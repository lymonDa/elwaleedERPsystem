import { useState, useEffect, useCallback, useMemo } from 'react';
import StatCard from '@/components/base/StatCard';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import Modal from '@/components/base/Modal';
import Input from '@/components/base/Input';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types/supabase';

interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  branch_id: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  branches?: { id: string; name: string } | null;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  super_admin: number;
  owner: number;
  branch_engineer: number;
}

interface PermissionItem {
  id: string;
  code: string;
  name_ar: string;
  group_name: string;
  description: string | null;
  assigned_roles: {
    super_admin: boolean;
    owner: boolean;
    branch_engineer: boolean;
  };
}

interface BranchOption {
  id: string;
  name: string;
}

const roleLabels: Record<string, string> = {
  super_admin: 'مدير النظام',
  owner: 'صاحب الشركة',
  branch_engineer: 'مهندس فرع',
};

const permissionGroupLabels: Record<string, string> = {
  'الفواتير': 'الفواتير والمحاسبة',
  'المخزون': 'المخزون والجرد',
  'الموارد البشرية': 'الموارد البشرية',
  'العملاء': 'العملاء',
  'الصيانة': 'الصيانة',
  'الموردين': 'الموردين والمشتريات',
  'التقارير': 'التقارير والتحليلات',
  'الإدارة': 'إدارة النظام',
  'المهام': 'المهام والمتابعة',
  'المصروفات': 'المصروفات',
};

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0, super_admin: 0, owner: 0, branch_engineer: 0 });
  const [pagination, setPagination] = useState({ page: 1, page_size: 20, total: 0, total_pages: 0 });

  // Add user modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: '', phone: '', role: 'branch_engineer', branch_id: '', password: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // Edit user modal
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', role: 'branch_engineer' as UserRole, branch_id: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Permissions modal
  const [showPermsModal, setShowPermsModal] = useState(false);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [permsLoading, setPermsLoading] = useState(false);
  const [permsError, setPermsError] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('branch_engineer');
  const [permToggles, setPermToggles] = useState<Record<string, boolean>>({});
  const [savePermsLoading, setSavePermsLoading] = useState(false);
  const [permsSavedMsg, setPermsSavedMsg] = useState('');

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const payload: Record<string, unknown> = {
        page: pagination.page,
        page_size: 20,
      };
      if (roleFilter !== 'all') payload.role = roleFilter;
      if (statusFilter !== 'all') payload.status = statusFilter;

      const { data, error: fnError } = await supabase.functions.invoke('get-users', {
        body: payload,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setProfiles(data?.profiles || []);
      if (data?.pagination) setPagination(data.pagination);
      if (data?.stats) setStats(data.stats);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, pagination.page]);

  // Fetch branches
  const fetchBranches = useCallback(async () => {
    try {
      const { data } = await supabase.from('branches').select('id, name').order('name');
      if (data) setBranches(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  // Filter locally by search
  const filteredProfiles = useMemo(() => {
    let result = [...profiles];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((p) => {
        return (
          p.full_name.toLowerCase().includes(q) ||
          (p.phone || '').toLowerCase().includes(q) ||
          (roleLabels[p.role] || '').toLowerCase().includes(q)
        );
      });
    }
    return result;
  }, [profiles, search]);

  // Add user
  const handleAddUser = async () => {
    if (!addForm.full_name.trim() || !addForm.phone.trim() || !addForm.password.trim()) {
      setAddError('جميع الحقول مطلوبة');
      return;
    }
    if (addForm.password.length < 6) {
      setAddError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    try {
      setAddLoading(true);
      setAddError('');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error: fnError } = await supabase.functions.invoke('create-user', {
        body: {
          full_name: addForm.full_name.trim(),
          phone: addForm.phone.trim(),
          role: addForm.role,
          branch_id: addForm.branch_id || null,
          password: addForm.password,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      showToast(data?.message || 'تم إنشاء المستخدم بنجاح', 'success');
      setShowAddModal(false);
      setAddForm({ full_name: '', phone: '', role: 'branch_engineer', branch_id: '', password: '' });
      fetchUsers();
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'فشل إنشاء المستخدم');
    } finally {
      setAddLoading(false);
    }
  };

  // Open edit modal
  const openEdit = (p: UserProfile) => {
    setEditUser(p);
    setEditForm({
      full_name: p.full_name,
      phone: p.phone || '',
      role: p.role,
      branch_id: p.branch_id || '',
    });
    setEditError('');
  };

  // Save edit
  const handleEditUser = async () => {
    if (!editUser) return;
    if (!editForm.full_name.trim()) {
      setEditError('الاسم مطلوب');
      return;
    }
    try {
      setEditLoading(true);
      setEditError('');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error: fnError } = await supabase.functions.invoke('update-user-profile', {
        body: {
          user_id: editUser.id,
          full_name: editForm.full_name.trim(),
          phone: editForm.phone.trim(),
          role: editForm.role,
          branch_id: editForm.branch_id || null,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      showToast(data?.message || 'تم تحديث المستخدم بنجاح', 'success');
      setEditUser(null);
      fetchUsers();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'فشل تحديث المستخدم');
    } finally {
      setEditLoading(false);
    }
  };

  // Toggle active
  const handleToggleActive = async (p: UserProfile) => {
    const newActive = !p.is_active;
    const actionLabel = newActive ? 'تفعيل' : 'تعطيل';
    if (!confirm(`هل أنت متأكد من ${actionLabel} المستخدم "${p.full_name}"؟`)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error: fnError } = await supabase.functions.invoke('toggle-user-active', {
        body: { user_id: p.id, is_active: newActive },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      showToast(data?.message || `تم ${actionLabel} المستخدم بنجاح`, 'success');
      fetchUsers();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'فشل العملية', 'error');
    }
  };

  // Load permissions
  const openPermsModal = async () => {
    setShowPermsModal(true);
    setPermsSavedMsg('');
    try {
      setPermsLoading(true);
      setPermsError('');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error: fnError } = await supabase.functions.invoke('get-permissions', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const flatPerms: PermissionItem[] = [];
      for (const group of Object.values(data?.groups || {})) {
        flatPerms.push(...(group as PermissionItem[]));
      }
      setPermissions(flatPerms);

      const toggles: Record<string, boolean> = {};
      for (const perm of flatPerms) {
        toggles[perm.code] = perm.assigned_roles[selectedRole] || false;
      }
      setPermToggles(toggles);
    } catch (err: unknown) {
      setPermsError(err instanceof Error ? err.message : 'فشل تحميل الصلاحيات');
    } finally {
      setPermsLoading(false);
    }
  };

  // Switch role in perms modal
  const switchPermRole = (role: UserRole) => {
    setSelectedRole(role);
    setPermsSavedMsg('');
    const toggles: Record<string, boolean> = {};
    for (const perm of permissions) {
      toggles[perm.code] = perm.assigned_roles[role] || false;
    }
    setPermToggles(toggles);
  };

  // Toggle individual permission
  const togglePerm = (code: string) => {
    setPermToggles((prev) => ({ ...prev, [code]: !prev[code] }));
    setPermsSavedMsg('');
  };

  // Save permissions
  const handleSavePermissions = async () => {
    const activeCodes = Object.entries(permToggles)
      .filter(([, v]) => v)
      .map(([k]) => k);

    try {
      setSavePermsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error: fnError } = await supabase.functions.invoke('update-role-permissions', {
        body: { role: selectedRole, permission_codes: activeCodes },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setPermsSavedMsg(data?.message || 'تم حفظ الصلاحيات بنجاح');

      setPermissions((prev) =>
        prev.map((perm) => ({
          ...perm,
          assigned_roles: {
            ...perm.assigned_roles,
            [selectedRole]: permToggles[perm.code] || false,
          },
        }))
      );
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'فشل حفظ الصلاحيات', 'error');
    } finally {
      setSavePermsLoading(false);
    }
  };

  const groupedPerms = useMemo(() => {
    const groups: Record<string, PermissionItem[]> = {};
    for (const perm of permissions) {
      if (!groups[perm.group_name]) groups[perm.group_name] = [];
      groups[perm.group_name].push(perm);
    }
    return groups;
  }, [permissions]);

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg animate-pulse ${
          toast.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي المستخدمين" value={stats.total} icon="ri-shield-user-line" variant="primary" />
        <StatCard title="نشطين" value={stats.active} icon="ri-check-double-line" variant="accent" />
        <StatCard title="غير نشطين" value={stats.inactive} icon="ri-user-unfollow-line" variant={stats.inactive > 0 ? 'secondary' : 'secondary'} />
        <StatCard title="الصلاحيات" value="24" icon="ri-shield-keyhole-line" variant="secondary" />
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'super_admin', 'owner', 'branch_engineer'] as const).map((r) => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPagination(p => ({ ...p, page: 1 })); }}
              className={`whitespace-nowrap px-3 py-1.5 text-xs rounded-full transition-colors cursor-pointer ${
                roleFilter === r
                  ? 'bg-primary-500 text-background-50 dark:text-foreground-950'
                  : 'bg-background-100 text-foreground-600 hover:bg-background-200'
              }`}
            >
              {r === 'all' ? 'الكل' : roleLabels[r] || r}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-background-200/70 hidden sm:block" />
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'active', 'inactive'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPagination(p => ({ ...p, page: 1 })); }}
              className={`whitespace-nowrap px-3 py-1.5 text-xs rounded-full transition-colors cursor-pointer ${
                statusFilter === s
                  ? 'bg-secondary-500 text-background-50 dark:text-foreground-950'
                  : 'bg-background-100 text-foreground-600 hover:bg-background-200'
              }`}
            >
              {s === 'all' ? 'الكل' : s === 'active' ? 'نشط' : 'غير نشط'}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="relative w-full sm:w-60">
          <i className="ri-search-line absolute right-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm" />
          <input
            type="text"
            placeholder="بحث باسم المستخدم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-9 pl-3 py-2 text-sm bg-background-50 border border-foreground-200 rounded-md text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          />
        </div>
        <Button variant="primary" size="sm" icon={<i className="ri-user-add-line" />} onClick={() => { setShowAddModal(true); setAddError(''); }}>
          إضافة مستخدم
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={<i className="ri-shield-keyhole-line" />}
          onClick={openPermsModal}
        >
          الصلاحيات
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-4 border-primary-300 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-sm text-foreground-400">جاري تحميل المستخدمين...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <i className="ri-error-warning-line text-4xl text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
          <Button onClick={fetchUsers} variant="secondary" size="sm">إعادة المحاولة</Button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-background-200/70 bg-background-100/50">
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">المستخدم</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الدور</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 hidden md:table-cell">الفرع</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 hidden lg:table-cell">رقم الهاتف</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الحالة</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 hidden lg:table-cell">تاريخ التسجيل</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-foreground-400">
                      <i className="ri-user-search-line text-3xl block mb-2" />
                      لا يوجد مستخدمين مطابقين للبحث
                    </td>
                  </tr>
                ) : (
                  filteredProfiles.map((p) => (
                    <tr key={p.id} className={`border-b border-background-200/50 hover:bg-background-100/30 transition-colors ${!p.is_active ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${p.is_active ? 'bg-primary-100 text-primary-700' : 'bg-background-200 text-foreground-400'}`}>
                            <span className="text-sm font-bold">{p.full_name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground-900">{p.full_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={p.role === 'super_admin' ? 'primary' : p.role === 'owner' ? 'accent' : 'secondary'}>
                          {roleLabels[p.role] || p.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-foreground-600 hidden md:table-cell">
                        {p.branches?.name || (p.branch_id ? '—' : <span className="text-foreground-400">كل الفروع</span>)}
                      </td>
                      <td className="px-4 py-3 text-foreground-600 font-mono text-xs hidden lg:table-cell" dir="ltr">
                        {p.phone || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={p.is_active ? 'success' : 'neutral'}>
                          {p.is_active ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-foreground-500 text-xs hidden lg:table-cell">
                        {formatDate(p.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(p)}
                            className="w-8 h-8 flex items-center justify-center rounded-md text-foreground-400 hover:text-foreground-700 hover:bg-background-200 transition-colors cursor-pointer"
                            title="تعديل"
                          >
                            <i className="ri-edit-line" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(p)}
                            className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
                              p.is_active
                                ? 'text-foreground-400 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-foreground-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={p.is_active ? 'تعطيل' : 'تفعيل'}
                          >
                            <i className={p.is_active ? 'ri-toggle-line' : 'ri-toggle-fill'} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-background-200/70">
              <button
                onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page <= 1}
                className="px-3 py-1 text-xs rounded-md bg-background-100 text-foreground-600 hover:bg-background-200 disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                السابق
              </button>
              <span className="text-xs text-foreground-500">
                صفحة {pagination.page} من {pagination.total_pages}
              </span>
              <button
                onClick={() => setPagination(p => ({ ...p, page: Math.min(p.total_pages, p.page + 1) }))}
                disabled={pagination.page >= pagination.total_pages}
                className="px-3 py-1 text-xs rounded-md bg-background-100 text-foreground-600 hover:bg-background-200 disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                التالي
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add User Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="إضافة مستخدم جديد" size="md">
        <div className="flex flex-col gap-4">
          <Input
            label="الاسم الكامل"
            placeholder="أدخل الاسم الكامل"
            value={addForm.full_name}
            onChange={(e) => setAddForm(f => ({ ...f, full_name: e.target.value }))}
          />
          <Input
            label="رقم الهاتف"
            placeholder="0100xxxxxxx"
            value={addForm.phone}
            onChange={(e) => setAddForm(f => ({ ...f, phone: e.target.value }))}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground-800">الدور</label>
            <select
              value={addForm.role}
              onChange={(e) => setAddForm(f => ({ ...f, role: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-background-50 border border-foreground-200 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            >
              <option value="branch_engineer">مهندس فرع</option>
              <option value="owner">صاحب الشركة</option>
              <option value="super_admin">مدير النظام</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground-800">الفرع</label>
            <select
              value={addForm.branch_id}
              onChange={(e) => setAddForm(f => ({ ...f, branch_id: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-background-50 border border-foreground-200 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            >
              <option value="">كل الفروع</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <Input
            label="كلمة المرور"
            type="password"
            placeholder="أدخل كلمة مرور (6 أحرف على الأقل)"
            value={addForm.password}
            onChange={(e) => setAddForm(f => ({ ...f, password: e.target.value }))}
          />
          {addError && <p className="text-sm text-red-600">{addError}</p>}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-background-200/70">
            <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>إلغاء</Button>
            <Button variant="primary" size="sm" onClick={handleAddUser} loading={addLoading}>
              حفظ المستخدم
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="تعديل بيانات المستخدم" size="md">
        <div className="flex flex-col gap-4">
          <Input
            label="الاسم الكامل"
            placeholder="أدخل الاسم الكامل"
            value={editForm.full_name}
            onChange={(e) => setEditForm(f => ({ ...f, full_name: e.target.value }))}
          />
          <Input
            label="رقم الهاتف"
            placeholder="0100xxxxxxx"
            value={editForm.phone}
            onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground-800">الدور</label>
            <select
              value={editForm.role}
              onChange={(e) => setEditForm(f => ({ ...f, role: e.target.value as UserRole }))}
              className="w-full px-3 py-2 text-sm bg-background-50 border border-foreground-200 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            >
              <option value="branch_engineer">مهندس فرع</option>
              <option value="owner">صاحب الشركة</option>
              <option value="super_admin">مدير النظام</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground-800">الفرع</label>
            <select
              value={editForm.branch_id}
              onChange={(e) => setEditForm(f => ({ ...f, branch_id: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-background-50 border border-foreground-200 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            >
              <option value="">كل الفروع</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          {editError && <p className="text-sm text-red-600">{editError}</p>}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-background-200/70">
            <Button variant="ghost" size="sm" onClick={() => setEditUser(null)}>إلغاء</Button>
            <Button variant="primary" size="sm" onClick={handleEditUser} loading={editLoading}>
              حفظ التعديلات
            </Button>
          </div>
        </div>
      </Modal>

      {/* Permissions Modal */}
      <Modal open={showPermsModal} onClose={() => setShowPermsModal(false)} title={`صلاحيات الأدوار`} size="lg">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap pb-3 border-b border-background-200/70">
            {(['super_admin', 'owner', 'branch_engineer'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => switchPermRole(r)}
                className={`whitespace-nowrap px-3 py-1.5 text-xs rounded-full transition-colors cursor-pointer ${
                  selectedRole === r
                    ? 'bg-primary-500 text-background-50 dark:text-foreground-950'
                    : 'bg-background-100 text-foreground-600 hover:bg-background-200'
                }`}
              >
                {roleLabels[r]}
              </button>
            ))}
          </div>

          {permsLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-300 border-t-primary-500 rounded-full animate-spin" />
            </div>
          )}

          {permsError && (
            <div className="text-center py-8">
              <p className="text-sm text-red-600">{permsError}</p>
              <Button onClick={openPermsModal} variant="secondary" size="sm" className="mt-2">إعادة المحاولة</Button>
            </div>
          )}

          {!permsLoading && !permsError && (
            <div className="max-h-96 overflow-y-auto flex flex-col gap-4">
              {Object.entries(groupedPerms).map(([group, perms]) => (
                <div key={group}>
                  <h4 className="text-sm font-semibold text-foreground-900 mb-2">{permissionGroupLabels[group] || group}</h4>
                  <div className="flex flex-col gap-1">
                    {perms.map((perm) => (
                      <button
                        key={perm.id}
                        onClick={() => togglePerm(perm.code)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm border transition-colors text-right cursor-pointer ${
                          permToggles[perm.code]
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300'
                            : 'bg-background-50 border-background-200/70 text-foreground-600 hover:bg-background-100'
                        }`}
                      >
                        <span className={`w-5 h-5 flex items-center justify-center flex-shrink-0 ${permToggles[perm.code] ? 'text-emerald-600' : 'text-foreground-300'}`}>
                          <i className={permToggles[perm.code] ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'} />
                        </span>
                        <span className="font-medium">{perm.name_ar}</span>
                        <span className="text-xs text-foreground-400 mr-auto">{perm.code}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {permsSavedMsg && (
            <div className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-md text-center">{permsSavedMsg}</div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-background-200/70">
            <span className="text-xs text-foreground-400 ml-auto">
              {Object.values(permToggles).filter(Boolean).length} صلاحية محددة
            </span>
            <Button variant="ghost" size="sm" onClick={() => setShowPermsModal(false)}>إغلاق</Button>
            <Button variant="primary" size="sm" onClick={handleSavePermissions} loading={savePermsLoading} disabled={permsLoading || !!permsError}>
              حفظ الصلاحيات
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}