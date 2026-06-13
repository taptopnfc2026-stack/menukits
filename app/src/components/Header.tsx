import { Link, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  QrCode,
  Store,
  BarChart3,
  Languages,
  UtensilsCrossed,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'My menus', icon: LayoutGrid, path: '/' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { label: 'QR Code', icon: QrCode, path: '/qr-code' },
  { label: 'Translations', icon: Languages, path: '/translations' },
  { label: 'Restaurant', icon: Store, path: '/restaurant' },
];

export function Header() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 shrink-0">
          <UtensilsCrossed className="h-6 w-6 text-[#f5b800]" />
          <span className="text-xl font-bold tracking-tight text-[#1a1520]">Menu</span>
          <span className="text-xl font-bold tracking-tight text-[#f5b800]">kits</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'gap-1.5 text-sm font-medium transition-colors hover:text-[#8a6500] whitespace-nowrap px-2.5',
                    isActive
                      ? 'text-[#151526] bg-[#fff8d8]'
                      : 'text-gray-500'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="hidden border-yellow-300 bg-yellow-50 text-xs font-semibold text-yellow-700 hover:bg-yellow-100 sm:inline-flex"
          >
            Free trial
          </Button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#151526] text-sm font-medium text-[#FFD400]">
            C
          </div>
        </div>
      </div>
    </header>
  );
}
