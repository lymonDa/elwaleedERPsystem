import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import Modal from '@/components/base/Modal';
import { mockPurchaseOrders, mockPurchaseOrderItems, supplierNames, poStatusLabels, poStatusColors } from '@/mocks/suppliers';
import type { PurchaseOrderStatus } from '@/types/supabase';

const statusTransitions: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  draft: ['ordered', 'cancelled'],
  ordered: ['received', 'cancelled'],
  received: [],
  cancelled: [],
};

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const po = useMemo(() => mockPurchaseOrders.find((p) => p.id === id), [id]);
  const poItems = useMemo(
    () => mockPurchaseOrderItems.filter((i) => i.purchase_order_id === id),
    [id]
  );

  if (!po) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full bg-background-200 flex items-center justify-center">
          <i className="ri-error-warning-line text-2xl text-foreground-400" />
        </div>
        <p className="text-foreground-500">أمر الشراء غير موجود</p>
        <Button variant="ghost" onClick={() => navigate('/suppliers/orders')}>العودة لأوامر الشراء</Button>
      </div>
    );
  }

  const currentStatus = po.status as PurchaseOrderStatus;
  const availableTransitions = statusTransitions[currentStatus] || [];

  const orderSubtotal = poItems.reduce((sum, item) => sum + (item.subtotal || item.quantity * item.unit_price), 0);

  const statusIcons: Record<PurchaseOrderStatus, string> = {
    draft: 'ri-draft-line',
    ordered: 'ri-shopping-cart-2-line',
    received: 'ri-check-double-line',
    cancelled: 'ri-close-circle-line',
  };

  const statusBgColors: Record<PurchaseOrderStatus, string> = {
    draft: 'bg-background-200',
    ordered: 'bg-primary-100',
    received: 'bg-emerald-100',
    cancelled: 'bg-red-100',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/suppliers/orders')}
            className="w-9 h-9 flex items-center justify-center rounded-md text-foreground-500 hover:text-foreground-700 hover:bg-background-200 transition-colors cursor-pointer"
          >
            <i className="ri-arrow-right-line text-lg" />
          </button>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${statusBgColors[currentStatus]}`}>
            <i className={`${statusIcons[currentStatus]} text-lg text-foreground-700`} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground-900 font-heading">{po.order_number}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant={poStatusColors[currentStatus] as 'primary' | 'accent' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral'}>
                {poStatusLabels[currentStatus]}
              </Badge>
              {po.supplier_id && (
                <Link to={`/suppliers/${po.supplier_id}`} className="text-xs text-foreground-500 hover:text-primary-600 transition-colors">
                  {supplierNames[po.supplier_id] || ''}
                </Link>
              )}
            </div>
          </div>
        </div>
        {availableTransitions.length > 0 && (
          <Button
            variant={currentStatus === 'draft' ? 'primary' : 'secondary'}
            size="md"
            onClick={() => setStatusModalOpen(true)}
            icon={<i className="ri-arrow-right-circle-line" />}
          >
            تحديث الحالة
          </Button>
        )}
      </div>

      {/* Info & Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: Items Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-background-200/70">
              <h3 className="text-sm font-semibold text-foreground-900">البنود ({poItems.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-background-200/70 bg-background-100/50">
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-foreground-500">#</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-foreground-500">الصنف</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-foreground-500">الكمية</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-foreground-500">سعر الوحدة</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-foreground-500">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {poItems.map((item, idx) => (
                    <tr key={item.id} className="border-b border-background-200/70 last:border-0">
                      <td className="px-4 py-3 text-xs text-foreground-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground-900">{item.item_name}</p>
                        {item.inventory_item_id && (
                          <Link to={`/inventory/${item.inventory_item_id}`} className="text-xs text-primary-600 hover:text-primary-700">
                            عرض في المخزون
                          </Link>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-medium text-foreground-900">{item.quantity}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground-700 whitespace-nowrap">
                          {item.unit_price.toLocaleString('ar-EG')} ج.م
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-foreground-900 whitespace-nowrap">
                          {(item.subtotal || item.quantity * item.unit_price).toLocaleString('ar-EG')} ج.م
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Total row */}
            <div className="px-4 py-3 border-t border-background-200/70 bg-background-100/50 flex justify-end">
              <div className="text-right">
                <span className="text-xs text-foreground-500 ml-2">الإجمالي:</span>
                <span className="text-lg font-bold text-foreground-900 font-heading">{orderSubtotal.toLocaleString('ar-EG')} ج.م</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {po.notes && (
            <div className="bg-background-50 border border-background-200/70 rounded-lg p-4">
              <p className="text-xs text-foreground-500 mb-1">ملاحظات</p>
              <p className="text-sm text-foreground-700">{po.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar: Timeline & Supplier */}
        <div className="space-y-4">
          {/* Timeline */}
          <div className="bg-background-50 border border-background-200/70 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground-900">الجدول الزمني</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-foreground-300 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-foreground-500">تاريخ الإنشاء</p>
                  <p className="text-sm text-foreground-900">{new Date(po.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
              {po.ordered_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-foreground-500">تاريخ الطلب</p>
                    <p className="text-sm text-foreground-900">{new Date(po.ordered_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
              )}
              {po.expected_delivery && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-foreground-500">التسليم المتوقع</p>
                    <p className="text-sm text-foreground-900">{new Date(po.expected_delivery).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
              )}
              {po.received_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-foreground-500">تاريخ الاستلام</p>
                    <p className="text-sm text-foreground-900">{new Date(po.received_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Supplier Card */}
          {po.supplier_id && (
            <div className="bg-background-50 border border-background-200/70 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground-900">المورد</h3>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary-700">
                    {(supplierNames[po.supplier_id] || 'م')[0]}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground-900">{supplierNames[po.supplier_id]}</p>
                  <Link
                    to={`/suppliers/${po.supplier_id}`}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    عرض الملف الكامل
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Modal */}
      <Modal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="تحديث حالة أمر الشراء"
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-sm text-foreground-600">
            الحالة الحالية: <Badge variant={poStatusColors[currentStatus] as 'primary' | 'accent' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral'}>{poStatusLabels[currentStatus]}</Badge>
          </p>
          <p className="text-xs text-foreground-500">اختر الحالة الجديدة:</p>
          <div className="space-y-2">
            {availableTransitions.map((nextStatus) => (
              <button
                key={nextStatus}
                onClick={() => {
                  setStatusModalOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-md border border-background-200/70 hover:bg-background-100 transition-colors cursor-pointer text-right"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${statusBgColors[nextStatus]}`}>
                  <i className={`${statusIcons[nextStatus]} text-sm text-foreground-700`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground-900">{poStatusLabels[nextStatus]}</p>
                  <p className="text-xs text-foreground-500">
                    {nextStatus === 'ordered' && 'إرسال الطلب للمورد'}
                    {nextStatus === 'received' && 'تأكيد استلام البضاعة'}
                    {nextStatus === 'cancelled' && 'إلغاء أمر الشراء'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}