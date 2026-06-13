import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  ArrowLeft,
  Upload,
  FileImage,
  XCircle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  recognizeMenuFromImages,
  convertToMenu,
  isApiKeyConfigured,
} from '@/services/openai';
import type { Menu } from '@/types';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'image/webp', 'image/bmp', 'image/tiff'];
const MAX_SIZE_MB = 15;
const IMAGE_REGEX = /^image\//;

type Phase = 'upload' | 'generating' | 'success' | 'error';
type RecognizedPreviewDish = { name: string; description: string; price: number; allergens?: string[] };
type RecognizedPreviewSection = { name: string; dishes: RecognizedPreviewDish[] };

const ALLERGEN_KEYWORDS: Array<{ name: string; keywords: string[] }> = [
  { name: 'Gluten', keywords: ['bread', 'flour', 'wheat', 'barley', 'rye', 'pasta', 'noodle', 'cake', 'pastry', 'crust', 'batter', 'breadcrumb'] },
  { name: 'Crustaceans', keywords: ['shrimp', 'prawn', 'crab', 'lobster', 'crayfish', 'scampi'] },
  { name: 'Eggs', keywords: ['egg', 'mayonnaise', 'mousse', 'custard', 'hollandaise', 'omelet', 'omelette', 'quiche'] },
  { name: 'Fish', keywords: ['fish', 'salmon', 'tuna', 'cod', 'bass', 'anchovy', 'sardine', 'snapper', 'caviar'] },
  { name: 'Peanuts', keywords: ['peanut', 'groundnut', 'satay'] },
  { name: 'Soybeans', keywords: ['soy', 'tofu', 'edamame', 'miso', 'tamari', 'tempeh'] },
  { name: 'Milk', keywords: ['milk', 'cream', 'butter', 'cheese', 'yogurt', 'lactose', 'parmesan', 'mozzarella', 'brie', 'gorgonzola', 'gruyère', 'gruyere'] },
  { name: 'Nuts', keywords: ['almond', 'hazelnut', 'walnut', 'cashew', 'pecan', 'pistachio', 'macadamia', 'pine nut', 'praline'] },
  { name: 'Celery', keywords: ['celery', 'celeriac'] },
  { name: 'Mustard', keywords: ['mustard', 'dijon'] },
  { name: 'Sesame', keywords: ['sesame', 'tahini'] },
  { name: 'Sulfites', keywords: ['sulfite', 'sulphite', 'wine', 'beer', 'vinegar', 'balsamic'] },
  { name: 'Lupin', keywords: ['lupin', 'lupine'] },
  { name: 'Molluscs', keywords: ['mollusc', 'mollusk', 'squid', 'octopus', 'snail', 'escargot', 'clam', 'oyster', 'mussel', 'scallop'] },
];

function detectLikelyAllergens(text: string): string[] {
  const normalized = text.toLowerCase();
  return ALLERGEN_KEYWORDS
    .filter((item) => item.keywords.some((keyword) => normalized.includes(keyword)))
    .map((item) => item.name);
}

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  preview?: string;
}

interface UploadMenuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (menu: Menu) => void;
}

// ---- Mock data: Used when API Key is not configured ----
const MOCK_RECOGNIZED_SECTIONS = [
  {
    name: 'Appetizers',
    dishes: [
      { name: 'Mesclun Mixed Green Salad', description: 'with tomato, cucumber, celery and homemade vinaigrette', price: 12.9 },
      { name: 'Bruschetta Trio', description: 'Classic tomato, mushroom & olive tapenade on toasted ciabatta', price: 9.5 },
    ],
  },
  {
    name: 'Soups',
    dishes: [
      { name: 'French Onion Soup', description: 'Caramelized onions and gruyère crust', price: 10 },
      { name: 'Lobster Bisque', description: 'Creamy lobster soup with sherry and chives', price: 14.95 },
      { name: 'Tomato Basil Soup', description: 'Roasted tomatoes with fresh basil and cream', price: 8.5 },
    ],
  },
  {
    name: 'Cheese Plate',
    dishes: [
      { name: 'Artisan Cheese Selection', description: 'Brie, aged cheddar, gorgonzola with crackers and honey', price: 17.95 },
    ],
  },
  {
    name: "Chef's Signature",
    dishes: [
      { name: 'Seaboard Bouillabaisse', description: 'Yellow tail snapper, salmon, jumbo shrimps, tomato saffron broth', price: 44.99 },
      { name: 'Wagyu Beef Tenderloin', description: 'A5 wagyu with truffle mashed potatoes and red wine reduction', price: 68 },
      { name: 'Pan-Seared Duck Breast', description: 'Cherry glaze, roasted root vegetables, foie gras sauce', price: 38.5 },
    ],
  },
  {
    name: 'Sides',
    dishes: [
      { name: 'Truffle Fries', description: 'Hand-cut fries with parmesan and truffle oil', price: 8.99 },
      { name: 'Garlic Butter Asparagus', description: 'Grilled asparagus with lemon zest', price: 7.5 },
    ],
  },
  {
    name: 'Other',
    dishes: [
      { name: 'Entree split', description: '', price: 10 },
      { name: 'Extra sauce', description: '', price: 3 },
    ],
  },
];

