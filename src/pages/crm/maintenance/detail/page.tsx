import { useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Button from '@/components/base/Button';
import Badge from '@/components/base/Badge';
import Modal from '@/components/base/Modal';
import { mockMaintenanceRequests, maintenanceStatusLabels } from '@/mocks/maintenance';
import { mockClientNames } from '@/mocks/clients';
import { employeeNames } from '@/mocks/employees';

export default function MaintenanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');

  const request = useMemo(() => mockMaintenanceRequests.find((mr) => mr.id === id), [id]);
  const clientId = request?.client_id;
  const clientName = clientId ? mockClientNames[clientId] : null;

  const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'primary' | 'accent'> = {
    pending: 'warning',
    scheduled: 'primary',
    in_progress: 'accent',
    completed: 'success',
    cancelled: 'neutral',
  };

  const statusIcons: Record<string, string> = {
    pending: 'ri-time-line',
    scheduled: 'ri-calendar-check-line',
    in_progress: 'ri-loader-4-line',
    completed: 'ri-check-double-line',
    cancelled: 'ri-close-circle-line',
  };

  const statusTransitions: Record<string, string[]> = {
    pending: ['scheduled', 'cancelled'],
    scheduled: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <i className="ri-tools-line text-4xl text-foreground-300" />
        <p className="text-foreground-500">طلب الصيانة غير موجود</p>
        <Link to="/crm/maintenance">
          <Button variant="secondary">العودة للقائمة</Button>
        </Link>
      </div>
    );
  }

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDateTime = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const availableTransitions = statusTransitions[request.status] || [];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/crm/maintenance')}
            className="w-8 h-8 flex items-center justify-center rounded-md text-foreground-500 hover:text-foreground-800 hover:bg-background-200 transition-colors cursor-pointer"
          >
            <i className="ri-arrow-right-line text-lg" />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-foreground-900 font-heading">طلب صيانة</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant={statusColors[request.status] || 'neutral'}>
                <i className={`${statusIcons[request.status] || 'ri-information-line'} ml-1`} />
                {maintenanceStatusLabels[request.status] || request.status}
              </Badge>
              <span className="text-xs text-foreground-400">{formatDate(request.created_at)}</span>
            </div>
          </div>
        </div>
        {availableTransitions.length > 0 && (
          <Button
            variant="secondary"
            icon={<i className="ri-arrow-left-right-line" />}
            onClick={() => setStatusModalOpen(true)}
          >
            تحديث الحالة
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main info */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Description */}
          <div className="bg-background-50 border border-background-200/70 rounded-lg p-5 md:p-6">
            <h3 className="text-sm font-semibold text-foreground-900 mb-3">وصف الطلب</h3>
            <p className="text-sm text-foreground-700 leading-relaxed">{request.description}</p>
          </div>

          {/* Timeline */}
          <div className="bg-background-50 border border-background-200/70 rounded-lg p-5 md:p-6">
            <h3 className="text-sm font-semibold text-foreground-900 mb-4">الجدول الزمني</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i className="ri-calendar-line text-sm text-secondary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground-900">تاريخ الإنشاء</p>
                  <p className="text-xs text-foreground-500">{formatDateTime(request.created_at)}</p>
                </div>
              </div>
              {request.scheduled_date && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="ri-calendar-check-line text-sm text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground-900">التاريخ المحدد</p>
                    <p className="text-xs text-foreground-500">{formatDate(request.scheduled_date)}</p>
                  </div>
                </div>
              )}
              {request.completed_at && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="ri-check-double-line text-sm text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground-900">تاريخ الإكمال</p>
                    <p className="text-xs text-foreground-500">{formatDateTime(request.completed_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {request.notes && (
            <div className="bg-background-50 border border-background-200/70 rounded-lg p-5 md:p-6">
              <h3 className="text-sm font-semibold text-foreground-900 mb-3">ملاحظات</h3>
              <p className="text-sm text-foreground-700 bg-background-100 rounded-md p-3">{request.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5">
          {/* Client */}
          <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground-900 mb-3">العميل</h3>
            {clientId && clientName ? (
              <Link
                to={`/crm/${clientId}`}
                className="flex items-center gap-2.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-secondary-700">{clientName.charAt(0)}</span>
                </div>
                {clientName}
              </Link>
            ) : (
              <p className="text-sm text-foreground-400">غير محدد</p>
            )}
          </div>

          {/* Assigned */}
          <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground-900 mb-3">المهندس المسؤول</h3>
            {request.assigned_to ? (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
                  <i className="ri-user-settings-line text-sm text-accent-600" />
                </div>
                <p className="text-sm font-medium text-foreground-900">
                  {employeeNames[request.assigned_to] || request.assigned_to}
                </p>
              </div>
            ) : (
              <p className="text-sm text-foreground-400">لم يتم التعيين بعد</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-background-50 border border-background-200/70 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground-900 mb-3">إجراءات سريعة</h3>
            <div className="flex flex-col gap-2">
              {clientId && (
                <Link to={`/crm/${clientId}`}>
                  <Button variant="secondary" size="sm" block icon={<i className="ri-user-line" />}>
                    عرض ملف العميل
                  </Button>
                </Link>
              )}
              {clientId && (
                <Link to={`/billing/new?client=${clientId}`}>
                  <Button variant="secondary" size="sm" block icon={<i className="ri-bill-line" />}>
                    إنشاء فاتورة
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Modal */}
      <Modal
        open={statusModalOpen}
        onClose={() => { setStatusModalOpen(false); setNewStatus(''); }}
        title="تحديث حالة طلب الصيانة"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-foreground-600">
            الحالة الحالية:{' '}
            <Badge variant={statusColors[request.status]}>{maintenanceStatusLabels[request.status]}</Badge>
          </p>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground-700">تحديث إلى:</p>
            {availableTransitions.map((s) => (
              <button
                key={s}
                onClick={() => setNewStatus(s)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-md text-sm transition-colors cursor-pointer border ${
                  newStatus === s
                    ? 'bg-primary-100 border-primary-300 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-700'
                    : 'bg-background-100 border-background-200/70 text-foreground-700 hover:bg-background-200'
                }`}
              >
                <i className={`${statusIcons[s] || 'ri-information-line'} text-base`} />
                {maintenanceStatusLabels[s] || s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 justify-end pt-2">
            <button
              onClick={() => { setStatusModalOpen(false); setNewStatus(''); }}
              className="whitespace-nowrap px-4 py-2 text-sm text-foreground-600 hover:text-foreground-900 hover:bg-background-200 rounded-md transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <Button onClick={() => { setStatusModalOpen(false); setNewStatus(''); }} disabled={!newStatus}>
              تأكيد التحديث
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}