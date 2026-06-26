import { Link } from 'react-router-dom';
import StatCard from '@/components/base/StatCard';
import Badge from '@/components/base/Badge';
import { monthlyProfits, monthlyExpenses, totalStats } from '@/mocks/reports';

function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ar-EG')} ج.م`;
}

export default function ProfitReportsPage() {
  const maxProfit = Math.max(...monthlyProfits.map((m) => Math.abs(m.profit)));
  const maxRevenue = Math.max(...monthlyProfits.map((m) => m.revenue));
  const maxExpense = Math.max(...monthlyProfits.map((m) => m.expenses));

  const expenseCategoryTotals: Record<string, number> = {};
  monthlyExpenses.forEach((m) => {
    m.byCategory.forEach((c) => {
      expenseCategoryTotals[c.category] = (expenseCategoryTotals[c.category] || 0) + c.amount;
    });
  });

  const sortedExpenseCategories = Object.entries(expenseCategoryTotals)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const totalExpensesCategory = sortedExpenseCategories.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-500">
        <Link to="/reports" className="hover:text-primary-500 transition-colors cursor-pointer">التقارير</Link>
        <i className="ri-arrow-left-s-line" />
        <span className="text-foreground-800 font-medium">تقارير الأرباح</span>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-foreground-900 font-heading">
          <i className="ri-funds-line ml-2 text-secondary-500" />
          تقارير الأرباح والخسائر
        </h2>
        <p className="text-xs text-foreground-500 mt-1">تحليل الإيرادات مقابل المصروفات وهوامش الربح الشهرية</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي الإيرادات" value={formatCurrency(totalStats.totalRevenueYTD)} icon="ri-money-dollar-circle-line" variant="primary" />
        <StatCard title="إجمالي المصروفات" value={formatCurrency(totalStats.totalExpensesYTD)} icon="ri-shopping-cart-line" variant="secondary" />
        <StatCard
          title="صافي الأرباح"
          value={formatCurrency(totalStats.totalProfitYTD)}
          icon="ri-funds-line"
          variant="accent"
          trend={{ value: totalStats.overallMargin, label: 'هامش الربح' }}
        />
        <StatCard
          title="متوسط الهامش الشهري"
          value={`${(monthlyProfits.reduce((sum, m) => sum + m.margin, 0) / monthlyProfits.length).toFixed(1)}%`}
          icon="ri-percent-line"
          variant={totalStats.overallMargin > 20 ? 'accent' : 'secondary'}
        />
      </div>

      {/* Revenue vs Expenses Chart */}
      <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
        <h3 className="text-sm font-bold text-foreground-900 font-heading mb-5">
          <i className="ri-bar-chart-grouped-line ml-2 text-primary-500" />
          الإيرادات مقابل المصروفات (شهرياً)
        </h3>
        <div className="flex items-end gap-4 h-64">
          {monthlyProfits.map((m) => {
            const revenueBarH = (m.revenue / maxRevenue) * 100;
            const expenseBarH = (m.expenses / maxRevenue) * 100;
            return (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                <span className="text-xs font-bold text-foreground-800 whitespace-nowrap">
                  {m.profit >= 0 ? '+' : ''}{formatCurrency(m.profit)}
                </span>
                <div className="w-full flex items-end justify-center gap-1.5" style={{ height: '200px' }}>
                  <div className="flex flex-col justify-end items-center w-full max-w-[32px]" style={{ height: '100%' }}>
                    <div className="w-full rounded-t-sm bg-primary-500/70" style={{ height: `${revenueBarH}%` }} />
                  </div>
                  <div className="flex flex-col justify-end items-center w-full max-w-[32px]" style={{ height: '100%' }}>
                    <div className="w-full rounded-t-sm bg-red-400/60" style={{ height: `${expenseBarH}%` }} />
                  </div>
                </div>
                <span className="text-xs text-foreground-500 whitespace-nowrap">{m.label}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-foreground-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary-500/70 inline-block" /> الإيرادات</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-400/60 inline-block" /> المصروفات</span>
        </div>
      </div>

      {/* Charts Row: Profit Trend + Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit Trend */}
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
          <h3 className="text-sm font-bold text-foreground-900 font-heading mb-5">
            <i className="ri-line-chart-line ml-2 text-accent-500" />
            اتجاه الأرباح الشهرية
          </h3>
          <div className="space-y-4">
            {monthlyProfits.map((m) => {
              const barPct = Math.abs(m.profit) / maxProfit * 100;
              const isProfit = m.profit >= 0;
              return (
                <div key={m.label} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-foreground-500 whitespace-nowrap text-right flex-shrink-0">{m.label}</span>
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <div className="flex-1 h-6 bg-background-100 rounded-md overflow-hidden relative">
                      <div
                        className={`absolute inset-y-0 ${isProfit ? 'bg-emerald-500/70' : 'bg-red-400/60'} rounded-md`}
                        style={{ width: `${barPct}%`, right: isProfit ? 'auto' : 0, left: isProfit ? 0 : 'auto' }}
                      />
                    </div>
                    <div className="flex items-center gap-2 w-44 text-left flex-shrink-0">
                      <span className={`text-xs font-bold ${isProfit ? 'text-emerald-600' : 'text-red-500'} w-28 whitespace-nowrap`}>
                        {isProfit ? '+' : ''}{formatCurrency(m.profit)}
                      </span>
                      <Badge variant={m.margin >= 30 ? 'success' : m.margin >= 10 ? 'warning' : 'danger'}>
                        {m.margin.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expense Category Breakdown */}
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
          <h3 className="text-sm font-bold text-foreground-900 font-heading mb-4">
            <i className="ri-pie-chart-line ml-2 text-secondary-500" />
            توزيع المصروفات (6 شهور)
          </h3>
          <div className="space-y-3">
            {sortedExpenseCategories.map((c) => {
              const pct = ((c.amount / totalExpensesCategory) * 100).toFixed(1);
              const barPct = (c.amount / sortedExpenseCategories[0].amount) * 100;
              return (
                <div key={c.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground-700">{c.category}</span>
                    <span className="text-xs text-foreground-500">{pct}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-5 bg-background-100 rounded-md overflow-hidden">
                      <div className="h-full bg-secondary-500/70 rounded-md" style={{ width: `${barPct}%` }} />
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

      {/* Monthly P&L Table */}
      <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
        <h3 className="text-sm font-bold text-foreground-900 font-heading mb-4">
          <i className="ri-table-line ml-2 text-foreground-500" />
          ملخص شهري للأرباح والخسائر
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-background-200">
                <th className="text-right py-2 px-3 text-foreground-500 font-medium">الشهر</th>
                <th className="text-right py-2 px-3 text-foreground-500 font-medium">الإيرادات</th>
                <th className="text-right py-2 px-3 text-foreground-500 font-medium">المصروفات</th>
                <th className="text-right py-2 px-3 text-foreground-500 font-medium">صافي الربح</th>
                <th className="text-right py-2 px-3 text-foreground-500 font-medium">هامش الربح</th>
                <th className="text-right py-2 px-3 text-foreground-500 font-medium">الأداء</th>
              </tr>
            </thead>
            <tbody>
              {monthlyProfits.map((m) => {
                const isProfit = m.profit >= 0;
                return (
                  <tr key={m.label} className="border-b border-background-100/70 hover:bg-background-100/50">
                    <td className="py-2.5 px-3 text-foreground-800 font-medium">{m.label}</td>
                    <td className="py-2.5 px-3 text-foreground-600">{formatCurrency(m.revenue)}</td>
                    <td className="py-2.5 px-3 text-foreground-600">{formatCurrency(m.expenses)}</td>
                    <td className={`py-2.5 px-3 font-bold ${isProfit ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isProfit ? '+' : ''}{formatCurrency(m.profit)}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={m.margin >= 30 ? 'success' : m.margin >= 10 ? 'warning' : 'danger'}>
                        {m.margin.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3">
                      {isProfit ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <i className="ri-arrow-up-line" /> ربح
                        </span>
                      ) : (
                        <span className="text-red-500 flex items-center gap-1">
                          <i className="ri-arrow-down-line" /> خسارة
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-background-50 font-bold">
                <td className="py-2.5 px-3 text-foreground-900">الإجمالي</td>
                <td className="py-2.5 px-3 text-foreground-900">{formatCurrency(totalStats.totalRevenueYTD)}</td>
                <td className="py-2.5 px-3 text-foreground-900">{formatCurrency(totalStats.totalExpensesYTD)}</td>
                <td className="py-2.5 px-3 text-emerald-700">+{formatCurrency(totalStats.totalProfitYTD)}</td>
                <td className="py-2.5 px-3">
                  <Badge variant="success">{totalStats.overallMargin}%</Badge>
                </td>
                <td className="py-2.5 px-3 text-emerald-600 flex items-center gap-1">
                  <i className="ri-arrow-up-line" /> ربح
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}