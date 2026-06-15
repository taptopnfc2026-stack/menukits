import { useState, useMemo, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import {
  Star,
  Flame,
  Leaf,
  Wheat,
  Info,
  X,
  Plus,
  Minus,
  ShoppingCart,
  Trash2,
  CheckCircle2,
  Printer,
  Instagram,
  Youtube,
  Music2,
  Twitter,
  Globe,
  MapPin,
  Phone,
  Mail,
  Clock,
  ExternalLink,
  AlertTriangle,
  ShieldCheck,
  CircleHelp,
  Loader2,
  BookOpen,
} from 'lucide-react';
import type { Dish, Menu } from '@/types';
import { CartProvider, useCart } from '@/contexts/CartContext';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { dbRowToMenu } from '@/lib/menu-row';
import { useDishExplain } from '@/services/dish-explain';

/* Dietary tag icon config — icons stay same, text gets translated via tTag */
const DIETARY_ICONS: Record<string, { icon: typeof Leaf; bg: string; color: string }> = {
  Vegan:       { icon: Leaf,  bg: 'bg-green-100',  color: 'text-green-800' },
  Vegetarian:  { icon: Leaf,  bg: 'bg-green-100',  color: 'text-green-800' },
  'Gluten-free':{ icon: Wheat, bg: 'bg-amber-100', color: 'text-amber-800' },
  'Lactose-free':{icon: Leaf,  bg: 'bg-blue-100',   color: 'text-blue-800' },
  'Dairy-free':  { icon: Leaf,  bg: 'bg-blue-100',   color: 'text-blue-800' },
  Spicy:        { icon: Flame, bg: 'bg-red-100',    color: 'text-red-800' },
};

const COVER_IMAGE = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop';
const RESTAURANT_NAME = 'My Restaurant';

/* Allergen & Dietary filter options — synced with AddDishDialog */
const ALLERGEN_OPTIONS = [
  'Gluten', 'Peanuts', 'Eggs', 'Fish', 'Crustaceans',
  'Soybeans', 'Milk', 'Nuts', 'Celery', 'Mustard',
  'Sesame', 'Sulfites', 'Lupin', 'Molluscs',
];

const DIETARY_OPTIONS = [
  'Vegan', 'Vegetarian', 'Gluten-free',
  'Lactose-free', 'Dairy-free', 'Spicy',
];

/** Parse **bold** markdown text into React nodes */
function formatBoldText(text: string): (string | React.ReactNode)[] {
  const result: (string | React.ReactNode)[] = [];
  const re = new RegExp('(\\*\\*.*?\\*\\*)', '');
  const parts = text.split(re);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('**') && part.endsWith('**')) {
      result.push(
        <strong key={result.length} className="font-semibold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      );
    } else {
      result.push(part);
    }
  }
  return result;
}

/** Fetch menu from public API by ID or slug */
async function fetchPublicMenu(idOrSlug: string): Promise<Menu | undefined> {
  try {
    // Try by IDs first (most direct)
    const res = await fetch('/api/public-menus?' + new URLSearchParams({
      ids: idOrSlug,
    }));
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const row = rows[0];
        return dbRowToMenu(row);
      }
    }

    // Fallback: try by slug (for friendly URLs)
    const slugRes = await fetch('/api/public-menus?' + new URLSearchParams({
      slug: idOrSlug,
    }));
    if (slugRes.ok) {
      const row = await slugRes.json();
      if (row) return dbRowToMenu(row);
    }
  } catch { /* ignore */}

  // Last resort: check localStorage (same-device cache)
  try {
    const raw = localStorage.getItem('menukits-menus');
    if (raw) {
      const cached: Menu[] = JSON.parse(raw);
      const found = cached.find((m) => m.id === idOrSlug);
      if (found) return found;
    }
  } catch { /* ignore */}

  return undefined;
}

function detectClientDevice(): 'mobile' | 'tablet' | 'desktop' {
  const ua = navigator.userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return 'tablet';
  if (/mobile|iphone|android/.test(ua)) return 'mobile';
  return 'desktop';
}

function trackMenuAnalytics(payload: Record<string, unknown>, useBeacon = false) {
  const body = JSON.stringify(payload);
  if (useBeacon && typeof navigator.sendBeacon === 'function') {
    try {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon('/api/menus?action=analytics', blob)) return;
    } catch {
      /* fall back to fetch */
    }
  }
  fetch('/api/menus?action=analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: useBeacon,
  }).catch(() => {});
}

/* ================================================================
   Inner component — uses Cart + Language contexts
   ================================================================ */
