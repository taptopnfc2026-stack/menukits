import { useState, useEffect, useRef } from 'react';
import {
  GripVertical,
  Eye,
  MoreVertical,
  Star,
  Languages,
  ImagePlus,
  Tag as TagIcon,
  Sparkles,
  X as CloseIcon,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DIETARY_TAGS, suggestDietaryTags, suggestDishImage } from '@/lib/dish-ai';
import type { Dish } from '@/types';

const ALLERGENS = [
  'Gluten', 'Peanuts', 'Eggs', 'Fish', 'Crustaceans',
  'Soybeans', 'Milk', 'Nuts', 'Celery', 'Mustard',
  'Sesame', 'Sulfites', 'Lupin', 'Molluscs',
];

// --- AI Description Generator ---
function generateAIDescription(dishName: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const name = dishName.toLowerCase();
      let desc = '';

      // Pattern-based intelligent generation
      if (name.includes('soup') || name.includes('consomm') || name.includes('broth')) {
        const bases: Record<string, string> = {
          frenchonion: 'Richly caramelized onions slow-cooked in a savory beef broth, topped with melted gruyère cheese and a golden toasted crouton crust.',
          gazpacho: 'Chilled Spanish tomato soup blended with crisp cucumber, fresh peppers, garlic, and premium olive oil, served ice-cold for a refreshing summer experience.',
          tomato: 'Classic homemade tomato soup made with vine-ripened tomatoes, fresh basil, and a hint of cream.',
          minestrone: 'Hearty Italian vegetable soup loaded with seasonal produce, pasta, and beans in a rich tomato broth.',
          miso: 'Traditional Japanese dashi-based soup with aged miso paste, silky tofu, wakame seaweed, and green onions.',
        };
        desc = Object.entries(bases).find(([k]) => name.includes(k))?.[1]
          || `A warm and comforting ${dishName} prepared with fresh ingredients and a rich, aromatic broth.`;
      }
      else if (name.includes('pasta') || name.includes('spaghetti') || name.includes('linguine') || name.includes('penne')) {
        desc = `Al dente pasta tossed in a handmade sauce with fresh herbs, grated parmesan, and a drizzle of extra virgin olive oil.`;
      }
      else if (name.includes('salad') || name.includes('caesar') || name.includes('garden')) {
        const salads: Record<string, string> = {
          caesar: 'Crisp romaine lettuce tossed in our signature Caesar dressing with shaved parmesan, crunchy croutons, and anchovy-infused umami depth.',
          greek: 'Vibrant mix of cucumber, tomatoes, kalamata olives, red onion, and feta cheese dressed in a zesty lemon-oregano vinaigrette.',
          nicoise: 'French-inspired salad with tuna steak, green beans, boiled eggs, niçoise olives, and anchovies on a bed of butter lettuce.',
        };
        desc = Object.entries(salads).find(([k]) => name.includes(k))?.[1]
          || `Fresh seasonal greens artfully arranged with house-made dressing and garden-picked vegetables.`;
      }
      else if (name.includes('bruschetta') || name.includes('crostini') || name.includes('toast')) {
        desc = `Toasted artisan sourdough bread topped with ripe diced tomatoes, fresh basil leaves, minced garlic, and a generous splash of extra virgin olive oil, finished with a pinch of sea salt flakes.`;
      }
      else if (name.includes('steak') || name.includes('ribeye') || name.includes('filet') || name.includes('tenderloin')) {
        desc = `Premium cut of beef seared to perfection, seasoned with cracked black pepper and finishing salt, served with roasted potatoes and seasonal vegetables.`;
      }
      else if (name.includes('salmon') || name.includes('fish') || name.includes('cod') || name.includes('sea bass')) {
        desc = `Perfectly pan-seared fillet with crispy skin, served on a bed of sautéed vegetables with a lemon-butter caper sauce and fresh herbs.`;
      }
      else if (name.includes('chicken') || name.includes('poultry')) {
        const chickens: Record<string, string> = {
          grilled: `Juicy chicken breast marinated in herbs and olive oil, flame-grilled to tender perfection with distinct char marks.`,
          fried: `Crispy double-breaded chicken with a golden crunch, served with house pickles and creamy coleslaw.`,
        };
        desc = Object.entries(chickens).find(([k]) => name.includes(k))?.[1]
          || `Tender, juicy chicken prepared to perfection with a blend of aromatic herbs and spices, served with seasonal accompaniments.`;
      }
      else if (name.includes('paella') || name.includes('rice') || name.includes('risotto')) {
        desc = `Authentic saffron-seasoned rice cooked slowly with premium ingredients, creating layers of flavor and a perfectly textured grain.`;
      }
      else if (name.includes('calamari') || name.includes('squid') || name.includes('shrimp') || name.includes('prawn')) {
        desc = `Lightly battered and deep-fried until golden and crispy, served with a zesty marinara sauce and fresh lemon wedges for squeezing.`;
      }
      else if (name.includes('burger') || name.includes('sandwich')) {
        desc = `Handcrafted patty on a toasted brioche bun, layered with fresh lettuce, ripe tomatoes, pickles, and our signature house sauce.`;
      }
      else if (name.includes('pizza') || name.includes('margherita') || name.includes('pepperoni')) {
        desc = `Wood-fired pizza with a hand-stretched crust, San Marzano tomato sauce, fresh mozzarella, and topped with premium ingredients.`;
      }
      else if (name.includes('provoleta') || name.includes('cheese') && !name.includes('cake')) {
        desc = `Melted provoleta cheese with fragrant oregano and sun-dried tomatoes, baked to bubbly perfection with a golden-brown caramelized top.`;
      }
      else if (name.includes('dessert') || name.includes('cake') || name.includes('tiramisu') || name.includes('panna cotta')) {
        const desserts: Record<string, string> = {
          tiramisu: `Classic Italian dessert with layers of espresso-soaked ladyfingers and mascarpone cream, dusted with fine cocoa powder.`,
          cheesecake: `Creamy New York-style cheesecake on a graham cracker crust, topped with fresh berry compote.`,
          cremebrulee: `Silky vanilla custard with a perfectly caramelized sugar crust that shatters at first spoonful.`,
        };
        desc = Object.entries(desserts).find(([k]) => name.includes(k))?.[1]
          || `An indulgent sweet treat crafted with care, featuring rich flavors and elegant presentation.`;
      }
      else if (name.includes('taco') || name.includes('burrito') || name.includes('quesadilla')) {
        desc = `Authentic Mexican flavors wrapped in warm tortillas, filled with fresh ingredients, salsa, and a squeeze of lime.`;
      }
      else if (name.includes('curry') || name.includes('tikka') || name.includes('masala')) {
        desc = `Aromatic blend of traditional spices simmered in a rich sauce, served with fragrant basmati rice or warm naan bread.`;
      }
      else if (name.includes('sushi') || name.includes('sashimi') || name.includes('roll') || name.includes('maki')) {
        desc = `Fresh, premium-grade fish paired with seasoned sushi rice, nori, and carefully selected toppings for authentic flavor harmony.`;
      }
      else if (name.includes('ramen') || name.includes('noodle') || name.includes('udon') || name.includes('pho')) {
        desc = `Rich and deeply flavorful broth with perfectly chewy noodles, topped with soft-boiled egg, sliced pork, and fresh aromatics.`;
      }

      if (!desc) {
        // Generic but context-aware fallback
        const adjectives = ['exquisite', 'artisanal', 'hand-crafted', 'premium', 'succulent'];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        desc = `${adj} ${dishName} prepared with the finest ingredients, carefully plated and served with attention to every detail.`;
      }

      resolve(desc);
    }, 1200); // Simulate network delay
  });
}

