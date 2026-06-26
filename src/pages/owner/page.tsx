import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { branchOverviews, ownerTotalStats } from '@/mocks/owner-dashboard';
import StatCard from '@/components/base/StatCard';
import Badge from '@/components/base/Badge';

function formatEGP(amount: number): string {
  return `${amount.toLocaleString('ar-EG')} ج.م`;
}

function formatCompact(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  return `${amount}`;
}

const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'];

const branchColors: Record<string, { bar: string; barDark: string; dot: string }> = {
  'فرع طنطا': { bar: 'bg-primary-500', barDark: 'dark:bg-primary-400', dot: 'bg-primary-500' },
  'فرع الأحياء': { bar: 'bg-accent-500', barDark: 'dark:bg-accent-400', dot: 'bg-accent-500' },
  'فرع المدارس': { bar: 'bg-secondary-500', barDark: 'dark:bg-secondary-400', dot: 'bg-secondary-500' },
};

type SortField = 'revenue' | 'profit' | 'margin' | 'employees' | 'inventory' | 'maintenance';
type SortDir = 'asc' | 'desc';

export default function OwnerDashboardPage() {
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  const maxMonthlyRevenue = useMemo(() => {
    let max = 0;
    for (let i = 0; i < 6; i++) {
      const total = branchOverviews.reduce((sum, b) => sum + b.monthlyRevenue[i].revenue, 0);
      if (total > max) max = total;
    }
    return max;
  }, []);

  const sortedBranches = useMemo(() => {
    const sorted = [...branchOverviews];
    const fieldMap: Record<SortField, (b: typeof branchOverviews[0]) => number> = {
      revenue: (b) => b.revenueYTD,
      profit: (b) => b.profitYTD,
      margin: (b) => b.marginPct,
      employees: (b) => b.activeEmployeeCount,
      inventory: (b) => b.inventoryValue,
      maintenance: (b) => b.maintenancePending,
    };
    sorted.sort((a, b) => {
      const val = fieldMap[sortField](a) - fieldMap[sortField](b);
      return sortDir === 'desc' ? -val : val;
    });
    return sorted;
  }, [sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <i className="ri-arrow-up-down-line text-foreground-400" />;
    return sortDir === 'desc'
      ? <i className="ri-sort-desc text-foreground-900" />
      : <i className="ri-sort-asc text-foreground-900" />;
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Hero */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-background-100 via-background-50 to-accent-100/40 p-6 md:p-8">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground-900 font-heading">
                لوحة تحكم المالك
              </h1>
              <p className="text-sm text-foreground-500 mt-1">
                نظرة شاملة على كل فروع شركة الوليد للتكييفات والمقاولات
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground-500 bg-background-50/60 rounded-lg px-3 py-2 self-start">
              <i className="ri-calendar-line" />
              <span className="whitespace-nowrap">{dateStr}</span>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge variant="success">3 فروع نشطة</Badge>
            <Badge variant="primary">{ownerTotalStats.activeEmployees} موظف نشط</Badge>
            <Badge variant="accent">{ownerTotalStats.totalClients} عملاء</Badge>
            <Badge variant="secondary">{ownerTotalStats.totalSuppliers} موردين</Badge>
          </div>
        </div>
        <div className="absolute -left-12 -top-12 w-48 h-48 rounded-full bg-primary-500/10" />
        <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-accent-500/10" />
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="إجمالي الإيرادات (حتى تاريخه)"
          value={formatEGP(ownerTotalStats.totalRevenue)}
          icon="ri-money-dollar-circle-line"
          variant="primary"
        />
        <StatCard
          title="صافي الأرباح"
          value={formatEGP(ownerTotalStats.totalProfit)}
          icon="ri-bar-chart-box-line"
          variant="accent"
          trend={{ value: ownerTotalStats.marginPct, label: 'هامش ربح' }}
        />
        <StatCard
          title="المستحقات غير المحصلة"
          value={formatEGP(ownerTotalStats.totalOutstanding)}
          icon="ri-hourglass-line"
          variant="secondary"
        />
        <StatCard
          title="قيمة المخزون"
          value={formatEGP(ownerTotalStats.totalInventoryValue)}
          icon="ri-archive-line"
          variant="primary"
        />
        <StatCard
          title="طلبات صيانة معلقة"
          value={`${ownerTotalStats.maintenancePending} طلب`}
          icon="ri-tools-line"
          variant="warning" as any
        />
        <StatCard
          title="إجمالي الفواتير"
          value={`${ownerTotalStats.totalInvoices} فاتورة`}
          icon="ri-bill-line"
          variant="accent" as any
        />
      </div>

      {/* Branch Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground-900 font-heading">
            نظرة على الفروع
          </h2>
          <span className="text-xs text-foreground-500">3 فروع</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {sortedBranches.map((branch) => (
            <div
              key={branch.branchId}
              className={`bg-background-50 border rounded-lg p-5 cursor-pointer transition-all ${
                selectedBranch === branch.branchId
                  ? 'border-primary-400 bg-primary-50/40'
                  : 'border-background-200/70 hover:border-background-300'
              }`}
              onClick={() => setSelectedBranch(selectedBranch === branch.branchId ? null : branch.branchId)}
            >
              {/* Branch Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  branch.branchName === 'فرع طنطا'
                    ? 'bg-primary-100 text-primary-600'
                    : branch.branchName === 'فرع الأحياء'
                    ? 'bg-accent-100 text-accent-600'
                    : 'bg-secondary-100 text-secondary-600'
                }`}>
                  <i className="ri-store-2-line text-lg" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground-900 truncate font-heading">
                    {branch.branchName}
                  </h3>
                  <p className="text-xs text-foreground-500 truncate">{branch.branchAddress}</p>
                </div>
              </div>

              {/* Revenue Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-foreground-600">الإيرادات</span>
                  <span className="font-semibold text-foreground-900">{formatCompact(branch.revenueYTD)}</span>
                </div>
                <div className="h-2 bg-background-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      branch.branchName === 'فرع طنطا' ? 'bg-primary-500' :
                      branch.branchName === 'فرع الأحياء' ? 'bg-accent-500' : 'bg-secondary-500'
                    }`}
                    style={{ width: `${(branch.revenueYTD / ownerTotalStats.totalRevenue) * 100}%` }}
                  />
                </div>
              </div>

              {/* Mini Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-foreground-500">الربح</p>
                  <p className="text-sm font-semibold text-foreground-900 font-heading">
                    {formatCompact(branch.profitYTD)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-foreground-500">الهامش</p>
                  <p className="text-sm font-semibold text-emerald-600 font-heading">
                    {branch.marginPct}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-foreground-500">موظفين</p>
                  <p className="text-sm font-semibold text-foreground-900 font-heading">
                    {branch.activeEmployeeCount}/{branch.employeeCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-foreground-500">صيانة معلقة</p>
                  <p className={`text-sm font-semibold font-heading ${
                    branch.maintenancePending > 1 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {branch.maintenancePending}
                  </p>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedBranch === branch.branchId && (
                <div className="mt-4 pt-4 border-t border-background-200/70 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground-500">محصّل</span>
                    <span className="text-foreground-900 font-medium">{formatEGP(branch.collectedYTD)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground-500">مستحق</span>
                    <span className="text-red-600 font-medium">{formatEGP(branch.outstandingYTD)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground-500">قيمة المخزون</span>
                    <span className="text-foreground-900 font-medium">{formatEGP(branch.inventoryValue)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground-500">فواتير</span>
                    <span className="text-foreground-900 font-medium">{branch.invoiceCount} فاتورة</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-foreground-500">أوامر شراء</span>
                    <span className="text-foreground-900 font-medium">{branch.purchaseOrderCount} أمر</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground-900 font-heading">
            الإيرادات الشهرية حسب الفرع
          </h2>
          <div className="flex items-center gap-3 text-xs flex-wrap">
            {branchOverviews.map((b) => (
              <div key={b.branchId} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${branchColors[b.branchName].dot}`} />
                <span className="text-foreground-500">{b.branchName}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-4 md:p-6">
          <div className="flex items-end gap-2 md:gap-3 h-64 overflow-x-auto pb-2">
            {months.map((month, idx) => {
              const values = branchOverviews.map((b) => ({
                branch: b.branchName,
                revenue: b.monthlyRevenue[idx].revenue,
              }));
              values.sort((a, b) => (branchOverviews.findIndex((x) => x.branchName === a.branch) - branchOverviews.findIndex((x) => x.branchName === b.branch)));

              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full flex flex-col items-center gap-0.5 justify-end h-[calc(100%-2rem)]">
                    {values.map((v) => {
                      const heightPct = maxMonthlyRevenue > 0 ? (v.revenue / maxMonthlyRevenue) * 100 : 0;
                      const colors = branchColors[v.branch];
                      return (
                        <div
                          key={v.branch}
                          className={`w-full max-w-[24px] rounded-t-sm transition-all duration-500 cursor-pointer group relative ${colors.bar} ${colors.barDark} hover:opacity-80`}
                          style={{ height: `${heightPct}%`, minHeight: v.revenue > 0 ? '4px' : '0' }}
                          title={`${v.branch}: ${formatEGP(v.revenue)}`}
                        >
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground-900 text-background-50 text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {formatCompact(v.revenue)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-xs text-foreground-500 whitespace-nowrap mt-1">{month}</span>
                </div>
              );
            })}
          </div>
          {/* Y-axis scale */}
          <div className="flex justify-between mt-3 pt-3 border-t border-background-200/70">
            <div className="flex items-center gap-4 text-xs text-foreground-500 flex-wrap">
              <span>0</span>
              <span>{formatCompact(Math.round(maxMonthlyRevenue * 0.25))}</span>
              <span>{formatCompact(Math.round(maxMonthlyRevenue * 0.5))}</span>
              <span>{formatCompact(Math.round(maxMonthlyRevenue * 0.75))}</span>
              <span>{formatCompact(maxMonthlyRevenue)}</span>
            </div>
            <span className="text-xs text-foreground-400">جنيه مصري</span>
          </div>
        </div>
      </div>

      {/* Branch Comparison Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground-900 font-heading">
            مقارنة الفروع
          </h2>
          <span className="text-xs text-foreground-500">اضغط على رأس العمود للترتيب</span>
        </div>
        <div className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-background-200/70 bg-background-100">
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-600">
                    الفرع
                  </th>
                  <th
                    className="text-right px-4 py-3 text-xs font-semibold text-foreground-600 cursor-pointer hover:text-foreground-900 transition-colors"
                    onClick={() => handleSort('revenue')}
                  >
                    <span className="flex items-center gap-1 justify-end">
                      الإيرادات
                      <SortIcon field="revenue" />
                    </span>
                  </th>
                  <th
                    className="text-right px-4 py-3 text-xs font-semibold text-foreground-600 cursor-pointer hover:text-foreground-900 transition-colors"
                    onClick={() => handleSort('profit')}
                  >
                    <span className="flex items-center gap-1 justify-end">
                      الأرباح
                      <SortIcon field="profit" />
                    </span>
                  </th>
                  <th
                    className="text-right px-4 py-3 text-xs font-semibold text-foreground-600 cursor-pointer hover:text-foreground-900 transition-colors"
                    onClick={() => handleSort('margin')}
                  >
                    <span className="flex items-center gap-1 justify-end">
                      الهامش
                      <SortIcon field="margin" />
                    </span>
                  </th>
                  <th
                    className="text-right px-4 py-3 text-xs font-semibold text-foreground-600 cursor-pointer hover:text-foreground-900 transition-colors"
                    onClick={() => handleSort('employees')}
                  >
                    <span className="flex items-center gap-1 justify-end">
                      الموظفين
                      <SortIcon field="employees" />
                    </span>
                  </th>
                  <th
                    className="text-right px-4 py-3 text-xs font-semibold text-foreground-600 cursor-pointer hover:text-foreground-900 transition-colors"
                    onClick={() => handleSort('inventory')}
                  >
                    <span className="flex items-center gap-1 justify-end">
                      المخزون
                      <SortIcon field="inventory" />
                    </span>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-600">
                    المستحقات
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedBranches.map((branch) => {
                  const isTop = branch.revenueYTD === Math.max(...branchOverviews.map(b => b.revenueYTD));
                  return (
                    <tr
                      key={branch.branchId}
                      className={`border-b border-background-100 last:border-0 hover:bg-background-100/50 transition-colors ${
                        selectedBranch === branch.branchId ? 'bg-primary-50/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isTop && (
                            <span className="w-5 h-5 flex items-center justify-center flex-shrink-0" title="الأعلى إيراداً">
                              <i className="ri-medal-line text-amber-500 text-sm" />
                            </span>
                          )}
                          <span className="font-medium text-foreground-900">{branch.branchName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <span className="font-semibold text-foreground-900 font-heading">
                            {formatEGP(branch.revenueYTD)}
                          </span>
                          <Badge variant="neutral">{branch.invoiceCount} فاتورة</Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold font-heading ${branch.profitYTD >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatEGP(branch.profitYTD)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant={branch.marginPct >= 45 ? 'success' : branch.marginPct >= 35 ? 'warning' : 'danger'}>
                          {branch.marginPct}%
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-foreground-900 font-medium">
                          {branch.activeEmployeeCount}
                        </span>
                        <span className="text-foreground-500 text-xs mr-1">نشط</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-foreground-900 font-medium">{formatEGP(branch.inventoryValue)}</span>
                          <span className="text-xs text-foreground-500">{branch.inventoryItems} صنف</span>
                          {branch.lowStockCount > 0 && (
                            <Badge variant="warning" className="mt-1">⚠ {branch.lowStockCount} تحت الحد</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${branch.outstandingYTD > 100000 ? 'text-red-600' : 'text-foreground-900'}`}>
                          {formatEGP(branch.outstandingYTD)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-background-200 bg-background-100 font-semibold">
                  <td className="px-4 py-3 text-foreground-900">الإجمالي</td>
                  <td className="px-4 py-3 text-right text-foreground-900 font-heading">{formatEGP(ownerTotalStats.totalRevenue)}</td>
                  <td className="px-4 py-3 text-right text-emerald-600 font-heading">{formatEGP(ownerTotalStats.totalProfit)}</td>
                  <td className="px-4 py-3 text-right">
                    <Badge variant="success">{ownerTotalStats.marginPct}%</Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-foreground-900">{ownerTotalStats.activeEmployees}/{ownerTotalStats.totalEmployees}</td>
                  <td className="px-4 py-3 text-right text-foreground-900 font-heading">{formatEGP(ownerTotalStats.totalInventoryValue)}</td>
                  <td className="px-4 py-3 text-right text-foreground-900 font-heading">{formatEGP(ownerTotalStats.totalOutstanding)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/reports"
          className="bg-background-50 border border-background-200/70 rounded-lg p-4 flex items-center gap-3 hover:border-primary-300 transition-colors cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-200 transition-colors">
            <i className="ri-bar-chart-2-line" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground-900">التقارير الكاملة</p>
            <p className="text-xs text-foreground-500">مبيعات، مخزون، أرباح</p>
          </div>
          <i className="ri-arrow-left-line text-foreground-400 mr-auto group-hover:text-primary-500 transition-colors" />
        </Link>
        <Link
          to="/reports/sales"
          className="bg-background-50 border border-background-200/70 rounded-lg p-4 flex items-center gap-3 hover:border-accent-300 transition-colors cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-accent-100 text-accent-600 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-200 transition-colors">
            <i className="ri-money-dollar-circle-line" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground-900">تحليل المبيعات</p>
            <p className="text-xs text-foreground-500">أفضل العملاء والفئات</p>
          </div>
          <i className="ri-arrow-left-line text-foreground-400 mr-auto group-hover:text-accent-500 transition-colors" />
        </Link>
        <Link
          to="/reports/profits"
          className="bg-background-50 border border-background-200/70 rounded-lg p-4 flex items-center gap-3 hover:border-secondary-300 transition-colors cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-secondary-100 text-secondary-600 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary-200 transition-colors">
            <i className="ri-line-chart-line" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground-900">الأرباح والخسائر</p>
            <p className="text-xs text-foreground-500">الإيرادات مقابل المصروفات</p>
          </div>
          <i className="ri-arrow-left-line text-foreground-400 mr-auto group-hover:text-secondary-500 transition-colors" />
        </Link>
        <Link
          to="/reports/inventory"
          className="bg-background-50 border border-background-200/70 rounded-lg p-4 flex items-center gap-3 hover:border-primary-300 transition-colors cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <i className="ri-archive-line" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground-900">حالة المخزون</p>
            <p className="text-xs text-foreground-500">{ownerTotalStats.totalInventoryValue.toLocaleString('ar-EG')} ج.م</p>
          </div>
          <i className="ri-arrow-left-line text-foreground-400 mr-auto group-hover:text-emerald-500 transition-colors" />
        </Link>
      </div>

      {/* Bottom summary strip */}
      <div className="bg-background-50 border border-background-200/70 rounded-lg p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground-900 font-heading">
              ملخص النصف الأول من 2026
            </h3>
            <p className="text-xs text-foreground-500 mt-0.5">
              إجمالي 6 شهور عبر 3 فروع — كل الأرقام بالجنيه المصري
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="text-center px-3 py-2 bg-emerald-50 rounded-lg">
              <p className="text-xs text-emerald-600">أعلى إيراد شهري</p>
              <p className="text-sm font-bold text-emerald-700 font-heading">589,500 ج.م</p>
              <p className="text-xs text-emerald-500">يونيو 2026</p>
            </div>
            <div className="text-center px-3 py-2 bg-amber-50 rounded-lg">
              <p className="text-xs text-amber-600">أعلى هامش ربح</p>
              <p className="text-sm font-bold text-amber-700 font-heading">79.2%</p>
              <p className="text-xs text-amber-500">يونيو 2026</p>
            </div>
            <div className="text-center px-3 py-2 bg-background-100 rounded-lg">
              <p className="text-xs text-foreground-500">معدل التحصيل</p>
              <p className="text-sm font-bold text-foreground-900 font-heading">75.7%</p>
              <p className="text-xs text-foreground-400">من الإيرادات</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}