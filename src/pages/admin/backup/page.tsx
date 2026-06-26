import { useState, useEffect, useCallback } from 'react';
import StatCard from '@/components/base/StatCard';
import Badge from '@/components/base/Badge';
import Button from '@/components/base/Button';
import Modal from '@/components/base/Modal';
import { supabase } from '@/lib/supabase';

interface BackupLog {
  id: string;
  created_by: string;
  file_path: string;
  file_size: number | null;
  backup_type: string;
  status: string;
  notes: string | null;
  created_at: string;
  creator_name?: string | null;
}

interface BackupStats {
  total_backups: number;
  completed_backups: number;
  total_size: number;
}

export default function AdminBackupPage() {
  const [backupLogs, setBackupLogs] = useState<BackupLog[]>([]);
  const [stats, setStats] = useState<BackupStats>({ total_backups: 0, completed_backups: 0, total_size: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [backupType, setBackupType] = useState('كاملة');
  const [backupNotes, setBackupNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const [restoreTarget, setRestoreTarget] = useState<string | null>(null);
  const [restoreConfirmText, setRestoreConfirmText] = useState('');

  const [backupFreq, setBackupFreq] = useState('أسبوعي');
  const [backupRetention, setBackupRetention] = useState('90');

  const formatSize = (bytes: number): string => {
    if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
    if (bytes >= 1000) return `${(bytes / 1000).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchBackupSettings = useCallback(async () => {
    const { data } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['backup_frequency', 'backup_retention_days']);
    if (data) {
      for (const s of data) {
        if (s.key === 'backup_frequency') setBackupFreq(String(s.value));
        if (s.key === 'backup_retention_days') setBackupRetention(String(s.value));
      }
    }
  }, []);

  const fetchBackupLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fnErr } = await supabase.functions.invoke('get-backup-logs', {
        body: { page: 1, limit: 50 },
      });
      if (fnErr) throw new Error(fnErr.message);
      if (data?.error) throw new Error(data.error);

      const parsed = data as any;
      setBackupLogs(parsed.data ?? []);
      setStats(parsed.stats ?? { total_backups: 0, completed_backups: 0, total_size: 0 });
    } catch (err: any) {
      console.error('fetchBackupLogs error:', err);
      setError(err?.message || 'فشل تحميل بيانات النسخ الاحتياطي');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackupLogs();
    fetchBackupSettings();
  }, [fetchBackupLogs, fetchBackupSettings]);

  const handleCreateBackup = async () => {
    try {
      setActionLoading(true);
      const { data, error: fnErr } = await supabase.functions.invoke('create-backup', {
        body: { backup_type: backupType, notes: backupNotes || undefined },
      });
      if (fnErr) throw new Error(fnErr.message);
      if (data?.error) throw new Error(data.error);

      setShowCreateModal(false);
      setBackupNotes('');
      setBackupType('كاملة');
      showToast('تم إنشاء النسخة الاحتياطية بنجاح!');
      fetchBackupLogs();
    } catch (err: any) {
      showToast(err?.message || 'فشل إنشاء النسخة الاحتياطية', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBackup = async () => {
    if (!showDeleteConfirm) return;
    try {
      setActionLoading(true);
      const { data, error: fnErr } = await supabase.functions.invoke('delete-backup', {
        body: { backup_id: showDeleteConfirm },
      });
      if (fnErr) throw new Error(fnErr.message);
      if (data?.error) throw new Error(data.error);

      setShowDeleteConfirm(null);
      showToast('تم حذف النسخة بنجاح');
      fetchBackupLogs();
    } catch (err: any) {
      showToast(err?.message || 'فشل حذف النسخة', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreTarget) return;
    if (restoreConfirmText !== 'استعادة') {
      showToast('يرجى كتابة "استعادة" للتأكيد', 'error');
      return;
    }
    try {
      setActionLoading(true);
      const { data, error: fnErr } = await supabase.functions.invoke('restore-backup', {
        body: { backup_id: restoreTarget },
      });
      if (fnErr) throw new Error(fnErr.message);
      if (data?.error) throw new Error(data.error);

      setShowRestoreModal(false);
      setRestoreTarget(null);
      setRestoreConfirmText('');
      const parsed = data as any;
      showToast(parsed?.message || 'تمت الاستعادة بنجاح');
      fetchBackupLogs();
    } catch (err: any) {
      showToast(err?.message || 'فشل استعادة النسخة', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = async (log: BackupLog) => {
    try {
      const { data, error: dlErr } = await supabase.storage
        .from('backups')
        .createSignedUrl(log.file_path, 60);
      if (dlErr) throw new Error(dlErr.message);
      if (data?.signedUrl) {
        const a = document.createElement('a');
        a.href = data.signedUrl;
        a.download = log.file_path.split('/').pop() || 'backup.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err: any) {
      showToast('فشل تحميل النسخة: ' + (err?.message || 'خطأ غير معروف'), 'error');
    }
  };

  const completedBackups = backupLogs.filter((b) => b.status === 'مكتملة');

  return (
    <div className="flex flex-col gap-5">
      {/* Toast */}
      {toastMsg && (
        <div className={`fixed bottom-6 left-6 z-[120] px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow-lg animate-bounce ${
          toastType === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <i className={toastType === 'success' ? 'ri-check-line' : 'ri-error-warning-line'} />
          {toastMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي النسخ" value={loading ? '—' : stats.total_backups} icon="ri-cloud-line" variant="primary" />
        <StatCard title="نسخ مكتملة" value={loading ? '—' : stats.completed_backups} icon="ri-check-double-line" variant="accent" />
        <StatCard title="الحجم الإجمالي" value={loading ? '—' : formatSize(stats.total_size)} icon="ri-hard-drive-2-line" variant="secondary" />
        <StatCard title="تكرار النسخ" value={backupFreq} icon="ri-refresh-line" variant="secondary" />
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-background-50 border border-background-200/70 rounded-lg">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground-500">التكرار الحالي:</span>
            <Badge variant="secondary">{backupFreq}</Badge>
          </div>
          <div className="w-px h-5 bg-background-200/70 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground-500">الاحتفاظ بالنسخ:</span>
            <Badge variant="neutral">{backupRetention} يوم</Badge>
          </div>
        </div>
        <div className="flex-1" />
        <Button
          variant="primary"
          size="md"
          icon={<i className="ri-add-line" />}
          onClick={() => setShowCreateModal(true)}
          loading={actionLoading}
        >
          إنشاء نسخة احتياطية الآن
        </Button>
      </div>

      {/* Backup Log Table */}
      <div className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-background-200/70">
          <h3 className="text-sm font-semibold text-foreground-900">سجل النسخ الاحتياطية</h3>
          <span className="text-xs text-foreground-400">{backupLogs.length} نسخة</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-foreground-400">جاري تحميل البيانات...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <i className="ri-error-warning-line text-3xl text-red-400" />
            <span className="text-sm text-foreground-500">{error}</span>
            <Button variant="ghost" size="sm" onClick={fetchBackupLogs}>
              إعادة المحاولة
            </Button>
          </div>
        ) : backupLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <i className="ri-cloud-off-line text-3xl text-foreground-300" />
            <span className="text-sm text-foreground-400">لا يوجد نسخ احتياطية بعد</span>
            <span className="text-xs text-foreground-300">قم بإنشاء أول نسخة احتياطية للبدء</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-background-200/70 bg-background-100/50">
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">النوع</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">مسار الملف</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 hidden md:table-cell">الحجم</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">الحالة</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 hidden lg:table-cell">المنشئ</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">التاريخ</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500 hidden lg:table-cell">ملاحظات</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-500">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {backupLogs.map((log) => (
                  <tr key={log.id} className={`border-b border-background-200/50 hover:bg-background-100/30 transition-colors ${log.status === 'محذوفة' ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{log.backup_type}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-foreground-600 break-all">{log.file_path}</span>
                    </td>
                    <td className="px-4 py-3 text-foreground-600 text-xs hidden md:table-cell">
                      {log.file_size ? formatSize(log.file_size) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={log.status === 'مكتملة' ? 'success' : log.status === 'محذوفة' ? 'danger' : 'warning'}>
                        {log.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-foreground-600 hidden lg:table-cell">
                      {log.creator_name || '—'}
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
                    <td className="px-4 py-3 text-foreground-500 text-xs max-w-48 truncate hidden lg:table-cell">
                      {log.notes || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {log.status === 'مكتملة' && (
                          <>
                            <button
                              className="w-8 h-8 flex items-center justify-center rounded-md text-foreground-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                              title="تحميل"
                              onClick={() => handleDownload(log)}
                            >
                              <i className="ri-download-line" />
                            </button>
                            <button
                              className="w-8 h-8 flex items-center justify-center rounded-md text-foreground-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                              title="استعادة"
                              onClick={() => {
                                setRestoreTarget(log.id);
                                setRestoreConfirmText('');
                                setShowRestoreModal(true);
                              }}
                            >
                              <i className="ri-refresh-line" />
                            </button>
                          </>
                        )}
                        <button
                          className="w-8 h-8 flex items-center justify-center rounded-md text-foreground-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="حذف"
                          onClick={() => setShowDeleteConfirm(log.id)}
                        >
                          <i className="ri-delete-bin-line" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Backup Modal */}
      <Modal open={showCreateModal} onClose={() => !actionLoading && setShowCreateModal(false)} title="إنشاء نسخة احتياطية جديدة" size="sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground-800">نوع النسخة</label>
            <div className="flex items-center gap-2 flex-wrap">
              {['كاملة', 'البيانات فقط', 'الإعدادات فقط'].map((t) => (
                <button
                  key={t}
                  onClick={() => setBackupType(t)}
                  className={`whitespace-nowrap px-3 py-1.5 text-xs rounded-full transition-colors cursor-pointer ${
                    backupType === t
                      ? 'bg-primary-500 text-background-50 dark:text-foreground-950'
                      : 'bg-background-100 text-foreground-600 hover:bg-background-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground-800">ملاحظات</label>
            <textarea
              value={backupNotes}
              onChange={(e) => setBackupNotes(e.target.value)}
              placeholder="ملاحظات اختيارية..."
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 text-sm bg-background-50 border border-foreground-200 rounded-md text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
            />
          </div>
          <div className="bg-background-100 rounded-md p-3 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs text-foreground-500">
              <i className="ri-information-line" />
              <span>سيتم حفظ النسخة تلقائياً في مخزن النسخ الاحتياطي الآمن</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground-500">
              <i className="ri-time-line" />
              <span>قد تستغرق عملية النسخ بضع دقائق حسب حجم البيانات</span>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-background-200/70">
            <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)} disabled={actionLoading}>
              إلغاء
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateBackup} loading={actionLoading}>
              بدء النسخ الاحتياطي
            </Button>
          </div>
        </div>
      </Modal>

      {/* Restore Backup Modal */}
      <Modal open={showRestoreModal} onClose={() => !actionLoading && setShowRestoreModal(false)} title="استعادة نسخة احتياطية" size="sm">
        <div className="flex flex-col gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <i className="ri-alert-fill text-red-500 text-lg" />
              <span className="text-sm font-semibold text-red-700">تحذير: عملية خطيرة!</span>
            </div>
            <p className="text-xs text-red-600">
              استعادة النسخة الاحتياطية ستؤدي إلى مسح جميع البيانات الحالية واستبدالها بمحتويات النسخة. هذه العملية لا يمكن التراجع عنها.
            </p>
            <p className="text-xs text-red-600">
              يوصى بإنشاء نسخة احتياطية جديدة قبل الاستعادة.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground-800">
              اكتب <span className="text-red-600 font-bold">استعادة</span> للتأكيد
            </label>
            <input
              type="text"
              value={restoreConfirmText}
              onChange={(e) => setRestoreConfirmText(e.target.value)}
              placeholder='اكتب "استعادة" هنا...'
              className="w-full px-3 py-2 text-sm bg-background-50 border border-foreground-200 rounded-md text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-background-200/70">
            <Button variant="ghost" size="sm" onClick={() => setShowRestoreModal(false)} disabled={actionLoading}>
              إلغاء
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRestoreBackup}
              loading={actionLoading}
              disabled={restoreConfirmText !== 'استعادة'}
            >
              تأكيد الاستعادة
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!showDeleteConfirm} onClose={() => !actionLoading && setShowDeleteConfirm(null)} title="تأكيد الحذف" size="sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <i className="ri-delete-bin-line text-red-500 text-lg" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-foreground-900">هل أنت متأكد من حذف هذه النسخة؟</span>
              <span className="text-xs text-foreground-500">سيتم حذف الملف من التخزين السحابي ولن يمكن استعادته</span>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-background-200/70">
            <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(null)} disabled={actionLoading}>
              إلغاء
            </Button>
            <Button variant="primary" size="sm" onClick={handleDeleteBackup} loading={actionLoading}>
              تأكيد الحذف
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}