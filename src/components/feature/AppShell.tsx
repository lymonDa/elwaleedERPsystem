import { useState, useEffect, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useNotificationStore } from '@/stores/notificationStore';
import NotificationBell from '@/components/feature/NotificationBell';
import type { UserRole } from '@/types/supabase';

interface NavItem {
  label: string;
  icon: string;
  path: string;
  roles: UserRole[];
  permission?: string;
}

const navigation: NavItem[] = [
  { label: 'لوحة التحكم', icon: 'ri-dashboard-line', path: '/', roles: ['super_admin', 'branch_engineer'] },
  { label: 'لوحة المالك', icon: 'ri-dashboard-3-line', path: '/owner', roles: ['owner'] },
  { label: 'الفواتير', icon: 'ri-bill-line', path: '/billing', roles: ['super_admin', 'branch_engineer'] },
  { label: 'المخزون', icon: 'ri-archive-line', path: '/inventory', roles: ['super_admin', 'branch_engineer'] },
  { label: 'الموظفين', icon: 'ri-team-line', path: '/hr', roles: ['super_admin', 'branch_engineer'] },
  { label: 'المهام', icon: 'ri-task-line', path: '/tasks', roles: ['super_admin', 'branch_engineer'] },
  { label: 'العملاء', icon: 'ri-user-heart-line', path: '/crm', roles: ['super_admin', 'branch_engineer'] },
  { label: 'الموردين', icon: 'ri-truck-line', path: '/suppliers', roles: ['super_admin', 'branch_engineer'] },
  { label: 'الإشعارات', icon: 'ri-notification-3-line', path: '/notifications', roles: ['super_admin', 'branch_engineer'] },
  { label: 'التقارير', icon: 'ri-bar-chart-2-line', path: '/reports', roles: ['super_admin', 'owner', 'branch_engineer'] },
];

const adminNav: NavItem[] = [
  { label: 'إدارة المستخدمين', icon: 'ri-shield-user-line', path: '/admin/users', roles: ['super_admin'] },
  { label: 'سجل العمليات', icon: 'ri-history-line', path: '/admin/audit-log', roles: ['super_admin'] },
  { label: 'إعدادات النظام', icon: 'ri-settings-3-line', path: '/admin/settings', roles: ['super_admin'] },
  { label: 'النسخ الاحتياطي', icon: 'ri-cloud-line', path: '/admin/backup', roles: ['super_admin'] },
];

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, branch, logout, isAuthenticated } = useAuthStore();
  const { mode, toggle: toggleTheme } = useThemeStore();
  const initRealtime = useNotificationStore((s) => s.initRealtime);
  const location = useLocation();
  const navigate = useNavigate();

  // Start realtime notifications subscription when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const cleanup = initRealtime();
    return cleanup;
  }, [isAuthenticated, initRealtime]);

  const userRole = profile?.role;
  const userNav = navigation.filter((item) => userRole && item.roles.includes(userRole));
  const adminLinks = adminNav.filter((item) => userRole && item.roles.includes(userRole));

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const roleLabel: Record<UserRole, string> = {
    super_admin: 'مدير النظام',
    owner: 'صاحب الشركة',
    branch_engineer: 'مهندس فرع',
    technician: 'فني',
  };

  return (
    <div className="min-h-screen flex bg-background-50 overflow-x-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 right-0 z-[70] h-screen w-64 bg-background-50 border-l border-background-200/70 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-background-200/70">
          <div className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0">
            <i className="ri-building-2-line text-base text-background-50" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground-900 truncate font-heading">الوليد</p>
            <p className="text-xs text-foreground-500 truncate">للتكييفات والمقاولات</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 flex flex-col gap-0.5">
          {userNav.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-primary-100 text-primary-800 font-medium dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-foreground-600 hover:bg-background-200 hover:text-foreground-900'
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center">
                  <i className={`${item.icon} text-base`} />
                </span>
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}

          {adminLinks.length > 0 && (
            <>
              <div className="mt-4 mb-1 px-3">
                <p className="text-xs font-semibold text-foreground-400 uppercase tracking-wider">
                  الإدارة
                </p>
              </div>
              {adminLinks.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-primary-100 text-primary-800 font-medium dark:bg-primary-900/30 dark:text-primary-300'
                        : 'text-foreground-600 hover:bg-background-200 hover:text-foreground-900'
                    }`}
                  >
                    <span className="w-5 h-5 flex items-center justify-center">
                      <i className={`${item.icon} text-base`} />
                    </span>
                    <span className="whitespace-nowrap">{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User info */}
        <div className="border-t border-background-200/70 p-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-secondary-200 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-secondary-700">
                {profile?.full_name?.charAt(0) || 'م'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground-900 truncate">
                {profile?.full_name || 'مستخدم'}
              </p>
              <p className="text-xs text-foreground-500">
                {userRole ? roleLabel[userRole] : ''}
              </p>
            </div>
          </div>
          {branch && (
            <p className="text-xs text-foreground-400 mb-2 px-1">
              <i className="ri-map-pin-line ml-1" />
              {branch.name}
            </p>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-foreground-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors cursor-pointer"
          >
            <i className="ri-logout-box-r-line" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-background-200/70 bg-background-50 sticky top-0 z-30 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-md text-foreground-600 hover:bg-background-200 transition-colors cursor-pointer flex-shrink-0"
              aria-label="فتح القائمة"
            >
              <i className="ri-menu-line text-lg" />
            </button>
            <h2 className="text-sm font-semibold text-foreground-900 font-heading hidden sm:block truncate">
              {[...userNav, ...adminLinks].find((item) => {
                if (item.path === '/') return location.pathname === '/';
                return location.pathname.startsWith(item.path);
              })?.label || 'لوحة التحكم'}
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <NotificationBell />
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-md text-foreground-500 hover:bg-background-200 transition-colors cursor-pointer"
              aria-label={mode === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              <i className={mode === 'dark' ? 'ri-sun-line' : 'ri-moon-line'} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}