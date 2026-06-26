import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '@/components/base/Button';
import Input from '@/components/base/Input';
import Badge from '@/components/base/Badge';
import StatCard from '@/components/base/StatCard';
import { supabase } from '@/lib/supabase';
import type { InventoryItem } from '@/types/supabase';

interface InventoryCategory {
  id: string;
  name: string;
}

interface InventoryStats {
  total: number;
  totalValue: number;
  lowStock: number;
  categoriesCount: number;
}

export default function InventoryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<(InventoryItem & { inventory_categories?: { name: string } })[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'ok'>('all');
  const [stats, setStats] = useState<InventoryStats>({ total: 0, totalValue: 0, lowStock: 0, categoriesCount: 0 });
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const payload: Record<string, unknown> = {
        page: pagination.page,
        limit: 20,
      };
      if (categoryFilter !== 'all') payload.category_id = categoryFilter;
      if (stockFilter !== 'all') payload.stock_status = stockFilter;
      if (search.trim()) payload.search = search.trim();

      const { data, error: fnError } = await supabase.functions.invoke('get-inventory-list', {
        body: payload,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setItems(data?.items || []);
      setStats(data?.stats || { total: 0, totalValue: 0, lowStock: 0, categoriesCount: 0 });
      if (data?.pagination) setPagination(data.pagination);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل المخزون');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, categoryFilter, stockFilter, search]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data, error: fnError } = await supabase.functions.invoke('get-inventory-categories', {
        body: {},
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (fnError) throw fnError;
      if (data?.categories) setCategories(data.categories);
    } catch {
      // silent fail for categories
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, [fetchData, fetchCategories]);

  const formatCurrency = (val: number | null) =>
    val != null ? `${val.toLocaleString('ar-EG')} ج.م` : '—';

  const getStockStatus = (qty: number, min: number) => {
    if (qty === 0) return { label: 'نافذ', color: 'danger' as const };
    if (qty <= min) return { label: 'منخفض', color: 'warning' as const };
    return { label: 'متوفر', color: 'success' as const };
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-foreground-900 font-heading">المخزون والجرد</h1>
          <p className="text-sm text-foreground-500 mt-0.5">إدارة الأصناف ومراقبة المخزون</p>
        </div>
        <Link to="/inventory/new">
          <Button icon={<i className="ri-add-line" />}>
            صنف جديد
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="إجمالي الأصناف" value={`${stats.total} صنف`} icon="ri-archive-line" variant="primary" />
        <StatCard title="قيمة المخزون" value={formatCurrency(stats.totalValue)} icon="ri-money-dollar-circle-line" variant="accent" />
        <StatCard title="أصناف منخفضة" value={`${stats.lowStock} صنف`} icon="ri-alert-line" variant="secondary" />
        <StatCard title="التصنيفات" value={`${stats.categoriesCount} تصنيف`} icon="ri-folder-2-line" variant="secondary" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="بحث باسم الصنف أو الرقم التسلسلي..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            icon={<i className="ri-search-line" />}
            wrapperClassName="flex-1"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Category filter */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => { setCategoryFilter('all'); setPagination(p => ({ ...p, page: 1 })); }}
              className={`whitespace-nowrap px-3 py-1.5 text-xs rounded-full transition-colors cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-primary-500 text-background-50 dark:text-foreground-950'
                  : 'bg-background-100 text-foreground-600 hover:bg-background-200'
              }`}
            >
              كل التصنيفات
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setCategoryFilter(cat.id); setPagination(p => ({ ...p, page: 1 })); }}
                className={`whitespace-nowrap px-3 py-1.5 text-xs rounded-full transition-colors cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-primary-500 text-background-50 dark:text-foreground-950'
                    : 'bg-background-100 text-foreground-600 hover:bg-background-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-background-300/60 hidden sm:block" />

          {/* Stock filter */}
          <div className="flex gap-1.5">
            {[
              { value: 'all', label: 'كل الحالات' },
              { value: 'ok', label: 'متوفر' },
              { value: 'low', label: 'منخفض/نافذ' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setStockFilter(opt.value as 'all' | 'low' | 'ok'); setPagination(p => ({ ...p, page: 1 })); }}
                className={`whitespace-nowrap px-3 py-1.5 text-xs rounded-full transition-colors cursor-pointer ${
                  stockFilter === opt.value
                    ? 'bg-accent-500 text-background-50 dark:text-foreground-950'
                    : 'bg-background-100 text-foreground-600 hover:bg-background-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-4 border-primary-300 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-sm text-foreground-400">جاري تحميل المخزون...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <i className="ri-error-warning-line text-4xl text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
          <Button onClick={fetchData} variant="secondary" size="sm">إعادة المحاولة</Button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-background-200/70 bg-background-100">
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">الصنف</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap hidden md:table-cell">الرقم التسلسلي</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap hidden lg:table-cell">التصنيف</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">الوحدة</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">المخزون</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap hidden sm:table-cell">سعر التكلفة</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap hidden sm:table-cell">سعر البيع</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 whitespace-nowrap">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-background-200/70">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-foreground-400">
                      <i className="ri-inbox-line text-3xl block mb-2" />
                      لا توجد أصناف مطابقة
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const stock = getStockStatus(item.quantity, item.min_quantity);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => navigate(`/inventory/${item.id}`)}
                        className={`hover:bg-background-100 transition-colors cursor-pointer ${
                          item.quantity <= item.min_quantity ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground-900 text-sm">{item.name}</span>
                            {item.description && (
                              <span className="text-xs text-foreground-400 mt-0.5 line-clamp-1 hidden sm:block">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-foreground-600 text-xs hidden md:table-cell">
                          {item.serial_number || '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-foreground-600 text-xs hidden lg:table-cell">
                          {(item as InventoryItem & { inventory_categories?: { name: string } }).inventory_categories?.name || '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-foreground-700 text-xs">
                          {item.unit}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold text-sm ${
                              item.quantity === 0 ? 'text-red-600' : item.quantity <= item.min_quantity ? 'text-amber-600' : 'text-foreground-900'
                            }`}>
                              {item.quantity}
                            </span>
                            <span className="text-xs text-foreground-400">
                              / {item.min_quantity}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-foreground-700 text-xs hidden sm:table-cell">
                          {formatCurrency(item.cost_price)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-foreground-900 font-medium text-xs hidden sm:table-cell">
                          {formatCurrency(item.selling_price)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={stock.color}>{stock.label}</Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-background-200/70">
              <button
                onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page <= 1}
                className="px-3 py-1 text-xs rounded-md bg-background-100 text-foreground-600 hover:bg-background-200 disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                السابق
              </button>
              <span className="text-xs text-foreground-500">
                صفحة {pagination.page} من {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                disabled={pagination.page >= pagination.totalPages}
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