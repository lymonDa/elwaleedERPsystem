import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Button from '@/components/base/Button';
import Badge from '@/components/base/Badge';
import { supabase } from '@/lib/supabase';
import type { InventoryItem, InventoryTransaction } from '@/types/supabase';

interface InventoryDetail {
  item: InventoryItem & { inventory_categories?: { name: string } };
  transactions: InventoryTransaction[];
  summary: { stockValue: number; projectedValue: number; profitMargin: number };
}

export default function InventoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<InventoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  // Modal states
  const [activeModal, setActiveModal] = useState<'stockIn' | 'stockOut' | 'transfer' | 'adjust' | null>(null);
  const [modalQty, setModalQty] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [modalTargetBranch, setModalTargetBranch] = useState('');
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: result, error: fnError } = await supabase.functions.invoke('get-inventory-detail', {
        body: { id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);

      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل بيانات الصنف');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchBranches = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: branchesData } = await supabase
        .from('branches')
        .select('id, name')
        .order('name');
      if (branchesData) setBranches(branchesData);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchDetail();
    fetchBranches();
  }, [fetchDetail, fetchBranches]);

  const resetModal = () => {
    setActiveModal(null);
    setModalQty('');
    setModalNotes('');
    setModalTargetBranch('');
    setActionError('');
    setActionSuccess('');
  };

  const handleAction = async (action: 'stockIn' | 'stockOut' | 'transfer' | 'adjust') => {
    if (!id || !data) return;
    setActionLoading(action);
    setActionError('');
    setActionSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const qty = parseInt(modalQty);
      if (isNaN(qty) || qty <= 0) {
        setActionError('الرجاء إدخال كمية صحيحة');
        setActionLoading('');
        return;
      }

      if (action === 'transfer' && !modalTargetBranch) {
        setActionError('الرجاء اختيار الفرع المستهدف');
        setActionLoading('');
        return;
      }

      const functionSlug = action === 'stockIn' ? 'stock-in'
        : action === 'stockOut' ? 'stock-out'
        : action === 'transfer' ? 'transfer-stock'
        : 'adjust-stock';

      const body: Record<string, unknown> = {
        inventory_item_id: id,
        notes: modalNotes || undefined,
      };

      if (action === 'adjust') {
        body.new_quantity = qty;
      } else {
        body.quantity = qty;
      }

      if (action === 'transfer') {
        body.target_branch_id = modalTargetBranch;
      }

      const { data: result, error: fnError } = await supabase.functions.invoke(functionSlug, {
        body,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);

      setActionSuccess(result?.message || 'تمت العملية بنجاح');
      setTimeout(() => {
        resetModal();
        fetchDetail();
      }, 1200);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'فشلت العملية');
    } finally {
      setActionLoading('');
    }
  };

  const formatCurrency = (val: number | null) =>
    val != null ? `${val.toLocaleString('ar-EG')} ج.م` : '—';

  const formatDateTime = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('ar-EG', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const transactionTypeLabels: Record<string, string> = { in: 'إضافة', out: 'صرف', transfer: 'تحويل', adjustment: 'تسوية' };

  const transactionTypeColor = (type: string) => {
    switch (type) {
      case 'in': return 'success';
      case 'out': return 'danger';
      case 'transfer': return 'warning';
      case 'adjustment': return 'neutral';
      default: return 'neutral';
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-primary-300 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-sm text-foreground-400">جاري تحميل بيانات الصنف...</p>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <i className="ri-error-warning-line text-4xl text-red-500" />
        <p className="text-sm text-red-600">{error}</p>
        <div className="flex gap-2">
          <Button onClick={fetchDetail} variant="secondary" size="sm">إعادة المحاولة</Button>
          <Link to="/inventory"><Button variant="ghost" size="sm">العودة للمخزون</Button></Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <i className="ri-error-warning-line text-4xl text-foreground-300" />
        <p className="text-foreground-500">الصنف غير موجود</p>
        <Link to="/inventory"><Button variant="ghost">العودة للمخزون</Button></Link>
      </div>
    );
  }

  const { item, transactions, summary } = data;

  const stockStatus =
    item.quantity === 0
      ? { label: 'نافذ', color: 'danger' as const }
      : item.quantity <= item.min_quantity
        ? { label: 'منخفض', color: 'warning' as const }
        : { label: 'متوفر', color: 'success' as const };

  return (
    <div className="flex flex-col gap-5">
      {/* Back + Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/inventory')}
            className="w-9 h-9 flex items-center justify-center rounded-md text-foreground-500 hover:bg-background-200 transition-colors cursor-pointer"
          >
            <i className="ri-arrow-right-line" />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-foreground-900 font-heading">{item.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant={stockStatus.color}>{stockStatus.label}</Badge>
              {item.inventory_categories?.name && (
                <span className="text-xs text-foreground-500">{item.inventory_categories.name}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main: Info + Transactions */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Item info */}
          <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <i className="ri-information-line text-foreground-400" />
              <h3 className="text-sm font-semibold text-foreground-900">بيانات الصنف</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-foreground-400">الاسم: </span>
                <span className="text-foreground-900 font-medium">{item.name}</span>
              </div>
              <div>
                <span className="text-foreground-400">الوحدة: </span>
                <span className="text-foreground-700">{item.unit}</span>
              </div>
              <div>
                <span className="text-foreground-400">الرقم التسلسلي: </span>
                <span className="text-foreground-700">{item.serial_number || '—'}</span>
              </div>
              <div>
                <span className="text-foreground-400">التصنيف: </span>
                <span className="text-foreground-700">{item.inventory_categories?.name || '—'}</span>
              </div>
              <div>
                <span className="text-foreground-400">الكمية الحالية: </span>
                <span className={`font-semibold ${
                  item.quantity === 0 ? 'text-red-600' : item.quantity <= item.min_quantity ? 'text-amber-600' : 'text-green-600'
                }`}>{item.quantity}</span>
              </div>
              <div>
                <span className="text-foreground-400">الحد الأدنى: </span>
                <span className="text-foreground-700">{item.min_quantity}</span>
              </div>
              <div>
                <span className="text-foreground-400">سعر التكلفة: </span>
                <span className="text-foreground-900 font-medium">{formatCurrency(item.cost_price)}</span>
              </div>
              <div>
                <span className="text-foreground-400">سعر البيع: </span>
                <span className="text-foreground-900 font-medium">{formatCurrency(item.selling_price)}</span>
              </div>
            </div>
            {item.description && (
              <div className="mt-4 pt-3 border-t border-background-200/70">
                <span className="text-foreground-400 text-sm">الوصف: </span>
                <span className="text-foreground-600 text-sm">{item.description}</span>
              </div>
            )}
          </div>

          {/* Transaction history */}
          <div className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-background-200/70 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground-900">سجل الحركات</h3>
              <span className="text-xs text-foreground-400">{transactions.length} حركة</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-background-200/70 bg-background-100">
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-foreground-500 whitespace-nowrap">التاريخ</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-foreground-500 whitespace-nowrap">النوع</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-foreground-500 whitespace-nowrap">الكمية</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-foreground-500 whitespace-nowrap">السابق</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-foreground-500 whitespace-nowrap">الجديد</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-foreground-500 hidden md:table-cell">المرجع</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-foreground-500 hidden lg:table-cell">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-background-200/70">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-foreground-400">
                        <i className="ri-history-line text-2xl block mb-2" />
                        لا توجد حركات مسجلة
                      </td>
                    </tr>
                  ) : (
                    transactions.map((txn) => (
                      <tr key={txn.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-foreground-600 text-xs">{formatDateTime(txn.created_at)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={transactionTypeColor(txn.transaction_type)}>
                            {transactionTypeLabels[txn.transaction_type] || txn.transaction_type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`font-semibold text-sm ${
                            txn.transaction_type === 'in'
                              ? 'text-green-600'
                              : txn.transaction_type === 'transfer' && txn.quantity > 0
                                ? 'text-amber-600'
                                : txn.transaction_type === 'adjustment'
                                  ? txn.quantity >= 0 ? 'text-green-600' : 'text-red-600'
                                  : 'text-red-600'
                          }`}>
                            {txn.transaction_type === 'in' ? `+${txn.quantity}`
                              : txn.transaction_type === 'adjustment'
                                ? txn.quantity >= 0 ? `+${txn.quantity}` : `${txn.quantity}`
                                : `-${txn.quantity}`}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-foreground-600 text-xs">{txn.previous_quantity}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-foreground-900 text-xs font-medium">{txn.new_quantity}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-foreground-500 text-xs hidden md:table-cell">
                          {txn.reference_type ? (
                            txn.reference_type === 'purchase_order' ? 'أمر شراء'
                            : txn.reference_type === 'invoice' ? 'فاتورة'
                            : txn.reference_type === 'maintenance' ? 'صيانة'
                            : txn.reference_type === 'transfer' ? 'تحويل'
                            : txn.reference_type === 'manual' ? 'يدوي'
                            : txn.reference_type
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-foreground-500 text-xs max-w-[200px] truncate hidden lg:table-cell">{txn.notes || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5">
          {/* Stock indicator */}
          <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground-900 mb-4">حالة المخزون</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  item.quantity === 0 ? 'bg-red-100' : item.quantity <= item.min_quantity ? 'bg-amber-100' : 'bg-green-100'
                }`}>
                  <i className={`${
                    item.quantity === 0 ? 'ri-close-circle-line text-red-600'
                    : item.quantity <= item.min_quantity ? 'ri-alert-line text-amber-600'
                    : 'ri-check-line text-green-600'
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground-900">
                    {item.quantity === 0 ? 'نفذ المخزون' : item.quantity <= item.min_quantity ? 'مخزون منخفض' : 'مخزون كافي'}
                  </p>
                  <p className="text-xs text-foreground-500">{item.quantity} / الحد الأدنى {item.min_quantity}</p>
                </div>
              </div>
              {item.quantity <= item.min_quantity && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                  <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                    <i className="ri-alert-line mt-0.5 flex-shrink-0" />
                    <span>يجب إعادة الطلب قريباً لتجنب نفاد المخزون</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Value summary */}
          <div className="bg-background-100 rounded-lg p-5 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground-900">ملخص القيم</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground-500">قيمة المخزون (تكلفة):</span>
                <span className="text-foreground-900 font-medium">{formatCurrency(summary.stockValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-500">القيمة المتوقعة (بيع):</span>
                <span className="text-foreground-900 font-medium">{formatCurrency(summary.projectedValue)}</span>
              </div>
              {summary.profitMargin > 0 && (
                <div className="flex justify-between pt-2 border-t border-background-200/70">
                  <span className="text-foreground-500">هامش الربح:</span>
                  <span className="text-green-600 font-medium">+{summary.profitMargin}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-background-100 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground-900 mb-3">إجراءات سريعة</h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setActiveModal('stockIn')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-200 rounded-md transition-colors cursor-pointer"
              >
                <i className="ri-add-circle-line text-green-600" />تسجيل إضافة للمخزون
              </button>
              <button
                onClick={() => setActiveModal('stockOut')}
                disabled={item.quantity === 0}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-200 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              >
                <i className="ri-indeterminate-circle-line text-red-600" />تسجيل صرف من المخزون
              </button>
              <button
                onClick={() => setActiveModal('transfer')}
                disabled={item.quantity === 0}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-200 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              >
                <i className="ri-swap-line text-amber-600" />تحويل بين الفروع
              </button>
              <button
                onClick={() => setActiveModal('adjust')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-700 hover:bg-background-200 rounded-md transition-colors cursor-pointer"
              >
                <i className="ri-edit-circle-line text-blue-600" />تسوية جرد
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={resetModal} />
          <div className="relative bg-background-50 rounded-lg p-6 w-full max-w-md mx-4 z-[101]">
            <h3 className="text-lg font-bold text-foreground-900 mb-1">
              {activeModal === 'stockIn' ? 'إضافة للمخزون'
                : activeModal === 'stockOut' ? 'صرف من المخزون'
                : activeModal === 'transfer' ? 'تحويل بين الفروع'
                : 'تسوية جرد'}
            </h3>
            <p className="text-sm text-foreground-500 mb-4">{item.name}</p>

            {/* Success message */}
            {actionSuccess && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md flex items-center gap-2">
                <i className="ri-check-line text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-400">{actionSuccess}</span>
              </div>
            )}

            {/* Error message */}
            {actionError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-2">
                <i className="ri-error-warning-line text-red-600" />
                <span className="text-sm text-red-700 dark:text-red-400">{actionError}</span>
              </div>
            )}

            {!actionSuccess && (
              <>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground-800 mb-1.5">
                      {activeModal === 'adjust' ? 'الكمية الجديدة' : 'الكمية'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={modalQty}
                      onChange={(e) => setModalQty(e.target.value)}
                      placeholder={activeModal === 'adjust' ? `${item.quantity}` : 'أدخل الكمية'}
                      className="w-full px-3 py-2 text-sm bg-background-50 border border-background-300 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                    {activeModal === 'stockOut' && (
                      <p className="text-xs text-foreground-400 mt-1">المتاح: {item.quantity} {item.unit}</p>
                    )}
                  </div>

                  {activeModal === 'transfer' && (
                    <div>
                      <label className="block text-sm font-medium text-foreground-800 mb-1.5">
                        الفرع المستهدف
                      </label>
                      <select
                        value={modalTargetBranch}
                        onChange={(e) => setModalTargetBranch(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-background-50 border border-background-300 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400"
                      >
                        <option value="">اختر الفرع...</option>
                        {branches
                          .filter((b) => b.id !== item.branch_id)
                          .map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-foreground-800 mb-1.5">ملاحظات</label>
                    <textarea
                      value={modalNotes}
                      onChange={(e) => setModalNotes(e.target.value)}
                      rows={2}
                      maxLength={500}
                      placeholder="ملاحظات إضافية..."
                      className="w-full px-3 py-2 text-sm bg-background-50 border border-background-300 rounded-md text-foreground-900 placeholder:text-foreground-300 focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end mt-5">
                  <Button variant="ghost" onClick={resetModal} disabled={actionLoading !== ''}>إلغاء</Button>
                  <Button
                    disabled={actionLoading !== '' || !modalQty || parseInt(modalQty) <= 0 || (activeModal === 'transfer' && !modalTargetBranch)}
                    onClick={() => handleAction(activeModal)}
                    icon={actionLoading === activeModal ? undefined : undefined}
                  >
                    {actionLoading === activeModal ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary-300 border-t-background-50 rounded-full animate-spin" />
                        جاري التنفيذ...
                      </span>
                    ) : (
                      <>
                        {activeModal === 'stockIn' ? 'تأكيد الإضافة'
                          : activeModal === 'stockOut' ? 'تأكيد الصرف'
                          : activeModal === 'transfer' ? 'تأكيد التحويل'
                          : 'تأكيد التسوية'}
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}