interface AddDishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (dish: Omit<Dish, 'id'>) => void;
  /** If provided, dialog operates in edit mode with pre-filled data */
  editingDish?: Dish | null;
}

export function AddDishDialog({ open, onOpenChange, onSave, editingDish }: AddDishDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [tag, setTag] = useState('');
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingDietary, setIsGeneratingDietary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill form when editing
  useEffect(() => {
    if (editingDish && open) {
      setName(editingDish.name);
      setDescription(editingDish.description);
      setPrice(String(editingDish.price));
      setTag(editingDish.tag || '');
      setSelectedAllergens(editingDish.allergens || []);
      setSelectedDietary(editingDish.dietaryTags || []);
      setImagePreview(editingDish.image || null);
    } else if (!editingDish && open) {
      setName('');
      setDescription('');
      setPrice('');
      setTag('');
      setSelectedAllergens([]);
      setSelectedDietary([]);
      setImagePreview(null);
    }
  }, [editingDish, open]);

  const isEditing = !!editingDish;

  const toggleAllergen = (a: string) =>
    setSelectedAllergens((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );

  const toggleDietary = (d: string) =>
    setSelectedDietary((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );

  // --- Image Upload ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- AI Generate Description ---
  const handleGenerateDescription = async () => {
    if (!name.trim()) {
      alert('Please enter a dish name first.');
      return;
    }
    setIsGeneratingDesc(true);
    try {
      const generated = await generateAIDescription(name.trim());
      setDescription(generated);
    } catch {
      alert('Failed to generate description. Please try again.');
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!name.trim()) {
      alert('Please enter a dish name first.');
      return;
    }
    setIsGeneratingImage(true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 350));
      setImagePreview(suggestDishImage({ name: name.trim(), description: description.trim() }));
    } catch {
      alert('Failed to generate an image. Please try again.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateDietaryTags = async () => {
    if (!name.trim() && !description.trim()) {
      alert('Please enter a dish name or description first.');
      return;
    }
    setIsGeneratingDietary(true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 300));
      setSelectedDietary(
        suggestDietaryTags({
          name: name.trim(),
          description: description.trim(),
          allergens: selectedAllergens,
          dietaryTags: selectedDietary,
        })
      );
    } catch {
      alert('Failed to generate dietary tags. Please try again.');
    } finally {
      setIsGeneratingDietary(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price) || 0,
      tag: tag.trim() || undefined,
      allergens: selectedAllergens,
      dietaryTags: selectedDietary,
      isVisible: true,
      image: imagePreview || undefined,
    });
    // Reset form
    setName('');
    setDescription('');
    setPrice('');
    setTag('');
    setSelectedAllergens([]);
    setSelectedDietary([]);
    setImagePreview(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Edit dish' : 'Add new dish'}
            </DialogTitle>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-gray-500">
              <Languages className="h-3.5 w-3.5" />
              Translations
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          {/* Name + Image */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr,180px]">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Grilled Salmon"
                  className="h-10"
                />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateDescription}
                    disabled={isGeneratingDesc || !name.trim()}
                    className="h-7 gap-1 px-2 text-xs font-medium text-[#8a6500] hover:bg-[#fff8d8] disabled:opacity-50"
                  >
                    {isGeneratingDesc ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    {isGeneratingDesc ? 'Generating...' : 'AI Write'}
                  </Button>
                </div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Served with lemon butter."
                  rows={3}
                  className="resize-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Price</label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="10.5"
                  className="w-full max-w-xs"
                />
                <p className="mt-1.5 text-xs text-gray-400">Add price options</p>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label className="text-sm font-medium text-gray-700">Image</label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage || !name.trim()}
                  className="h-7 gap-1 px-2 text-xs font-medium text-[#8a6500] hover:bg-[#fff8d8] disabled:opacity-50"
                >
                  {isGeneratingImage ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  {isGeneratingImage ? 'Generating...' : 'AI Image'}
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {imagePreview ? (
                /* Preview mode */
                <div className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200">
                  <img
                    src={imagePreview}
                    alt="Dish preview"
                    className="h-full w-full object-cover"
                  />
                  {/* Overlay actions */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mr-2 rounded-full bg-white/90 p-2 shadow-md opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white"
                      title="Change image"
                    >
                      <ImagePlus className="h-4 w-4 text-gray-700" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="rounded-full bg-white/90 p-2 shadow-md opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white"
                      title="Remove image"
                    >
                      <CloseIcon className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Upload area */
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition-all hover:border-gray-300 hover:bg-gray-100 active:border-[#F2B900] active:bg-[#fff8d8]"
                >
                  <div className="relative mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
                    <ImagePlus className="h-6 w-6 text-gray-400" />
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm border cursor-pointer">
                      <span className="text-[10px]">✎</span>
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">Upload file</span>
                  <span className="mt-1 text-[10px] text-gray-400">JPG, PNG up to 5MB</span>
                </button>
              )}
            </div>
          </div>

          {/* Tag */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Tag</label>
            <div className="relative">
              <TagIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Write a short tag"
                className="pl-9"
              />
            </div>
            <button className="mt-2 inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50">
              Suggested tags
              <span className="text-gray-400">▾</span>
            </button>
          </div>

          {/* Allergens */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Allergens</label>
            <div className="flex flex-wrap gap-2">
              {ALLERGENS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAllergen(a)}
                  className={`rounded-full border px-3 py-1 text-sm font-medium transition-all ${
                    selectedAllergens.includes(a)
                      ? 'border-[#151526] bg-[#151526] text-[#FFD400]'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary tags */}
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <label className="text-sm font-medium text-gray-700">Dietary tags</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleGenerateDietaryTags}
                disabled={isGeneratingDietary || (!name.trim() && !description.trim())}
                className="h-7 gap-1 px-2 text-xs font-medium text-[#8a6500] hover:bg-[#fff8d8] disabled:opacity-50"
              >
                {isGeneratingDietary ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                {isGeneratingDietary ? 'Tagging...' : 'AI Tags'}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {DIETARY_TAGS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDietary(d)}
                  className={`rounded-full border px-3 py-1 text-sm font-medium transition-all ${
                    selectedDietary.includes(d)
                      ? 'border-[#151526] bg-[#151526] text-[#FFD400]'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} className="min-w-[120px] bg-[#FFD400] font-bold text-[#151526] hover:bg-[#F2B900]">
              {isEditing ? 'Save changes' : 'Create dish'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
