import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import Modal from '@/components/base/Modal';
import { supabase } from '@/lib/supabase';

const payrollStatusLabels: Record<string, string> = {
  pending: 'قيد المراجعة',
  approved: 'معتمدة',
  paid: 'مدفوعة',
};

const payrollColors: Record<string, 'success' | 'warning' | 'primary' | 'neutral'> = {
  pending: 'warning',
  approved: 'primary',
  paid: 'success',
};

const attStatusLabels: Record<string, string> = {
  present: 'حاضر',
  absent: 'غائب',
  late: 'متأخر',
  half_day: 'نصف يوم',
};

interface PayrollDetail {
  id: string;
  employee_id: string;
  employee_name: string;
  position: string;
  branch_id: string;
  employee_status: string;
  month: number;
  year: number;
  base_salary: number;
  total_deductions: number;
  total_bonuses: number;
  net_salary: number;
  status: string;
  notes: string | null;
  created_at: string;
  bonuses: PayrollItem[];
  deductions: PayrollItem[];
  attendance_summary: { present: number; absent: number; late: number; half_day: number };
  month_leaves: MonthLeave[];
}

interface PayrollItem {
  id: string;
  payroll_id: string;
  item_type: string;
  amount: number;
  reason: string;
  created_at: string;
}

interface MonthLeave {
  leave_type: string;
  total_days: number;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
}

const leaveTypeLabels: Record<string, string> = {
  annual: 'سنوية',
  sick: 'مرضية',
  unpaid: 'بدون راتب',
  emergency: 'طارئة',
  maternity: 'وضع',
};

