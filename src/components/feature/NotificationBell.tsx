import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useNotificationStore } from '@/stores/notificationStore';
import { notificationTypeIcons, notificationTypeColors } from '@/mocks/notifications';

export default function NotificationBell() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    isPanelOpen,
    togglePanel,
    closePanel,
    markAsRead,
    loadNotifications,
  } = useNotificationStore();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closePanel();
      }
    };
    if (isPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPanelOpen, closePanel]);

  // Lock body scroll when panel is open
  useEffect(() => {
    if (isPanelOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isPanelOpen]);

  const recentNotifications = notifications.slice(0, 6);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'الآن';
    if (diffMin < 60) return `منذ ${diffMin} د`;
    if (diffHrs < 24) return `منذ ${diffHrs} س`;
    if (diffDays < 7) return `منذ ${diffDays} ي`;
    return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={togglePanel}
        className="relative w-9 h-9 flex items-center justify-center rounded-md text-foreground-500 hover:bg-background-200 transition-colors cursor-pointer"
        aria-label="الإشعارات"
      >
        <i className="ri-notification-3-line text-lg" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center text-[10px] font-bold text-background-50 bg-primary-500 rounded-full min-w-[18px] h-[18px] px-1 leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Backdrop blur overlay */}
      {isPanelOpen && (
        <div
          className="fixed inset-0 z-[55] backdrop-blur-sm bg-black/10"
          onClick={closePanel}
        />
      )}

      {/* Dropdown panel */}
      {isPanelOpen && (
        <div className="fixed top-16 z-[60] left-2 right-auto w-80 max-w-[calc(100vw-1rem)] sm:left-4 bg-white dark:bg-background-900 border border-background-200/70 rounded-lg shadow-2xl overflow-hidden ring-1 ring-background-200/50">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-background-200/70 bg-background-50/50 dark:bg-background-800/50">
            <h3 className="text-sm font-bold text-foreground-900 font-heading">الإشعارات</h3>
            {unreadCount > 0 && (
              <span className="text-[11px] font-medium text-primary-600 bg-primary-100 dark:bg-primary-900/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                {unreadCount} غير مقروء
              </span>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-primary-300 border-t-primary-500 rounded-full animate-spin" />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-foreground-300">
              <span className="w-10 h-10 flex items-center justify-center">
                <i className="ri-error-warning-line text-2xl text-red-400" />
              </span>
              <button
                onClick={loadNotifications}
                className="text-xs text-primary-600 hover:text-primary-700 cursor-pointer"
              >
                إعادة المحاولة
              </button>
            </div>
          )}

          {/* Notification list */}
          {!loading && !error && (
            <div className="max-h-[360px] overflow-y-auto bg-background-50 dark:bg-background-900">
              {recentNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-foreground-300">
                  <span className="w-10 h-10 flex items-center justify-center mb-2">
                    <i className="ri-notification-off-line text-2xl" />
                  </span>
                  <p className="text-xs">لا توجد إشعارات</p>
                </div>
              ) : (
                recentNotifications.map((notif) => (
                  <Link
                    key={notif.id}
                    to={notif.link || '/notifications'}
                    onClick={() => {
                      markAsRead(notif.id);
                      closePanel();
                    }}
                    className={`flex gap-3 px-4 py-3 hover:bg-background-100 dark:hover:bg-background-800 transition-colors cursor-pointer border-b border-background-200/30 last:border-b-0 ${
                      !notif.is_read ? 'bg-accent-50/40 dark:bg-accent-900/10' : ''
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        notificationTypeColors[notif.type] || 'bg-foreground-100 text-foreground-600'
                      }`}
                    >
                      <i className={`${notificationTypeIcons[notif.type] || 'ri-notification-3-line'} text-xs`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs text-foreground-900 leading-relaxed ${!notif.is_read ? 'font-bold' : 'font-medium'}`}>
                          {notif.title}
                        </p>
                        {!notif.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-[11px] text-foreground-500 mt-1 leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-foreground-400 mt-1.5">
                        {formatTime(notif.created_at)}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {/* Panel footer */}
          <Link
            to="/notifications"
            onClick={closePanel}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 border-t border-background-200/70 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors cursor-pointer bg-background-50/50 dark:bg-background-800/50"
          >
            عرض جميع الإشعارات
            <span className="w-3.5 h-3.5 flex items-center justify-center">
              <i className="ri-arrow-left-line" />
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}