import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import StatCard from '@/components/base/StatCard';
import {
  mockAttendance,
  mockEmployees,
  employeeNames,
  attendanceStatusLabels,
} from '@/mocks/employees';

const attendanceColors: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  present: 'success',
  absent: 'danger',
  late: 'warning',
  half_day: 'warning',
};

export default function AttendancePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState('');

  const filtered = useMemo(() => {
    let list = mockAttendance;
    if (filterDate) {
      list = list.filter((a) => a.attendance_date === filterDate);
    }
    if (filterStatus !== 'all') {
      list = list.filter((a) => a.status === filterStatus);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => {
        const name = (employeeNames[a.employee_id] || '').toLowerCase();
        return name.includes(q);
      });
    }
    return list.sort((a, b) => b.attendance_date.localeCompare(a.attendance_date));
  }, [search, filterStatus, filterDate]);

  const today = new Date().toISOString().split('T')[0];
  const todayRecords = mockAttendance.filter((a) => a.attendance_date === today);

  const todayStats = {
    present: todayRecords.filter((a) => a.status === 'present').length,
    late: todayRecords.filter((a) => a.status === 'late').length,
    absent: todayRecords.filter((a) => a.status === 'absent').length,
    halfDay: todayRecords.filter((a) => a.status === 'half_day').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground-900 font-heading">الحضور والانصراف</h1>
          <p className="text-sm text-foreground-500 mt-1">سجل حضور الموظفين اليومي</p>
        </div>
        <Button variant="ghost" size="sm" icon={<i className="ri-arrow-right-line" />} onClick={() => navigate('/hr')}>
          العودة للموظفين
        </Button>
      </div>

      {/* Today Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="حاضر اليوم" value={todayStats.present} icon="ri-checkbox-circle-line" variant="primary" />
        <StatCard title="متأخر" value={todayStats.late} icon="ri-alert-line" variant="accent" />
        <StatCard title="نصف يوم" value={todayStats.halfDay} icon="ri-time-line" variant="secondary" />
        <StatCard title="غائب" value={todayStats.absent} icon="ri-close-circle-line" variant="primary" />
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
        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          wrapperClassName="w-40"
        />
        <div className="flex items-center gap-1.5 bg-background-50 border border-background-200/70 rounded-lg px-1 py-1">
          {(['all', 'present', 'late', 'absent', 'half_day'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filterStatus === s
                  ? 'bg-primary-500 text-background-50 dark:text-foreground-950'
                  : 'text-foreground-600 hover:text-foreground-900 hover:bg-background-200'
              }`}
            >
              {s === 'all' ? 'الكل' : attendanceStatusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-background-200/70 bg-background-100">
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">التاريخ</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الموظف</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الحضور</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الانصراف</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الحالة</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((a) => (
                <tr key={a.id} className="border-b border-background-200/70 hover:bg-background-100/70 transition-colors">
                  <td className="px-4 py-3 text-foreground-700 font-medium whitespace-nowrap">{a.attendance_date}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/hr/${a.employee_id}`)}
                      className="text-foreground-900 hover:text-primary-600 transition-colors cursor-pointer font-medium"
                    >
                      {employeeNames[a.employee_id] || a.employee_id}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-foreground-700">{a.check_in || '—'}</td>
                  <td className="px-4 py-3 text-foreground-700">{a.check_out || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={attendanceColors[a.status] || 'neutral'}>
                      {attendanceStatusLabels[a.status] || a.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-foreground-500 text-xs max-w-[180px] truncate">{a.notes || '—'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-foreground-400">
                    <i className="ri-calendar-check-line text-3xl block mb-2" />
                    لا توجد سجلات حضور مطابقة
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