import { Link } from 'react-router-dom';
import StatCard from '@/components/base/StatCard';
import Badge from '@/components/base/Badge';
import { monthlyRevenue, categoryRevenue, topClients, totalStats } from '@/mocks/reports';
import { mockInvoices, statusLabels, statusColors } from '@/mocks/invoices';
import { mockClients } from '@/mocks/clients';

function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ar-EG')} ج.م`;
}

const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue));
const maxCategoryAmount = Math.max(...categoryRevenue.map((c) => c.amount));

export default function SalesReportsPage() {
  const totalCollected = monthlyRevenue.reduce((sum, m) => sum + m.collected, 0);
  const totalOutstanding = monthlyRevenue.reduce((sum, m) => sum + m.outstanding, 0);

  const invoiceStatusCounts = mockInvoices.reduce((acc, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-500">
        <Link to="/reports" className="hover:text-primary-500 transition-colors cursor-pointer">التقارير</Link>
        <i className="ri-arrow-left-s-line" />
        <span className="text-foreground-800 font-medium">تقارير المبيعات</span>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-foreground-900 font-heading">
          <i className="ri-shopping-bag-3-line ml-2 text-primary-500" />
          تقارير المبيعات
        </h2>
        <p className="text-xs text-foreground-500 mt-1">تحليل شامل للمبيعات والإيرادات من يناير حتى يونيو 2026</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي الإيرادات" value={formatCurrency(totalStats.totalRevenueYTD)} icon="ri-money-dollar-circle-line" variant="primary" />
        <StatCard title="المحصل" value={formatCurrency(totalCollected)} icon="ri-check-double-line" variant="accent" />
        <StatCard title="المستحق" value={formatCurrency(totalOutstanding)} icon="ri-time-line" variant="warning" as any />
        <StatCard title="عدد الفواتير" value={`${totalStats.totalInvoicesYTD} فاتورة`} icon="ri-bill-line" variant="secondary" />
      </div>

      {/* Charts Row 1: Revenue Trend + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
          <h3 className="text-sm font-bold text-foreground-900 font-heading mb-5">
            <i className="ri-line-chart-line ml-2 text-primary-500" />
            اتجاه الإيرادات الشهرية
          </h3>
          <div className="space-y-4">
            {monthlyRevenue.map((m) => {
              const barPct = (m.revenue / maxRevenue) * 100;
              const collectedPct = m.revenue > 0 ? (m.collected / m.revenue) * barPct : 0;
              return (
                <div key={m.label} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-foreground-500 whitespace-nowrap text-right flex-shrink-0">{m.label}</span>
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <div className="flex-1 h-6 bg-background-100 rounded-md overflow-hidden relative">
                      <div
                        className="absolute inset-y-0 right-0 bg-primary-500/80 rounded-r-md"
                        style={{ width: `${collectedPct}%` }}
                      />
                      <div
                        className="absolute inset-y-0 bg-amber-400/60"
                        style={{ left: `${collectedPct}%`, width: `${barPct - collectedPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-foreground-800 w-28 text-left whitespace-nowrap flex-shrink-0">
                      {formatCurrency(m.revenue)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-foreground-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary-500/80 inline-block" /> محصّل</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-400/60 inline-block" /> غير محصّل</span>
          </div>
        </div>

        {/* Revenue by Category */}
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
          <h3 className="text-sm font-bold text-foreground-900 font-heading mb-5">
            <i className="ri-pie-chart-line ml-2 text-accent-500" />
            توزيع الإيرادات حسب النوع
          </h3>
          <div className="space-y-4">
            {categoryRevenue.map((c) => {
              const barPct = (c.amount / maxCategoryAmount) * 100;
              return (
                <div key={c.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground-700">{c.category}</span>
                    <span className="text-xs text-foreground-500">{c.count} طلب · {c.pct}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-5 bg-background-100 rounded-md overflow-hidden">
                      <div
                        className="h-full bg-accent-500/70 rounded-md"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-foreground-800 w-24 text-left whitespace-nowrap">
                      {formatCurrency(c.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts Row 2: Top Clients + Invoice Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
          <h3 className="text-sm font-bold text-foreground-900 font-heading mb-4">
            <i className="ri-star-line ml-2 text-accent-500" />
            أفضل العملاء
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-background-200">
                  <th className="text-right py-2 px-3 text-foreground-500 font-medium">#</th>
                  <th className="text-right py-2 px-3 text-foreground-500 font-medium">العميل</th>
                  <th className="text-right py-2 px-3 text-foreground-500 font-medium">عدد الفواتير</th>
                  <th className="text-right py-2 px-3 text-foreground-500 font-medium">الإجمالي</th>
                  <th className="text-right py-2 px-3 text-foreground-500 font-medium">النسبة</th>
                </tr>
              </thead>
              <tbody>
                {topClients.map((c, i) => {
                  const pct = ((c.totalRevenue / totalStats.totalRevenueYTD) * 100).toFixed(1);
                  return (
                    <tr key={c.clientId} className="border-b border-background-100/70 hover:bg-background-100/50">
                      <td className="py-2.5 px-3">
                        <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-xs font-bold ${
                          i < 3 ? 'bg-accent-100 text-accent-700' : 'bg-background-200 text-foreground-500'
                        }`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <Link to={`/crm/${c.clientId}`} className="text-foreground-800 hover:text-primary-500 font-medium cursor-pointer">
                          {c.clientName}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 text-foreground-600">{c.invoiceCount}</td>
                      <td className="py-2.5 px-3 font-bold text-foreground-900">{formatCurrency(c.totalRevenue)}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-foreground-500">{pct}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Status Breakdown */}
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
          <h3 className="text-sm font-bold text-foreground-900 font-heading mb-4">
            <i className="ri-donut-chart-line ml-2 text-secondary-500" />
            حالة الفواتير
          </h3>
          <div className="space-y-3">
            {(['paid', 'issued', 'partially_paid', 'draft', 'cancelled'] as const).map((status) => {
              const count = invoiceStatusCounts[status] || 0;
              const pct = mockInvoices.length > 0 ? (count / mockInvoices.length) * 100 : 0;
              const colors: Record<string, string> = {
                paid: 'bg-emerald-500',
                issued: 'bg-amber-500',
                partially_paid: 'bg-blue-400',
                draft: 'bg-background-300',
                cancelled: 'bg-red-400',
              };
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colors[status] === 'bg-emerald-500' ? '#10b981' : colors[status] === 'bg-amber-500' ? '#f59e0b' : colors[status] === 'bg-blue-400' ? '#60a5fa' : colors[status] === 'bg-background-300' ? '#d1d5db' : '#f87171' }} />
                  <span className="flex-1 text-xs text-foreground-700">{statusLabels[status] || status}</span>
                  <span className="text-xs font-bold text-foreground-800 w-8 text-left">{count}</span>
                  <div className="w-24 h-2 bg-background-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[status] === 'bg-emerald-500' ? '#10b981' : colors[status] === 'bg-amber-500' ? '#f59e0b' : colors[status] === 'bg-blue-400' ? '#60a5fa' : colors[status] === 'bg-background-300' ? '#d1d5db' : '#f87171' }} />
                  </div>
                  <span className="text-xs text-foreground-500 w-10 text-left">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Monthly Detail Table */}
      <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
        <h3 className="text-sm font-bold text-foreground-900 font-heading mb-4">
          <i className="ri-table-line ml-2 text-foreground-500" />
          ملخص شهري للمبيعات
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-background-200">
                <th className="text-right py-2 px-3 text-foreground-500 font-medium">الشهر</th>
                <th className="text-right py-2 px-3 text-foreground-500 font-medium">عدد الفواتير</th>
                <th className="text-right py-2 px-3 text-foreground-500 font-medium">الإيرادات</th>
                <th className="text-right py-2 px-3 text-foreground-500 font-medium">المحصل</th>
                <th className="text-right py-2 px-3 text-foreground-500 font-medium">المستحق</th>
                <th className="text-right py-2 px-3 text-foreground-500 font-medium">نسبة التحصيل</th>
              </tr>
            </thead>
            <tbody>
              {monthlyRevenue.map((m) => {
                const collectionRate = m.revenue > 0 ? ((m.collected / m.revenue) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={m.label} className="border-b border-background-100/70 hover:bg-background-100/50">
                    <td className="py-2.5 px-3 text-foreground-800 font-medium">{m.label}</td>
                    <td className="py-2.5 px-3 text-foreground-600">{m.invoiceCount}</td>
                    <td className="py-2.5 px-3 text-foreground-900 font-bold">{formatCurrency(m.revenue)}</td>
                    <td className="py-2.5 px-3 text-emerald-600">{formatCurrency(m.collected)}</td>
                    <td className="py-2.5 px-3 text-amber-600">{m.outstanding > 0 ? formatCurrency(m.outstanding) : '—'}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={Number(collectionRate) >= 90 ? 'success' : Number(collectionRate) >= 70 ? 'warning' : 'danger'}>
                        {collectionRate}%
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-background-50 font-bold">
                <td className="py-2.5 px-3 text-foreground-900">الإجمالي</td>
                <td className="py-2.5 px-3 text-foreground-900">{totalStats.totalInvoicesYTD}</td>
                <td className="py-2.5 px-3 text-foreground-900">{formatCurrency(totalStats.totalRevenueYTD)}</td>
                <td className="py-2.5 px-3 text-emerald-700">{formatCurrency(totalCollected)}</td>
                <td className="py-2.5 px-3 text-amber-700">{formatCurrency(totalOutstanding)}</td>
                <td className="py-2.5 px-3">
                  <Badge variant="success">
                    {((totalCollected / totalStats.totalRevenueYTD) * 100).toFixed(1)}%
                  </Badge>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}