import { useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Button from '@/components/base/Button';
import Badge from '@/components/base/Badge';
import { mockClients } from '@/mocks/clients';
import { mockInvoices, statusLabels as invoiceStatusLabels, statusColors } from '@/mocks/invoices';
import { mockMaintenanceRequests, maintenanceStatusLabels } from '@/mocks/maintenance';
import { employeeNames } from '@/mocks/employees';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'invoices' | 'maintenance'>('info');

  const client = useMemo(() => mockClients.find((c) => c.id === id), [id]);

  const clientInvoices = useMemo(() => {
    if (!id) return [];
    return mockInvoices
      .filter((inv) => inv.client_id === id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [id]);

  const clientMaintenance = useMemo(() => {
    if (!id) return [];
    return mockMaintenanceRequests
      .filter((mr) => mr.client_id === id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [id]);

  const stats = useMemo(() => {
    if (!id) return { totalInvoices: 0, totalPaid: 0, totalPending: 0, completedMaintenance: 0, pendingMaintenance: 0 };
    const invoices = clientInvoices.filter((i) => i.status !== 'cancelled' && i.status !== 'draft');
    const totalPaid = invoices.reduce((sum, i) => sum + (i.paid_amount || 0), 0);
    const totalPending = invoices.filter((i) => i.status === 'issued' || i.status === 'partially_paid').length;
    const completed = clientMaintenance.filter((m) => m.status === 'completed').length;
    const pending = clientMaintenance.filter((m) => m.status !== 'completed' && m.status !== 'cancelled').length;
    return { totalInvoices: invoices.length, totalPaid, totalPending, completedMaintenance: completed, pendingMaintenance: pending };
  }, [id, clientInvoices, clientMaintenance]);

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <i className="ri-user-search-line text-4xl text-foreground-300" />
        <p className="text-foreground-500">العميل غير موجود</p>
        <Link to="/crm">
          <Button variant="secondary">العودة للقائمة</Button>
        </Link>
      </div>
    );
  }

  const formatCurrency = (val: number | null) =>
    val != null ? `${val.toLocaleString('ar-EG')} ج.م` : '—';

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const typeLabels: Record<string, string> = { individual: 'فرد', company: 'شركة' };

  const tabs = [
    { key: 'info', label: 'البيانات الأساسية', icon: 'ri-information-line' },
    { key: 'invoices', label: `الفواتير (${clientInvoices.length})`, icon: 'ri-bill-line' },
    { key: 'maintenance', label: `الصيانة (${clientMaintenance.length})`, icon: 'ri-tools-line' },
  ];

  const maintenanceStatusColors: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'primary' | 'accent'> = {
    pending: 'warning',
    scheduled: 'primary',
    in_progress: 'accent',
    completed: 'success',
    cancelled: 'neutral',
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
            <h1 className="text-lg md:text-xl font-bold text-foreground-900 font-heading">{client.name}</h1>
            <p className="text-sm text-foreground-500 mt-0.5">
              <Badge variant={client.type === 'company' ? 'accent' : 'secondary'}>
                {typeLabels[client.type || 'individual']}
              </Badge>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/crm/maintenance/new?client=${client.id}`}>
            <Button variant="secondary" icon={<i className="ri-tools-line" />} size="sm">
              طلب صيانة
            </Button>
          </Link>
          <Link to="/billing/new">
            <Button icon={<i className="ri-add-line" />} size="sm">
              فاتورة جديدة
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-3 md:p-4">
          <p className="text-xs text-foreground-500">إجمالي الفواتير</p>
          <p className="text-lg font-bold text-foreground-900 mt-1">{stats.totalInvoices}</p>
        </div>
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-3 md:p-4">
          <p className="text-xs text-foreground-500">إجمالي المدفوع</p>
          <p className="text-lg font-bold text-emerald-600 mt-1">{formatCurrency(stats.totalPaid)}</p>
        </div>
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-3 md:p-4">
          <p className="text-xs text-foreground-500">صيانة مكتملة</p>
          <p className="text-lg font-bold text-emerald-600 mt-1">{stats.completedMaintenance}</p>
        </div>
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-3 md:p-4">
          <p className="text-xs text-foreground-500">صيانة معلقة</p>
          <p className="text-lg font-bold text-amber-600 mt-1">{stats.pendingMaintenance}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-background-100 rounded-full p-1 w-fit overflow-x-auto max-w-full">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2 text-xs rounded-full transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'bg-background-50 text-foreground-900 font-medium shadow-sm'
                : 'text-foreground-500 hover:text-foreground-700'
            }`}
          >
            <i className={`${tab.icon} text-sm`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content: Info */}
      {activeTab === 'info' && (
        <div className="bg-background-50 border border-background-200/70 rounded-lg p-5 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <p className="text-xs text-foreground-400 mb-1">الاسم</p>
              <p className="text-sm font-medium text-foreground-900">{client.name}</p>
            </div>
            <div>
              <p className="text-xs text-foreground-400 mb-1">النوع</p>
              <Badge variant={client.type === 'company' ? 'accent' : 'secondary'}>
                {typeLabels[client.type || 'individual']}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-foreground-400 mb-1">رقم الهاتف</p>
              <p className="text-sm text-foreground-700">{client.phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-foreground-400 mb-1">البريد الإلكتروني</p>
              <p className="text-sm text-foreground-700">{client.email || '—'}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-foreground-400 mb-1">العنوان</p>
              <p className="text-sm text-foreground-700">{client.address || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-foreground-400 mb-1">تاريخ الإضافة</p>
              <p className="text-sm text-foreground-600">{formatDate(client.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-foreground-400 mb-1">آخر تحديث</p>
              <p className="text-sm text-foreground-600">{formatDate(client.updated_at)}</p>
            </div>
            {client.notes && (
              <div className="sm:col-span-2">
                <p className="text-xs text-foreground-400 mb-1">ملاحظات</p>
                <p className="text-sm text-foreground-700 bg-background-100 rounded-md p-3">{client.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Invoices */}
      {activeTab === 'invoices' && (
        <div className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-background-200/70 bg-background-100">
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">رقم الفاتورة</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">التاريخ</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">المبلغ</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">المدفوع</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-background-200/70">
                {clientInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-foreground-400">
                      <i className="ri-bill-line text-3xl block mb-2" />
                      لا توجد فواتير لهذا العميل
                    </td>
                  </tr>
                ) : (
                  clientInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => navigate(`/billing/${inv.id}`)}
                      className="hover:bg-background-100 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-foreground-900">{inv.invoice_number}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-foreground-600 text-xs">{formatDate(inv.issued_at || inv.created_at)}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-foreground-900">{formatCurrency(inv.grand_total)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-foreground-600">{formatCurrency(inv.paid_amount)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={statusColors[inv.status]}>
                          {invoiceStatusLabels[inv.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Maintenance */}
      {activeTab === 'maintenance' && (
        <div className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-background-200/70 bg-background-100">
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">الوصف</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">المهندس</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">التاريخ المحدد</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-background-200/70">
                {clientMaintenance.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-foreground-400">
                      <i className="ri-tools-line text-3xl block mb-2" />
                      لا توجد طلبات صيانة لهذا العميل
                    </td>
                  </tr>
                ) : (
                  clientMaintenance.map((mr) => (
                    <tr
                      key={mr.id}
                      onClick={() => navigate(`/crm/maintenance/${mr.id}`)}
                      className="hover:bg-background-100 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-foreground-900 text-sm truncate">{mr.description}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-foreground-600">
                        {mr.assigned_to ? employeeNames[mr.assigned_to] || '—' : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-foreground-600">
                        {formatDate(mr.scheduled_date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={maintenanceStatusColors[mr.status] || 'neutral'}>
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
      )}
    </div>
  );
}