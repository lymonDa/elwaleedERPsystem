import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile, Branch, UserRole } from '@/types/supabase';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  branch: Branch | null;
  permissions: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ needsTotp: boolean; error?: string }>;
  verifyTotp: (code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setBranch: (branch: Branch | null) => void;
  setPermissions: (permissions: string[]) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  branch: null,
  permissions: [],
  isLoading: false,
  isAuthenticated: false,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      set({ user: currentUser });

      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();

        set({ profile: profile ?? null });

        if (profile) {
          const { data: permissions } = await supabase
            .from('role_permissions')
            .select('permission_id')
            .eq('role', profile.role);

          const { data: branch } = profile.branch_id
            ? await supabase
                .from('branches')
                .select('*')
                .eq('id', profile.branch_id)
                .maybeSingle()
            : { data: null };

          set({
            isAuthenticated: true,
            permissions: permissions?.map((p) => p.permission_id) ?? [],
            branch: branch ?? null,
          });
        }
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
      set({ error: 'فشل في تهيئة الجلسة' });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    try {
      set({ error: null, isLoading: true });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const message =
          error.message === 'Invalid login credentials'
            ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            : 'حدث خطأ أثناء تسجيل الدخول';
        set({ error: message, isLoading: false });
        return { needsTotp: false, error: message };
      }

      if (!data.user) {
        set({ error: 'لم يتم العثور على المستخدم', isLoading: false });
        return { needsTotp: false, error: 'لم يتم العثور على المستخدم' };
      }

      set({ user: data.user });

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!profile) {
        await supabase.auth.signOut();
        set({ error: 'حساب المستخدم غير موجود في النظام', isLoading: false, user: null });
        return { needsTotp: false, error: 'حساب المستخدم غير موجود في النظام' };
      }

      if (profile.totp_enabled) {
        set({ profile, isLoading: false });
        return { needsTotp: true };
      }

      const { data: permData } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role', profile.role);

      const { data: branch } = profile.branch_id
        ? await supabase
            .from('branches')
            .select('*')
            .eq('id', profile.branch_id)
            .maybeSingle()
        : { data: null };

      set({
        profile,
        permissions: permData?.map((p) => p.permission_id) ?? [],
        branch: branch ?? null,
        isAuthenticated: true,
        isLoading: false,
      });

      return { needsTotp: false };
    } catch (err) {
      console.error('Login error:', err);
      set({ error: 'حدث خطأ غير متوقع', isLoading: false });
      return { needsTotp: false, error: 'حدث خطأ غير متوقع' };
    }
  },

  verifyTotp: async (code: string) => {
    try {
      set({ isLoading: true });
      const { profile, user } = get();

      if (!profile || !user) {
        set({ error: 'انتهت الجلسة، يرجى إعادة تسجيل الدخول', isLoading: false });
        return { success: false, error: 'انتهت الجلسة' };
      }

      const { data: permData } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role', profile.role);

      const { data: branch } = profile.branch_id
        ? await supabase
            .from('branches')
            .select('*')
            .eq('id', profile.branch_id)
            .maybeSingle()
        : { data: null };

      set({
        permissions: permData?.map((p) => p.permission_id) ?? [],
        branch: branch ?? null,
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true };
    } catch (err) {
      console.error('TOTP verification error:', err);
      set({ error: 'رمز التحقق غير صحيح', isLoading: false });
      return { success: false, error: 'رمز التحقق غير صحيح' };
    }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      set({
        user: null,
        profile: null,
        branch: null,
        permissions: [],
        isAuthenticated: false,
        error: null,
      });
    }
  },

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setBranch: (branch) => set({ branch }),
  setPermissions: (permissions) => set({ permissions }),
  clearError: () => set({ error: null }),
}));