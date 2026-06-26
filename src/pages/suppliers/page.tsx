import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StatCard from '@/components/base/StatCard';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import { supabase } from '@/lib/supabase';
import type { Supplier } from '@/types/supabase';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<(Supplier & { order_count?: number; pending_count?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const payload: Record<string, unknown> = { page: 1, page_size: 50 };
      if (search.trim()) payload.search = search.trim();

      const { data, error: fnError } = await supabase.functions.invoke('get-suppliers', {
        body: payload,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setSuppliers(data?.suppliers || []);
      if (data?.pagination) {
        setPagination({
          page: data.pagination.page,
          total: data.pagination.total,
          totalPages: data.pagination.total_pages,
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل الموردين');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const filtered = useMemo(() => {
    if (!search.trim()) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.contact_person && s.contact_person.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
    );
  }, [suppliers, search]);

  const activeOrders = suppliers.reduce((sum, s) => sum + (s.order_count || 0), 0);
  const pendingOrders = suppliers.reduce((sum, s) => sum + (s.pending_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground-900 font-heading">الموردين وأوامر الشراء</h1>
          <p className="text-sm text-foreground-500 mt-1">إدارة الموردين وأوامر الشراء ومتابعة الاستلام</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/suppliers/orders">
            <Button variant="secondary" size="md" icon={<i className="ri-file-list-3-line" />}>
              أوامر الشراء
            </Button>
          </Link>
          <Link to="/suppliers/new">
            <Button variant="primary" size="md" icon={<i className="ri-add-line" />}>
              مورد جديد
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي الموردين"
          value={suppliers.length}
          icon="ri-truck-line"
          variant="primary"
        />
        <StatCard
          title="أوامر شراء نشطة"
          value={activeOrders}
          icon="ri-shopping-cart-2-line"
          variant="accent"
        />
        <StatCard
          title="مسودات معلقة"
          value={pendingOrders}
          icon="ri-draft-line"
          variant="secondary"
        />
        <StatCard
          title="إجمالي أوامر الشراء"
          value={activeOrders}
          icon="ri-file-text-line"
          variant="secondary"
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-foreground-400">
            <i className="ri-search-line text-sm" />
          </span>
          <input
            type="text"
            placeholder="ابحث باسم المورد أو جهة الاتصال أو رقم الهاتف..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="w-full pr-10 pl-4 py-2 text-sm bg-background-50 border border-foreground-200 rounded-md text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-4 border-primary-300 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-sm text-foreground-400">جاري تحميل الموردين...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <i className="ri-error-warning-line text-4xl text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
          <Button onClick={fetchSuppliers} variant="secondary" size="sm">إعادة المحاولة</Button>
        </div>
      )}

      {/* Suppliers Table */}
      {!loading && !error && (
        <div className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-background-200/70 bg-background-100/50">
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">المورد</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">جهة الاتصال</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">الهاتف</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">البريد الإلكتروني</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">أوامر الشراء</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">آخر تحديث</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((supplier) => {
                  const counts = { total: supplier.order_count || 0, pending: supplier.pending_count || 0 };
                  return (
                    <tr
                      key={supplier.id}
                      onClick={() => navigate(`/suppliers/${supplier.id}`)}
                      className="border-b border-background-200/70 hover:bg-background-100/50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary-700">
                              {supplier.name.charAt(0)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground-900 truncate">{supplier.name}</p>
                            {supplier.address && (
                              <p className="text-xs text-foreground-500 truncate">{supplier.address}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground-700 whitespace-nowrap">
                          {supplier.contact_person || <span className="text-foreground-400">—</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground-600 whitespace-nowrap" dir="ltr">
                          {supplier.phone || <span className="text-foreground-400">—</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground-600 whitespace-nowrap" dir="ltr">
                          {supplier.email || <span className="text-foreground-400">—</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-foreground-700">{counts.total}</span>
                          {counts.pending > 0 && (
                            <Badge variant="warning">{counts.pending} معلق</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-foreground-500 whitespace-nowrap">
                          {new Date(supplier.updated_at).toLocaleDateString('ar-EG')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-foreground-400 text-sm">
                      لا توجد نتائج مطابقة للبحث
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}