function MenuPreviewContent() {
  const { id } = useParams<{ id: string }>();

  // Async data loading — fetches from public API first, falls back to localStorage
  const [menu, setMenu] = useState<Menu | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const fetched = await fetchPublicMenu(id || '');
      if (!cancelled) {
        if (fetched) {
          setMenu(fetched);
        }
        setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [activeSection, setActiveSection] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showOrderSlip, setShowOrderSlip] = useState(false);

  /* Filter states */
  const [showAllergenFilter, setShowAllergenFilter] = useState(false);
  const [showDietaryFilter, setShowDietaryFilter] = useState(false);
  const [selectedUserAllergens, setSelectedUserAllergens] = useState<string[]>([]);
  const [selectedUserDietary, setSelectedUserDietary] = useState<string[]>([]);

  // Language & Cart hooks
  const { uiLang, restaurantLang, t, tTag, tSection, tDishName, tDesc } = useLanguage();
  const { items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart();

  // AI dish explanation (on-demand, follows uiLang)
  const explain = useDishExplain(uiLang);

  // Get quantity of a specific dish in cart
  const getDishQty = (dishId: string) =>
    items.find((item) => item.dish.id === dishId)?.quantity || 0;

  useEffect(() => {
    if (!menu?.id) return;
    const startedAt = Date.now();
    trackMenuAnalytics({
      event: 'menu_view',
      menuId: menu.id,
      device: detectClientDevice(),
      path: window.location.pathname,
    });

    const sendDuration = () => {
      const seconds = Math.round((Date.now() - startedAt) / 1000);
      if (seconds > 1) {
        trackMenuAnalytics({
          event: 'session_duration',
          menuId: menu.id,
          seconds,
        }, true);
      }
    };

    window.addEventListener('pagehide', sendDuration);
    return () => {
      window.removeEventListener('pagehide', sendDuration);
      sendDuration();
    };
  }, [menu?.id]);

  useEffect(() => {
    if (!menu) return;
    const firstVisible = menu.sections.find((section) => section.dishes.some((dish) => dish.isVisible));
    if (firstVisible && !activeSection) {
      setActiveSection(firstVisible.id);
    }
  }, [menu, activeSection]);

  const openDishDetail = (dish: Dish, sectionName?: string) => {
    setSelectedDish(dish);
    if (menu?.id) {
      trackMenuAnalytics({
        event: 'dish_view',
        menuId: menu.id,
        dishId: dish.id,
        dishName: dish.name,
        sectionName: sectionName || '',
      });
    }
  };

  const selectSection = (sectionId: string, sectionName: string) => {
    setActiveSection(sectionId);
    if (menu?.id) {
      trackMenuAnalytics({
        event: 'section_view',
        menuId: menu.id,
        sectionId,
        sectionName,
      });
    }
  };

  /* ---------- Filter helpers ---------- */
  const toggleUserAllergen = (a: string) =>
    setSelectedUserAllergens((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  const toggleUserDietary = (d: string) =>
    setSelectedUserDietary((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );

  /** Filter a dish */
  const passesFilter = (dish: Dish): boolean => {
    if (selectedUserAllergens.length > 0) {
      if (dish.allergens.some((a) => selectedUserAllergens.includes(a))) return false;
    }
    if (selectedUserDietary.length > 0) {
      if (!selectedUserDietary.some((d) => dish.dietaryTags.includes(d))) return false;
    }
    return true;
  };

  /* ---------- Order slip data ---------- */
  const orderNumber = useMemo(() => {
    return `ORD-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  }, []);
  const orderTime = useMemo(
    () =>
      new Intl.DateTimeFormat(uiLang === 'zh' ? 'zh-CN' : uiLang, {
        hour: '2-digit',
        minute: '2-digit',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date()),
    [uiLang]
  );

  /* ========== Loading / Not Found ========== */
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <div className="text-center px-6">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#5544e4] mb-4" />
          <p className="text-lg font-medium text-gray-700">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <div className="text-center px-6">
          <p className="text-lg font-medium text-gray-900">{t('menuNotFound')}</p>
          <p className="mt-2 text-sm text-gray-500">{t('menuNotFoundDesc')}</p>
          <a
            href="/"
            className="mt-4 inline-block rounded-full bg-[black] px-6 py-2.5 text-sm font-medium text-white hover:bg-[gray-800]"
          >
            {t('goToHomepage')}
          </a>
        </div>
      </div>
    );
  }

  const visibleSections = menu.sections.filter((s) =>
    s.dishes.some((d) => d.isVisible)
  );
  const restaurantName = menu.restaurantInfo?.name?.trim() || menu.title || RESTAURANT_NAME;
  const coverImage = menu.restaurantInfo?.coverImage?.trim() || COVER_IMAGE;

  /* ========== Main Render ========== */
  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* ====== Customer Mobile Frame ====== */}
      <div className="mx-auto flex min-h-screen max-w-[460px] flex-col shadow-2xl relative pb-[72px]"
        style={{ background: 'linear-gradient(180deg, #ffffff 0%, #ffffff 40%, #f2f0f5 85%, #1b191f 100%)' }}>

        {/* Cover Image Section */}
        <div className="relative w-full aspect-[4/3] overflow-hidden shrink-0">
          <img src={coverImage} alt="Restaurant cover" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Language Switcher — prominent button */}
          <div className="absolute top-4 right-4">
            <LanguageSwitcher />
          </div>

          {/* Restaurant info on cover */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h1 className="text-[26px] font-bold text-white drop-shadow-lg leading-tight">{restaurantName}</h1>
            <p className="mt-1.5 flex items-center gap-1.5 text-[15px] text-white/85 font-medium">
              <span className="inline-block h-2 w-2 rounded-full bg-green-400"></span>
              {t('openToday')}
            </p>
          </div>
        </div>

        {/* ====== Filter Bar — Allergens & Dietary ====== */}
        <div className="flex items-center gap-3 px-[14px] py-3.5 bg-white/95 backdrop-blur shrink-0">
          <button
            onClick={() => setShowAllergenFilter(true)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-[18px] py-2 text-[13px] font-semibold transition-all active:scale-95 ${
              selectedUserAllergens.length > 0
                ? 'border-red-500 bg-red-500 text-white shadow-md'
                : 'border-red-300 bg-red-50 text-red-700 hover:bg-red-500 hover:border-red-500 hover:text-white hover:shadow-md'
            }`}
          >
            <AlertTriangle className={`h-4 w-4 ${selectedUserAllergens.length > 0 ? 'text-white' : 'text-red-500'}`} />
            {t('allergenFilter') || 'Allergens'}
            {selectedUserAllergens.length > 0 && (
              <span className="ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/25 px-1.5 text-[11px] font-bold text-white">
                {selectedUserAllergens.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowDietaryFilter(true)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-[18px] py-2 text-[13px] font-semibold transition-all active:scale-95 ${
              selectedUserDietary.length > 0
                ? 'border-green-500 bg-green-500 text-white shadow-md'
                : 'border-green-300 bg-green-50 text-green-700 hover:bg-green-500 hover:border-green-500 hover:text-white hover:shadow-md'
            }`}
          >
            <ShieldCheck className={`h-4 w-4 ${selectedUserDietary.length > 0 ? 'text-white' : 'text-green-500'}`} />
            {t('dietaryFilter') || 'Dietary'}
            {selectedUserDietary.length > 0 && (
              <span className="ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/25 px-1.5 text-[11px] font-bold text-white">
                {selectedUserDietary.length}
              </span>
            )}
          </button>
          {(selectedUserAllergens.length > 0 || selectedUserDietary.length > 0) && (
            <button
              onClick={() => { setSelectedUserAllergens([]); setSelectedUserDietary([]); }}
              className="ml-auto text-[13px] font-semibold text-gray-400 underline underline-offset-3 hover:text-gray-600 transition-colors"
            >
              {t('clearFilters') || 'Clear'}
            </button>
          )}
        </div>

        {/* Section Navigation Tabs — larger, clearer */}
        <div className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur shrink-0">
          <div className="flex gap-0 overflow-x-auto px-[14px] no-scrollbar">
            {visibleSections.map((section) => {
              const secName = tSection(section.name, section.translations);
              return (
              <button
                key={section.id}
                onClick={() => selectSection(section.id, section.name)}
                className={`relative shrink-0 px-[18px] py-[14px] text-[15px] font-semibold transition-colors whitespace-nowrap ${
                  activeSection === section.id ? 'text-black' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {secName.display}
                {activeSection === section.id && (
                  <span className="absolute bottom-0 left-1/2 h-[3px] w-4/5 -translate-x-1/2 rounded-full bg-black" />
                )}
              </button>
              );
            })}
          </div>
        </div>

        {/* Menu Content — scrollable area, wider padding */}
        <div className="flex-1 px-[12px] pb-4 overflow-y-auto">
          {visibleSections
            .filter((s) => s.id === activeSection)
            .map((section) => {
              const sectionTitle = tSection(section.name, section.translations);
              return (
              <div key={section.id} className="pt-4">
                <h2 className="mb-3 text-[20px] font-bold text-gray-900">{sectionTitle.display}</h2>
                <div className="space-y-3.5">
                  {section.dishes.filter((d) => d.isVisible && passesFilter(d)).map((dish) => {
                    const qty = getDishQty(dish.id);
                    const dishName = tDishName(dish.name, dish.translations);
                    const dishDesc = tDesc(dish.description, dish.translations);
                    return (
                      <div
                        key={dish.id}
                        className="flex w-full gap-3.5 rounded-2xl border border-gray-100 bg-white p-[14px] shadow-sm transition-all"
                      >
                        {/* Dish Image - clickable to open detail */}
                        <button onClick={() => openDishDetail(dish, section.name)} className="shrink-0 block">
                          {dish.image ? (
                            <div className="h-[100px] w-[100px] overflow-hidden rounded-xl">
                              <img src={dish.image} alt={dish.name} className="h-full w-full object-cover" />
                            </div>
                          ) : (
                            <div className="flex h-[100px] w-[100px] items-center justify-center rounded-xl bg-gray-100 text-gray-300">
                              <Info className="h-8 w-8" />
                            </div>
                          )}
                        </button>

                        {/* Dish Info — larger, clearer, bilingual */}
                        <div className="min-w-0 flex-1 flex flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-1 min-w-0">
                              <button onClick={() => openDishDetail(dish, section.name)} className="text-left min-w-0 flex-1">
                                <h3 className="text-[16px] font-bold text-gray-900 leading-snug">{dishName.display}</h3>
                                {dish.tag && (
                                  <span className="mt-1 inline-block rounded-full bg-black/8 px-2.5 py-1 text-[11px] font-semibold text-black/80">
                                    {dish.tag}
                                  </span>
                                )}
                              </button>
                              {/* AI Explain Button */}
                              <button
                                onClick={(e) => { e.stopPropagation(); explain.explainDish(dish); }}
                                title="Tell me about this dish"
                                className="shrink-0 mt-0.5 p-1 rounded-full text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                              >
                                <CircleHelp className="h-[18px] w-[18px]" />
                              </button>
                            </div>
                            <span className="shrink-0 font-bold text-gray-900 text-[18px] tabular-nums">
                              ${dish.price.toFixed(2)}
                            </span>
                          </div>

                          {/* Bilingual description */}
                          <p className="mt-1.5 text-[14px] leading-relaxed text-gray-500 flex-shrink line-clamp-2">
                            {dishDesc.display}
                          </p>

                          {/* Tags row — dietary tags translated via tTag */}
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {dish.isBestSeller && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-100 px-2.5 py-1 text-[11px] font-semibold text-yellow-800">
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />{t('bestSeller')}
                              </span>
                            )}
                            {dish.dietaryTags.slice(0, 2).map((tag) => {
                              const cfg = DIETARY_ICONS[tag];
                              if (!cfg) return null;
                              const IconComp = cfg.icon;
                              return (
                                <span key={tag} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${cfg.bg} ${cfg.color}`}>
                                  <IconComp className="h-3 w-3" />{tTag(tag)}
                                </span>
                              );
                            })}
                          </div>

                          {/* Add to cart / Quantity control — larger, clearer */}
                          <div className="mt-2.5 flex items-center justify-end">
                            {qty === 0 ? (
                              <button
                                onClick={() => addItem(dish)}
                                className="flex items-center gap-2 rounded-full bg-black px-[18px] py-2 text-[14px] font-semibold text-white shadow-sm active:scale-95 transition-transform"
                              >
                                <Plus className="h-4 w-4" />{t('add')}
                              </button>
                            ) : (
                              <div className="flex items-center gap-2.5 rounded-full border border-black/20 bg-black/05 px-1">
                                <button
                                  onClick={() => updateQuantity(dish.id, qty - 1)}
                                  className="flex h-8 w-8 items-center justify-center rounded-full text-black hover:bg-black/10"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="min-w-[24px] text-center text-[16px] font-bold text-black">{qty}</span>
                                <button
                                  onClick={() => addItem(dish)}
                                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white hover:bg-gray-800"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              );
            })}

          {/* Empty state — including when all dishes are filtered out */}
          {visibleSections.filter(
            (s) => s.id === activeSection && s.dishes.filter((d) => d.isVisible && passesFilter(d)).length === 0
          ).length > 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              {(selectedUserAllergens.length > 0 || selectedUserDietary.length > 0) ? (
                <>
                  <p className="text-gray-500 font-medium">{t('noMatchingDishes') || 'No dishes match your filters'}</p>
                  <button
                    onClick={() => { setSelectedUserAllergens([]); setSelectedUserDietary([]); }}
                    className="mt-3 text-sm text-black/70 underline underline-offset-2 hover:text-black"
                  >
                    {t('clearFilters') || 'Clear all filters'}
                  </button>
                </>
              ) : (
                <p className="text-gray-400">{t('noDishes')}</p>
              )}
            </div>
          )}

          {/* Bottom spacer so content isn't hidden behind floating cart bar */}
          <div className="h-4" />
        </div>

        {/* ====== Restaurant Info Footer ====== */}
        {(() => {
          const ri = menu?.restaurantInfo;
          const social = ri?.socialLinks || {};
          const hours = ri?.hours || [];
          const hasContact = !!(ri?.address || ri?.phone || ri?.email || social?.website);
          const hasHours = hours.length > 0;
          /* Build social link entries */
          const socialEntries: { icon: typeof Instagram; label: string; url: string }[] = [];
          if (social.instagram) socialEntries.push({ icon: Instagram, label: 'Instagram', url: `https://instagram.com/${social.instagram.replace('@','')}` });
          if (social.tiktok) socialEntries.push({ icon: Music2, label: 'TikTok', url: `https://tiktok.com/@${social.tiktok.replace('@','')}` });
          if (social.twitterX) socialEntries.push({ icon: Twitter, label: 'X', url: `https://x.com/${social.twitterX}` });
          if (social.youtube) socialEntries.push({ icon: Youtube, label: 'YouTube', url: `https://youtube.com/${social.youtube}` });
          if (social.website) socialEntries.push({ icon: Globe, label: 'Website', url: social.website.startsWith('http') ? social.website : `https://${social.website}` });
          const hasSocial = socialEntries.length > 0;

          return (
            <div
              className="text-white px-6 pt-10 pb-8 mt-3"
              style={{
                background: 'linear-gradient(180deg, #2c2a35 0%, #232128 50%, #1b191f 100%)',
              }}
            >
              {/* Restaurant name — only when info available */}
              {ri?.name && (
                <h3 className="text-center text-xl font-bold tracking-wide mb-7" style={{ color: '#f0ece4' }}>{ri.name}</h3>
              )}

              {/* HOURS | CONTACT grid — only when we have data */}
              {(hasHours || hasContact) && (
                <>
                  <div className="grid grid-cols-2 gap-6 max-w-[380px] mx-auto mb-6">
                    {/* Hours column */}
                    <div>
                      <p className="text-[11px] uppercase tracking-widest font-semibold mb-2.5" style={{ color: '#9a95a8' }}>{t('hours') || 'Hours'}</p>
                      {hasHours ? (
                        <div className="space-y-1.5">
                          {hours.map((h, i) => (
                            <p key={i} className="text-[13px] leading-tight" style={{ color: '#c8c4d0' }}>
                              <span style={{ color: '#e8e4ec' }}>{h.day}</span>{': '}
                              {h.closed ? <span className="italic" style={{ color: '#6b6578' }}>Closed</span> : <span style={{ color: '#ddd8e4' }}>{h.open} - {h.close}</span>}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[13px] italic" style={{ color: '#6b6578' }}>Not set</p>
                      )}
                    </div>

                    {/* Contact column */}
                    <div>
                      <p className="text-[11px] uppercase tracking-widest font-semibold mb-2.5" style={{ color: '#9a95a8' }}>{t('contact') || 'Contact'}</p>
                      <div className="space-y-2">
                        {ri?.address && (
                          <a href={`https://maps.google.com/?q=${encodeURIComponent(ri.address)}`} target="_blank" rel="noopener noreferrer" className="flex items-start gap-1.5 text-[13px] transition-colors group">
                            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 group-hover:text-white transition-colors" style={{ color: '#7a7588' }} />
                            <span className="leading-tight group-hover:text-white transition-colors" style={{ color: '#c8c4d0' }}>{ri.address}</span>
                            <ExternalLink className="h-2.5 w-2.5 shrink-0 mt-0.5 opacity-30" />
                          </a>
                        )}
                        {ri?.phone && (
                          <a href={`tel:${ri.phone}`} className="flex items-center gap-1.5 text-[13px] transition-colors group">
                            <Phone className="h-3.5 w-3.5 shrink-0 group-hover:text-white transition-colors" style={{ color: '#7a7588' }} />
                            <span className="group-hover:text-white transition-colors" style={{ color: '#c8c4d0' }}>{ri.phone}</span>
                          </a>
                        )}
                        {ri?.email && (
                          <a href={`mailto:${ri.email}`} className="flex items-center gap-1.5 text-[13px] transition-colors group">
                            <Mail className="h-3.5 w-3.5 shrink-0 group-hover:text-white transition-colors" style={{ color: '#7a7588' }} />
                            <span className="truncate group-hover:text-white transition-colors" style={{ color: '#c8c4d0' }}>{ri.email}</span>
                          </a>
                        )}
                        {social?.website && (
                          <a href={social.website.startsWith('http') ? social.website : `https://${social.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[13px] transition-colors group">
                            <Globe className="h-3.5 w-3.5 shrink-0 group-hover:text-white transition-colors" style={{ color: '#7a7588' }} />
                            <span className="truncate group-hover:text-white transition-colors" style={{ color: '#c8c4d0' }}>{social.website.replace(/^https?:\/\//,'')}</span>
                            <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-30" />
                          </a>
                        )}
                        {!hasContact && (
                          <p className="text-[13px] italic" style={{ color: '#6b6578' }}>Not set</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="max-w-[380px] mx-auto my-5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />
                </>
              )}

              {/* Follow Us — only when social links exist */}
              {hasSocial && (
                <div className="text-center mb-6">
                  <p className="text-[11px] uppercase tracking-widest font-semibold mb-3" style={{ color: '#9a95a8' }}>{t('followUs') || 'Follow us'}</p>
                  <div className="flex items-center justify-center gap-4">
                    {socialEntries.map((entry) => {
                      const Icon = entry.icon;
                      return (
                        <a
                          key={entry.label}
                          href={entry.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={entry.label}
                          className="flex h-9 w-9 items-center justify-center rounded-full border transition-all active:scale-95 hover:bg-white/15 hover:border-white/25"
                          style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(220,216,228,0.65)' }}
                        >
                          <Icon className="h-[18px] w-[18px]" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Legal links row */}
              <div className="text-center mb-3">
                <div className="flex items-center justify-center gap-x-4 gap-y-1 flex-wrap">
                  <a href="/privacy" className="text-[10px] underline underline-offset-2 hover:text-gray-300 transition-colors" style={{ color: '#6b6578' }}>
                    Privacy Policy
                  </a>
                  <a href="/terms" className="text-[10px] underline underline-offset-2 hover:text-gray-300 transition-colors" style={{ color: '#6b6578' }}>
                    Terms of Service
                  </a>
                  <a href="/cookies" className="text-[10px] underline underline-offset-2 hover:text-gray-300 transition-colors" style={{ color: '#6b6578' }}>
                    Cookie Policy
                  </a>
                  <a href="/imprint" className="text-[10px] underline underline-offset-2 hover:text-gray-300 transition-colors" style={{ color: '#6b6578' }}>
                    Imprint
                  </a>
                </div>
              </div>

              {/* Copyright + Powered by — always visible */}
              <div className="text-center space-y-1.5 pt-1">
                <p className="text-[11px]" style={{ color: '#6b6578' }}>
                  &copy; {new Date().getFullYear()} {(ri?.name || 'Restaurant')}. All rights reserved.
                </p>
                <p className="text-[10px]" style={{ color: '#555062' }}>
                  Powered by <span className="font-semibold" style={{ color: '#8b7ae0' }}>MenuKits</span>
                </p>
              </div>

              {/* Bottom spacer to eliminate white gap at viewport bottom */}
              <div className="h-6 sm:h-8" />
            </div>
          );
        })()}
      </div>

      {/* ====== Floating Cart Bar ====== */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 safe-area-bottom">
          <div className="mx-auto max-w-[460px]">
            <button
              onClick={() => setShowCart(true)}
              className="flex w-full items-center gap-3 rounded-t-2xl bg-black px-5 py-[18px] shadow-[0_-4px_24px_rgba(0,0,0,0.25)] active:scale-[0.99] transition-transform"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <span className="flex-1 text-left text-[15px] font-semibold text-white">
                {t('itemsInCart', totalItems, totalItems > 1 ? 's' : '')}
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-base font-bold text-white tabular-nums">
                ${totalPrice.toFixed(2)}
              </span>
              <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ====== Cart Drawer ====== */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-[460px] animate-slide-up rounded-t-3xl bg-white sm:rounded-3xl sm:m-4 max-h-[85vh] flex flex-col">
            {/* Handle bar + close */}
            <div className="flex items-center justify-between pt-3 pb-1 px-6">
              <div className="flex justify-center grow">
                <div className="h-1 w-10 rounded-full bg-gray-300" />
              </div>
              <button onClick={() => setShowCart(false)} className="absolute right-4 top-4 rounded-full bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 pb-5 flex-1 flex flex-col overflow-hidden">
              <h2 className="text-[20px] font-bold text-gray-900 mb-1">{t('yourOrder')}</h2>
              <p className="text-[13px] text-gray-400 mb-4">{RESTAURANT_NAME}</p>

              {/* Item list */}
              <div className="flex-1 overflow-y-auto space-y-3.5 -mx-1 px-1">
                {items.map((item) => {
                  const cartDishName = tDishName(item.dish.name, item.dish.translations);
                  return (
                  <div key={item.dish.id} className="flex items-start gap-3 rounded-xl bg-gray-50 p-3.5">
                    <img
                      src={item.dish.image || ''}
                      alt={item.dish.name}
                      className="h-[60px] w-[60px] shrink-0 rounded-lg object-cover bg-gray-200"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-gray-900 truncate leading-snug">{cartDishName.display}</p>
                      <p className="text-[13px] text-gray-500">${item.dish.price.toFixed(2)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.dish.id, item.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100"
                        ><Minus className="h-3.5 w-3.5" /></button>
                        <span className="min-w-[24px] text-center text-[15px] font-bold text-gray-900">{item.quantity}</span>
                        <button
                          onClick={() => addItem(item.dish)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100"
                        ><Plus className="h-3.5 w-3.5" /></button>
                        <button
                          onClick={() => removeItem(item.dish.id)}
                          className="ml-auto p-1.5 text-red-400 hover:text-red-600"
                        ><Trash2 className="h-4.5 w-4.5" /></button>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-[15px] font-bold text-gray-900">
                        ${(item.dish.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  );
                })}

                {items.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <ShoppingCart className="h-10 w-10 mb-2 opacity-40" />
                    <p className="text-sm">{t('yourCartIsEmpty')}</p>
                  </div>
                )}
              </div>

              {/* Total + Actions */}
              <div className="border-t border-gray-100 mt-4 pt-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] text-gray-500 font-medium">{t('total')}</span>
                  <span className="text-[22px] font-bold text-gray-900">${totalPrice.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => {
                    setShowCart(false);
                    setShowOrderSlip(true);
                  }}
                  disabled={items.length === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-4 text-[15px] font-semibold text-white shadow-md disabled:opacity-40 active:scale-[0.98] transition-all hover:bg-gray-800"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  {t('placeOrder')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== Order Slip / Receipt ====== */}
      {showOrderSlip && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-[460px] max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl sm:m-4" style={{ background: 'repeating-linear-gradient(180deg, #f9f6f0 0px, #f9f6f0 14px, #faf8f3 14px, #faf8f3 28px)' }}>
            {/* Zigzag tear-off top edge */}
            <div className="sticky top-0 z-10 overflow-hidden rounded-t-3xl sm:rounded-t-3xl" style={{ height: '12px' }}>
              <svg viewBox="0 0 400 12" preserveAspectRatio="none" className="w-full h-full" style={{ fill: '#f9f6f0' }}>
                <path d="M0 6 Q10 0 20 6 Q30 12 40 6 Q50 0 60 6 Q70 12 80 6 Q90 0 100 6 Q110 12 120 6 Q130 0 140 6 Q150 12 160 6 Q170 0 180 6 Q190 12 200 6 Q210 0 220 6 Q230 12 240 6 Q250 0 260 6 Q270 12 280 6 Q290 0 300 6 Q310 12 320 6 Q330 0 340 6 Q350 12 360 6 Q370 0 380 6 Q390 12 400 6 L400 12 L0 12 Z" />
              </svg>
            </div>

            <div className="px-5 pb-7">
              {/* Header actions */}
              <div className="flex items-center justify-end mb-3 gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-black/[0.03]"
                >
                  <Printer className="h-3.5 w-3.5" />{t('print')}
                </button>
                <button
                  onClick={() => setShowOrderSlip(false)}
                  className="rounded-full p-1.5 text-gray-400 hover:bg-black/[0.04]"
                ><X className="h-5 w-5" /></button>
              </div>

              {/* Receipt body — paper style */}
              <div id="order-slip" className="relative mx-auto max-w-[320px]">
                <div className="absolute inset-0 rounded-sm shadow-[inset_0_0_30px_rgba(0,0,0,0.03)] pointer-events-none" />

                <div className="text-center mb-4 pb-3 border-b border-dashed border-gray-300/70">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-medium">{t('orderSlip')}</p>
                  <h2 className="mt-1 text-2xl font-bold text-gray-900 tracking-wide" style={{ fontFamily: '"Courier New", Courier, monospace', letterSpacing: '0.05em' }}>{RESTAURANT_NAME}</h2>
                  <p className="mt-0.5 text-[11px] text-gray-400" style={{ fontFamily: '"Courier New", Courier, monospace' }}>{orderTime}</p>
                  <div className="mt-2 inline-block rounded-full border border-dashed border-gray-300/60 px-3 py-0.5 bg-white/40">
                    <span className="text-[11px] font-mono font-bold text-gray-700">{orderNumber}</span>
                  </div>
                </div>

                <div className="space-y-0">
                  <div className="grid grid-cols-[1fr_36px_56px] gap-1 text-[9px] uppercase tracking-wider text-gray-400 font-semibold pb-1.5 border-b border-dashed border-gray-300/50" style={{ fontFamily: '"Courier New", Courier, monospace' }}>
                    <span>{t('item')}</span>
                    <span className="text-center">{t('qty')}</span>
                    <span className="text-right">{t('price')}</span>
                  </div>
                  {items.map((item) => (
                    <div key={item.dish.id} className="grid grid-cols-[1fr_36px_56px] gap-1 py-1.5 border-b border-dotted border-gray-200/80" style={{ fontFamily: '"Courier New", Courier, monospace' }}>
                      <div className="min-w-0 pr-1">
                        <p className="text-[13px] font-semibold text-gray-800 truncate leading-tight">{tDishName(item.dish.name, item.dish.translations).display}</p>
                        <p className="text-[9px] text-gray-400 mt-0">@${item.dish.price.toFixed(2)} {t('each', '').replace('{}','').trim()}</p>
                      </div>
                      <span className="text-center self-start pt-0.5 text-[13px] font-bold text-gray-600">{item.quantity}</span>
                      <span className="text-right self-start pt-0.5 text-[13px] font-bold text-gray-900">
                        ${(item.dish.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 space-y-1 pt-3 border-t border-dashed border-gray-300/70" style={{ fontFamily: '"Courier New", Courier, monospace' }}>
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>{t('subtotal', totalItems.toString())}</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400 italic">
                    <span>{t('taxService')}</span>
                    <span>See bill</span>
                  </div>
                  <div className="flex justify-between pt-2.5 pb-1 border-t border-dashed border-gray-300/70 mt-1">
                    <span className="text-[15px] font-bold text-gray-900 tracking-wide">TOTAL</span>
                    <span className="text-[16px] font-extrabold text-gray-900">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-lg border border-dashed border-gray-200 bg-white/50 p-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                  <p className="text-[11px] leading-relaxed text-gray-500">
                    <strong className="text-gray-700">{t('showReceiptToServerStrong')}</strong> {t('showReceiptToServer', '')}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-dashed border-gray-200/60 text-center">
                  <p className="text-[9px] text-gray-400 tracking-wider" style={{ fontFamily: '"Courier New", Courier, monospace' }}>
                    {t('orderedVia')}<span className="font-bold text-gray-500 ml-0.5">menukits</span>
                  </p>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => {
                    clearCart();
                    setShowOrderSlip(false);
                  }}
                  className="flex-1 rounded-xl border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 hover:bg-black/[0.02]"
                >
                  {t('newOrder')}
                </button>
                <button
                  onClick={() => setShowOrderSlip(false)}
                  className="flex-1 rounded-xl bg-black py-3 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  {t('done')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== Dish Detail Modal ====== */}
      {selectedDish && !showOrderSlip && (() => {
        const modalDishName = tDishName(selectedDish.name, selectedDish.translations);
        const modalDishDesc = tDesc(selectedDish.description, selectedDish.translations);
        return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedDish(null)} />
          <div className="relative w-full max-w-[460px] animate-slide-up rounded-t-3xl bg-white sm:rounded-3xl sm:m-4">
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-gray-300" />
            </div>
            <button
              onClick={() => setSelectedDish(null)}
              className="absolute right-4 top-4 rounded-full bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="pb-7">
              {selectedDish.image && (
                <div className="mx-5 mb-4 h-56 overflow-hidden rounded-2xl">
                  <img src={selectedDish.image} alt={selectedDish.name} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="px-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <h2 className="text-[22px] font-bold text-gray-900 leading-snug">{modalDishName.display}</h2>
                      <button
                        onClick={() => explain.explainDish(selectedDish)}
                        title="Tell me about this dish"
                        className="shrink-0 mt-1 p-1 rounded-full text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                      >
                        <CircleHelp className="h-5 w-5" />
                      </button>
                    </div>
                    {selectedDish.tag && (
                      <span className="mt-1.5 inline-block rounded-full bg-black/8 px-3 py-1 text-[12px] font-semibold text-black/80">
                        {selectedDish.tag}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-[22px] font-bold text-gray-900 tabular-nums">${selectedDish.price.toFixed(2)}</span>
                </div>

                <p className="mt-3 text-[15px] leading-relaxed text-gray-600">{modalDishDesc.display}</p>
                <div className="mt-5 space-y-4">
                  {selectedDish.dietaryTags.length > 0 && (
                    <div>
                      <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-gray-400">{t('dietaryInfo')}</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedDish.dietaryTags.map((tag) => {
                          const cfg = DIETARY_ICONS[tag];
                          if (!cfg) return null;
                          const IconComp = cfg.icon;
                          return (
                            <span key={tag} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${cfg.bg} ${cfg.color}`}>
                              <IconComp className="h-4 w-4" />{tTag(tag)}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {selectedDish.allergens.length > 0 && (
                    <div>
                      <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-gray-400">{t('allergens')}</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedDish.allergens.map((a) => (
                          <span key={a} className="rounded-full bg-red-50 px-3 py-1.5 text-[14px] font-medium text-red-700">{tTag(a)}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => {
                      addItem(selectedDish);
                      setSelectedDish(null);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-4 text-[15px] font-semibold text-white shadow-md active:scale-[0.98] transition-transform hover:bg-gray-800"
                  >
                    <Plus className="h-5 w-5" />{t('addToOrder')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* ====== AI Dish Explanation Popup ====== */}
      {(explain.status !== 'idle') && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={explain.dismiss} />
          <div className="relative w-full max-w-[460px] animate-slide-up rounded-t-3xl bg-white sm:rounded-3xl sm:m-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pt-5 pb-3 px-6 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
                  {explain.status === 'loading' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : explain.status === 'error' ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <BookOpen className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">{explain.status === 'loading' ? t('learningAboutDish') : t('dishStory')}</h3>
                  <p className="text-xs text-gray-400">{t('aiInsights')}</p>
                </div>
              </div>
              <button onClick={explain.dismiss}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              ><X className="h-5 w-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {explain.status === 'loading' && (
                <div className="space-y-3">
                  <div className="h-4 bg-gray-100 rounded-full animate-pulse w-full" />
                  <div className="h-4 bg-gray-100 rounded-full animate-pulse w-11/12" />
                  <div className="h-4 bg-gray-100 rounded-full animate-pulse w-10/12" />
                  <div className="h-4 bg-gray-100 rounded-full animate-pulse w-full mt-4" />
                  <div className="h-4 bg-gray-100 rounded-full animate-pulse w-9/12" />
                  <div className="h-4 bg-gray-100 rounded-full animate-pulse w-full" />
                </div>
              )}
              {explain.status === 'error' && (
                <div className="text-center py-6">
                  <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-amber-400" />
                  <p className="text-sm text-gray-600">{explain.error}</p>
                  <button
                    onClick={() => {
                      if (explain.activeDishId) {
                        const dish = menu?.sections.flatMap(s => s.dishes).find(d => d.id === explain.activeDishId);
                        if (dish) explain.explainDish(dish);
                      }
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-100"
                  >
                    {t('tryAgain')}
                  </button>
                </div>
              )}
              {explain.status === 'ready' && explain.text && (
                <div className="space-y-3 leading-relaxed text-[15px] text-gray-700">
                  {explain.text.split('\n').filter(Boolean).map((line, i) => (
                    <p key={i}>{formatBoldText(line)}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 pb-5 pt-2">
              <button onClick={explain.dismiss}
                className="w-full rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200 active:scale-[0.98] transition-all"
              >
                {t('gotIt')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== Allergen Filter Bottom Sheet ====== */}
      {showAllergenFilter && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAllergenFilter(false)} />
          <div className="relative w-full max-w-[460px] animate-slide-up rounded-t-3xl bg-white sm:rounded-3xl sm:m-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pt-4 pb-2 px-6 border-b border-gray-100">
              <div className="flex justify-center grow">
                <div className="h-1 w-10 rounded-full bg-gray-300" />
              </div>
              <button onClick={() => setShowAllergenFilter(false)} className="absolute right-5 top-4 rounded-full bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="flex items-center gap-2.5 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h3 className="text-[18px] font-bold text-gray-900">{t('allergenFilterTitle') || 'Select your allergens'}</h3>
              </div>
              <p className="text-[13px] text-gray-500 mb-5 leading-relaxed">{t('allergenFilterDesc') || 'Dishes containing selected allergens will be hidden from the menu.'}</p>

              <div className="space-y-2">
                {ALLERGEN_OPTIONS.map((a) => {
                  const active = selectedUserAllergens.includes(a);
                  return (
                    <button
                      key={a}
                      onClick={() => toggleUserAllergen(a)}
                      className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-left transition-all active:scale-[0.98] ${
                        active ? 'bg-red-50 border-2 border-red-300' : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <span className={`text-[14.5px] font-medium ${active ? 'text-red-700' : 'text-gray-700'}`}>{tTag(a)}</span>
                      <span className={`shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        active ? 'border-red-500 bg-red-500' : 'border-gray-300'
                      }`}>
                        {active && (<svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setSelectedUserAllergens([])}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                {t('clearFilters') || 'Clear all'}
              </button>
              <button
                onClick={() => setShowAllergenFilter(false)}
                className="flex-1 rounded-xl bg-black py-3 text-sm font-semibold text-white hover:bg-gray-800"
              >
                {t('apply') || 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== Dietary Filter Bottom Sheet ====== */}
      {showDietaryFilter && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDietaryFilter(false)} />
          <div className="relative w-full max-w-[460px] animate-slide-up rounded-t-3xl bg-white sm:rounded-3xl sm:m-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pt-4 pb-2 px-6 border-b border-gray-100">
              <div className="flex justify-center grow">
                <div className="h-1 w-10 rounded-full bg-gray-300" />
              </div>
              <button onClick={() => setShowDietaryFilter(false)} className="absolute right-5 top-4 rounded-full bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="flex items-center gap-2.5 mb-2">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                <h3 className="text-[18px] font-bold text-gray-900">{t('dietaryFilterTitle') || 'Select dietary preferences'}</h3>
              </div>
              <p className="text-[13px] text-gray-500 mb-5 leading-relaxed">{t('dietaryFilterDesc') || 'Only dishes matching your preferences will be shown.'}</p>

              <div className="space-y-2">
                {DIETARY_OPTIONS.map((d) => {
                  const active = selectedUserDietary.includes(d);
                  const cfg = DIETARY_ICONS[d];
                  const IconComp = cfg?.icon || Leaf;
                  return (
                    <button
                      key={d}
                      onClick={() => toggleUserDietary(d)}
                      className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-left transition-all active:scale-[0.98] ${
                        active ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <IconComp className={`h-[18px] w-[18px] ${active ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className={`text-[14.5px] font-medium ${active ? 'text-green-700' : 'text-gray-700'}`}>
                          {tTag(d) !== d ? tTag(d) : d}
                        </span>
                      </div>
                      <span className={`shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        active ? 'border-green-500 bg-green-500' : 'border-gray-300'
                      }`}>
                        {active && (<svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setSelectedUserDietary([])}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                {t('clearFilters') || 'Clear all'}
              </button>
              <button
                onClick={() => setShowDietaryFilter(false)}
                className="flex-1 rounded-xl bg-black py-3 text-sm font-semibold text-white hover:bg-gray-800"
              >
                {t('apply') || 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   Exported wrapper with providers
   ================================================================ */
export default function MenuPreviewPage() {
  return (
    <LanguageProvider>
      <CartProvider>
        <MenuPreviewContent />
      </CartProvider>
    </LanguageProvider>
  );
}
