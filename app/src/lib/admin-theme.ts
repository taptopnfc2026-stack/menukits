/**
 * Admin theme system — provides 6 predefined themes + custom color picker.
 * Themes are persisted in localStorage and applied via CSS variables on :root.
 */

export type ThemeId =
  | 'midnight-indigo'   // Default — indigo accent on slate
  | 'ocean-teal'        // Teal/cyan accent
  | 'emerald'           // Green accent
  | 'sunset-orange'     // Orange/amber accent
  | 'rose-pink'         // Pink/rose accent
  | 'royal-purple'      // Purple/violet accent
  | 'custom';           // User-picked custom colors

export interface AdminTheme {
  id: ThemeId;
  name: string;
  /** Accent color used for buttons, links, active states */
  accent: string;          // hex
  /** Accent foreground (text on accent bg) */
  accentFg: string;        // hex
  /** Soft tint of accent (used for hover/active backgrounds) */
  accentSoft: string;      // rgba or hex with alpha
  /** Subtle ring color around focused/active elements */
  accentRing: string;      // rgba
}

export const ADMIN_THEMES: Record<ThemeId, AdminTheme> = {
  'midnight-indigo': {
    id: 'midnight-indigo',
    name: 'Midnight Indigo',
    accent: '#6366F1',
    accentFg: '#FFFFFF',
    accentSoft: 'rgba(99,102,241,0.15)',
    accentRing: 'rgba(99,102,241,0.40)',
  },
  'ocean-teal': {
    id: 'ocean-teal',
    name: 'Ocean Teal',
    accent: '#14B8A6',
    accentFg: '#FFFFFF',
    accentSoft: 'rgba(20,184,166,0.15)',
    accentRing: 'rgba(20,184,166,0.40)',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald',
    accent: '#10B981',
    accentFg: '#FFFFFF',
    accentSoft: 'rgba(16,185,129,0.15)',
    accentRing: 'rgba(16,185,129,0.40)',
  },
  'sunset-orange': {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    accent: '#F97316',
    accentFg: '#FFFFFF',
    accentSoft: 'rgba(249,115,22,0.15)',
    accentRing: 'rgba(249,115,22,0.40)',
  },
  'rose-pink': {
    id: 'rose-pink',
    name: 'Rose Pink',
    accent: '#F43F5E',
    accentFg: '#FFFFFF',
    accentSoft: 'rgba(244,63,94,0.15)',
    accentRing: 'rgba(244,63,94,0.40)',
  },
  'royal-purple': {
    id: 'royal-purple',
    name: 'Royal Purple',
    accent: '#A855F7',
    accentFg: '#FFFFFF',
    accentSoft: 'rgba(168,85,247,0.15)',
    accentRing: 'rgba(168,85,247,0.40)',
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    accent: '#3B82F6',
    accentFg: '#FFFFFF',
    accentSoft: 'rgba(59,130,246,0.15)',
    accentRing: 'rgba(59,130,246,0.40)',
  },
};

const STORAGE_KEY = 'menukits_admin_theme';
const CUSTOM_STORAGE_KEY = 'menukits_admin_custom_theme';

interface CustomThemeData {
  accent: string;
  accentSoft: string;
  accentRing: string;
}

function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace('#', '');
  const bigint = parseInt(cleaned, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Pick readable text color (white or near-black) based on accent luminance. */
export function pickReadableText(hex: string): string {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  // Per WCAG luminance approximation
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#0F172A' : '#FFFFFF';
}

export function loadThemeId(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    if (stored && stored in ADMIN_THEMES) return stored;
  } catch { /* ignore */ }
  return 'midnight-indigo';
}

export function loadCustomTheme(): CustomThemeData | null {
  try {
    const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CustomThemeData;
  } catch {
    return null;
  }
}

export function saveTheme(id: ThemeId, customAccent?: string) {
  localStorage.setItem(STORAGE_KEY, id);
  if (id === 'custom' && customAccent) {
    const data: CustomThemeData = {
      accent: customAccent,
      accentSoft: hexToRgba(customAccent, 0.15),
      accentRing: hexToRgba(customAccent, 0.40),
    };
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(data));
  }
}

/** Apply the theme to the document by writing CSS variables on :root. */
export function applyTheme(id: ThemeId, customAccent?: string) {
  let theme: AdminTheme;
  if (id === 'custom' && customAccent) {
    theme = {
      id: 'custom',
      name: 'Custom',
      accent: customAccent,
      accentFg: pickReadableText(customAccent),
      accentSoft: hexToRgba(customAccent, 0.15),
      accentRing: hexToRgba(customAccent, 0.40),
    };
  } else {
    theme = ADMIN_THEMES[id];
  }

  const root = document.documentElement;
  root.style.setProperty('--admin-accent', theme.accent);
  root.style.setProperty('--admin-accent-fg', theme.accentFg);
  root.style.setProperty('--admin-accent-soft', theme.accentSoft);
  root.style.setProperty('--admin-accent-ring', theme.accentRing);
}

export function getCurrentAccent(): string {
  const id = loadThemeId();
  if (id === 'custom') {
    return loadCustomTheme()?.accent || ADMIN_THEMES.custom.accent;
  }
  return ADMIN_THEMES[id].accent;
}
