import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Button from '@/components/base/Button';
import Badge from '@/components/base/Badge';
import Modal from '@/components/base/Modal';
import { supabase } from '@/lib/supabase';
import type { Invoice, InvoiceItem, InvoicePayment } from '@/types/supabase';

interface InvoiceDetail {
  invoice: Invoice & {
    clients?: { name: string; phone: string; email: string; address: string };
    branches?: { name: string };
    invoice_items?: (InvoiceItem & { inventory_items?: { name: string; unit: string } })[];
    invoice_payments?: InvoicePayment[];
    remaining_balance?: number;
    collection_rate?: number;
  };
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [issueLoading, setIssueLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchInvoice = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error: fnError } = await supabase.functions.invoke('get-invoice-detail', {
        body: { id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setDetail(data as InvoiceDetail);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل الفاتورة');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleAddPayment = async () => {
    if (!id || !paymentAmount || parseFloat(paymentAmount) <= 0) return;
    try {
      setPaymentLoading(true);
      setPaymentError('');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error: fnError } = await supabase.functions.invoke('add-payment', {
        body: {
          invoice_id: id,
          amount: parseFloat(paymentAmount),
          method: paymentMethod,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setDetail({ invoice: data.invoice } as InvoiceDetail);
      setShowPaymentModal(false);
      setPaymentAmount('');
    } catch (err: unknown) {
      setPaymentError(err instanceof Error ? err.message : 'فشل في تسجيل الدفعة');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleIssue = async () => {
    if (!id) return;
    try {
      setIssueLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error: fnError } = await supabase.functions.invoke('update-invoice', {
        body: { invoice_id: id, status: 'issued' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setDetail({ invoice: data.invoice } as InvoiceDetail);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل في إصدار الفاتورة');
    } finally {
      setIssueLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('هل أنت متأكد من إلغاء وحذف هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
      setDeleteLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error: fnError } = await supabase.functions.invoke('delete-invoice', {
        body: { invoice_id: id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      navigate('/billing');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل في حذف الفاتورة');
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatCurrency = (val: number | null) =>
    val != null ? `${val.toLocaleString('ar-EG')} ج.م` : '—';

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const statusLabels: Record<string, string> = {
    draft: 'مسودة',
    issued: 'مصدرة',
    partially_paid: 'مدفوعة جزئياً',
    paid: 'مدفوعة',
    cancelled: 'ملغية',
  };

  const statusColors: Record<string, 'neutral' | 'primary' | 'accent' | 'secondary' | 'warning' | 'danger' | 'success'> = {
    draft: 'neutral',
    issued: 'primary',
    partially_paid: 'accent',
    paid: 'secondary',
    cancelled: 'warning',
  };

  const paymentMethodLabels: Record<string, string> = {
    cash: 'نقدي',
    bank_transfer: 'تحويل بنكي',
    credit_card: 'بطاقة ائتمان',
    installment: 'أقساط',
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-primary-300 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-sm text-foreground-400">جاري تحميل الفاتورة...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <i className="ri-error-warning-line text-4xl text-red-500" />
        <p className="text-red-600">{error || 'الفاتورة غير موجودة'}</p>
        <Link to="/billing">
          <Button variant="ghost">العودة للفواتير</Button>
        </Link>
      </div>
    );
  }

  const invoice = detail.invoice;
  const items = invoice.invoice_items || [];
  const payments = invoice.invoice_payments || [];
  const clientName = invoice.clients?.name || null;
  const remaining = invoice.remaining_balance ?? 0;
  const collectionRate = invoice.collection_rate ?? 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Back + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/billing')}
            className="w-9 h-9 flex items-center justify-center rounded-md text-foreground-500 hover:bg-background-200 transition-colors cursor-pointer"
          >
            <i className="ri-arrow-right-line" />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-foreground-900 font-heading">
              {invoice.invoice_number}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant={statusColors[invoice.status]}>{statusLabels[invoice.status]}</Badge>
              {invoice.payment_method && (
                <span className="text-xs text-foreground-500">
                  {paymentMethodLabels[invoice.payment_method]}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <Button
              variant="accent"
              size="sm"
              icon={<i className="ri-money-dollar-circle-line" />}
              onClick={() => setShowPaymentModal(true)}
            >
              تسجيل دفعة
            </Button>
          )}
          {invoice.status === 'draft' && (
            <Button
              variant="primary"
              size="sm"
              icon={<i className="ri-send-plane-line" />}
              onClick={handleIssue}
              loading={issueLoading}
            >
              إصدار الفاتورة
            </Button>
          )}
          {invoice.status !== 'paid' && (
            <Button
              variant="ghost"
              size="sm"
              icon={<i className="ri-delete-bin-line" />}
              onClick={handleDelete}
              loading={deleteLoading}
            >
              حذف
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main: Items + Summary */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Client info */}
          <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <i className="ri-user-3-line text-foreground-400" />
              <h3 className="text-sm font-semibold text-foreground-900">بيانات العميل</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-foreground-400">الاسم: </span>
                <span className="text-foreground-900 font-medium">{clientName || '—'}</span>
              </div>
              <div>
                <span className="text-foreground-400">تاريخ الإصدار: </span>
                <span className="text-foreground-700">{formatDate(invoice.issued_at)}</span>
              </div>
              <div>
                <span className="text-foreground-400">تاريخ الاستحقاق: </span>
                <span className="text-foreground-700">{formatDate(invoice.due_date)}</span>
              </div>
              {invoice.branches?.name && (
                <div>
                  <span className="text-foreground-400">الفرع: </span>
                  <span className="text-foreground-700">{invoice.branches.name}</span>
                </div>
              )}
            </div>
            {invoice.notes && (
              <div className="mt-3 pt-3 border-t border-background-200/70">
                <span className="text-foreground-400 text-sm">ملاحظات: </span>
                <span className="text-foreground-600 text-sm">{invoice.notes}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-background-200/70">
              <h3 className="text-sm font-semibold text-foreground-900">بنود الفاتورة</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-background-200/70 bg-background-100">
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-foreground-500">#</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-foreground-500">البند</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-foreground-500 whitespace-nowrap">الكمية</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-foreground-500 whitespace-nowrap">سعر الوحدة</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-foreground-500 whitespace-nowrap">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-background-200/70">
                  {items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-foreground-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3 text-foreground-900">
                        {item.item_name}
                        {item.inventory_items?.name && (
                          <span className="text-foreground-400 text-xs block">{item.inventory_items.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-foreground-700 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-foreground-700 whitespace-nowrap">{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-3 text-foreground-900 font-medium whitespace-nowrap">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t border-background-200/70 px-5 py-3 flex flex-col items-end gap-1 text-sm">
              <div className="flex gap-6 flex-wrap justify-end">
                <span className="text-foreground-500">المجموع الفرعي:</span>
                <span className="text-foreground-900">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discount_amount ? (
                <div className="flex gap-6 flex-wrap justify-end">
                  <span className="text-foreground-500">الخصم:</span>
                  <span className="text-red-600">-{formatCurrency(invoice.discount_amount)}</span>
                </div>
              ) : null}
              <div className="flex gap-6 flex-wrap justify-end">
                <span className="text-foreground-500">الضريبة:</span>
                <span className="text-foreground-900">{formatCurrency(invoice.tax_amount)}</span>
              </div>
              <div className="flex gap-6 flex-wrap justify-end pt-2 border-t border-background-200/70 mt-1">
                <span className="font-semibold text-foreground-900">الإجمالي:</span>
                <span className="font-bold text-foreground-900 text-base">{formatCurrency(invoice.grand_total)}</span>
              </div>
              <div className="flex gap-6 flex-wrap justify-end">
                <span className="text-foreground-500">المدفوع:</span>
                <span className="text-green-600 font-medium">{formatCurrency(invoice.paid_amount)}</span>
              </div>
              <div className="flex gap-6 flex-wrap justify-end">
                <span className="text-foreground-500">المتبقي:</span>
                <span className={`font-medium ${remaining > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {formatCurrency(remaining)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Payments */}
        <div className="flex flex-col gap-5">
          <div className="bg-background-50 border border-background-200/70 rounded-lg">
            <div className="px-5 py-3 border-b border-background-200/70">
              <h3 className="text-sm font-semibold text-foreground-900">سجل المدفوعات</h3>
            </div>
            <div className="p-5">
              {payments.length === 0 ? (
                <p className="text-sm text-foreground-400 text-center py-4">لا توجد مدفوعات مسجلة</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {payments.map((p) => (
                    <div key={p.id} className="border border-background-200/70 rounded-md p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground-900">{formatCurrency(p.amount)}</span>
                        <Badge variant="neutral">{paymentMethodLabels[p.method]}</Badge>
                      </div>
                      <p className="text-xs text-foreground-500">{formatDate(p.paid_at)}</p>
                      {p.reference && (
                        <p className="text-xs text-foreground-400 mt-1">مرجع: {p.reference}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick summary */}
          <div className="bg-background-100 rounded-lg p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center">
                <i className="ri-information-line text-accent-600" />
              </div>
              <div>
                <p className="text-xs text-foreground-500">حالة الدفع</p>
                <p className="text-sm font-semibold text-foreground-900">
                  {invoice.status === 'paid' ? 'مكتمل الدفع' : invoice.status === 'partially_paid' ? 'دفع جزئي' : invoice.status === 'cancelled' ? 'ملغية' : 'في انتظار الدفع'}
                </p>
              </div>
            </div>
            {remaining > 0 && invoice.status !== 'cancelled' && (
              <div>
                <div className="flex justify-between text-xs text-foreground-500 mb-1">
                  <span>نسبة التحصيل</span>
                  <span>{collectionRate}%</span>
                </div>
                <div className="w-full h-2 bg-background-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-500 rounded-full transition-all"
                    style={{ width: `${collectionRate}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal open={showPaymentModal} onClose={() => { setShowPaymentModal(false); setPaymentError(''); }} title="تسجيل دفعة جديدة">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-foreground-500 mb-1">المبلغ المتبقي: {formatCurrency(remaining)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground-800 mb-1">المبلغ</label>
            <div className="relative">
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="المبلغ المدفوع"
                className="w-full px-3 py-2 text-sm bg-background-50 border border-foreground-200 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-foreground-400">ج.م</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground-800 mb-1">طريقة الدفع</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background-50 border border-foreground-200 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="cash">نقدي</option>
              <option value="bank_transfer">تحويل بنكي</option>
              <option value="credit_card">بطاقة ائتمان</option>
              <option value="installment">أقساط</option>
            </select>
          </div>
          {paymentError && (
            <p className="text-sm text-red-600">{paymentError}</p>
          )}
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="ghost" onClick={() => { setShowPaymentModal(false); setPaymentError(''); }}>إلغاء</Button>
            <Button onClick={handleAddPayment} loading={paymentLoading}>تسجيل الدفعة</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}