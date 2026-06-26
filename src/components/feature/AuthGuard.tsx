import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types/supabase';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { isAuthenticated, isLoading, profile, initialize } = useAuthStore();
  const location = useLocation();
  const [initDone, setInitDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    initialize().then(() => {
      if (!cancelled) setInitDone(true);
    });
    return () => { cancelled = true; };
  }, [initialize]);

  if (isLoading || !initDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-foreground-500 font-heading">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function RoleGuard({ children, roles }: { children: React.ReactNode; roles: UserRole[] }) {
  const { profile } = useAuthStore();

  if (!profile || !roles.includes(profile.role)) {
    return null;
  }

  return <>{children}</>;
}

export function PermissionGate({ children, permission }: { children: React.ReactNode; permission: string }) {
  const { permissions } = useAuthStore();

  if (!permissions.includes(permission)) {
    return null;
  }

  return <>{children}</>;
}

export function usePermission(permission: string): boolean {
  const { permissions } = useAuthStore();
  return permissions.includes(permission);
}