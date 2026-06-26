import { create } from 'zustand';
import type { Notification } from '@/types/supabase';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isPanelOpen: boolean;
  loading: boolean;
  error: string;
  _channel: RealtimeChannel | null;
  _initialized: boolean;

  loadNotifications: () => Promise<void>;
  initRealtime: () => () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  togglePanel: () => void;
  closePanel: () => void;
  addNotification: (notif: { user_id: string; title: string; message: string; type: string; is_read: boolean; link?: string }) => Promise<void>;
}

let realtimeSeq = 0;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isPanelOpen: false,
  loading: false,
  error: '',
  _channel: null,
  _initialized: false,

  loadNotifications: async () => {
    const { _initialized, loading } = get();
    if (_initialized || loading) return;

    set({ loading: true, error: '' });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        set({ loading: false, _initialized: true });
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('get-notifications', {
        body: { page: 1, page_size: 50 },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const notifs: Notification[] = data?.notifications || [];
      set({
        notifications: notifs,
        unreadCount: notifs.filter((n) => !n.is_read).length,
        loading: false,
        error: '',
        _initialized: true,
      });
    } catch (err: unknown) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'فشل في تحميل الإشعارات',
        _initialized: true,
      });
    }
  },

  initRealtime: () => {
    const existingChannel = get()._channel;
    if (existingChannel) {
      return () => {
        supabase.removeChannel(existingChannel);
        set({ _channel: null });
      };
    }

    realtimeSeq += 1;
    const channelName = `notifications-realtime-${realtimeSeq}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          set((state) => {
            const exists = state.notifications.some((n) => n.id === newNotif.id);
            if (exists) return state;

            return {
              notifications: [newNotif, ...state.notifications],
              unreadCount: newNotif.is_read ? state.unreadCount : state.unreadCount + 1,
            };
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const updated = payload.new as Notification;
          set((state) => {
            const exists = state.notifications.some((n) => n.id === updated.id);
            if (!exists) return state;

            const updatedList = state.notifications.map((n) =>
              n.id === updated.id ? updated : n,
            );
            return {
              notifications: updatedList,
              unreadCount: updatedList.filter((n) => !n.is_read).length,
            };
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const deleted = payload.old as { id: string };
          set((state) => {
            const filtered = state.notifications.filter((n) => n.id !== deleted.id);
            return {
              notifications: filtered,
              unreadCount: filtered.filter((n) => !n.is_read).length,
            };
          });
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          setTimeout(() => {
            const currentChannel = get()._channel;
            if (currentChannel) {
              supabase.removeChannel(currentChannel);
              set({ _channel: null });
            }
            get().initRealtime();
          }, 3000);
        }
      });

    set({ _channel: channel });

    return () => {
      supabase.removeChannel(channel);
      set({ _channel: null });
    };
  },

  markAsRead: (id: string) => {
    const { notifications } = get();
    const notif = notifications.find((n) => n.id === id);
    if (!notif || notif.is_read) return;

    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n,
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.is_read).length,
      };
    });

    supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .then();
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));

    supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false)
      .then();
  },

  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),

  closePanel: () => set({ isPanelOpen: false }),

  addNotification: async (notif) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notif.user_id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        is_read: false,
        link: notif.link || null,
      })
      .select('*')
      .single();

    if (error || !data) return;

    set((state) => ({
      notifications: [data as Notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
}));