import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Badge from '@/components/base/Badge';
import StatCard from '@/components/base/StatCard';
import { supabase } from '@/lib/supabase';
import type { Invoice, InvoiceStatus } from '@/types/supabase';

export default function BillingPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [pagination, setPagination] = useState({ page: 1, page_size: 20, total: 0, total_pages: 0 });

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const payload: Record<string, unknown> = {
        page: pagination.page,
        page_size: pagination.page_size,
      };
      if (statusFilter !== 'all') payload.status = statusFilter;

      const { data, error: fnError } = await supabase.functions.invoke('get-invoices', {
        body: payload,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setInvoices(data?.invoices || []);
      if (data?.pagination) setPagination(data.pagination);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل الفواتير');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, pagination.page, pagination.page_size]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filtered = useMemo(() => {
    let result = [...invoices];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((inv) => {
        const clientName = (inv.clients?.name || '').toLowerCase();
        return (
          inv.invoice_number.toLowerCase().includes(q) ||
          clientName.includes(q)
        );
      });
    }
    return result;
  }, [invoices, search]);

  const stats = useMemo(() => {
    const total = invoices.length;
    const totalRevenue = invoices
      .filter((i) => i.status !== 'cancelled' && i.status !== 'draft')
      .reduce((sum, i) => sum + (i.grand_total || 0), 0);
    const totalPaid = invoices.reduce((sum, i) => sum + (i.paid_amount || 0), 0);
    const pending = invoices.filter((i) => i.status === 'issued' || i.status === 'partially_paid').length;
    return { total, totalRevenue, totalPaid, pending };
  }, [invoices]);

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

  const statusOptions: { value: InvoiceStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'الكل' },
    { value: 'draft', label: 'مسودة' },
    { value: 'issued', label: 'مصدرة' },
    { value: 'partially_paid', label: 'مدفوعة جزئياً' },
    { value: 'paid', label: 'مدفوعة' },
    { value: 'cancelled', label: 'ملغية' },
  ];

  const formatCurrency = (val: number | null) =>
    val != null ? `${val.toLocaleString('ar-EG')} ج.م` : '—';

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-foreground-900 font-heading">الفواتير</h1>
          <p className="text-sm text-foreground-500 mt-0.5">إدارة الفواتير والمبالغ المستحقة</p>
        </div>
        <Link to="/billing/new">
          <Button icon={<i className="ri-add-line" />}>
            فاتورة جديدة
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="إجمالي الفواتير" value={`${stats.total} فاتورة`} icon="ri-bill-line" variant="primary" />
        <StatCard title="إجمالي الإيرادات" value={formatCurrency(stats.totalRevenue)} icon="ri-money-dollar-circle-line" variant="accent" />
        <StatCard title="المبالغ المحصلة" value={formatCurrency(stats.totalPaid)} icon="ri-check-double-line" variant="secondary" />
        <StatCard title="قيد الانتظار" value={`${stats.pending} فاتورة`} icon="ri-hourglass-line" variant="primary" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="بحث برقم الفاتورة أو اسم العميل..."
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

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-4 border-primary-300 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-sm text-foreground-400">جاري تحميل الفواتير...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <i className="ri-error-warning-line text-4xl text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
          <Button onClick={fetchInvoices} variant="secondary" size="sm">إعادة المحاولة</Button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-background-200/70 bg-background-100">
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">رقم الفاتورة</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">العميل</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">التاريخ</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">المبلغ</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">المدفوع</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-background-200/70">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-foreground-400">
                      <i className="ri-inbox-line text-3xl block mb-2" />
                      لا توجد فواتير مطابقة
                    </td>
                  </tr>
                ) : (
                  filtered.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => navigate(`/billing/${inv.id}`)}
                      className="hover:bg-background-100 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-medium text-foreground-900">{inv.invoice_number}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-foreground-700">
                        {(inv as Invoice & { clients?: { name: string } }).clients?.name || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-foreground-600 text-xs">
                        {formatDate(inv.issued_at || inv.created_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-foreground-900">
                        {formatCurrency(inv.grand_total)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-foreground-600">
                        {formatCurrency(inv.paid_amount)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={statusColors[inv.status]}>
                          {statusLabels[inv.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-background-200/70">
              <button
                onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page <= 1}
                className="px-3 py-1 text-xs rounded-md bg-background-100 text-foreground-600 hover:bg-background-200 disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                السابق
              </button>
              <span className="text-xs text-foreground-500">
                صفحة {pagination.page} من {pagination.total_pages}
              </span>
              <button
                onClick={() => setPagination(p => ({ ...p, page: Math.min(p.total_pages, p.page + 1) }))}
                disabled={pagination.page >= pagination.total_pages}
                className="px-3 py-1 text-xs rounded-md bg-background-100 text-foreground-600 hover:bg-background-200 disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                التالي
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}