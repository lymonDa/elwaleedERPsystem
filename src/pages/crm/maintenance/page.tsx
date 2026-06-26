import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Badge from '@/components/base/Badge';
import StatCard from '@/components/base/StatCard';
import { mockMaintenanceRequests, maintenanceStatusLabels } from '@/mocks/maintenance';
import { mockClientNames } from '@/mocks/clients';
import { employeeNames } from '@/mocks/employees';
import type { MaintenanceStatus } from '@/types/supabase';

export default function MaintenanceListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | 'all'>('all');

  const filtered = useMemo(() => {
    let result = [...mockMaintenanceRequests];
    if (statusFilter !== 'all') {
      result = result.filter((mr) => mr.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((mr) => {
        const clientName = (mr.client_id && mockClientNames[mr.client_id] || '').toLowerCase();
        return (
          mr.description.toLowerCase().includes(q) ||
          clientName.includes(q)
        );
      });
    }
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return result;
  }, [search, statusFilter]);

  const stats = useMemo(() => {
    const total = mockMaintenanceRequests.length;
    const pending = mockMaintenanceRequests.filter((m) => m.status === 'pending').length;
    const inProgress = mockMaintenanceRequests.filter((m) => m.status === 'in_progress').length;
    const completed = mockMaintenanceRequests.filter((m) => m.status === 'completed').length;
    return { total, pending, inProgress, completed };
  }, []);

  const statusOptions: { value: MaintenanceStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'الكل' },
    { value: 'pending', label: 'قيد الانتظار' },
    { value: 'scheduled', label: 'مجدولة' },
    { value: 'in_progress', label: 'قيد التنفيذ' },
    { value: 'completed', label: 'مكتملة' },
    { value: 'cancelled', label: 'ملغاة' },
  ];

  const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'primary' | 'accent'> = {
    pending: 'warning',
    scheduled: 'primary',
    in_progress: 'accent',
    completed: 'success',
    cancelled: 'neutral',
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/crm')}
            className="w-8 h-8 flex items-center justify-center rounded-md text-foreground-500 hover:text-foreground-800 hover:bg-background-200 transition-colors cursor-pointer"
          >
            <i className="ri-arrow-right-line text-lg" />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-foreground-900 font-heading">طلبات الصيانة</h1>
            <p className="text-sm text-foreground-500 mt-0.5">متابعة وإدارة طلبات الصيانة والتركيب</p>
          </div>
        </div>
        <Link to="/crm/maintenance/new">
          <Button icon={<i className="ri-add-line" />}>
            طلب صيانة جديد
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="إجمالي الطلبات" value={`${stats.total} طلب`} icon="ri-tools-line" variant="primary" />
        <StatCard title="قيد الانتظار" value={`${stats.pending} طلب`} icon="ri-hourglass-line" variant="warning" />
        <StatCard title="قيد التنفيذ" value={`${stats.inProgress} طلب`} icon="ri-loader-4-line" variant="accent" />
        <StatCard title="مكتملة" value={`${stats.completed} طلب`} icon="ri-check-double-line" variant="secondary" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="بحث في الوصف أو اسم العميل..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<i className="ri-search-line" />}
          wrapperClassName="flex-1"
        />
        <div className="flex gap-1.5 flex-wrap">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`whitespace-nowrap px-3 py-1.5 text-xs rounded-full transition-colors cursor-pointer ${
                statusFilter === opt.value
                  ? 'bg-primary-500 text-background-50 dark:text-foreground-950'
                  : 'bg-background-100 text-foreground-600 hover:bg-background-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-background-200/70 bg-background-100">
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">الوصف</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">العميل</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">المهندس</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">التاريخ المحدد</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">تاريخ الطلب</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-background-200/70">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-foreground-400">
                    <i className="ri-tools-line text-3xl block mb-2" />
                    لا توجد طلبات صيانة مطابقة
                  </td>
                </tr>
              ) : (
                filtered.map((mr) => (
                  <tr
                    key={mr.id}
                    onClick={() => navigate(`/crm/maintenance/${mr.id}`)}
                    className="hover:bg-background-100 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-foreground-900 text-sm truncate">{mr.description}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {mr.client_id ? (
                        <Link
                          to={`/crm/${mr.client_id}`}
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          className="text-primary-600 hover:text-primary-700 text-xs font-medium"
                        >
                          {mockClientNames[mr.client_id] || '—'}
                        </Link>
                      ) : (
                        <span className="text-foreground-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-foreground-600">
                      {mr.assigned_to ? employeeNames[mr.assigned_to] || '—' : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-foreground-600">
                      {formatDate(mr.scheduled_date)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-foreground-500">
                      {formatDate(mr.created_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={statusColors[mr.status] || 'neutral'}>
                        {maintenanceStatusLabels[mr.status] || mr.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}