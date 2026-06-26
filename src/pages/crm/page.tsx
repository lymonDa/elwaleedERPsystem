import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Badge from '@/components/base/Badge';
import StatCard from '@/components/base/StatCard';
import { supabase } from '@/lib/supabase';
import type { Client } from '@/types/supabase';

export default function CrmPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<(Client & { invoice_count?: number; maintenance_count?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const payload: Record<string, unknown> = { page: 1, page_size: 50 };
      if (typeFilter !== 'all') payload.type = typeFilter;
      if (search.trim()) payload.search = search.trim();

      const { data, error: fnError } = await supabase.functions.invoke('get-clients', {
        body: payload,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setClients(data?.clients || []);
      if (data?.pagination) {
        setPagination({
          page: data.pagination.page,
          total: data.pagination.total,
          totalPages: data.pagination.total_pages,
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل العملاء');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, search]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filtered = useMemo(() => {
    let result = [...clients];
    if (typeFilter !== 'all') {
      result = result.filter((c) => c.type === typeFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q))
      );
    }
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return result;
  }, [clients, search, typeFilter]);

  const stats = useMemo(() => {
    const total = clients.length;
    const companies = clients.filter((c) => c.type === 'company').length;
    const individuals = clients.filter((c) => c.type === 'individual').length;
    return { total, companies, individuals };
  }, [clients]);

  const typeOptions = [
    { value: 'all', label: 'الكل' },
    { value: 'individual', label: 'أفراد' },
    { value: 'company', label: 'شركات' },
  ];

  const typeLabels: Record<string, string> = {
    individual: 'فرد',
    company: 'شركة',
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-foreground-900 font-heading">العملاء و CRM</h1>
          <p className="text-sm text-foreground-500 mt-0.5">إدارة جهات الاتصال وطلبات الصيانة</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/crm/maintenance">
            <Button variant="secondary" icon={<i className="ri-tools-line" />}>
              طلبات الصيانة
            </Button>
          </Link>
          <Link to="/crm/new">
            <Button icon={<i className="ri-user-add-line" />}>
              عميل جديد
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="إجمالي العملاء" value={stats.total} icon="ri-user-heart-line" variant="primary" />
        <StatCard title="شركات" value={stats.companies} icon="ri-building-2-line" variant="accent" />
        <StatCard title="أفراد" value={stats.individuals} icon="ri-user-line" variant="secondary" />
        <StatCard title="طلبات الصيانة" value={clients.reduce((sum, c) => sum + (c.maintenance_count || 0), 0)} icon="ri-tools-line" variant="primary" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="بحث بالاسم أو رقم الهاتف أو البريد..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          icon={<i className="ri-search-line" />}
          wrapperClassName="flex-1"
        />
        <div className="flex gap-1.5 flex-wrap">
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setTypeFilter(opt.value); setPagination(p => ({ ...p, page: 1 })); }}
              className={`whitespace-nowrap px-3 py-1.5 text-xs rounded-full transition-colors cursor-pointer ${
                typeFilter === opt.value
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
          <p className="text-sm text-foreground-400">جاري تحميل العملاء...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <i className="ri-error-warning-line text-4xl text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
          <Button onClick={fetchClients} variant="secondary" size="sm">إعادة المحاولة</Button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-background-200/70 bg-background-100">
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">الاسم</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">النوع</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">رقم الهاتف</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">الفواتير</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">الصيانة</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">آخر تعامل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-background-200/70">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-foreground-400">
                      <i className="ri-user-search-line text-3xl block mb-2" />
                      لا يوجد عملاء مطابقين
                    </td>
                  </tr>
                ) : (
                  filtered.map((client) => (
                    <tr
                      key={client.id}
                      onClick={() => navigate(`/crm/${client.id}`)}
                      className="hover:bg-background-100 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-secondary-700">
                              {client.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground-900">{client.name}</p>
                            {client.email && (
                              <p className="text-xs text-foreground-400">{client.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={client.type === 'company' ? 'accent' : 'secondary'}>
                          {typeLabels[client.type || 'individual']}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-foreground-700 text-xs">
                        {client.phone || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-foreground-600 text-xs">
                        {client.invoice_count || 0} فاتورة
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-foreground-600 text-xs">
                        {client.maintenance_count || 0} طلب
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-foreground-500 text-xs">
                        {formatDate(client.updated_at)}
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