export function UploadMenuDialog({ open, onOpenChange, onGenerate }: UploadMenuDialogProps) {
  const [phase, setPhase] = useState<Phase>('upload');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [recognizedMenu, setRecognizedMenu] = useState<Menu | null>(null);
  const [recognizedSections, setRecognizedSections] = useState<RecognizedPreviewSection[]>([]);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [autoDetectAllergens, setAutoDetectAllergens] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasApiKey = isApiKeyConfigured();

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setPhase('upload');
      setFiles([]);
      setRecognizedMenu(null);
      setRecognizedSections([]);
      setActiveSectionIdx(0);
      setProgressMsg('');
      setErrorMsg('');
      setAutoDetectAllergens(false);
    }
  }, [open]);

  const validateFile = (file: File): string | null => {
    const isValidType = file.type
      ? ACCEPTED_TYPES.includes(file.type) || IMAGE_REGEX.test(file.type)
      : /\.(png|jpe?g|webp|bmp|tiff?|pdf)$/i.test(file.name);
    if (!isValidType) return 'Unsupported format. Please use PNG, JPG, or PDF.';
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return `File too large. Max ${MAX_SIZE_MB}MB.`;
    return null;
  };

  const createPreview = (file: File): Promise<string | undefined> => {
    if (!file.type.startsWith('image/')) return Promise.resolve(undefined);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(file);
    });
  };

  const addFiles = useCallback(async (newFiles: FileList | File[]) => {
    for (const file of Array.from(newFiles)) {
      const error = validateFile(file);
      if (error) { alert(`${file.name}: ${error}`); continue; }
      const preview = await createPreview(file);
      setFiles((prev) => [
        ...prev,
        { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, file, name: file.name, size: file.size, preview },
      ]);
    }
  }, []);

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  // ---- 真实 API 生成 ----
  const startRealGeneration = async () => {
    if (files.length === 0) return;
    setPhase('generating');
    setErrorMsg('');
    setProgressMsg('');

    try {
      const result = await recognizeMenuFromImages(
        files.map(f => f.file),
        (msg) => {
          setProgressMsg(msg);
        },
        { detectAllergens: autoDetectAllergens }
      );

      if (!result) {
        throw new Error('Could not recognize menu content, please ensure the image is clear');
      }

      const menu = convertToMenu(result, files.map((f) => f.file));
      setRecognizedMenu(menu);
      // Convert recognized sections for the preview display
      const sectionsForPreview = result.sections.map((sec) => ({
        name: sec.name,
        dishes: sec.dishes,
      }));
      setRecognizedSections(sectionsForPreview);
      setPhase('success');
    } catch (err: any) {
      console.error('Generation error:', err);
      setErrorMsg(err.message || 'Recognition failed, please try again');
      setPhase('error');
    }
  };

  // ---- Mock 流式生成（API Key 未配置时） ----
  const startMockGeneration = async () => {
    if (files.length === 0) return;
    setPhase('generating');
    setRecognizedSections([]);
    setProgressMsg('Using demo mode...');

    for (let i = 0; i < MOCK_RECOGNIZED_SECTIONS.length; i++) {
      await new Promise((r) => setTimeout(r, 700 + Math.random() * 600));
      const section = MOCK_RECOGNIZED_SECTIONS[i];
      const dishChunks: RecognizedPreviewDish[][] = [];
      for (let j = 0; j < section.dishes.length; j++) {
        dishChunks.push(section.dishes.slice(0, j + 1).map((dish) => ({
          ...dish,
          allergens: autoDetectAllergens ? detectLikelyAllergens(`${dish.name} ${dish.description}`) : [],
        })));
        await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
        setRecognizedSections((prev) => {
          const next = [...prev];
          next[i] = { name: section.name, dishes: [...dishChunks[dishChunks.length - 1]] };
          return next;
        });
      }
    }

    await new Promise((r) => setTimeout(r, 500));

    // Build mock menu
    const mockMenu: Menu = {
      id: Date.now().toString(),
      title: `Menu (${files.length} file${files.length > 1 ? 's' : ''}) - Demo`,
      sections: MOCK_RECOGNIZED_SECTIONS.map((sec, idx) => ({
        id: `s-${Date.now()}-${idx}`,
        name: sec.name,
        dishes: sec.dishes.map((d, di) => ({
          id: `d-${Date.now()}-${idx}-${di}`,
          name: d.name,
          description: d.description,
          price: d.price,
          isVisible: true,
          allergens: autoDetectAllergens ? detectLikelyAllergens(`${d.name} ${d.description}`) : [],
          dietaryTags: [],
          isBestSeller: false,
        })),
        isExpanded: true,
      })),
      isVisible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRecognizedMenu(mockMenu);
    setPhase('success');
  };

  const startGeneration = () => {
    if (hasApiKey) {
      startRealGeneration();
    } else {
      startMockGeneration();
    }
  };

  const handleGoToMenus = () => {
    if (recognizedMenu) {
      onGenerate(recognizedMenu);
    }
  };

  const handleRetry = () => {
    setErrorMsg('');
    setPhase('upload');
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)}KB` : `${(bytes / (1024 * 1024)).toFixed(1)}MB`;

  const resetAndClose = () => onOpenChange(false);

  // ============================================================
  //  PHASE: Upload
  // ============================================================
  const renderUploadHeader = () => (
    <div className="flex items-center gap-3 border-b px-6 py-4 shrink-0">
      <button
        onClick={resetAndClose}
        className="rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Upload my existing menu</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Upload your printed menu or a PDF and turn it into a digital menu.
        </p>
      </div>
      <button
        onClick={resetAndClose}
        className="ml-auto rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );

  const renderUploadBody = () => (
    <div className="space-y-4 px-6 py-5">
      {/* Upload zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files); }}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 cursor-pointer transition-all ${
          isDragging ? 'border-[#F2B900] bg-[#fff8d8]'
            : files.length > 0 ? 'border-gray-200 bg-gray-50'
              : 'border-gray-300 bg-white hover:border-[#F2B900]/60 hover:bg-[#fff8d8]'
        }`}
      >
        <input ref={inputRef} type="file" accept=".png,.jpg,.jpeg,.webp,.bmp,.tiff,.tif,.pdf,image/*,application/pdf"
          multiple className="hidden" onChange={(e) => { if (e.target.files?.length) { addFiles(e.target.files); e.target.value = ''; }}} />
        <div className={`flex h-14 w-14 items-center justify-center rounded-full mb-3 ${isDragging ? 'bg-[#fff8d8]' : 'bg-gray-100'}`}>
          <Upload className={`h-6 w-6 ${isDragging ? 'text-[#b98900]' : 'text-gray-400'}`} />
        </div>
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-[#b98900]">Click to upload</span>{' '}
          <span className="text-gray-500">or drag and drop</span>
        </p>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Supported formats: PNG, JPG, PDF</span>
        <span>Max file size: {MAX_SIZE_MB}MB</span>
      </div>

      {files.length > 0 && (
        <div className="space-y-2 max-h-[180px] overflow-y-auto">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
              {f.preview ? (
                <img src={f.preview} alt="" className="h-9 w-9 rounded object-cover" />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-red-50">
                  <FileImage className="h-4 w-4 text-red-500" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">{f.name}</p>
                <p className="text-xs text-gray-400">{formatSize(f.size)}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                className="shrink-0 rounded p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* API key status */}
      <div className={`flex items-start gap-2.5 rounded-lg px-4 py-3 ${
        hasApiKey ? 'bg-blue-50' : 'bg-amber-50'
      }`}>
        {hasApiKey ? (
          <>
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-600">i</span>
            <p className="text-sm leading-relaxed text-blue-700">
              AI provider configured. Using <span className="font-semibold">AI recognition</span> for menu parsing.
            </p>
          </>
        ) : (
          <>
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-600">!</span>
            <p className="text-sm leading-relaxed text-amber-700">
              API Key not configured, using <span className="font-semibold">demo data</span>.
              Contact your administrator to configure AI providers.
            </p>
          </>
        )}
      </div>

      <label
        className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition-all ${
          autoDetectAllergens
            ? 'border-[#f1d36a] bg-[#fff8d8] shadow-sm'
            : 'border-gray-200 bg-white hover:border-[#f1d36a] hover:bg-[#fffdf2]'
        }`}
      >
        <input
          type="checkbox"
          checked={autoDetectAllergens}
          onChange={(e) => setAutoDetectAllergens(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-gray-300 accent-[#FFD400]"
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-sm font-bold text-[#151526]">
            <Sparkles className="h-4 w-4 text-[#b98900]" />
            Auto-detect allergens with AI
          </span>
          <span className="mt-1 block text-xs leading-relaxed text-slate-500">
            Reference only. The system marks likely allergens from dish names and descriptions; please review manually before publishing.
          </span>
        </span>
      </label>
    </div>
  );

  const renderUploadFooter = () => (
    <div className="flex justify-end border-t px-6 py-4">
      <Button onClick={startGeneration} disabled={files.length === 0}
        className="min-w-[140px] bg-[#FFD400] font-bold text-[#151526] hover:bg-[#F2B900]">
        Generate menu
      </Button>
    </div>
  );

  // ============================================================
  //  PHASE: Generating
  // ============================================================
  const renderGeneratingContent = () => (
    <div className="flex flex-col items-center justify-center h-[400px] px-6 space-y-6">
      {/* Spinner */}
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-[#FFD400]/30 border-t-[#151526] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#b98900]" />
        </div>
      </div>

      {/* Progress message */}
      <div className="text-center space-y-2">
        <p className="text-base font-semibold text-gray-900">
          {hasApiKey
            ? autoDetectAllergens ? 'AI recognizing menu and allergens...' : 'AI recognizing menu...'
            : autoDetectAllergens ? 'Demo mode: Generating menu data and allergens...' : 'Demo mode: Generating menu data...'}
        </p>
        {progressMsg && (
          <p className="text-sm text-gray-500 animate-pulse">{progressMsg}</p>
        )}
        {!hasApiKey && (
          <p className="text-xs text-amber-600 mt-2">
            Tip: Configure API Key for real recognition results
          </p>
        )}
      </div>

      {/* Processing steps */}
      <div className="w-full max-w-xs space-y-3">
        {[
          { label: 'Upload image', done: true },
          { label: 'AI recognizing menu content', done: progressMsg.includes('complete') },
          ...(autoDetectAllergens ? [{ label: 'Mark likely allergens for review', done: false }] : []),
          { label: 'Generate menu structure', done: false },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            {step.done ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            ) : i === 1 ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#b98900] shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-gray-200 shrink-0" />
            )}
            <span className={`text-sm ${step.done ? 'text-gray-400' : 'text-gray-600'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGeneratingFooter = () => (
    <div className="flex justify-end border-t px-6 py-4">
      <Button disabled className="min-w-[160px] bg-[#fff8d8] text-[#8a6500] hover:bg-[#fff8d8] cursor-wait">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Generating menu...
      </Button>
    </div>
  );

  // ============================================================
  //  PHASE: Success
  // ============================================================
  const allSectionNames = recognizedSections.map((s) => s.name);

  const renderSuccessContent = () => (
    <div className="flex flex-col h-[460px] overflow-hidden">
      {/* Section tabs */}
      <div className="flex gap-2 overflow-x-auto px-6 pt-4 pb-3 no-scrollbar shrink-0">
        {allSectionNames.map((name, idx) => (
          <button key={name} onClick={() => setActiveSectionIdx(idx)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              activeSectionIdx === idx
                ? 'bg-gray-900 text-white'
                : 'bg-transparent border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}>
            {name}
          </button>
        ))}
      </div>

      {/* Dish list */}
      <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-1 no-scrollbar">
        {recognizedSections.length > 0 && recognizedSections[activeSectionIdx] && (
          <div>
            <h3 className="mb-3 text-lg font-bold text-gray-900">
              {recognizedSections[activeSectionIdx].name}
            </h3>
            <div className="space-y-4">
              {recognizedSections[activeSectionIdx].dishes.map((dish, di) => (
                <div key={di}>
                  <h4 className="font-semibold text-gray-900">{dish.name}</h4>
                  {dish.description && (
                    <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-gray-500">
                      {dish.description}
                    </p>
                  )}
                  <p className="mt-1 font-bold text-gray-900">
                    {typeof dish.price === 'number' ? `$${dish.price.toFixed(2)}` : dish.price}
                  </p>
                  {dish.allergens && dish.allergens.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {dish.allergens.map((allergen) => (
                        <span key={allergen} className="rounded-full bg-[#fff8d8] px-2 py-0.5 text-[11px] font-bold text-[#8a6500]">
                          {allergen}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderSuccessFooter = () => (
    <>
      <div className="mx-6 mb-4 flex items-start gap-3 rounded-xl bg-green-50 px-4 py-3.5 border border-green-200">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
        <div>
          <p className="text-sm font-medium text-green-800">Menu created successfully!</p>
          <p className="text-xs text-green-600 mt-0.5">
            {recognizedSections.length} section{recognizedSections.length > 1 ? 's' : ''}, results generated{hasApiKey ? ' by AI' : ''}
            {autoDetectAllergens ? ' with likely allergen marks for review' : ''}
          </p>
        </div>
      </div>
      <div className="flex justify-end border-t px-6 py-4">
        <Button onClick={handleGoToMenus} className="min-w-[140px] bg-[#FFD400] font-bold text-[#151526] hover:bg-[#F2B900]">
          Go to menus
        </Button>
      </div>
    </>
  );

  // ============================================================
  //  PHASE: Error
  // ============================================================
  const renderErrorContent = () => (
    <div className="flex flex-col items-center justify-center h-[400px] px-6 space-y-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-base font-semibold text-gray-900">Recognition failed</p>
        <p className="text-sm text-gray-500">{errorMsg || 'Please check your connection and try again'}</p>
      </div>
      <Button onClick={handleRetry} variant="outline" className="mt-2">
        Try again
      </Button>
    </div>
  );

  // ============================================================
  //  Main header (non-upload phases)
  // ============================================================
  const renderPhaseHeader = () => {
    if (phase === 'upload') return null;

    return (
      <div className="flex items-center gap-3 border-b px-6 py-4 shrink-0">
        <button
          onClick={() => {
            if (phase === 'success' || phase === 'error') {
              setPhase('upload');
              setRecognizedMenu(null);
              setRecognizedSections([]);
              setErrorMsg('');
            }
          }}
          className={`rounded-md p-1 transition-colors ${
            phase === 'success' || phase === 'error'
              ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              : 'text-transparent pointer-events-none'
          }`}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {phase === 'generating' ? 'Recognizing...' : phase === 'success' ? 'Recognition result' : 'Recognition failed'}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {files.length} file{files.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={resetAndClose}
          className="ml-auto rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    );
  };

  // ============================================================
  //  Render
  // ============================================================
  return (
    <Dialog open={open} onOpenChange={phase === 'upload' ? resetAndClose : undefined}>
      <DialogContent className="max-w-lg p-0" showCloseButton={false}>
        {phase === 'upload' ? renderUploadHeader() : renderPhaseHeader()}

        {phase === 'upload' && renderUploadBody()}
        {phase === 'generating' && renderGeneratingContent()}
        {phase === 'success' && renderSuccessContent()}
        {phase === 'error' && renderErrorContent()}

        {phase === 'upload' && renderUploadFooter()}
        {phase === 'generating' && renderGeneratingFooter()}
        {phase === 'success' && renderSuccessFooter()}
      </DialogContent>
    </Dialog>
  );
}
