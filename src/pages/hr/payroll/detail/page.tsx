import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import StatCard from '@/components/base/StatCard';
import { supabase } from '@/lib/supabase';

const payrollColors: Record<string, 'success' | 'warning' | 'primary' | 'neutral'> = {
  pending: 'warning',
  approved: 'primary',
  paid: 'success',
};

const payrollStatusLabels: Record<string, string> = {
  pending: 'قيد المراجعة',
  approved: 'معتمدة',
  paid: 'مدفوعة',
};

const monthNames = ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

interface PayrollRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  position: string;
  branch_id: string;
  month: number;
  year: number;
  base_salary: number;
  total_deductions: number;
  total_bonuses: number;
  net_salary: number;
  status: string;
  notes: string | null;
  created_at: string;
}

interface PayrollStats {
  totalBase: number;
  totalDeductions: number;
  totalBonuses: number;
  totalNet: number;
}

export default function PayrollPage() {
  const navigate = useNavigate();
  const [filterMonth, setFilterMonth] = useState(6);
  const [filterYear, setFilterYear] = useState(2026);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [data, setData] = useState<PayrollRecord[]>([]);
  const [stats, setStats] = useState<PayrollStats>({ totalBase: 0, totalDeductions: 0, totalBonuses: 0, totalNet: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: invokeErr } = await supabase.functions.invoke('get-payroll-list', {
        body: {
          month: filterMonth,
          year: filterYear,
          status: filterStatus !== 'all' ? filterStatus : undefined,
          search: search || undefined,
          page: 1,
          limit: 100,
        },
      });

      if (invokeErr) throw new Error(invokeErr.message);
      if (result.error) throw new Error(result.error);

      setData(result.data || []);
      setStats(result.stats || { totalBase: 0, totalDeductions: 0, totalBonuses: 0, totalNet: 0 });
    } catch (err: any) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filterMonth, filterYear, filterStatus, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Get user branch
      const { data: profileData } = await supabase
        .from('profiles')
        .select('branch_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id || '')
        .single();

      const branchId = profileData?.branch_id;

      if (!branchId) {
        alert('لا يمكن تحديد الفرع. تأكد من تسجيل الدخول بشكل صحيح.');
        setGenerating(false);
        return;
      }

      const { data: result, error: invokeErr } = await supabase.functions.invoke('generate-payroll', {
        body: { month: filterMonth, year: filterYear, branch_id: branchId },
      });

      if (invokeErr) throw new Error(invokeErr.message);
      if (result.error) throw new Error(result.error);

      alert(`تم توليد ${result.generated} كشف راتب${result.skipped ? `، وتم تخطي ${result.skipped} موظف (موجودين مسبقاً)` : ''}`);
      fetchData();
    } catch (err: any) {
      alert('فشل توليد كشوف الرواتب: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (payrollId: string, newStatus: string) => {
    try {
      const { data: result, error: invokeErr } = await supabase.functions.invoke('update-payroll-status', {
        body: { payroll_id: payrollId, status: newStatus },
      });

      if (invokeErr) throw new Error(invokeErr.message);
      if (result.error) throw new Error(result.error);

      fetchData();
    } catch (err: any) {
      alert('فشل تغيير الحالة: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground-900 font-heading">كشوف الرواتب</h1>
          <p className="text-sm text-foreground-500 mt-1">إدارة الرواتب الشهرية للموظفين</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<i className="ri-arrow-right-line" />} onClick={() => navigate('/hr')}>
            العودة للموظفين
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<i className="ri-add-line" />}
            onClick={handleGenerate}
            loading={generating}
          >
            توليد كشوف
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="إجمالي الأساسي" value={`${stats.totalBase.toLocaleString()} ج.م`} icon="ri-money-dollar-circle-line" variant="primary" />
        <StatCard title="إجمالي المكافآت" value={`${stats.totalBonuses.toLocaleString()} ج.م`} icon="ri-add-circle-line" variant="accent" />
        <StatCard title="إجمالي الخصومات" value={`${stats.totalDeductions.toLocaleString()} ج.م`} icon="ri-subtract-line" variant="secondary" />
        <StatCard title="الصافي المستحق" value={`${stats.totalNet.toLocaleString()} ج.م`} icon="ri-bank-card-line" variant="primary" />
      </div>

      {/* Month/Year Filter + Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-foreground-600">الشهر:</label>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(Number(e.target.value))}
            className="px-3 py-1.5 text-sm bg-background-50 border border-background-200/70 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            {monthNames.slice(1).map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-foreground-600">السنة:</label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(Number(e.target.value))}
            className="px-3 py-1.5 text-sm bg-background-50 border border-background-200/70 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5 bg-background-50 border border-background-200/70 rounded-lg px-1 py-1">
          {(['all', 'pending', 'approved', 'paid'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filterStatus === s
                  ? 'bg-primary-500 text-background-50 dark:text-foreground-950'
                  : 'text-foreground-600 hover:text-foreground-900 hover:bg-background-200'
              }`}
            >
              {s === 'all' ? 'الكل' : payrollStatusLabels[s]}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <i className="ri-search-line absolute right-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm" />
          <input
            type="text"
            placeholder="بحث باسم الموظف أو المنصب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-9 pl-3 py-1.5 text-sm bg-background-50 border border-background-200/70 rounded-md text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-foreground-400">جاري تحميل كشوف الرواتب...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <i className="ri-error-warning-line text-3xl text-red-400" />
            <span className="text-sm text-foreground-500">{error}</span>
            <Button variant="ghost" size="sm" onClick={fetchData}>إعادة المحاولة</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-background-200/70 bg-background-100">
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الموظف</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">المنصب</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الأساسي</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">المكافآت</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الخصومات</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الصافي</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الحالة</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-foreground-500">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {data.map((p) => (
                  <tr key={p.id} className="border-b border-background-200/70 hover:bg-background-100/70 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/hr/payroll/${p.id}`)}
                        className="text-foreground-900 hover:text-primary-600 transition-colors cursor-pointer font-medium"
                      >
                        {p.employee_name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-foreground-600 text-xs">{p.position}</td>
                    <td className="px-4 py-3 text-foreground-700">{p.base_salary.toLocaleString()} ج.م</td>
                    <td className="px-4 py-3 text-emerald-600 font-medium">+{p.total_bonuses.toLocaleString()} ج.م</td>
                    <td className="px-4 py-3 text-red-600 font-medium">-{p.total_deductions.toLocaleString()} ج.م</td>
                    <td className="px-4 py-3 text-foreground-900 font-bold">{p.net_salary.toLocaleString()} ج.م</td>
                    <td className="px-4 py-3">
                      <Badge variant={payrollColors[p.status] || 'neutral'}>
                        {payrollStatusLabels[p.status] || p.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {p.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(p.id, 'approved')}
                            className="w-7 h-7 flex items-center justify-center rounded-md bg-primary-100 text-primary-600 hover:bg-primary-200 transition-colors cursor-pointer"
                            title="اعتماد"
                          >
                            <i className="ri-check-line text-sm" />
                          </button>
                        )}
                        {p.status === 'approved' && (
                          <button
                            onClick={() => handleStatusChange(p.id, 'paid')}
                            className="w-7 h-7 flex items-center justify-center rounded-md bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors cursor-pointer"
                            title="تأكيد الصرف"
                          >
                            <i className="ri-bank-card-line text-sm" />
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/hr/payroll/${p.id}`)}
                          className="w-7 h-7 flex items-center justify-center rounded-md bg-background-100 text-foreground-500 hover:bg-background-200 transition-colors cursor-pointer"
                          title="تفاصيل"
                        >
                          <i className="ri-eye-line text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-foreground-400">
                      <i className="ri-money-dollar-circle-line text-3xl block mb-2" />
                      لا توجد كشوف رواتب لهذا الشهر
                      <br />
                      <span className="text-xs mt-1 block">استخدم زر "توليد كشوف" لإنشاء كشوف الرواتب تلقائياً</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}