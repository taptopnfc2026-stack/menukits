import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, UtensilsCrossed, ArrowLeft } from 'lucide-react';
import type { Menu } from '@/types';

const MENUS_STORAGE_KEY = 'menukits-menus';
const COVER_IMAGE = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop';
const RESTAURANT_NAME = 'xiaochuan';

function getStoredMenus(): Menu[] {
  try {
    const raw = localStorage.getItem(MENUS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function MenuHubPage() {
  const [menus] = useState<Menu[]>(() => getStoredMenus());
  const visibleMenus = menus.filter((m) => m.isVisible !== false);

  if (visibleMenus.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center px-6">
          <UtensilsCrossed className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-lg font-semibold text-gray-700">No menus available yet</p>
          <p className="mt-2 text-sm text-gray-400">Check back later or scan a QR code.</p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#5544e4] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#4433cc] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center px-4 py-6 sm:py-12">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Cover image */}
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <img
            src={COVER_IMAGE}
            alt="Cover"
            className="h-full w-full object-cover"
          />
          {/* Back button overlay */}
          <Link
            to="/"
            className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/60 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        </div>

        {/* Restaurant name + menu cards */}
        <div className="bg-white px-5 py-5">
          <h1 className="text-center text-xl font-bold text-gray-900">
            {RESTAURANT_NAME}
          </h1>

          <div className="mt-4 space-y-2.5">
            {visibleMenus.map((menu) => (
              <Link
                key={menu.id}
                to={`/r/${menu.id}`}
                className="flex w-full items-center justify-between rounded-xl bg-[#1a1a2e] px-5 py-3.5 text-left text-sm font-medium text-white transition-all hover:bg-[#2a2a4e] active:scale-[0.98]"
              >
                <span className="truncate">{menu.title}</span>
                <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-60" />
              </Link>
            ))}
          </div>
        </div>

        {/* Powered by footer */}
        <div className="border-t border-gray-100 bg-white px-5 py-3 text-center">
          <p className="text-[11px] text-gray-400">
            Powered by <span className="font-semibold text-[#5544e4]">chefymenu.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}