const monthNames = ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export default function PayrollDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [payroll, setPayroll] = useState<PayrollDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add item modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [itemType, setItemType] = useState<'deduction' | 'bonus'>('bonus');
  const [itemAmount, setItemAmount] = useState('');
  const [itemReason, setItemReason] = useState('');
  const [adding, setAdding] = useState(false);

  // Remove confirmation
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: invokeErr } = await supabase.functions.invoke('get-payroll-detail', {
        body: { payroll_id: id },
      });

      if (invokeErr) throw new Error(invokeErr.message);
      if (result.error) throw new Error(result.error);

      setPayroll(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleAddItem = async () => {
    if (!id || !itemAmount || !itemReason) return;
    const amount = Number(itemAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('الرجاء إدخال مبلغ صحيح');
      return;
    }

    setAdding(true);
    try {
      const { data: result, error: invokeErr } = await supabase.functions.invoke('add-payroll-item', {
        body: { payroll_id: id, item_type: itemType, amount, reason: itemReason },
      });

      if (invokeErr) throw new Error(invokeErr.message);
      if (result.error) throw new Error(result.error);

      setShowAddModal(false);
      setItemAmount('');
      setItemReason('');
      fetchDetail();
    } catch (err: any) {
      alert('فشل إضافة البند: ' + err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveItem = async () => {
    if (!removingId) return;
    setRemoving(true);
    try {
      const { data: result, error: invokeErr } = await supabase.functions.invoke('remove-payroll-item', {
        body: { item_id: removingId },
      });

      if (invokeErr) throw new Error(invokeErr.message);
      if (result.error) throw new Error(result.error);

      setRemovingId(null);
      fetchDetail();
    } catch (err: any) {
      alert('فشل حذف البند: ' + err.message);
    } finally {
      setRemoving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;
    try {
      const { data: result, error: invokeErr } = await supabase.functions.invoke('update-payroll-status', {
        body: { payroll_id: id, status: newStatus },
      });

      if (invokeErr) throw new Error(invokeErr.message);
      if (result.error) throw new Error(result.error);

      fetchDetail();
    } catch (err: any) {
      alert('فشل تغيير الحالة: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-foreground-400">جاري تحميل تفاصيل الراتب...</span>
        </div>
      </div>
    );
  }

  if (error || !payroll) {
    return (
      <div className="flex flex-col items-center py-20 gap-3">
        <i className="ri-error-warning-line text-3xl text-red-400" />
        <span className="text-sm text-foreground-500">{error || 'لم يتم العثور على كشف الراتب'}</span>
        <Button variant="ghost" size="sm" onClick={() => navigate('/hr/payroll')}>العودة لكشوف الرواتب</Button>
      </div>
    );
  }

  const isEditable = payroll.status === 'pending';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/hr/payroll')} className="text-foreground-400 hover:text-foreground-600 transition-colors cursor-pointer">
              <i className="ri-arrow-right-line" />
            </button>
            <h1 className="text-xl font-bold text-foreground-900 font-heading">
              كشف راتب {monthNames[payroll.month]} {payroll.year}
            </h1>
          </div>
          <p className="text-sm text-foreground-500 mt-1">{payroll.employee_name} — {payroll.position}</p>
        </div>
        <div className="flex items-center gap-2">
          {payroll.status === 'pending' && (
            <Button variant="primary" size="sm" icon={<i className="ri-check-line" />} onClick={() => handleStatusChange('approved')}>
              اعتماد
            </Button>
          )}
          {payroll.status === 'approved' && (
            <Button variant="primary" size="sm" icon={<i className="ri-bank-card-line" />} onClick={() => handleStatusChange('paid')}>
              تأكيد الصرف
            </Button>
          )}
          <Badge variant={payrollColors[payroll.status] || 'neutral'}>
            {payrollStatusLabels[payroll.status] || payroll.status}
          </Badge>
        </div>
      </div>

      {/* Salary Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-4 text-center">
          <p className="text-xs text-foreground-500 mb-1">الأساسي</p>
          <p className="text-lg font-bold text-foreground-900">{payroll.base_salary.toLocaleString()} ج.م</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200/70 rounded-lg p-4 text-center">
          <p className="text-xs text-emerald-600 mb-1">المكافآت والبدلات</p>
          <p className="text-lg font-bold text-emerald-700">+{payroll.total_bonuses.toLocaleString()} ج.م</p>
        </div>
        <div className="bg-red-50 border border-red-200/70 rounded-lg p-4 text-center">
          <p className="text-xs text-red-500 mb-1">الخصومات</p>
          <p className="text-lg font-bold text-red-600">-{payroll.total_deductions.toLocaleString()} ج.م</p>
        </div>
        <div className="bg-primary-50 border border-primary-200/70 rounded-lg p-4 text-center">
          <p className="text-xs text-primary-600 mb-1">الصافي المستحق</p>
          <p className="text-lg font-bold text-primary-700">{payroll.net_salary.toLocaleString()} ج.م</p>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-foreground-900 mb-3">ملخص الحضور — {monthNames[payroll.month]} {payroll.year}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-3 bg-emerald-50 rounded-lg px-3 py-2">
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-emerald-100">
              <i className="ri-check-line text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-emerald-600">حضور</p>
              <p className="text-sm font-bold text-emerald-700">{payroll.attendance_summary.present} يوم</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-red-50 rounded-lg px-3 py-2">
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-red-100">
              <i className="ri-close-line text-red-600" />
            </div>
            <div>
              <p className="text-xs text-red-600">غياب</p>
              <p className="text-sm font-bold text-red-700">{payroll.attendance_summary.absent} يوم</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-amber-50 rounded-lg px-3 py-2">
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-amber-100">
              <i className="ri-time-line text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-amber-600">تأخير</p>
              <p className="text-sm font-bold text-amber-700">{payroll.attendance_summary.late} مرة</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-secondary-50 rounded-lg px-3 py-2">
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary-100">
              <i className="ri-hourglass-2-line text-secondary-600" />
            </div>
            <div>
              <p className="text-xs text-secondary-600">نصف يوم</p>
              <p className="text-sm font-bold text-secondary-700">{payroll.attendance_summary.half_day} يوم</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bonuses Section */}
      <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground-900">
            <i className="ri-add-circle-line text-emerald-500 ml-1" />
            البدلات والمكافآت
          </h2>
          {isEditable && (
            <button
              onClick={() => { setItemType('bonus'); setShowAddModal(true); }}
              className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 font-medium cursor-pointer transition-colors"
            >
              <i className="ri-add-line" /> إضافة بدل
            </button>
          )}
        </div>
        {payroll.bonuses.length === 0 ? (
          <p className="text-sm text-foreground-400 text-center py-4">لا توجد بدلات أو مكافآت</p>
        ) : (
          <div className="space-y-2">
            {payroll.bonuses.map((b) => (
              <div key={b.id} className="flex items-center justify-between bg-emerald-50/50 border border-emerald-200/30 rounded-md px-3 py-2">
                <div>
                  <p className="text-sm text-foreground-800">{b.reason}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">+{b.amount.toLocaleString()} ج.م</span>
                  {isEditable && (
                    <button
                      onClick={() => setRemovingId(b.id)}
                      className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <i className="ri-delete-bin-line text-xs" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deductions Section */}
      <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground-900">
            <i className="ri-subtract-line text-red-500 ml-1" />
            الخصومات
          </h2>
          {isEditable && (
            <button
              onClick={() => { setItemType('deduction'); setShowAddModal(true); }}
              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium cursor-pointer transition-colors"
            >
              <i className="ri-add-line" /> إضافة خصم
            </button>
          )}
        </div>
        {payroll.deductions.length === 0 ? (
          <p className="text-sm text-foreground-400 text-center py-4">لا توجد خصومات</p>
        ) : (
          <div className="space-y-2">
            {payroll.deductions.map((d) => (
              <div key={d.id} className="flex items-center justify-between bg-red-50/50 border border-red-200/30 rounded-md px-3 py-2">
                <div>
                  <p className="text-sm text-foreground-800">{d.reason}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-red-600 whitespace-nowrap">-{d.amount.toLocaleString()} ج.م</span>
                  {isEditable && (
                    <button
                      onClick={() => setRemovingId(d.id)}
                      className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <i className="ri-delete-bin-line text-xs" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Month Leaves */}
      {payroll.month_leaves.length > 0 && (
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-foreground-900 mb-3">
            <i className="ri-calendar-check-line text-secondary-500 ml-1" />
            الإجازات خلال الشهر
          </h2>
          <div className="space-y-2">
            {payroll.month_leaves.map((l, i) => (
              <div key={i} className="flex items-center justify-between bg-secondary-50/50 border border-secondary-200/30 rounded-md px-3 py-2">
                <div>
                  <p className="text-sm text-foreground-800">
                    {leaveTypeLabels[l.leave_type] || l.leave_type}: {l.reason}
                  </p>
                  <p className="text-xs text-foreground-400">{l.start_date} → {l.end_date}</p>
                </div>
                <span className="text-sm font-medium text-foreground-600 whitespace-nowrap">{l.total_days} يوم</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      <Modal
        open={showAddModal}
        onClose={() => { setShowAddModal(false); setItemAmount(''); setItemReason(''); }}
        title={itemType === 'bonus' ? 'إضافة بدل / مكافأة' : 'إضافة خصم'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-foreground-600 mb-1">النوع</label>
            <div className="flex items-center gap-1.5 bg-background-50 border border-background-200/70 rounded-lg px-1 py-1 w-fit">
              <button
                onClick={() => setItemType('bonus')}
                className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${itemType === 'bonus' ? 'bg-emerald-500 text-white' : 'text-foreground-600 hover:text-foreground-900'}`}
              >
                بدل / مكافأة
              </button>
              <button
                onClick={() => setItemType('deduction')}
                className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${itemType === 'deduction' ? 'bg-red-500 text-white' : 'text-foreground-600 hover:text-foreground-900'}`}
              >
                خصم
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-foreground-600 mb-1">المبلغ (ج.م)</label>
            <input
              type="number"
              value={itemAmount}
              onChange={(e) => setItemAmount(e.target.value)}
              placeholder="أدخل المبلغ"
              min="1"
              className="w-full px-3 py-2 text-sm bg-background-50 border border-background-200/70 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <div>
            <label className="block text-sm text-foreground-600 mb-1">السبب</label>
            <input
              type="text"
              value={itemReason}
              onChange={(e) => setItemReason(e.target.value)}
              placeholder="سبب الإضافة..."
              className="w-full px-3 py-2 text-sm bg-background-50 border border-background-200/70 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => { setShowAddModal(false); setItemAmount(''); setItemReason(''); }}>
              إلغاء
            </Button>
            <Button
              variant={itemType === 'bonus' ? 'primary' : 'secondary'}
              size="sm"
              onClick={handleAddItem}
              loading={adding}
              disabled={!itemAmount || !itemReason}
            >
              إضافة
            </Button>
          </div>
        </div>
      </Modal>

      {/* Remove Confirmation Modal */}
      <Modal
        open={removingId !== null}
        onClose={() => setRemovingId(null)}
        title="تأكيد الحذف"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground-600">هل أنت متأكد من حذف هذا البند؟ سيتم إعادة حساب الصافي تلقائياً.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setRemovingId(null)}>
              إلغاء
            </Button>
            <Button variant="secondary" size="sm" onClick={handleRemoveItem} loading={removing}>
              حذف
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}