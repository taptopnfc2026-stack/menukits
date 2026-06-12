import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutGrid,
  QrCode,
  Store,
  BarChart3,
  Languages,
  ArrowLeft,
  UtensilsCrossed,
  FileText,
  LogOut,
  User,
  X,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChecklistBadge } from '@/components/ChecklistBadge';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user, logout, updateProfile } = useAuth();
  const initial = (user?.displayName || user?.email || 'U')[0].toUpperCase();
  const [profileOpen, setProfileOpen] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);

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
            {user && (
              <>
                <span className="hidden sm:inline text-sm font-medium text-gray-700 mr-1">
                  {user.displayName}
                </span>
                <button
                  onClick={() => { setEditName(user.displayName || ''); setProfileOpen(true); }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5544e4] text-sm font-medium text-white hover:bg-[#4433cc] transition-colors cursor-pointer"
                  title={user?.displayName || 'User'}
                >
                  {initial}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main>
        <Outlet />
        <ChecklistBadge />
      </main>

      {/* User Profile Dialog */}
      {profileOpen && user && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setProfileOpen(false)} />
          
          {/* Dialog */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={() => setProfileOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header with avatar */}
            <div className="flex flex-col items-center mb-6 pt-2">
              <div className="h-16 w-16 rounded-full bg-[#5544e4] flex items-center justify-center text-2xl font-bold text-white mb-3">
                {initial}
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Account Settings</h2>
              <p className="text-sm text-gray-500 mt-0.5">Manage your profile information</p>
            </div>

            {/* Form fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your display name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5544e4]/20 focus:border-[#5544e4] transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed here</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setProfileOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                disabled={!editName.trim() || saving || editName === user.displayName}
                onClick={async () => {
                  if (editName.trim() && editName !== user.displayName) {
                    setSaving(true);
                    const res = await updateProfile(editName.trim());
                    if (res.ok) {
                      setProfileOpen(false);
                    } else {
                      alert(res.error);
                    }
                    setSaving(false);
                  }
                }}
                className="flex-1 bg-[#5544e4] hover:bg-[#4433cc] text-white"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>

            {/* Logout at bottom */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => logout().then(() => { setProfileOpen(false); window.location.href = '/'; })}
                className="w-full flex items-center justify-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
