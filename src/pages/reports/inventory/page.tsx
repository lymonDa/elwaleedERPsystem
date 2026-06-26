import { Link } from 'react-router-dom';
import StatCard from '@/components/base/StatCard';
import Badge from '@/components/base/Badge';
import { inventorySummary } from '@/mocks/reports';
import { mockItems, mockCategories, mockTransactions, itemNames, categoryNames } from '@/mocks/inventory';

function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ar-EG')} ج.م`;
}

export default function InventoryReportsPage() {
  const maxCategoryValue = Math.max(...inventorySummary.categoryDistribution.map((c) => c.value));

  const lowStockItems = mockItems.filter((item) => item.quantity <= item.min_quantity);

  const itemMovementCount: Record<string, number> = {};
  mockTransactions.forEach((txn) => {
    const existing = itemMovementCount[txn.inventory_item_id] || 0;
    itemMovementCount[txn.inventory_item_id] = existing + 1;
  });

  const sortedByMovement = [...mockItems]
    .map((item) => ({ ...item, movementCount: itemMovementCount[item.id] || 0 }))
    .sort((a, b) => b.movementCount - a.movementCount)
    .slice(0, 10);

  const totalIn = mockTransactions
    .filter((t) => t.transaction_type === 'in')
    .reduce((sum, t) => sum + t.quantity, 0);
  const totalOut = mockTransactions
    .filter((t) => t.transaction_type === 'out')
    .reduce((sum, t) => sum + t.quantity, 0);
  const totalAdjustment = mockTransactions
    .filter((t) => t.transaction_type === 'adjustment')
    .reduce((sum, t) => sum + t.quantity, 0);

  const stockStatusCounts = mockItems.reduce((acc, item) => {
    if (item.quantity === 0) acc.outOfStock++;
    else if (item.quantity <= item.min_quantity) acc.lowStock++;
    else acc.healthy++;
    return acc;
  }, { healthy: 0, lowStock: 0, outOfStock: 0 });

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-500">
        <Link to="/reports" className="hover:text-primary-500 transition-colors cursor-pointer">التقارير</Link>
        <i className="ri-arrow-left-s-line" />
        <span className="text-foreground-800 font-medium">تقارير المخزون</span>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-foreground-900 font-heading">
          <i className="ri-archive-line ml-2 text-accent-500" />
          تقارير المخزون
        </h2>
        <p className="text-xs text-foreground-500 mt-1">تحليل مستويات المخزون وحركة الأصناف وتوزيعها</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="عدد الأصناف" value={`${inventorySummary.totalItems} صنف`} icon="ri-box-3-line" variant="primary" />
        <StatCard title="قيمة المخزون" value={formatCurrency(inventorySummary.totalValue)} icon="ri-money-dollar-circle-line" variant="accent" />
        <StatCard title="هامش الربح المتوقع" value={formatCurrency(inventorySummary.potentialProfit)} icon="ri-increase-decrease-line" variant="secondary" />
        <StatCard
          title="تنبيهات نفاد المخزون"
          value={`${inventorySummary.lowStockCount} صنف`}
          icon="ri-alert-line"
          variant="warning" as any
          trend={inventorySummary.lowStockCount > 0 ? { value: -inventorySummary.lowStockCount * 5, label: 'تحت الحد الأدنى' } : undefined}
        />
      </div>

      {/* Charts Row 1: Stock Status + Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Status */}
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
          <h3 className="text-sm font-bold text-foreground-900 font-heading mb-5">
            <i className="ri-pie-chart-line ml-2 text-primary-500" />
            حالة المخزون
          </h3>
          <div className="flex items-center gap-8">
            {/* Donut-like visual */}
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="6" className="text-background-100" />
                {(() => {
                  const total = stockStatusCounts.healthy + stockStatusCounts.lowStock + stockStatusCounts.outOfStock;
                  if (total === 0) return null;
                  const healthyPct = (stockStatusCounts.healthy / total) * 100;
                  const lowPct = (stockStatusCounts.lowStock / total) * 100;
                  const circumference = 2 * Math.PI * 14;
                  const healthyDash = (healthyPct / 100) * circumference;
                  const lowDash = (lowPct / 100) * circumference;
                  return (
                    <>
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="6"
                        strokeDasharray={`${healthyDash} ${circumference - healthyDash}`} strokeDashoffset="0" strokeLinecap="round" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#f59e0b" strokeWidth="6"
                        strokeDasharray={`${lowDash} ${circumference - lowDash}`} strokeDashoffset={-healthyDash} strokeLinecap="round" />
                    </>
                  );
                })()}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-foreground-900 font-heading">{inventorySummary.totalItems}</span>
              </div>
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="text-xs text-foreground-700 flex-1">مخزون سليم</span>
                <span className="text-xs font-bold text-foreground-900">{stockStatusCounts.healthy}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0" />
                <span className="text-xs text-foreground-700 flex-1">أقل من الحد الأدنى</span>
                <span className="text-xs font-bold text-foreground-900">{stockStatusCounts.lowStock}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400 flex-shrink-0" />
                <span className="text-xs text-foreground-700 flex-1">نفاد المخزون</span>
                <span className="text-xs font-bold text-foreground-900">{stockStatusCounts.outOfStock}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
          <h3 className="text-sm font-bold text-foreground-900 font-heading mb-5">
            <i className="ri-bar-chart-line ml-2 text-accent-500" />
            توزيع المخزون حسب التصنيف
          </h3>
          <div className="space-y-4">
            {inventorySummary.categoryDistribution.map((c) => {
              const barPct = (c.value / maxCategoryValue) * 100;
              return (
                <div key={c.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground-700">{c.category}</span>
                    <span className="text-xs text-foreground-500">{c.count} أصناف</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-5 bg-background-100 rounded-md overflow-hidden">
                      <div className="h-full bg-accent-500/70 rounded-md" style={{ width: `${barPct}%` }} />
                    </div>
                    <span className="text-xs font-bold text-foreground-800 w-24 text-left whitespace-nowrap">
                      {formatCurrency(c.value)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts Row 2: Low Stock + Movement Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
          <h3 className="text-sm font-bold text-foreground-900 font-heading mb-4">
            <i className="ri-alert-line ml-2 text-red-500" />
            تنبيهات المخزون المنخفض
          </h3>
          {lowStockItems.length === 0 ? (
            <div className="text-center py-8 text-xs text-foreground-400">
              <i className="ri-check-double-line text-2xl block mb-2 text-emerald-400" />
              جميع الأصناف بمستويات مخزون جيدة
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-background-200">
                    <th className="text-right py-2 px-3 text-foreground-500 font-medium">الصنف</th>
                    <th className="text-right py-2 px-3 text-foreground-500 font-medium">التصنيف</th>
                    <th className="text-right py-2 px-3 text-foreground-500 font-medium">الكمية</th>
                    <th className="text-right py-2 px-3 text-foreground-500 font-medium">الحد الأدنى</th>
                    <th className="text-right py-2 px-3 text-foreground-500 font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((item) => (
                    <tr key={item.id} className="border-b border-background-100/70 hover:bg-background-100/50">
                      <td className="py-2.5 px-3">
                        <Link to={`/inventory/${item.id}`} className="text-foreground-800 hover:text-primary-500 font-medium cursor-pointer">
                          {item.name}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 text-foreground-500">{categoryNames[item.category_id || ''] || '—'}</td>
                      <td className="py-2.5 px-3 font-bold text-red-600">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-foreground-600">{item.min_quantity}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="danger">نفاد وشيك</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Movement Summary */}
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
          <h3 className="text-sm font-bold text-foreground-900 font-heading mb-4">
            <i className="ri-swap-line ml-2 text-secondary-500" />
            ملخص حركة المخزون
          </h3>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center">
              <p className="text-xs text-foreground-500 mb-1">وارد</p>
              <p className="text-lg font-bold text-emerald-600 font-heading">{totalIn}</p>
              <p className="text-xs text-foreground-400">وحدة</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
              <p className="text-xs text-foreground-500 mb-1">منصرف</p>
              <p className="text-lg font-bold text-red-600 font-heading">{totalOut}</p>
              <p className="text-xs text-foreground-400">وحدة</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
              <p className="text-xs text-foreground-500 mb-1">تسوية</p>
              <p className="text-lg font-bold text-amber-600 font-heading">{totalAdjustment}</p>
              <p className="text-xs text-foreground-400">وحدة</p>
            </div>
          </div>

          <h4 className="text-xs font-bold text-foreground-700 mb-3">الأصناف الأكثر حركة</h4>
          <div className="space-y-2">
            {sortedByMovement.slice(0, 8).map((item, i) => (
              <div key={item.id} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-secondary-100 flex items-center justify-center text-xs font-bold text-secondary-600 flex-shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 text-xs text-foreground-700 truncate">{item.name}</span>
                <span className="text-xs font-bold text-foreground-800 whitespace-nowrap">{item.movementCount} حركة</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}