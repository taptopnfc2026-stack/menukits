import { useState, useMemo } from 'react';
import { useChecklist } from '@/contexts/ChecklistContext';
import { useMenuContext } from '@/contexts/MenuContext';
import { translateText } from '@/services/openai';
import type { Menu, Dish as DishType, Section as SectionType } from '@/types';
import {
  Globe,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  ArrowRightLeft,
  Languages,
  AlertCircle,
  Loader2,
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
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', enabled: false },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', enabled: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', enabled: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', enabled: false },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', enabled: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', enabled: false },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', enabled: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', enabled: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', enabled: false },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', enabled: false },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', enabled: false },
];

/** Count how many translation entries exist across all dishes and sections */
function countTranslations(menu: Menu | undefined): number {
  if (!menu) return 0;
  let count = 0;
  for (const sec of menu.sections) {
    if (sec.translations) count += Object.keys(sec.translations).length;
    for (const dish of sec.dishes) {
      if (dish.translations) {
        for (const lang of Object.values(dish.translations)) {
          if (lang.name) count++;
          if (lang.description) count++;
        }
      }
    }
  }
  return count;
}

/** Count total translatable items (sections + dish names + descriptions with content) */
function countTotalItems(menu: Menu | undefined): number {
  if (!menu) return 0;
  let total = 0;
  for (const sec of menu.sections) {
    total += 1; // section name
    for (const dish of sec.dishes) {
      total += 1; // dish name
      if (dish.description.trim()) total += 1; // description
    }
  }
  return total;
}

