import { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  ChevronLeft,
  Star,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import type { Menu } from '@/types';

const COVER_IMAGE = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop';

interface MenuPreviewDrawerProps {
  menus: Menu[];
  restaurantName?: string;
  /** If provided, skip menu list and show this menu's dishes directly */
  initialMenuId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MenuPreviewDrawer({ menus, restaurantName = 'My Restaurant', initialMenuId, open, onOpenChange }: MenuPreviewDrawerProps) {
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(initialMenuId ?? null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // Sync initialMenuId when it changes (e.g., different menu opened in editor)
  if (initialMenuId && selectedMenuId !== initialMenuId && !open) {
    // Reset on close so next open picks up new initial
    setSelectedMenuId(initialMenuId);
  }

  // When dialog opens with initialMenuId, jump straight to dishes view
  useEffect(() => {
    if (open && initialMenuId) {
      setSelectedMenuId(initialMenuId);
      setActiveSectionId(null);
    } else if (!open) {
      // Reset when closed (only if we have initialMenuId mode)
      if (initialMenuId) {
        setSelectedMenuId(null);
        setActiveSectionId(null);
      }
    }
  }, [open, initialMenuId]);

  const visibleMenus = menus.filter((m) => m.isVisible);
  const selectedMenu = selectedMenuId ? visibleMenus.find((m) => m.id === selectedMenuId) : null;

  // Get visible sections of selected menu
  const visibleSections = selectedMenu
    ? selectedMenu.sections.filter((s) => s.dishes.some((d) => d.isVisible))
    : [];

  // Auto-set first active section when menu changes
  if (selectedMenu && !activeSectionId && visibleSections.length > 0) {
    setActiveSectionId(visibleSections[0].id);
  }

  const handleSelectMenu = (menuId: string) => {
    setSelectedMenuId(menuId);
    setActiveSectionId(null); // reset so auto-select triggers
  };

  // ======== Level 0: Menu List ========
  const renderMenuList = () => (
    <div className="px-6 pt-14 pb-5">
      <h2 className="text-center text-xl font-bold text-gray-900">
        {restaurantName}
      </h2>
      {visibleMenus.length > 0 ? (
        <div className="mt-5 space-y-2.5">
          {visibleMenus.map((menu) => (
            <button
              key={menu.id}
              onClick={() => handleSelectMenu(menu.id)}
              className={`flex w-full items-center justify-between rounded-2xl px-5 py-3.5 text-left text-base font-medium transition-all bg-[#1a1a2e] text-white hover:bg-[#2a2a4e]`}
            >
              <span>{menu.title}</span>
              <svg className="h-4 w-4 opacity-70 shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-12 py-12 text-center">
          <p className="text-sm text-gray-400">No menus to display</p>
        </div>
      )}
    </div>
  );

  // ======== Level 1: Dishes View (section tabs + dish cards) ========
  const renderDishesView = () => {
    if (!selectedMenu || visibleSections.length === 0) return null;

    return (
      <div className="flex flex-col">
        {/* Back button */}
        <div className="px-5 pt-12 pb-2">
          <button
            onClick={() => { setSelectedMenuId(null); setActiveSectionId(null); }}
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {selectedMenu.title}
          </button>
        </div>

        {/* Section tabs (pills) */}
        <div className="flex gap-2 overflow-x-auto px-5 py-3 no-scrollbar">
          {visibleSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSectionId(section.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                activeSectionId === section.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-transparent border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {section.name}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {/* Show all sections content, highlight the active one */}
          {visibleSections.map((section) => {
            const dishes = section.dishes.filter((d) => d.isVisible);
            return (
              <div key={section.id} className={activeSectionId !== section.id ? 'hidden' : ''}>
                <h3 className="mb-3 text-lg font-bold text-gray-900">{section.name}</h3>

                {dishes.length > 0 ? (
                  <div className="space-y-4">
                    {dishes.map((dish) => (
                      <div key={dish.id} className="flex gap-3">
                        {/* Dish info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">{dish.name}</h4>
                            {dish.isBestSeller && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-50 px-2 py-0.5 text-[11px] font-semibold text-yellow-700">
                                <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                                Best seller
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-gray-500">
                            {dish.description}
                          </p>
                          <p className="mt-1 font-bold text-gray-900">{dish.price}</p>
                        </div>
                        {/* Thumbnail */}
                        {dish.image && (
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                            <img
                              src={dish.image}
                              alt={dish.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-gray-400">No dishes in this section</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideOverlay className="max-w-[420px] p-0 overflow-hidden border-0 bg-transparent shadow-none max-h-[90vh]">
        {/* Phone frame */}
        <div className="relative mx-auto w-full max-w-[375px] h-[85vh] max-h-[780px] flex flex-col overflow-hidden"
          style={{
            background: '#1a1a1a',
            borderRadius: '44px',
            padding: '12px',
          }}
        >
          {/* Dynamic Island / Notch area */}
          <div
            style={{
              position: 'absolute',
              top: '18px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '120px',
              height: '32px',
              background: '#000',
              borderRadius: '20px',
              zIndex: 40,
            }}
          />

          {/* Phone screen container */}
          <div className="relative z-10 flex flex-col w-full h-full overflow-hidden bg-white rounded-[34px]" style={{ minHeight: 0 }}>
          {/* Top-right action buttons - below notch */}
          <div className="absolute top-12 right-4 z-30 flex items-center gap-1.5">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-gray-600 shadow hover:bg-white transition-colors"
              onClick={() => window.open('#', '_blank')}
              title="Open in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-gray-600 shadow hover:bg-white transition-colors"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {!selectedMenuId ? (
            <>
              {/* Cover Image (only on level 0) */}
              <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden">
                <img src={COVER_IMAGE} alt="Restaurant cover" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>

              {/* Level 0 content */}
              {renderMenuList()}

              {/* Footer */}
              <div className="mt-auto px-6 py-3 text-center shrink-0">
                {/* Home indicator */}
                <div className="mx-auto mb-2 h-1 w-32 rounded-full bg-gray-200" />
                <p className="text-[10px] text-gray-400">
                  Powered by{' '}
                  <span className="font-semibold text-[#b98900]">menukits.eu</span>
                </p>
              </div>
            </>
          ) : (
            /* Level 1: Full-height scrollable dishes view */
            renderDishesView()
          )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
