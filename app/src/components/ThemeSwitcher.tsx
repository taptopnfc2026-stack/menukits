import { useState } from 'react';
import { Palette, Check, Pipette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { ADMIN_THEMES, type ThemeId } from '@/lib/admin-theme';

/**
 * Theme switcher — 6 preset themes + custom hex color picker.
 * Lives in the top bar; opens a popover with theme choices.
 */
export default function ThemeSwitcher() {
  const { themeId, customAccent, setTheme } = useAdminTheme();
  const [open, setOpen] = useState(false);
  const [draftHex, setDraftHex] = useState(customAccent);

  const themes: ThemeId[] = [
    'midnight-indigo',
    'ocean-teal',
    'emerald',
    'sunset-orange',
    'rose-pink',
    'royal-purple',
  ];

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        className="h-9 gap-2 border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
        title="Change theme color"
      >
        <Palette className="h-4 w-4" />
        <span className="hidden text-xs font-medium md:inline">Theme</span>
        <span
          className="h-3.5 w-3.5 rounded-full border border-slate-300"
          style={{ backgroundColor: themeId === 'custom' ? customAccent : ADMIN_THEMES[themeId].accent }}
        />
      </Button>

      {open && (
        <>
          {/* Backdrop to close popover */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="admin-themed absolute right-0 top-11 z-50 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200/40">
            <div className="mb-3 flex items-center gap-2">
              <Palette className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900">Theme Color</h3>
            </div>

            {/* Preset grid */}
            <div className="mb-4 grid grid-cols-3 gap-2">
              {themes.map((id) => {
                const t = ADMIN_THEMES[id];
                const active = themeId === id;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      setTheme(id);
                      setOpen(false);
                    }}
                    className={cn(
                      'group relative flex flex-col items-center gap-1.5 rounded-lg border p-2.5 transition-all',
                      active
                        ? 'border-slate-300 bg-slate-100'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100',
                    )}
                  >
                    <span
                      className="h-7 w-7 rounded-full border-2 border-slate-200 shadow-inner transition-transform group-hover:scale-110"
                      style={{ backgroundColor: t.accent }}
                    />
                    <span className="text-[10px] font-medium text-slate-600">
                      {t.name}
                    </span>
                    {active && (
                      <Check className="absolute right-1.5 top-1.5 h-3 w-3 text-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom color picker */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <Label className="mb-2 flex items-center gap-1.5 text-xs text-slate-400">
                <Pipette className="h-3 w-3" />
                Custom Color
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={draftHex}
                  onChange={(e) => setDraftHex(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-slate-300 bg-transparent"
                />
                <Input
                  type="text"
                  value={draftHex}
                  onChange={(e) => setDraftHex(e.target.value)}
                  placeholder="#6366F1"
                  className="h-9 flex-1 border-slate-300 bg-white font-mono text-xs text-slate-900"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    setTheme('custom', draftHex);
                    setOpen(false);
                  }}
                  className="h-9 bg-slate-200 px-3 text-xs text-slate-900 hover:bg-slate-300"
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
