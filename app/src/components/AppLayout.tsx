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
  Menu as MenuIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChecklistBadge } from '@/components/ChecklistBadge';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { label: 'My menus', icon: LayoutGrid, path: '/app' },
  { label: 'Restaurant', icon: Store, path: '/app/restaurant' },
  { label: 'Translations', icon: Languages, path: '/app/translations' },
  { label: 'QR Code', icon: QrCode, path: '/app/qr-code' },
  { label: 'Paper Menu', icon: FileText, path: '/app/paper-menu' },
  { label: 'Analytics', icon: BarChart3, path: '/app/analytics' },
];

export default function AppLayout() {
  const location = useLocation();
  const { user, logout, updateProfile } = useAuth();
  const initial = (user?.displayName || user?.email || 'U')[0].toUpperCase();
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className="flex h-full flex-col border-r border-[#eee6cf] bg-[#fffdf7]">
      <div className="flex h-20 items-center justify-between px-5">
        <Link to="/app" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFD400] text-[#151526] shadow-lg shadow-[#ffd400]/25">
            <UtensilsCrossed className="h-5 w-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-950">
            Menu<span className="text-[#f5b800]">Kits</span>
          </span>
        </Link>
        {mobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="px-4">
        <Link
          to="/"
          onClick={() => setSidebarOpen(false)}
          className="mb-4 flex items-center gap-2 rounded-xl border border-[#eee6cf] bg-white px-3 py-2 text-sm font-semibold text-slate-500 transition hover:border-[#f2b900]/40 hover:bg-[#fff8d8] hover:text-[#151526]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to website
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/app'
              ? location.pathname === '/app'
              : location.pathname.startsWith(item.path);
          return (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}>
              <span
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition',
                  isActive
                    ? 'bg-[#151526] text-white shadow-lg shadow-[#151526]/12'
                    : 'text-slate-600 hover:bg-[#fff8d8] hover:text-[#151526]'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-[#FFD400]' : 'text-slate-400 group-hover:text-[#b98900]')} />
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-slate-100 p-4">
        <div className="rounded-2xl border border-[#f1d36a] bg-[#fff8d8] px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#8a6500]">Free trial</p>
          <p className="mt-1 text-xs leading-5 text-[#8a6500]/80">Build, preview, and publish your smart menu.</p>
        </div>
        {user && (
          <button
            onClick={() => { setEditName(user.displayName || ''); setProfileOpen(true); setSidebarOpen(false); }}
            className="flex w-full items-center gap-3 rounded-2xl border border-[#eee6cf] bg-white p-3 text-left transition hover:border-[#f2b900]/40 hover:bg-[#fff8d8]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#151526] text-sm font-bold text-[#FFD400]">
              {initial}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-slate-900">{user.displayName || 'Restaurant Admin'}</span>
              <span className="block truncate text-xs text-slate-500">{user.email}</span>
            </span>
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#faf9f4]">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block lg:w-64">
        <SidebarContent />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative h-full w-[280px] max-w-[86vw] shadow-2xl">
            <SidebarContent mobile />
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl border border-slate-200 p-2 text-slate-600"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <Link to="/app" className="flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-[#f5b800]" />
            <span className="text-lg font-extrabold text-slate-950">Menu<span className="text-[#f5b800]">Kits</span></span>
          </Link>
          {user ? (
            <button
              onClick={() => { setEditName(user.displayName || ''); setProfileOpen(true); }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#151526] text-sm font-bold text-[#FFD400]"
            >
              {initial}
            </button>
          ) : <span className="h-9 w-9" />}
        </div>
      </header>

      <main className="lg:pl-64">
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
              <div className="h-16 w-16 rounded-full bg-[#151526] flex items-center justify-center text-2xl font-bold text-[#FFD400] mb-3">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD400]/30 focus:border-[#f2b900] transition-colors"
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
                className="flex-1 bg-[#FFD400] hover:bg-[#F2B900] text-[#151526] font-bold"
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
