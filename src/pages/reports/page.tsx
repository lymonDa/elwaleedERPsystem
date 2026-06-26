import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '@/components/base/StatCard';
import Badge from '@/components/base/Badge';
import { supabase } from '@/lib/supabase';

function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ar-EG')} ج.م`;
}

export default function ReportsPage() {
  const [data, setData] = useState<{
    monthlyRevenue: { label: string; revenue: number; outstanding: number }[];
    topClients: { rank: number; clientName: string; totalRevenue: number; invoiceCount: number }[];
    totalStats: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error: fnError } = await supabase.functions.invoke('get-reports', {
        body: {},
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setData(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل التقارير');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const monthlyRevenue = data?.monthlyRevenue || [];
  const topClients = data?.topClients || [];
  const totalStats = data?.totalStats || {};
  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue), 1);

  const miniStats = [
    { label: 'الفواتير', value: totalStats.totalInvoicesYTD || 0, icon: 'ri-bill-line' },
    { label: 'العملاء', value: totalStats.totalClients || 0, icon: 'ri-user-heart-line' },
    { label: 'الموظفين', value: totalStats.totalEmployees || 0, icon: 'ri-team-line' },
    { label: 'الموردين', value: totalStats.totalSuppliers || 0, icon: 'ri-truck-line' },
    { label: 'صيانة مكتملة', value: totalStats.maintenanceCompleted || 0, icon: 'ri-tools-line' },
    { label: 'أوامر شراء', value: totalStats.purchaseOrdersYTD || 0, icon: 'ri-shopping-cart-line' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground-900 font-heading">
            <i className="ri-bar-chart-2-line ml-2" />
            التقارير والتحليلات
          </h2>
          <p className="text-xs text-foreground-500 mt-1">نظرة شاملة على أداء الشركة من يناير حتى يونيو 2026</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-4 border-primary-300 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-sm text-foreground-400">جاري تحميل التقارير...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <i className="ri-error-warning-line text-4xl text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={fetchReports} className="text-xs text-primary-600 hover:text-primary-700">إعادة المحاولة</button>
        </div>
      )}

      {/* Content */}
      {!loading && !error && data && (
        <>
          {/* Primary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="إجمالي الإيرادات (حتى تاريخه)"
              value={formatCurrency(totalStats.totalRevenueYTD || 0)}
              icon="ri-money-dollar-circle-line"
              trend={{ value: 24.5, label: 'مقارنة بالربع السابق' }}
              variant="primary"
            />
            <StatCard
              title="صافي الأرباح"
              value={formatCurrency(totalStats.totalProfitYTD || 0)}
              icon="ri-funds-line"
              trend={{ value: totalStats.overallMargin || 0, label: 'هامش الربح' }}
              variant="accent"
            />
            <StatCard
              title="المستحقات غير المحصلة"
              value={formatCurrency(totalStats.receivablesOutstanding || 0)}
              icon="ri-time-line"
              variant="warning" as any
            />
            <StatCard
              title="قيمة المخزون الحالي"
              value={formatCurrency(totalStats.inventoryValue || 0)}
              icon="ri-archive-line"
              variant="secondary"
            />
          </div>

          {/* Mini stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {miniStats.map((stat) => (
              <div key={stat.label} className="bg-background-50 border border-background-200/70 rounded-lg p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-secondary-100 flex items-center justify-center flex-shrink-0">
                  <i className={`${stat.icon} text-sm text-secondary-600`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-foreground-500 truncate">{stat.label}</p>
                  <p className="text-sm font-bold text-foreground-900 font-heading">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Revenue Chart */}
            <div className="lg:col-span-2 bg-background-50 border border-background-200/70 rounded-lg p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-foreground-900 font-heading">
                  <i className="ri-line-chart-line ml-2 text-primary-500" />
                  الإيرادات الشهرية
                </h3>
                <Link to="/reports/sales" className="text-xs text-primary-500 hover:text-primary-600 font-medium whitespace-nowrap cursor-pointer">
                  عرض التفاصيل <i className="ri-arrow-left-line mr-1" />
                </Link>
              </div>

              <div className="flex items-end gap-3 h-56 overflow-x-auto pb-2">
                {monthlyRevenue.map((m) => {
                  const heightPct = (m.revenue / maxRevenue) * 100;
                  return (
                    <div key={m.label} className="flex-1 flex flex-col items-center gap-2 min-w-[60px]">
                      <span className="text-xs font-bold text-foreground-800 whitespace-nowrap">
                        {formatCurrency(m.revenue)}
                      </span>
                      <div className="w-full flex flex-col items-center gap-1">
                        <div className="relative w-full max-w-[48px] flex flex-col justify-end" style={{ height: '180px' }}>
                          <div
                            className="w-full rounded-t-md bg-primary-500/80 hover:bg-primary-500 transition-colors"
                            style={{ height: `${heightPct}%` }}
                          />
                          {m.outstanding > 0 && (
                            <div
                              className="w-full bg-amber-400/50 border-t border-dashed border-amber-500"
                              style={{ height: `${(m.outstanding / maxRevenue) * 100}%` }}
                            />
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-foreground-500 whitespace-nowrap">{m.label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-foreground-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-primary-500/80 inline-block" /> محصّل
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-amber-400/50 border border-dashed border-amber-500 inline-block" /> غير محصّل
                </span>
              </div>
            </div>

            {/* Top Clients */}
            <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
              <h3 className="text-sm font-bold text-foreground-900 font-heading mb-4">
                <i className="ri-star-line ml-2 text-accent-500" />
                أفضل العملاء
              </h3>
              <div className="space-y-3">
                {topClients.slice(0, 5).map((c, i) => (
                  <div key={c.rank || i} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-accent-600">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground-800 truncate">{c.clientName}</p>
                      <p className="text-xs text-foreground-500">{c.invoiceCount} فواتير</p>
                    </div>
                    <span className="text-xs font-bold text-foreground-900 whitespace-nowrap">
                      {formatCurrency(c.totalRevenue)}
                    </span>
                  </div>
                ))}
                {topClients.length === 0 && (
                  <p className="text-xs text-foreground-400 text-center py-4">لا توجد بيانات</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/reports/sales"
              className="bg-background-50 border border-background-200/70 rounded-lg p-5 hover:border-primary-300 transition-colors cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center mb-3 group-hover:bg-primary-200 transition-colors">
                <i className="ri-shopping-bag-3-line text-lg text-primary-600" />
              </div>
              <h4 className="text-sm font-bold text-foreground-900 font-heading mb-1">تقارير المبيعات</h4>
              <p className="text-xs text-foreground-500">تحليل الإيرادات، أفضل العملاء، الفواتير حسب الحالة</p>
            </Link>

            <Link
              to="/reports/inventory"
              className="bg-background-50 border border-background-200/70 rounded-lg p-5 hover:border-accent-300 transition-colors cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center mb-3 group-hover:bg-accent-200 transition-colors">
                <i className="ri-archive-line text-lg text-accent-600" />
              </div>
              <h4 className="text-sm font-bold text-foreground-900 font-heading mb-1">تقارير المخزون</h4>
              <p className="text-xs text-foreground-500">مستويات المخزون، توزيع الأصناف، تنبيهات النفاد</p>
            </Link>

            <Link
              to="/reports/profits"
              className="bg-background-50 border border-background-200/70 rounded-lg p-5 hover:border-secondary-300 transition-colors cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center mb-3 group-hover:bg-secondary-200 transition-colors">
                <i className="ri-funds-line text-lg text-secondary-600" />
              </div>
              <h4 className="text-sm font-bold text-foreground-900 font-heading mb-1">تقارير الأرباح</h4>
              <p className="text-xs text-foreground-500">الإيرادات مقابل المصروفات، هوامش الربح، تحليل المصروفات</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}