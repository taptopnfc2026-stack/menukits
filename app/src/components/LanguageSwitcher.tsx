import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { LANGUAGES, useLanguage } from '@/contexts/LanguageContext';

/**
 * Language switcher dropdown — prominent "Switch language" button
 * placed in top-right of the menu preview cover area.
 * Opens a scrollable list of 24 languages grouped with European priority.
 */
export default function LanguageSwitcher() {
  const { uiLang, setUiLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
      }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const currentLang = LANGUAGES.find((l) => l.code === uiLang) || LANGUAGES[0];

  return (
    <div className="relative z-30" ref={ref}>
      {/* Trigger button — prominent style */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-sm px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-lg ring-1 ring-black/5 hover:bg-white transition-all active:scale-95"
      >
        <Globe className="h-4 w-4 text-[#5544e4]" />
        <span className="hidden sm:inline">{t('switchLanguage')}</span>
        <span className="sm:hidden">{currentLang.nativeLabel}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-72 max-h-[70vh] overflow-y-auto rounded-2xl bg-white py-2 shadow-xl ring-1 ring-black/10 z-50 animate-in fade-in slide-in-from-top-2">
            {/* Header */}
            <div className="sticky top-0 bg-white px-4 pt-2 pb-3 border-b border-gray-50">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {t('switchLanguage')}
              </p>
            </div>

            {/* Language list */}
            <div className="py-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setUiLang(lang.code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                    lang.code === uiLang
                      ? 'bg-[#5544e4]/8 text-[#5544e4] font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-base leading-none shrink-0 w-6 text-center">{lang.flag}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate">{lang.label}</span>
                    <span className={`block text-[11px] ${lang.code === uiLang ? 'text-[#5544e4]/70' : 'text-gray-400'}`}>
                      {lang.nativeLabel}
                    </span>
                  </span>
                  {lang.code === uiLang && (
                    <Check className="h-4 w-4 shrink-0 text-[#5544e4]" />
                  )}
                </button>
              ))}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 mt-1 border-t border-gray-50">
              <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                UI language &bull; Menu content stays in original language
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
