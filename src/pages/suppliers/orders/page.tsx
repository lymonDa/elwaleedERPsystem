import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StatCard from '@/components/base/StatCard';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import { mockPurchaseOrders, supplierNames, poStatusLabels, poStatusColors } from '@/mocks/suppliers';
import type { PurchaseOrderStatus } from '@/types/supabase';

export default function PurchaseOrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    let result = mockPurchaseOrders;
    if (statusFilter !== 'all') {
      result = result.filter((po) => po.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (po) =>
          po.order_number.toLowerCase().includes(q) ||
          (po.supplier_id && supplierNames[po.supplier_id]?.toLowerCase().includes(q)) ||
          (po.notes && po.notes.toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [search, statusFilter]);

  const stats = useMemo(() => {
    const all = mockPurchaseOrders;
    return {
      total: all.length,
      received: all.filter((po) => po.status === 'received').length,
      ordered: all.filter((po) => po.status === 'ordered').length,
      draft: all.filter((po) => po.status === 'draft').length,
      cancelled: all.filter((po) => po.status === 'cancelled').length,
      totalAmount: all.reduce((sum, po) => sum + (po.total_amount || 0), 0),
    };
  }, []);

  const statuses: { value: string; label: string }[] = [
    { value: 'all', label: 'الكل' },
    { value: 'draft', label: 'مسودة' },
    { value: 'ordered', label: 'مطلوب' },
    { value: 'received', label: 'مستلم' },
    { value: 'cancelled', label: 'ملغي' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              to="/suppliers"
              className="w-9 h-9 flex items-center justify-center rounded-md text-foreground-500 hover:text-foreground-700 hover:bg-background-200 transition-colors cursor-pointer"
            >
              <i className="ri-arrow-right-line text-lg" />
            </Link>
            <h1 className="text-xl md:text-2xl font-bold text-foreground-900 font-heading">أوامر الشراء</h1>
          </div>
          <p className="text-sm text-foreground-500 mt-1 mr-12">متابعة وإدارة أوامر الشراء من الموردين</p>
        </div>
        <Link to="/suppliers/orders/new">
          <Button variant="primary" size="md" icon={<i className="ri-add-line" />}>
            أمر شراء جديد
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-4 text-center">
          <p className="text-xl font-bold text-foreground-900 font-heading">{stats.total}</p>
          <p className="text-xs text-foreground-500 mt-1">إجمالي الأوامر</p>
        </div>
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-4 text-center">
          <p className="text-xl font-bold text-primary-600 font-heading">{stats.ordered}</p>
          <p className="text-xs text-foreground-500 mt-1">قيد الطلب</p>
        </div>
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-4 text-center">
          <p className="text-xl font-bold text-emerald-600 font-heading">{stats.received}</p>
          <p className="text-xs text-foreground-500 mt-1">مستلمة</p>
        </div>
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-4 text-center">
          <p className="text-xl font-bold text-foreground-900 font-heading">{stats.totalAmount.toLocaleString('ar-EG')}</p>
          <p className="text-xs text-foreground-500 mt-1">إجمالي القيم (ج.م)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1 bg-background-200/50 rounded-full p-1 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === s.value
                  ? 'bg-background-50 text-foreground-900 shadow-sm'
                  : 'text-foreground-500 hover:text-foreground-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-foreground-400">
            <i className="ri-search-line text-sm" />
          </span>
          <input
            type="text"
            placeholder="ابحث برقم الأمر أو المورد..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2 text-sm bg-background-50 border border-foreground-200 rounded-md text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-background-200/70 bg-background-100/50">
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">رقم الأمر</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">المورد</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">الحالة</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">المبلغ</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">تاريخ الطلب</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">التسليم المتوقع</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">الاستلام</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((po) => (
                <tr
                  key={po.id}
                  onClick={() => navigate(`/suppliers/orders/${po.id}`)}
                  className="border-b border-background-200/70 hover:bg-background-100/50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-foreground-900 whitespace-nowrap">{po.order_number}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-foreground-700 whitespace-nowrap">
                      {po.supplier_id ? supplierNames[po.supplier_id] || '—' : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={poStatusColors[po.status as PurchaseOrderStatus] as 'primary' | 'accent' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral'}>
                      {poStatusLabels[po.status as PurchaseOrderStatus]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-foreground-900 whitespace-nowrap">
                      {(po.total_amount || 0).toLocaleString('ar-EG')} ج.م
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-foreground-600 whitespace-nowrap">
                      {po.ordered_at ? new Date(po.ordered_at).toLocaleDateString('ar-EG') : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-foreground-600 whitespace-nowrap">
                      {po.expected_delivery ? new Date(po.expected_delivery).toLocaleDateString('ar-EG') : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-foreground-600 whitespace-nowrap">
                      {po.received_at ? new Date(po.received_at).toLocaleDateString('ar-EG') : '—'}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-foreground-400 text-sm">
                    لا توجد أوامر شراء مطابقة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}