export default function TranslationPage() {
  const { completeStep } = useChecklist();
  completeStep('menu-language');
  const { menus, updateMenu } = useMenuContext();
  const currentMenu = menus[0]; // active menu

  const [languages, setLanguages] = useState<SupportedLanguage[]>(() => {
    // Restore enabled languages from menu's restaurantInfo
    const savedLangs = currentMenu?.restaurantInfo?.languages || [];
    return LANGUAGES.map((l) => ({
      ...l,
      enabled: savedLangs.length > 0 ? savedLangs.includes(l.code) : l.enabled,
    }));
  });
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [autoTranslate, setAutoTranslate] = useState(true);

  const toggleLanguage = (code: string) => {
    setLanguages((prev) =>
      prev.map((l) => (l.code === code ? { ...l, enabled: !l.enabled } : l))
    );
  };

  /** Persist language toggles to menu's restaurantInfo */
  const saveLanguagePrefs = (enabledLangs: SupportedLanguage[]) => {
    if (!currentMenu) return;
    const codes = enabledLangs.filter((l) => l.enabled).map((l) => l.code);
    updateMenu(currentMenu.id, (menu) => ({
      ...menu,
      restaurantInfo: {
        ...(menu.restaurantInfo || {}),
        languages: codes,
      },
    }));
  };

  /** Main translation function — calls AI API for all items × all enabled languages */
  const handleBulkTranslate = async () => {
    if (!currentMenu || currentMenu.sections.length === 0) {
      setError('No menu data found. Please upload a menu first.');
      return;
    }

    const enabledLangs = languages.filter((l) => l.enabled && l.code !== 'en');
    if (enabledLangs.length === 0) {
      setError('Please enable at least one target language (other than English).');
      return;
    }

    setIsTranslating(true);
    setError(null);

    // Collect all items to translate: [{ text, type, sectionIndex, dishIndex?, field }]
    interface TranslateItem {
      text: string;
      type: 'section' | 'dish-name' | 'dish-desc';
      sectionIndex: number;
      dishIndex?: number;
      field?: 'name' | 'description';
    }

    const items: TranslateItem[] = [];
    currentMenu.sections.forEach((sec, si) => {
      if (sec.name.trim()) items.push({ text: sec.name, type: 'section', sectionIndex: si });
      sec.dishes.forEach((dish, di) => {
        if (dish.name.trim()) items.push({ text: dish.name, type: 'dish-name', sectionIndex: si, dishIndex: di, field: 'name' });
        if (dish.description?.trim()) items.push({ text: dish.description, type: 'dish-desc', sectionIndex: si, dishIndex: di, field: 'description' });
      });
    });

    const totalTasks = items.length * enabledLangs.length;
    setProgress({ current: 0, total: totalTasks });

    try {
      // Clone menu sections with translations populated
      const newSections = currentMenu.sections.map((sec) => ({ ...sec }));
      let completed = 0;

      for (const item of items) {
        for (const lang of enabledLangs) {
          try {
            const translated = await translateText(item.text, 'en', lang.code);

            // Apply translation to the cloned structure
            if (item.type === 'section') {
              const sec = newSections[item.sectionIndex];
              if (!sec.translations) sec.translations = {};
              sec.translations[lang.code] = translated;
            } else {
              const sec = newSections[item.sectionIndex];
              const dish = { ...sec.dishes[item.dishIndex!] };
              if (!dish.translations) dish.translations = {};
              if (!dish.translations[lang.code]) dish.translations[lang.code] = {};
              dish.translations[lang.code][item.field!] = translated;
              sec.dishes = [...sec.dishes];
              sec.dishes[item.dishIndex!] = dish;
            }
          } catch (err) {
            console.warn(`Translation failed: "${item.text}" → ${lang.code}`, err);
            // Continue with other items on failure
          }

          completed++;
          setProgress({ current: completed, total: totalTasks });

          // Small delay between API calls to avoid rate limiting
          await new Promise((r) => setTimeout(r, 100));
        }
      }

      // Save updated menu with translations
      updateMenu(currentMenu.id, (menu) => ({
        ...menu,
        sections: newSections,
        updatedAt: new Date().toISOString(),
      }));

      // Also save language preferences
      saveLanguagePrefs(languages);
    } catch (err) {
      console.error('Translation batch error:', err);
      setError(err instanceof Error ? err.message : 'Translation failed. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const enabledCount = languages.filter((l) => l.enabled).length;
  const translationCount = useMemo(() => countTranslations(currentMenu), [currentMenu]);
  const totalItems = useMemo(() => countTotalItems(currentMenu), [currentMenu]);

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
          disabled={isTranslating || !currentMenu || currentMenu.sections.length === 0}
          className="gap-2 bg-[#5544e4] hover:bg-[#4433cc]"
        >
          {isTranslating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Translating... {progress.current}/{progress.total}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              AI Translate All
            </>
          )}
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Progress bar */}
      {isTranslating && (
        <Card className="mb-6 border-[#5544e4]/20 bg-[#5544e4]/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#5544e4]">Translating menu...</span>
              <span className="text-sm text-gray-500">{progress.current} / {progress.total}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#5544e4] transition-all duration-300"
                style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

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
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-2">
          <span className="text-sm text-gray-500">{enabledCount} of {languages.length} languages enabled</span>
        </div>
        <div className={`rounded-lg px-4 py-2 ${translationCount > 0 ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
          <span className={`text-sm ${translationCount > 0 ? 'text-green-700' : 'text-gray-500'}`}>
            {translationCount > 0 ? (
              <>✓ {translationCount} translations completed</>
            ) : (
              `— ${totalItems} items ready to translate`
            )}
          </span>
        </div>
        {currentMenu && (
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-2">
            <span className="text-sm text-gray-500">
              Menu: <strong>{currentMenu.title}</strong> ({currentMenu.sections.length} sections)
            </span>
          </div>
        )}
      </div>

      {/* Language List */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-3 bg-gray-50/50">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Available Languages</p>
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
                {lang.enabled && lang.code !== 'en' && (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                    <CheckCircle2 className="h-3 w-3" />
                    Enabled
                  </span>
                )}
                <Switch
                  checked={lang.enabled}
                  onCheckedChange={() => toggleLanguage(lang.code)}
                  disabled={isTranslating}
                  className="data-[state=checked]:bg-[#5544e4]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Translation preview — show real data from menu if available */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Translation preview</h2>
        {currentMenu && currentMenu.sections.length > 0 ? (
          <div className="space-y-4">
            {currentMenu.sections.slice(0, 2).map((sec) => (
              <div key={sec.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Section</p>
                <p className="font-semibold text-gray-900 mb-3">{sec.name}</p>
                {sec.dishes.slice(0, 2).map((dish) => (
                  <div key={dish.id} className="rounded-lg bg-gray-50 p-3 mb-2 last:mb-0">
                    <p className="text-sm font-semibold text-gray-900">{dish.name}</p>
                    {dish.description && (
                      <p className="mt-1 text-xs text-gray-500 leading-relaxed line-clamp-2">{dish.description}</p>
                    )}
                    {dish.translations && Object.keys(dish.translations).length > 0 && (
                      <div className="mt-2 space-y-1">
                        {Object.entries(dish.translations).slice(0, 3).map(([code, tr]) => {
                          const langFlag = LANGUAGES.find((l) => l.code === code)?.flag || code;
                          return (
                            <p key={code} className="text-xs text-[#5544e4]">
                              <strong>{langFlag}</strong> {tr.name}{tr.description ? ` / ${tr.description.substring(0, 60)}...` : ''}
                            </p>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
            <Globe className="mx-auto h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">Upload a menu first, then click "AI Translate All" to generate translations.</p>
          </div>
        )}
      </div>
    </div>
  );
}
