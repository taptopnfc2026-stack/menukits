import { useState } from 'react';
import { useChecklist } from '@/contexts/ChecklistContext';
import {
  Globe,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  ArrowRightLeft,
  Languages,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  enabled: boolean;
}

const LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', enabled: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', enabled: true },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', enabled: true },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', enabled: true },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', enabled: false },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', enabled: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', enabled: false },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', enabled: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', enabled: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', enabled: false },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', enabled: false },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', enabled: false },
];

export default function TranslationPage() {
  const { completeStep } = useChecklist();
  // Complete menu language step when visiting
  completeStep('menu-language');
  const [languages, setLanguages] = useState(LANGUAGES);
  const [isTranslating, setIsTranslating] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(true);

  const toggleLanguage = (code: string) => {
    setLanguages((prev) =>
      prev.map((l) => (l.code === code ? { ...l, enabled: !l.enabled } : l))
    );
  };

  const handleBulkTranslate = () => {
    setIsTranslating(true);
    setTimeout(() => setIsTranslating(false), 2000);
  };

  const enabledCount = languages.filter((l) => l.enabled).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Translations</h1>
          <p className="mt-1 text-sm text-gray-500">
            AI-powered multi-language menu translation for your international customers
          </p>
        </div>
        <Button
          onClick={handleBulkTranslate}
          disabled={isTranslating}
          className="gap-2 bg-[#5544e4] hover:bg-[#4433cc]"
        >
          {isTranslating ? (
            <>
              <Sparkles className="h-4 w-4 animate-spin" />
              Translating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              AI Translate All
            </>
          )}
        </Button>
      </div>

      {/* Auto translate toggle */}
      <Card className="mb-6 border border-gray-100 bg-gradient-to-r from-[#5544e4]/5 to-purple-50/50 shadow-sm">
        <CardContent className="flex items-center justify-between p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5544e4]/10 shrink-0">
              <ArrowRightLeft className="h-5 w-5 text-[#5544e4]" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Auto-translate new dishes</p>
              <p className="text-sm text-gray-500 mt-0.5">
                When you add a new dish, it will be automatically translated to all enabled languages using AI
              </p>
            </div>
          </div>
          <Switch
            checked={autoTranslate}
            onCheckedChange={setAutoTranslate}
            className="data-[state=checked]:bg-[#5544e4]"
          />
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="mb-6 flex items-center gap-4">
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-2">
          <span className="text-sm text-gray-500">{enabledCount} of {languages.length} languages enabled</span>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2">
          <span className="text-sm text-green-700">✓ 485 translations completed</span>
        </div>
      </div>

      {/* Language List */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-3 bg-gray-50/50">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Available Languages
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {languages.map((lang) => (
            <div
              key={lang.code}
              className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50/50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-xl">
                  {lang.flag}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{lang.name}</p>
                  <p className="text-sm text-gray-500">{lang.nativeName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {lang.enabled && (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                    <CheckCircle2 className="h-3 w-3" />
                    Translated
                  </span>
                )}
                <Switch
                  checked={lang.enabled}
                  onCheckedChange={() => toggleLanguage(lang.code)}
                  className="data-[state=checked]:bg-[#5544e4]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Translation preview */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Translation preview</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {['English', 'Spanish', 'French', 'Chinese'].map((lang) => (
            <div key={lang} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                {lang}
              </p>
              <div className="space-y-3">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {lang === 'English' ? 'Grilled Salmon' : 
                     lang === 'Spanish' ? 'Salmón a la Parrilla' :
                     lang === 'French' ? 'Saumon Grillé' :
                     '烤三文鱼'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                    {lang === 'English' ? 'Atlantic salmon fillet with lemon butter sauce and seasonal vegetables.' :
                     lang === 'Spanish' ? 'Filete de salmón atlántico con salsa de mantequilla de limón y verduras de temporada.' :
                     lang === 'French' ? 'Filet de saumon atlantique, sauce au beurre citronné et légumes de saison.' :
                     '大西洋三文鱼配柠檬黄油酱和时令蔬菜'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
