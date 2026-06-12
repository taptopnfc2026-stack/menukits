import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, UtensilsCrossed, ArrowLeft, Loader2 } from 'lucide-react';
import type { Menu } from '@/types';

/** Transform DB row → frontend Menu shape */
function dbRowToMenu(row: any): Menu {
  if (row?.data && typeof row.data === 'object') {
    return {
      ...row.data,
      id: row.id,
      title: row.data.title || row.name || '',
      isVisible: row.is_public ?? true,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
  return {
    id: row.id,
    title: row.name || 'Untitled',
    sections: [],
    isVisible: row.is_public ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default function PublicRestaurantPage() {
  const { slug } = useParams<{ slug: string }>();
  const [restaurant, setRestaurant] = useState<{ name: string; address: string; phone: string; slug: string; cover_image_url?: string | null } | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    
    async function load() {
      try {
        const res = await fetch(`/api/public-restaurant?slug=${encodeURIComponent(slug)}`);
        if (res.ok) {
          const data = await res.json();
          setRestaurant(data.restaurant);
          if (data.menus) {
            setMenus(data.menus.map(dbRowToMenu));
          }
        } else if (res.status === 404) {
          setNotFound(true);
        }
      } catch {
        /* silent fail */
      }
      setIsLoading(false);
    }
    load();
  }, [slug]);

  const visibleMenus = menus.filter((m) => m.isVisible !== false);

  // Loading
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center px-6">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#5544e4] mb-4" />
          <p className="text-lg font-medium text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  // Not found
  if (notFound || !restaurant) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center px-6 max-w-sm">
          <UtensilsCrossed className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Restaurant not found</h1>
          <p className="text-sm text-gray-500 mb-6">
            This menu link doesn't exist or has been removed.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-[#5544e4] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#4433cc] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to MenuKits
          </Link>
        </div>
      </div>
    );
  }

  // Cover image — use restaurant's or fallback
  const coverSrc = restaurant.cover_image_url ||
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop';

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center px-4 py-6 sm:py-12">
      {/* Mobile-first card */}
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl sm:rounded-3xl">
        
        {/* Cover image with gradient overlay */}
        <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[16/9]">
          <img
            src={coverSrc}
            alt={restaurant.name}
            className="h-full w-full object-cover"
          />
          {/* Gradient overlay for text readability on any image */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          
          {/* Branding badge */}
          <Link
            to="/"
            className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-[#5544e4] shadow-sm hover:bg-white transition-colors"
          >
            <UtensilsCrossed className="h-3 w-3" />
            MenuKits
          </Link>
          
          {/* Restaurant name overlay at bottom of cover */}
          <div className="absolute bottom-0 left-0 right-0 p-5 pb-3">
            <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg leading-tight">
              {restaurant.name}
            </h1>
            {(restaurant.address || restaurant.phone) && (
              <p className="mt-1 text-xs sm:text-sm text-white/80 drop-shadow">
                {[restaurant.address, restaurant.phone].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>

        {/* Menu list area */}
        <div className="bg-white px-5 py-5 sm:px-6 sm:py-6">
          {visibleMenus.length > 0 ? (
            <>
              <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-400">
                Our Menu{visibleMenus.length > 1 ? `s (${visibleMenus.length})` : ''}
              </p>
              <div className="space-y-2.5">
                {visibleMenus.map((menu) => (
                  <Link
                    key={menu.id}
                    to={`/r/${menu.id}`}
                    className="flex w-full items-center justify-between rounded-xl bg-[#1a1a2e] px-5 py-4 text-left text-sm font-medium text-white transition-all hover:bg-[#2a2a4e] active:scale-[0.98]"
                  >
                    <span className="truncate flex-1 mr-3">{menu.title}</span>
                    <ChevronRight className="ml-auto h-4 w-4 shrink-0 opacity-60" />
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <UtensilsCrossed className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500">No menus available</p>
              <p className="mt-1 text-xs text-gray-400">Check back soon!</p>
            </div>
          )}

          {/* Quick info cards below menus */}
          {(restaurant.address || restaurant.phone) && (
            <div className="mt-5 grid grid-cols-2 gap-2">
              {restaurant.address && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(restaurant.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center rounded-xl bg-gray-50 px-3 py-3 text-center transition-colors hover:bg-gray-100 active:scale-[0.98]"
                >
                  <svg className="mb-1 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-[11px] font-medium text-gray-600 truncate w-full">Address</span>
                </a>
              )}
              {restaurant.phone && (
                <a
                  href={`tel:${restaurant.phone.replace(/\s/g, '')}`}
                  className="flex flex-col items-center rounded-xl bg-gray-50 px-3 py-3 text-center transition-colors hover:bg-gray-100 active:scale-[0.98]"
                >
                  <svg className="mb-1 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-[11px] font-medium text-gray-600">Call</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-white px-5 py-3 text-center">
          <p className="text-[11px] text-gray-400">
            Powered by <span className="font-semibold text-[#5544e4]">MenuKits</span> &middot; Digital Menu Solution
          </p>
        </div>
      </div>
    </div>
  );
}
