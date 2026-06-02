import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  QrCode,
  Store,
  BarChart3,
  Languages,
  ArrowLeft,
  UtensilsCrossed,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChecklistBadge } from '@/components/ChecklistBadge';

const navItems = [
  { label: 'My menus', icon: LayoutGrid, path: '/app' },
  { label: 'Analytics', icon: BarChart3, path: '/app/analytics' },
  { label: 'QR Code', icon: QrCode, path: '/app/qr-code' },
  { label: 'Paper Menu', icon: FileText, path: '/app/paper-menu' },
  { label: 'Translations', icon: Languages, path: '/app/translations' },
  { label: 'Restaurant', icon: Store, path: '/app/restaurant' },
];

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Logo + back to landing */}
          <div className="flex items-center gap-4 shrink-0">
            <Link to="/" className="text-gray-400 hover:text-gray-600 transition-colors" title="Back to home">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Link to="/app" className="flex items-center gap-1.5">
              <UtensilsCrossed className="h-7 w-7 text-[#f5b800]" />
              <span className="text-[22px] font-bold tracking-tight text-[#1a1520]">Menu</span>
              <span className="text-[22px] font-bold tracking-tight text-[#f5b800]">kits</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/app'
                  ? location.pathname === '/app'
                  : location.pathname.startsWith(item.path);
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'gap-1.5 text-sm font-medium transition-colors hover:text-[#5544e4] whitespace-nowrap px-2.5',
                      isActive
                        ? 'text-[#5544e4] bg-[#5544e4]/5'
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
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5544e4] text-sm font-medium text-white">
              C
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main>
        <Outlet />
        <ChecklistBadge />
      </main>
    </div>
  );
}
