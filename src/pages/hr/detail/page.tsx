import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import Modal from '@/components/base/Modal';
import Input from '@/components/base/Input';
import {
  mockEmployees,
  mockAttendance,
  mockPayrolls,
  mockPayrollItems,
  mockLeaves,
  employeeNames,
  statusLabels,
  attendanceStatusLabels,
  leaveTypeLabels,
  leaveStatusLabels,
  payrollStatusLabels,
} from '@/mocks/employees';
import type { PayrollStatus } from '@/types/supabase';

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  active: 'success',
  inactive: 'warning',
  terminated: 'danger',
};

const attendanceColors: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  present: 'success',
  absent: 'danger',
  late: 'warning',
  half_day: 'warning',
};

const payrollColors: Record<string, 'success' | 'warning' | 'primary' | 'neutral'> = {
  draft: 'neutral',
  pending: 'warning',
  approved: 'primary',
  paid: 'success',
};

const leaveColors: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
  cancelled: 'neutral',
};

const monthNames = ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

type TabId = 'info' | 'attendance' | 'payroll' | 'leaves';

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [payrollModalOpen, setPayrollModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(6);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusReason, setBonusReason] = useState('');
  const [deductionAmount, setDeductionAmount] = useState('');
  const [deductionReason, setDeductionReason] = useState('');

  const emp = mockEmployees.find((e) => e.id === id);
  if (!emp) {
    return (
      <div className="text-center py-16">
        <i className="ri-user-search-line text-4xl text-foreground-300 block mb-3" />
        <p className="text-foreground-500">الموظف غير موجود</p>
        <Button variant="ghost" size="sm" onClick={() => navigate('/hr')} className="mt-3">
          العودة لقائمة الموظفين
        </Button>
      </div>
    );
  }

  const empAttendance = mockAttendance.filter((a) => a.employee_id === emp.id).sort((a, b) => b.attendance_date.localeCompare(a.attendance_date));
  const empPayrolls = mockPayrolls.filter((p) => p.employee_id === emp.id).sort((a, b) => b.year - a.year || b.month - a.month);
  const empLeaves = mockLeaves.filter((l) => l.employee_id === emp.id).sort((a, b) => b.start_date.localeCompare(a.start_date));
  const empName = employeeNames[emp.id] || '—';

  const attendanceSummary = {
    present: empAttendance.filter((a) => a.status === 'present').length,
    absent: empAttendance.filter((a) => a.status === 'absent').length,
    late: empAttendance.filter((a) => a.status === 'late').length,
    halfDay: empAttendance.filter((a) => a.status === 'half_day').length,
  };

  const payrollItemsFor = (payrollId: string) => mockPayrollItems.filter((pi) => pi.payroll_id === payrollId);

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'info', label: 'البيانات', icon: 'ri-user-line' },
    { id: 'attendance', label: 'الحضور', icon: 'ri-calendar-check-line' },
    { id: 'payroll', label: 'الرواتب', icon: 'ri-money-dollar-circle-line' },
    { id: 'leaves', label: 'الإجازات', icon: 'ri-calendar-event-line' },
  ];

  const handleGeneratePayroll = () => {
    alert('سيتم إنشاء كشف الراتب — هذه الميزة تحتاج للربط مع Supabase');
    setPayrollModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/hr')}
            className="w-8 h-8 flex items-center justify-center rounded-md text-foreground-500 hover:bg-background-200 transition-colors cursor-pointer"
          >
            <i className="ri-arrow-right-line" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground-900 font-heading">{empName}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-foreground-500">{emp.position}</p>
              <Badge variant={statusColors[emp.status] || 'neutral'}>
                {statusLabels[emp.status] || emp.status}
              </Badge>
            </div>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<i className="ri-pencil-line" />}
          onClick={() => navigate(`/hr/${emp.id}/edit`)}
        >
          تعديل البيانات
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-background-50 border border-background-200/70 rounded-full px-1 py-1 w-fit overflow-x-auto max-w-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-primary-500 text-background-50 dark:text-foreground-950'
                : 'text-foreground-600 hover:text-foreground-900'
            }`}
          >
            <span className="w-4 h-4 flex items-center justify-center">
              <i className={tab.icon} />
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground-900 font-heading mb-4">البيانات الأساسية</h3>
            <div className="space-y-3">
              <InfoRow label="الاسم الكامل" value={empName} />
              <InfoRow label="المسمى الوظيفي" value={emp.position} />
              <InfoRow label="تاريخ التعيين" value={emp.hire_date} />
              <InfoRow label="الراتب الأساسي" value={`${emp.base_salary.toLocaleString()} ج.م`} />
              <InfoRow label="الحالة" value={statusLabels[emp.status]} />
            </div>
          </div>

          {/* Contact & Notes */}
          <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground-900 font-heading mb-4">معلومات إضافية</h3>
            <div className="space-y-3">
              <InfoRow label="جهة اتصال الطوارئ" value={emp.emergency_contact || '—'} />
              <InfoRow label="ملاحظات" value={emp.notes || '—'} />
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="bg-background-50 border border-background-200/70 rounded-lg p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-foreground-900 font-heading mb-4">ملخص الحضور (آخر 26 يوم عمل)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SummaryBox label="حاضر" value={attendanceSummary.present} color="emerald" />
              <SummaryBox label="متأخر" value={attendanceSummary.late} color="amber" />
              <SummaryBox label="نصف يوم" value={attendanceSummary.halfDay} color="orange" />
              <SummaryBox label="غائب" value={attendanceSummary.absent} color="red" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-background-200/70 bg-background-100">
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">التاريخ</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الحضور</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الانصراف</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الحالة</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {empAttendance.slice(0, 30).map((a) => (
                  <tr key={a.id} className="border-b border-background-200/70 hover:bg-background-100/70 transition-colors">
                    <td className="px-4 py-3 text-foreground-700 font-medium">{a.attendance_date}</td>
                    <td className="px-4 py-3 text-foreground-700">{a.check_in || '—'}</td>
                    <td className="px-4 py-3 text-foreground-700">{a.check_out || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={attendanceColors[a.status] || 'neutral'}>
                        {attendanceStatusLabels[a.status] || a.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-foreground-500 text-xs">{a.notes || '—'}</td>
                  </tr>
                ))}
                {empAttendance.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-foreground-400">لا توجد سجلات حضور</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'payroll' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setPayrollModalOpen(true)} icon={<i className="ri-add-line" />}>
              إنشاء كشف راتب
            </Button>
          </div>
          <div className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-background-200/70 bg-background-100">
                    <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الشهر</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الأساسي</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">المكافآت</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الخصومات</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الصافي</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {empPayrolls.map((p) => (
                    <tr key={p.id} className="border-b border-background-200/70 hover:bg-background-100/70 transition-colors">
                      <td className="px-4 py-3 text-foreground-700 font-medium">
                        {monthNames[p.month]} {p.year}
                      </td>
                      <td className="px-4 py-3 text-foreground-700">{p.base_salary.toLocaleString()} ج.م</td>
                      <td className="px-4 py-3 text-emerald-600 font-medium">+{p.total_bonuses.toLocaleString()} ج.م</td>
                      <td className="px-4 py-3 text-red-600 font-medium">-{p.total_deductions.toLocaleString()} ج.م</td>
                      <td className="px-4 py-3 text-foreground-900 font-bold">{p.net_salary.toLocaleString()} ج.م</td>
                      <td className="px-4 py-3">
                        <Badge variant={payrollColors[p.status] || 'neutral'}>
                          {payrollStatusLabels[p.status] || p.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {empPayrolls.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-foreground-400">لا توجد كشوف رواتب</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'leaves' && (
        <div className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-background-200/70 bg-background-100">
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">النوع</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">من</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">إلى</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الأيام</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">السبب</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {empLeaves.map((l) => (
                  <tr key={l.id} className="border-b border-background-200/70 hover:bg-background-100/70 transition-colors">
                    <td className="px-4 py-3 text-foreground-700">{leaveTypeLabels[l.leave_type]}</td>
                    <td className="px-4 py-3 text-foreground-700">{l.start_date}</td>
                    <td className="px-4 py-3 text-foreground-700">{l.end_date}</td>
                    <td className="px-4 py-3 text-foreground-700 font-medium">{l.total_days}</td>
                    <td className="px-4 py-3 text-foreground-500 text-xs max-w-[200px] truncate">{l.reason || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={leaveColors[l.status] || 'neutral'}>
                        {leaveStatusLabels[l.status] || l.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {empLeaves.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-foreground-400">لا توجد طلبات إجازة</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate Payroll Modal */}
      <Modal open={payrollModalOpen} onClose={() => setPayrollModalOpen(false)} title="إنشاء كشف راتب جديد">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground-800 block mb-1">الشهر</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-background-50 border border-foreground-200 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                {monthNames.slice(1).map((name, i) => (
                  <option key={i + 1} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground-800 block mb-1">السنة</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-background-50 border border-foreground-200 rounded-md text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                {[2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-background-100 rounded-md p-3">
            <p className="text-sm text-foreground-700">
              الراتب الأساسي: <strong>{emp.base_salary.toLocaleString()} ج.م</strong>
            </p>
          </div>

          <div className="border-t border-background-200/70 pt-3">
            <p className="text-sm font-medium text-foreground-800 mb-2">المكافآت</p>
            <div className="grid grid-cols-3 gap-2">
              <Input
                label="المبلغ"
                type="number"
                value={bonusAmount}
                onChange={(e) => setBonusAmount(e.target.value)}
                placeholder="0"
              />
              <div className="col-span-2">
                <Input
                  label="السبب"
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  placeholder="مكافأة أداء..."
                />
              </div>
            </div>
          </div>

          <div className="border-t border-background-200/70 pt-3">
            <p className="text-sm font-medium text-foreground-800 mb-2">الخصومات</p>
            <div className="grid grid-cols-3 gap-2">
              <Input
                label="المبلغ"
                type="number"
                value={deductionAmount}
                onChange={(e) => setDeductionAmount(e.target.value)}
                placeholder="0"
              />
              <div className="col-span-2">
                <Input
                  label="السبب"
                  value={deductionReason}
                  onChange={(e) => setDeductionReason(e.target.value)}
                  placeholder="خصم تأخير..."
                />
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-md p-3">
            <p className="text-sm text-emerald-800 dark:text-emerald-300">
              الصافي المتوقع:{' '}
              <strong>
                {(
                  emp.base_salary +
                  (Number(bonusAmount) || 0) -
                  (Number(deductionAmount) || 0)
                ).toLocaleString()}{' '}
                ج.م
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-2 justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={() => setPayrollModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="primary" size="sm" onClick={handleGeneratePayroll}>
              إنشاء الكشف
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
      <span className="text-xs text-foreground-500 w-40 flex-shrink-0">{label}</span>
      <span className="text-sm text-foreground-900 font-medium">{value}</span>
    </div>
  );
}

function SummaryBox({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
    orange: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
    red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
  };
  return (
    <div className={`rounded-md p-3 text-center border ${colorMap[color] || ''}`}>
      <p className="text-2xl font-bold font-heading">{value}</p>
      <p className="text-xs mt-0.5">{label}</p>
    </div>
  );
}