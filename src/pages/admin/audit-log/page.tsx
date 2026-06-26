import { useState, useEffect, useCallback } from 'react';
import StatCard from '@/components/base/StatCard';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import Modal from '@/components/base/Modal';
import { supabase } from '@/lib/supabase';
import { roleLabels } from '@/mocks/admin';

interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: any;
  new_data: any;
  ip_address: string | null;
  created_at: string;
  user_name?: string | null;
  user_role?: string | null;
}

interface AuditStats {
  total_operations: number;
  today_operations: number;
  unique_tables: number;
  unique_users: number;
}

interface FiltersAvailable {
  actions: string[];
  tables: string[];
}

const actionIcons: Record<string, string> = {
  'تسجيل دخول': 'ri-login-circle-line',
  'تسجيل خروج': 'ri-logout-circle-line',
  'إنشاء': 'ri-add-circle-line',
  'إضافة': 'ri-add-circle-line',
  'تعديل': 'ri-edit-circle-line',
  'تغيير': 'ri-edit-circle-line',
  'تحديث': 'ri-refresh-line',
  'حذف': 'ri-delete-bin-line',
  'تسجيل': 'ri-file-add-line',
};

function getActionIcon(action: string): string {
  for (const [key, icon] of Object.entries(actionIcons)) {
    if (action.includes(key)) return icon;
  }
  return 'ri-record-circle-line';
}

function getActionVariant(action: string): 'primary' | 'accent' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral' {
  if (action.includes('تسجيل دخول') || action.includes('تسجيل خروج')) return 'neutral';
  if (action.includes('إنشاء') || action.includes('إضافة')) return 'success';
  if (action.includes('تعديل') || action.includes('تغيير') || action.includes('تحديث')) return 'secondary';
  if (action.includes('حذف')) return 'danger';
  return 'primary';
}

