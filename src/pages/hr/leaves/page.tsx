import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Modal from '@/components/base/Modal';
import StatCard from '@/components/base/StatCard';
import {
  mockLeaves,
  employeeNames,
  leaveTypeLabels,
  leaveStatusLabels,
} from '@/mocks/employees';

const leaveColors: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
  cancelled: 'neutral',
};

const leaveTypeIcons: Record<string, string> = {
  annual: 'ri-suitcase-line',
  sick: 'ri-heart-pulse-line',
  unpaid: 'ri-money-dollar-circle-line',
  emergency: 'ri-alert-line',
  maternity: 'ri-user-heart-line',
};

export default function LeavesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<(typeof mockLeaves)[0] | null>(null);

  const filtered = useMemo(() => {
    let list = mockLeaves;
    if (filterType !== 'all') {
      list = list.filter((l) => l.leave_type === filterType);
    }
    if (filterStatus !== 'all') {
      list = list.filter((l) => l.status === filterStatus);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((l) => {
        const name = (employeeNames[l.employee_id] || '').toLowerCase();
        return name.includes(q) || leaveTypeLabels[l.leave_type]?.includes(q);
      });
    }
    return list.sort((a, b) => b.start_date.localeCompare(a.start_date));
  }, [search, filterType, filterStatus]);

  const stats = {
    pending: mockLeaves.filter((l) => l.status === 'pending').length,
    approved: mockLeaves.filter((l) => l.status === 'approved').length,
    total: mockLeaves.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground-900 font-heading">إدارة الإجازات</h1>
          <p className="text-sm text-foreground-500 mt-1">طلبات الإجازات والموافقات</p>
        </div>
        <Button variant="ghost" size="sm" icon={<i className="ri-arrow-right-line" />} onClick={() => navigate('/hr')}>
          العودة للموظفين
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard title="إجمالي الطلبات" value={stats.total} icon="ri-calendar-event-line" variant="primary" />
        <StatCard title="طلبات قيد الانتظار" value={stats.pending} icon="ri-time-line" variant="accent" />
        <StatCard title="طلبات معتمدة" value={stats.approved} icon="ri-check-double-line" variant="secondary" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Input
            placeholder="بحث باسم الموظف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<i className="ri-search-line text-sm" />}
          />
        </div>
        <div className="flex items-center gap-1.5 bg-background-50 border border-background-200/70 rounded-lg px-1 py-1">
          {(['all', 'annual', 'sick', 'unpaid', 'emergency'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filterType === t
                  ? 'bg-primary-500 text-background-50 dark:text-foreground-950'
                  : 'text-foreground-600 hover:text-foreground-900 hover:bg-background-200'
              }`}
            >
              {t === 'all' ? 'كل الأنواع' : leaveTypeLabels[t]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 bg-background-50 border border-background-200/70 rounded-lg px-1 py-1">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filterStatus === s
                  ? 'bg-primary-500 text-background-50 dark:text-foreground-950'
                  : 'text-foreground-600 hover:text-foreground-900 hover:bg-background-200'
              }`}
            >
              {s === 'all' ? 'كل الحالات' : leaveStatusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Leaves Table */}
      <div className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-background-200/70 bg-background-100">
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الموظف</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">النوع</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">من</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">إلى</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الأيام</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الحالة</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b border-background-200/70 hover:bg-background-100/70 transition-colors">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/hr/${l.employee_id}`)}
                      className="text-foreground-900 hover:text-primary-600 transition-colors cursor-pointer font-medium"
                    >
                      {employeeNames[l.employee_id] || l.employee_id}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-foreground-700">
                      <span className="w-4 h-4 flex items-center justify-center">
                        <i className={leaveTypeIcons[l.leave_type] || 'ri-calendar-line'} />
                      </span>
                      {leaveTypeLabels[l.leave_type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground-700">{l.start_date}</td>
                  <td className="px-4 py-3 text-foreground-700">{l.end_date}</td>
                  <td className="px-4 py-3 text-foreground-700 font-medium">{l.total_days}</td>
                  <td className="px-4 py-3">
                    <Badge variant={leaveColors[l.status] || 'neutral'}>
                      {leaveStatusLabels[l.status] || l.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setSelectedLeave(l); setDetailModalOpen(true); }}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-foreground-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                    >
                      <i className="ri-eye-line" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-foreground-400">
                    <i className="ri-calendar-event-line text-3xl block mb-2" />
                    لا توجد طلبات إجازة مطابقة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal open={detailModalOpen} onClose={() => setDetailModalOpen(false)} title="تفاصيل طلب الإجازة" size="md">
        {selectedLeave && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-accent-100 text-accent-600 flex items-center justify-center flex-shrink-0">
                <i className={`${leaveTypeIcons[selectedLeave.leave_type] || 'ri-calendar-line'} text-xl`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground-900">{employeeNames[selectedLeave.employee_id]}</p>
                <p className="text-xs text-foreground-500">{leaveTypeLabels[selectedLeave.leave_type]}</p>
              </div>
              <Badge variant={leaveColors[selectedLeave.status] || 'neutral'} className="mr-auto">
                {leaveStatusLabels[selectedLeave.status]}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-background-100 rounded-md p-3">
              <div>
                <p className="text-xs text-foreground-500">من تاريخ</p>
                <p className="text-sm font-medium text-foreground-900">{selectedLeave.start_date}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-500">إلى تاريخ</p>
                <p className="text-sm font-medium text-foreground-900">{selectedLeave.end_date}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-500">عدد الأيام</p>
                <p className="text-sm font-medium text-foreground-900">{selectedLeave.total_days} يوم</p>
              </div>
              <div>
                <p className="text-xs text-foreground-500">تاريخ التقديم</p>
                <p className="text-sm font-medium text-foreground-900">{selectedLeave.created_at.split('T')[0]}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-foreground-500 mb-1">سبب الطلب</p>
              <p className="text-sm text-foreground-900 bg-background-100 rounded-md p-3">
                {selectedLeave.reason || 'غير محدد'}
              </p>
            </div>

            {selectedLeave.notes && (
              <div>
                <p className="text-xs text-foreground-500 mb-1">ملاحظات إدارية</p>
                <p className="text-sm text-foreground-700 bg-background-100 rounded-md p-3">{selectedLeave.notes}</p>
              </div>
            )}

            {selectedLeave.status === 'pending' && (
              <div className="flex items-center gap-2 justify-end pt-2 border-t border-background-200/70">
                <Button variant="danger" size="sm" onClick={() => setDetailModalOpen(false)}>
                  رفض
                </Button>
                <Button variant="primary" size="sm" onClick={() => setDetailModalOpen(false)}>
                  موافقة
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}