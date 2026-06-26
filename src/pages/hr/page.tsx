import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '@/components/base/StatCard';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import { supabase } from '@/lib/supabase';
import type { Employee } from '@/types/supabase';

const statusLabels: Record<string, string> = {
  active: 'نشط',
  inactive: 'غير نشط',
  terminated: 'منهي خدمة',
};

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  active: 'success',
  inactive: 'warning',
  terminated: 'danger',
};

export default function HrPage() {
  const [employees, setEmployees] = useState<(Employee & { profiles?: { full_name: string; phone: string; avatar_url: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const payload: Record<string, unknown> = {
        page: pagination.page,
        page_size: 50,
      };
      if (filterStatus !== 'all') payload.status = filterStatus;
      if (search.trim()) payload.search = search.trim();

      const { data, error: fnError } = await supabase.functions.invoke('get-employees', {
        body: payload,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setEmployees(data?.employees || []);
      if (data?.pagination) {
        setPagination({
          page: data.pagination.page,
          total: data.pagination.total,
          totalPages: data.pagination.total_pages,
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل الموظفين');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, filterStatus, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    const active = employees.filter((e) => e.status === 'active').length;
    const inactive = employees.filter((e) => e.status === 'inactive').length;
    const terminated = employees.filter((e) => e.status === 'terminated').length;
    const totalSalary = employees
      .filter((e) => e.status === 'active')
      .reduce((sum, e) => sum + (e.base_salary || 0), 0);
    return { active, inactive, terminated, totalSalary, total: employees.length };
  }, [employees]);

  const filtered = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.toLowerCase();
    return employees.filter((emp) => {
      const name = (emp.profiles?.full_name || '').toLowerCase();
      return name.includes(q) || emp.position.toLowerCase().includes(q);
    });
  }, [employees, search]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground-900 font-heading">الموظفين والموارد البشرية</h1>
          <p className="text-sm text-foreground-500 mt-1">إدارة الموظفين والحضور والرواتب والإجازات</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/hr/attendance">
            <Button variant="secondary" size="sm" icon={<i className="ri-calendar-check-line" />}>
              الحضور
            </Button>
          </Link>
          <Link to="/hr/payroll">
            <Button variant="secondary" size="sm" icon={<i className="ri-money-dollar-circle-line" />}>
              الرواتب
            </Button>
          </Link>
          <Link to="/hr/leaves">
            <Button variant="secondary" size="sm" icon={<i className="ri-calendar-event-line" />}>
              الإجازات
            </Button>
          </Link>
          <Link to="/hr/new">
            <Button variant="primary" size="sm" icon={<i className="ri-user-add-line" />}>
              موظف جديد
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي الموظفين"
          value={stats.total}
          icon="ri-team-line"
          variant="primary"
        />
        <StatCard
          title="الموظفين النشطين"
          value={stats.active}
          icon="ri-user-smile-line"
          variant="accent"
          trend={{ value: stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0, label: 'من الإجمالي' }}
        />
        <StatCard
          title="إجمالي الرواتب الشهرية"
          value={`${stats.totalSalary.toLocaleString()} ج.م`}
          icon="ri-money-dollar-circle-line"
          variant="secondary"
        />
        <StatCard
          title="غير نشطين / منهي خدمة"
          value={stats.inactive + stats.terminated}
          icon="ri-user-unfollow-line"
          variant="primary"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="بحث باسم الموظف أو المسمى الوظيفي..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            icon={<i className="ri-search-line text-sm" />}
          />
        </div>
        <div className="flex items-center gap-1.5 bg-background-50 border border-background-200/70 rounded-lg px-1 py-1 overflow-x-auto max-w-full">
          {(['all', 'active', 'inactive', 'terminated'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setPagination(p => ({ ...p, page: 1 })); }}
              className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filterStatus === s
                  ? 'bg-primary-500 text-background-50 dark:text-foreground-950'
                  : 'text-foreground-600 hover:text-foreground-900 hover:bg-background-200'
              }`}
            >
              {s === 'all' ? 'الكل' : statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-4 border-primary-300 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-sm text-foreground-400">جاري تحميل الموظفين...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <i className="ri-error-warning-line text-4xl text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
          <Button onClick={fetchData} variant="secondary" size="sm">إعادة المحاولة</Button>
        </div>
      )}

      {/* Employee Table */}
      {!loading && !error && (
        <div className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-background-200/70 bg-background-100">
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">#</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الاسم</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">المسمى الوظيفي</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">تاريخ التعيين</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الراتب الأساسي</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-foreground-400">
                      <i className="ri-user-search-line text-3xl block mb-2" />
                      لا يوجد موظفين مطابقين للبحث
                    </td>
                  </tr>
                ) : (
                  filtered.map((emp, idx) => (
                    <tr
                      key={emp.id}
                      className="border-b border-background-200/70 hover:bg-background-100/70 transition-colors cursor-pointer"
                      onClick={() => {
                        window.location.href = `/hr/${emp.id}`;
                      }}
                    >
                      <td className="px-4 py-3 text-foreground-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/hr/${emp.id}`}
                          className="font-medium text-foreground-900 hover:text-primary-600 transition-colors"
                        >
                          {emp.profiles?.full_name || '—'}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-foreground-700">{emp.position}</td>
                      <td className="px-4 py-3 text-foreground-500">{emp.hire_date}</td>
                      <td className="px-4 py-3 text-foreground-700 font-medium">
                        {(emp.base_salary || 0).toLocaleString()} ج.م
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusColors[emp.status] || 'neutral'}>
                          {statusLabels[emp.status] || emp.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/hr/attendance"
          className="bg-background-50 border border-background-200/70 rounded-lg p-5 hover:bg-background-100 transition-colors cursor-pointer flex items-start gap-4 group"
        >
          <div className="w-11 h-11 rounded-lg bg-accent-100 text-accent-600 flex items-center justify-center flex-shrink-0">
            <i className="ri-calendar-check-line text-xl" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground-900 font-heading group-hover:text-accent-600 transition-colors">
              الحضور والانصراف
            </h3>
            <p className="text-xs text-foreground-500 mt-1">سجل حضور يومي كامل مع البصمة الجغرافية والتأخير</p>
          </div>
        </Link>
        <Link
          to="/hr/payroll"
          className="bg-background-50 border border-background-200/70 rounded-lg p-5 hover:bg-background-100 transition-colors cursor-pointer flex items-start gap-4 group"
        >
          <div className="w-11 h-11 rounded-lg bg-secondary-100 text-secondary-600 flex items-center justify-center flex-shrink-0">
            <i className="ri-money-dollar-circle-line text-xl" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground-900 font-heading group-hover:text-secondary-600 transition-colors">
              كشوف الرواتب
            </h3>
            <p className="text-xs text-foreground-500 mt-1">إدارة الرواتب الشهرية مع المكافآت والخصومات</p>
          </div>
        </Link>
        <Link
          to="/hr/leaves"
          className="bg-background-50 border border-background-200/70 rounded-lg p-5 hover:bg-background-100 transition-colors cursor-pointer flex items-start gap-4 group"
        >
          <div className="w-11 h-11 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
            <i className="ri-calendar-event-line text-xl" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground-900 font-heading group-hover:text-primary-600 transition-colors">
              إدارة الإجازات
            </h3>
            <p className="text-xs text-foreground-500 mt-1">طلبات الإجازات السنوية والمرضية والطارئة</p>
          </div>
        </Link>
      </div>
    </div>
  );
}