export default function AdminAuditLogPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditStats>({ total_operations: 0, today_operations: 0, unique_tables: 0, unique_users: 0 });
  const [filtersAvailable, setFiltersAvailable] = useState<FiltersAvailable>({ actions: [], tables: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;

  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const fetchAuditLogs = useCallback(async (currentPage: number) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('limit', String(limit));
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (tableFilter !== 'all') params.set('table', tableFilter);
      if (search) params.set('search', search);

      const { data, error: fnErr } = await supabase.functions.invoke('get-audit-logs', {
        body: Object.fromEntries(params),
      });

      if (fnErr) throw new Error(fnErr.message);
      if (data?.error) throw new Error(data.error);

      const parsed = data as any;
      setAuditLogs(parsed.data ?? []);
      setTotal(parsed.total ?? 0);
      setStats(parsed.stats ?? { total_operations: 0, today_operations: 0, unique_tables: 0, unique_users: 0 });
      if (parsed.filters_available) {
        setFiltersAvailable(parsed.filters_available);
      }
    } catch (err: any) {
      console.error('fetchAuditLogs error:', err);
      setError(err?.message || 'فشل تحميل سجل العمليات');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, tableFilter, search]);

  useEffect(() => {
    setPage(1);
    fetchAuditLogs(1);
  }, [actionFilter, tableFilter, search, fetchAuditLogs]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchAuditLogs(newPage);
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (tableFilter !== 'all') params.set('table', tableFilter);
      if (search) params.set('search', search);
      params.set('format', format);

      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error('جلسة غير صالحة');

      const baseUrl = 'https://nvoiywhxngbguzpmhysk.supabase.co/functions/v1/export-audit-logs';
      const resp = await fetch(`${baseUrl}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resp.ok) throw new Error('فشل التصدير');

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.${format === 'csv' ? 'csv' : 'json'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex flex-col gap-5">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي العمليات" value={loading ? '—' : stats.total_operations} icon="ri-history-line" variant="primary" />
        <StatCard title="عمليات اليوم" value={loading ? '—' : stats.today_operations} icon="ri-calendar-check-line" variant="accent" />
        <StatCard title="الجداول المسجلة" value={loading ? '—' : stats.unique_tables} icon="ri-database-2-line" variant="secondary" />
        <StatCard title="المستخدمين النشطين" value={loading ? '—' : stats.unique_users} icon="ri-user-line" variant="secondary" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap max-w-full overflow-x-auto pb-1">
          <button
            onClick={() => setActionFilter('all')}
            className={`whitespace-nowrap px-3 py-1.5 text-xs rounded-full transition-colors cursor-pointer ${
              actionFilter === 'all' ? 'bg-primary-500 text-background-50 dark:text-foreground-950' : 'bg-background-100 text-foreground-600 hover:bg-background-200'
            }`}
          >
            كل الإجراءات
          </button>
          {filtersAvailable.actions.slice(0, 8).map((a) => (
            <button
              key={a}
              onClick={() => setActionFilter(a)}
              className={`whitespace-nowrap px-3 py-1.5 text-xs rounded-full transition-colors cursor-pointer ${
                actionFilter === a ? 'bg-primary-500 text-background-50 dark:text-foreground-950' : 'bg-background-100 text-foreground-600 hover:bg-background-200'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-56">
            <i className="ri-search-line absolute right-3 top-1/2 -translate-y-1/2 text-foreground-400 text-sm" />
            <input
              type="text"
              placeholder="بحث في السجل..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-9 pl-3 py-2 text-sm bg-background-50 border border-foreground-200 rounded-md text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="w-8 h-8 flex items-center justify-center rounded-md text-foreground-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
              title="تصدير JSON"
            >
              <i className="ri-file-code-line text-sm" />
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="w-8 h-8 flex items-center justify-center rounded-md text-foreground-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
              title="تصدير CSV"
            >
              <i className="ri-file-excel-2-line text-sm" />
            </button>
          </div>
        </div>
      </div>

      {/* Table filter pills */}
      <div className="flex items-center gap-2 flex-wrap max-w-full overflow-x-auto pb-1">
        <button
          onClick={() => setTableFilter('all')}
          className={`whitespace-nowrap px-3 py-1.5 text-xs rounded-full transition-colors cursor-pointer ${
            tableFilter === 'all' ? 'bg-secondary-500 text-background-50 dark:text-foreground-950' : 'bg-background-100 text-foreground-600 hover:bg-background-200'
          }`}
        >
          كل الجداول
        </button>
        {filtersAvailable.tables.map((t) => (
          <button
            key={t}
            onClick={() => setTableFilter(t)}
            className={`whitespace-nowrap px-3 py-1.5 text-xs rounded-full transition-colors cursor-pointer ${
              tableFilter === t ? 'bg-secondary-500 text-background-50 dark:text-foreground-950' : 'bg-background-100 text-foreground-600 hover:bg-background-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Audit Log Table */}
      <div className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-foreground-400">جاري تحميل سجل العمليات...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <i className="ri-error-warning-line text-3xl text-red-400" />
            <span className="text-sm text-foreground-500">{error}</span>
            <Button variant="ghost" size="sm" onClick={() => fetchAuditLogs(page)}>
              إعادة المحاولة
            </Button>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <i className="ri-history-line text-3xl text-foreground-300" />
            <span className="text-sm text-foreground-400">لا يوجد عمليات مطابقة للبحث</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-background-200/70 bg-background-100/50">
                    <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الإجراء</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الجدول</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 hidden md:table-cell">المستخدم</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 hidden lg:table-cell">IP</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">التوقيت</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">تفاصيل</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => {
                    const variant = getActionVariant(log.action);
                    const icon = getActionIcon(log.action);
                    return (
                      <tr key={log.id} className="border-b border-background-200/50 hover:bg-background-100/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center">
                              <i className={`${icon} text-sm ${variant === 'danger' ? 'text-red-600' : variant === 'success' ? 'text-emerald-600' : variant === 'secondary' ? 'text-secondary-600' : 'text-foreground-500'}`} />
                            </span>
                            <Badge variant={variant}>{log.action}</Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono bg-background-100 px-2 py-0.5 rounded text-foreground-600">{log.table_name}</span>
                        </td>
                        <td className="px-4 py-3 text-foreground-600 hidden md:table-cell">{log.user_name || '—'}</td>
                        <td className="px-4 py-3 text-xs font-mono text-foreground-400 hidden lg:table-cell" dir="ltr">
                          {log.ip_address || '—'}
                        </td>
                        <td className="px-4 py-3 text-foreground-500 text-xs whitespace-nowrap">
                          {new Date(log.created_at).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="w-8 h-8 flex items-center justify-center rounded-md text-foreground-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                            title="عرض التفاصيل"
                          >
                            <i className="ri-eye-line" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-background-200/70">
                <span className="text-xs text-foreground-400">
                  {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} من {total}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                    className="w-8 h-8 flex items-center justify-center rounded-md text-foreground-400 hover:text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                  >
                    <i className="ri-arrow-right-s-line" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md text-xs transition-colors cursor-pointer ${
                          pageNum === page
                            ? 'bg-primary-500 text-background-50 dark:text-foreground-950'
                            : 'text-foreground-500 hover:bg-background-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-md text-foreground-400 hover:text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                  >
                    <i className="ri-arrow-left-s-line" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <Modal open={!!selectedLog} onClose={() => setSelectedLog(null)} title="تفاصيل سجل العملية" size="md">
        {selectedLog && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-foreground-500 mb-0.5">الإجراء</p>
                <Badge variant={getActionVariant(selectedLog.action)}>{selectedLog.action}</Badge>
              </div>
              <div>
                <p className="text-xs text-foreground-500 mb-0.5">الجدول</p>
                <span className="text-sm font-mono text-foreground-900">{selectedLog.table_name}</span>
              </div>
              <div>
                <p className="text-xs text-foreground-500 mb-0.5">المستخدم</p>
                <span className="text-sm text-foreground-900">{selectedLog.user_name || '—'}</span>
              </div>
              <div>
                <p className="text-xs text-foreground-500 mb-0.5">الدور</p>
                <span className="text-sm text-foreground-600">
                  {selectedLog.user_role ? (roleLabels[selectedLog.user_role] || selectedLog.user_role) : '—'}
                </span>
              </div>
              <div>
                <p className="text-xs text-foreground-500 mb-0.5">عنوان IP</p>
                <span className="text-sm font-mono text-foreground-600" dir="ltr">{selectedLog.ip_address || '—'}</span>
              </div>
              <div>
                <p className="text-xs text-foreground-500 mb-0.5">التوقيت</p>
                <span className="text-sm text-foreground-600">
                  {new Date(selectedLog.created_at).toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
              {selectedLog.record_id && (
                <div className="col-span-2">
                  <p className="text-xs text-foreground-500 mb-0.5">معرف السجل</p>
                  <span className="text-sm font-mono text-foreground-600">{selectedLog.record_id}</span>
                </div>
              )}
            </div>
            {selectedLog.old_data && (
              <div>
                <p className="text-xs text-foreground-500 mb-1">البيانات السابقة</p>
                <pre className="text-xs bg-background-100 p-3 rounded-md text-foreground-700 overflow-x-auto font-mono whitespace-pre-wrap">
                  {JSON.stringify(selectedLog.old_data, null, 2)}
                </pre>
              </div>
            )}
            {selectedLog.new_data && (
              <div>
                <p className="text-xs text-foreground-500 mb-1">البيانات الجديدة</p>
                <pre className="text-xs bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-md text-emerald-800 dark:text-emerald-300 overflow-x-auto font-mono whitespace-pre-wrap">
                  {JSON.stringify(selectedLog.new_data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}