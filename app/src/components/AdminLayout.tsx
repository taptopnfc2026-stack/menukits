import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Users,
  BarChart3,
  KeyRound,
  Settings as SettingsIcon,
  Sparkles,
  ArrowLeft,
  Menu,
  Activity,
  Plug,
  Bell,
  Search,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import { useAuth } from '@/contexts/AuthContext';

const baseNavItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/',
    exact: true,
    section: 'Overview',
  },
  {
    title: 'Menus',
    icon: UtensilsCrossed,
    path: '/menus',
    section: 'Overview',
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    path: '/analytics',
    section: 'Overview',
  },
  {
    title: 'Users',
    icon: Users,
    path: '/users',
    section: 'Management',
  },
  {
    title: 'API Connections',
    icon: Plug,
    path: '/api',
    section: 'Management',
  },
  {
    title: 'AI Providers',
    icon: Sparkles,
    path: '/providers',
    section: 'Configuration',
  },
  {
    title: 'API Keys',
    icon: KeyRound,
    path: '/keys',
    section: 'Configuration',
  },
  {
    title: 'Activity Log',
    icon: Activity,
    path: '/activity',
    section: 'Configuration',
  },
  {
    title: 'Settings',
    icon: SettingsIcon,
    path: '/settings',
    section: 'System',
  },
];

// Top bar — needs to be inside SidebarProvider to use the menu button
function AdminTopBar() {
  const { toggleSidebar } = useSidebar();
  return (
    <header className="admin-themed sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="h-9 w-9 text-slate-400 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
        title="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search menus, users, settings…"
          className="h-9 w-full border-slate-200 bg-slate-100 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus-visible:border-slate-300 focus-visible:ring-0"
        />
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
        <ThemeSwitcher />
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>
        <a
          href={window.location.hostname.startsWith('admin.') ? 'https://menukits.eu/app' : '/app'}
          className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-200 hover:text-slate-900 sm:inline-flex"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to App
        </a>
      </div>
    </header>
  );
}

export default function AdminLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  // Apply the theme on every mount (so visiting the admin URL restores the saved theme)
  useAdminTheme();

  // Detect context: nested under /admin in full app, or root in admin SPA
  const isNestedUnderAdmin = location.pathname.startsWith('/admin');
  const basePath = isNestedUnderAdmin ? '/admin' : '';

  // Resolve nav paths with the correct base
  const resolvePath = (path: string) => {
    if (path === '/') return basePath || '/';
    return `${basePath}${path}`;
  };

  const adminNavItems = baseNavItems.map((item) => ({
    ...item,
    resolvedPath: resolvePath(item.path),
  }));

  // Group nav items by section
  const sections = Array.from(new Set(adminNavItems.map((i) => i.section)));

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="admin-themed flex min-h-screen w-full bg-white text-slate-700">
        {/* ---- Sidebar ---- */}
        <Sidebar
          variant="inset"
          collapsible="icon"
          className="admin-themed border-r border-slate-200 bg-white"
        >
          <SidebarHeader className="border-b border-slate-200 px-4 py-4">
            <Link
              to={basePath || '/'}
              className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center"
            >
              <div
                className="admin-bg-accent flex h-8 w-8 items-center justify-center rounded-lg shadow-lg"
                style={{ boxShadow: '0 4px 14px var(--admin-accent-ring)' }}
              >
                <Sparkles className="h-4 w-4" style={{ color: 'var(--admin-accent-fg)' }} />
              </div>
              <span className="text-base font-semibold text-slate-900 group-data-[collapsible=icon]:hidden">
                MenuKits
                <span className="ml-1 text-xs font-normal text-slate-500">Admin</span>
              </span>
            </Link>
          </SidebarHeader>

          <SidebarContent className="admin-scroll">
            <div className="admin-themed px-2 py-3">
              {sections.map((section) => (
                <div key={section} className="mb-4">
                  <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 group-data-[collapsible=icon]:hidden">
                    {section}
                  </p>
                  <SidebarMenu>
                    {adminNavItems
                      .filter((i) => i.section === section)
                      .map((item) => {
                        const isActive = item.exact
                          ? location.pathname === item.resolvedPath
                          : location.pathname.startsWith(item.resolvedPath);

                        return (
                          <SidebarMenuItem key={item.path}>
                            <SidebarMenuButton asChild isActive={isActive}>
                              <Link
                                to={item.resolvedPath}
                                className={cn(
                                  'admin-themed flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                  isActive
                                    ? 'admin-nav-active'
                                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
                                )}
                              >
                                <item.icon
                                  className={cn(
                                    'h-4 w-4 shrink-0',
                                    isActive ? 'admin-text-accent' : 'text-slate-400',
                                  )}
                                />
                                <span className="group-data-[collapsible=icon]:hidden">
                                  {item.title}
                                </span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                  </SidebarMenu>
                </div>
              ))}
            </div>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200 p-3">
            <div className="group-data-[collapsible=icon]:hidden rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-2.5">
                <div className="admin-bg-accent-soft flex h-8 w-8 items-center justify-center rounded-full">
                  <span className="admin-text-accent text-xs font-semibold">
                    {(user?.displayName || user?.email?.split('@')[0] || 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-900">
                    {user?.displayName || user?.email?.split('@')[0] || 'Admin'}
                  </p>
                  <p className="truncate text-[10px] text-slate-400">
                    {user?.email || 'admin'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={logout}
                  title="Sign out"
                  className="h-7 w-7 text-slate-400 hover:text-red-500"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* ---- Main Content ---- */}
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopBar />
          <main className="admin-scroll admin-themed flex-1 overflow-auto bg-white">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
