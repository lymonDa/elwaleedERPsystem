import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import Badge from '@/components/base/Badge';
import { notificationTypeLabels, notificationTypeIcons, notificationTypeColors } from '@/mocks/notifications';
import type { Notification } from '@/types/supabase';

type FilterType = 'all' | 'unread' | 'task_assigned' | 'task_status_changed' | 'task_comment' | 'task_due_soon' | 'task_overdue';

const filterTabs: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'unread', label: 'غير مقروء' },
  { key: 'task_assigned', label: 'تعيين مهمة' },
  { key: 'task_status_changed', label: 'تغيير حالة' },
  { key: 'task_comment', label: 'تعليقات' },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const payload: Record<string, unknown> = { page: 1, page_size: 50 };
      if (filter === 'unread') {
        payload.is_read = false;
      } else if (filter !== 'all') {
        payload.type = filter;
      }

      const { data, error: fnError } = await supabase.functions.invoke('get-notifications', {
        body: payload,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setNotifications(data?.notifications || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'فشل في تحميل الإشعارات');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = useMemo(() => {
    let result = notifications;
    if (filter === 'unread') {
      result = result.filter((n) => !n.is_read);
    } else if (filter !== 'all') {
      result = result.filter((n) => n.type === filter);
    }
    return result;
  }, [notifications, filter]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleClick = (id: string) => {
    markAsRead(id);
    setSelectedNotification(selectedNotification === id ? null : id);
  };

  const markAsRead = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      // silent
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // silent
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'الآن';
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    if (diffHrs < 24) return `منذ ${diffHrs} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground-900 font-heading">الإشعارات</h1>
          <p className="text-sm text-foreground-500 mt-0.5">
            {unreadCount > 0
              ? `لديك ${unreadCount} إشعار غير مقروء`
              : 'جميع الإشعارات مقروءة'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors cursor-pointer whitespace-nowrap"
          >
            <span className="w-4 h-4 flex items-center justify-center">
              <i className="ri-check-double-line" />
            </span>
            تعليم الكل مقروء
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-background-50 border border-background-200/70 rounded-full px-1 py-1 w-fit overflow-x-auto max-w-full">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer whitespace-nowrap ${
              filter === tab.key
                ? 'bg-background-50 text-foreground-900 shadow-sm'
                : 'text-foreground-500 hover:text-foreground-700'
            }`}
          >
            {tab.label}
            {tab.key === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 bg-primary-500 text-background-50 text-[10px] font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-4 border-primary-300 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-sm text-foreground-400">جاري تحميل الإشعارات...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <i className="ri-error-warning-line text-4xl text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={fetchNotifications} className="text-xs text-primary-600 hover:text-primary-700">إعادة المحاولة</button>
        </div>
      )}

      {/* Notifications list */}
      {!loading && !error && (
        <div className="bg-background-50 border border-background-200/70 rounded-lg overflow-hidden">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-foreground-300">
              <span className="w-16 h-16 flex items-center justify-center mb-4">
                <i className="ri-notification-off-line text-4xl" />
              </span>
              <p className="text-sm font-medium">لا توجد إشعارات</p>
              <p className="text-xs mt-1">
                {filter !== 'all' ? 'جرّب تغيير الفلتر' : 'ستظهر الإشعارات هنا عند ورودها'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-background-200/70">
              {filteredNotifications.map((notif) => {
                const isSelected = selectedNotification === notif.id;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleClick(notif.id)}
                    className={`px-4 py-3.5 transition-colors cursor-pointer ${
                      !notif.is_read
                        ? 'bg-accent-50/50 hover:bg-accent-50'
                        : 'hover:bg-background-100'
                    } ${isSelected ? 'bg-background-100' : ''}`}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                          notificationTypeColors[notif.type] || 'bg-foreground-100 text-foreground-600'
                        }`}
                      >
                        <i className={notificationTypeIcons[notif.type] || 'ri-notification-3-line'} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 overflow-hidden">
                            <div className="flex items-center gap-2">
                              <h3 className={`text-sm font-medium text-foreground-900 ${!notif.is_read ? 'font-bold' : ''}`}>
                                {notif.title}
                              </h3>
                              {!notif.is_read && (
                                <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                              )}
                            </div>
                            <p
                              className={`text-xs text-foreground-500 mt-0.5 ${
                                isSelected ? '' : 'line-clamp-2'
                              }`}
                            >
                              {notif.message}
                            </p>
                          </div>
                          <span className="text-[11px] text-foreground-400 whitespace-nowrap flex-shrink-0">
                            {formatTime(notif.created_at)}
                          </span>
                        </div>

                        {/* Expanded actions */}
                        {isSelected && (
                          <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-background-200/50">
                            <Badge variant="neutral" className="text-[10px]">
                              {notificationTypeLabels[notif.type] || notif.type}
                            </Badge>
                            {notif.link && (
                              <Link
                                to={notif.link}
                                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap"
                              >
                                <span className="w-3.5 h-3.5 flex items-center justify-center">
                                  <i className="ri-arrow-left-line" />
                                </span>
                                الذهاب للمهمة
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Summary bar */}
      {filteredNotifications.length > 0 && (
        <div className="flex items-center gap-4 px-4 py-3 bg-background-100 rounded-lg text-xs text-foreground-500">
          <span>عرض {filteredNotifications.length} إشعار</span>
          <span>•</span>
          <span>غير مقروء: {filteredNotifications.filter((n) => !n.is_read).length}</span>
          <span>•</span>
          <span>مقروء: {filteredNotifications.filter((n) => n.is_read).length}</span>
        </div>
      )}
    </div>
  );
}