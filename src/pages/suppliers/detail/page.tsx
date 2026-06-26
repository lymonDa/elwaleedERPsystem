import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import { mockSuppliers, mockPurchaseOrders, poStatusLabels, poStatusColors } from '@/mocks/suppliers';
import type { PurchaseOrderStatus } from '@/types/supabase';

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'orders'>('info');

  const supplier = useMemo(() => mockSuppliers.find((s) => s.id === id), [id]);
  const supplierOrders = useMemo(
    () => mockPurchaseOrders.filter((po) => po.supplier_id === id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [id]
  );

  if (!supplier) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full bg-background-200 flex items-center justify-center">
          <i className="ri-error-warning-line text-2xl text-foreground-400" />
        </div>
        <p className="text-foreground-500">المورد غير موجود</p>
        <Button variant="ghost" onClick={() => navigate('/suppliers')}>العودة للموردين</Button>
      </div>
    );
  }

  const orderStats = {
    total: supplierOrders.length,
    received: supplierOrders.filter((po) => po.status === 'received').length,
    ordered: supplierOrders.filter((po) => po.status === 'ordered').length,
    draft: supplierOrders.filter((po) => po.status === 'draft').length,
    cancelled: supplierOrders.filter((po) => po.status === 'cancelled').length,
  };

  const totalSpent = supplierOrders
    .filter((po) => po.status === 'received')
    .reduce((sum, po) => sum + (po.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/suppliers')}
            className="w-9 h-9 flex items-center justify-center rounded-md text-foreground-500 hover:text-foreground-700 hover:bg-background-200 transition-colors cursor-pointer"
          >
            <i className="ri-arrow-right-line text-lg" />
          </button>
          <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-primary-700">{supplier.name.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground-900 font-heading">{supplier.name}</h1>
            <p className="text-sm text-foreground-500">{supplier.contact_person || 'لا يوجد جهة اتصال'}</p>
          </div>
        </div>
        <Link to={`/suppliers/orders/new?supplier=${supplier.id}`}>
          <Button variant="primary" size="md" icon={<i className="ri-add-line" />}>
            أمر شراء جديد
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-foreground-900 font-heading">{orderStats.total}</p>
          <p className="text-xs text-foreground-500 mt-1">أوامر الشراء</p>
        </div>
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600 font-heading">{orderStats.received}</p>
          <p className="text-xs text-foreground-500 mt-1">مستلمة</p>
        </div>
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-primary-600 font-heading">{orderStats.ordered + orderStats.draft}</p>
          <p className="text-xs text-foreground-500 mt-1">معلقة</p>
        </div>
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-foreground-900 font-heading">{totalSpent.toLocaleString('ar-EG')}</p>
          <p className="text-xs text-foreground-500 mt-1">إجمالي المشتريات (ج.م)</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-background-200/50 rounded-full p-1 w-fit overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'info'
              ? 'bg-background-50 text-foreground-900 shadow-sm'
              : 'text-foreground-500 hover:text-foreground-700'
          }`}
        >
          البيانات الأساسية
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'orders'
              ? 'bg-background-50 text-foreground-900 shadow-sm'
              : 'text-foreground-500 hover:text-foreground-700'
          }`}
        >
          أوامر الشراء ({orderStats.total})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' ? (
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-foreground-500 mb-1">اسم المورد</p>
              <p className="text-sm font-medium text-foreground-900">{supplier.name}</p>
            </div>
            <div>
              <p className="text-xs text-foreground-500 mb-1">جهة الاتصال</p>
              <p className="text-sm font-medium text-foreground-900">{supplier.contact_person || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-foreground-500 mb-1">رقم الهاتف</p>
              <p className="text-sm font-medium text-foreground-900" dir="ltr">{supplier.phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-foreground-500 mb-1">البريد الإلكتروني</p>
              <p className="text-sm font-medium text-foreground-900" dir="ltr">{supplier.email || '—'}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-foreground-500 mb-1">العنوان</p>
              <p className="text-sm font-medium text-foreground-900">{supplier.address || '—'}</p>
            </div>
            {supplier.notes && (
              <div className="sm:col-span-2">
                <p className="text-xs text-foreground-500 mb-1">ملاحظات</p>
                <p className="text-sm text-foreground-700 bg-background-100 rounded-md p-3">{supplier.notes}</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-background-200/70">
            <div>
              <p className="text-xs text-foreground-500 mb-1">تاريخ الإضافة</p>
              <p className="text-sm text-foreground-700">{new Date(supplier.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-xs text-foreground-500 mb-1">آخر تحديث</p>
              <p className="text-sm text-foreground-700">{new Date(supplier.updated_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-background-200/70 bg-background-100/50">
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">رقم الأمر</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">الحالة</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">المبلغ</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">تاريخ الطلب</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">التسليم المتوقع</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">تاريخ الاستلام</th>
                </tr>
              </thead>
              <tbody>
                {supplierOrders.map((po) => (
                  <tr
                    key={po.id}
                    onClick={() => navigate(`/suppliers/orders/${po.id}`)}
                    className="border-b border-background-200/70 hover:bg-background-100/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-foreground-900">{po.order_number}</span>
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
                {supplierOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-foreground-400 text-sm">
                      لا توجد أوامر شراء لهذا المورد
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}