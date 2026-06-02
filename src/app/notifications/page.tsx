'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { notificationsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Heart, UserPlus, Repeat2, MessageCircle } from 'lucide-react';
import Avatar from '@/components/Avatar';

interface Notification {
  _id: string;
  type: 'like' | 'comment' | 'follow' | 'repost' | 'mention';
  message: string;
  read: boolean;
  createdAt: string;
  actorId: { _id: string; username: string; avatar: string } | string | null;
}

const TYPE_ICONS: Record<string, JSX.Element> = {
  like:    <Heart size={13} className="text-red-400" fill="currentColor" />,
  follow:  <UserPlus size={13} className="text-[#c9a84c]" />,
  comment: <MessageCircle size={13} className="text-blue-400" />,
  repost:  <Repeat2 size={13} className="text-green-400" />,
  mention: <span className="text-purple-400 text-xs font-bold">@</span>,
};

function timeAgo(date: string) {
  try {
    const mins = Math.round((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 60) return `${mins}m`;
    if (mins < 1440) return `${Math.round(mins / 60)}h`;
    return `${Math.round(mins / 1440)}d`;
  } catch { return ''; }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    notificationsApi.getNotifications()
      .then(res => {
        setNotifications(res.data.data || []);
        setUnread(res.data.unreadCount || 0);
      })
      .catch(() => toast.error('Error al cargar notificaciones'))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch { toast.error('Error'); }
  };

  const recent = notifications.filter(n => !n.read);
  const older = notifications.filter(n => n.read);

  return (
    <AppLayout>
      <div className="max-w-[560px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-white">Notificaciones</h1>
          {unread > 0 && (
            <button onClick={handleMarkAllRead} className="text-xs text-[#c9a84c] hover:underline">
              Marcar todo como leído
            </button>
          )}
        </div>

        <div className="bg-[#141414] rounded-xl border border-[#1e1e1e] overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {recent.length > 0 ? (
                recent.map(n => <NotifRow key={n._id} n={n} router={router} />)
              ) : (
                <div className="px-4 py-4 text-sm text-gray-500 border-b border-[#1e1e1e]">
                  No tienes notificaciones recientes
                </div>
              )}

              {older.length > 0 && (
                <>
                  <div className="px-4 py-2 border-t border-[#1e1e1e]">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Anteriores</span>
                  </div>
                  {older.map(n => <NotifRow key={n._id} n={n} router={router} />)}
                </>
              )}

              {notifications.length === 0 && (
                <div className="py-12 text-center text-gray-500 text-sm">No tienes notificaciones</div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function NotifRow({ n, router }: { n: Notification; router: ReturnType<typeof useRouter> }) {
  const actor = typeof n.actorId === 'object' && n.actorId !== null ? n.actorId : null;
  const username = actor?.username;
  const actorId = actor?._id;

  const goToProfile = () => {
    if (actorId) router.push(`/profile/${actorId}`);
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b border-[#1e1e1e] last:border-0 transition-colors hover:bg-[#1a1a1a] ${!n.read ? 'bg-[#181818]' : ''}`}>
      {/* Avatar with type icon */}
      <div className="relative shrink-0 cursor-pointer" onClick={goToProfile}>
        <Avatar src={actor?.avatar} username={username || ''} size={40} onClick={goToProfile} />
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#141414] flex items-center justify-center border border-[#2a2a2a]">
          {TYPE_ICONS[n.type] || <span className="text-xs">🔔</span>}
        </div>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-300 leading-snug">
          {username && actorId ? (
            <button onClick={goToProfile} className="font-semibold text-white hover:text-[#c9a84c] transition-colors mr-1">
              {username}
            </button>
          ) : null}
          {n.message}
        </p>
        {n.createdAt && (
          <span className="text-xs text-gray-600 mt-0.5 block">{timeAgo(n.createdAt)}</span>
        )}
      </div>

      {!n.read && <div className="w-2 h-2 rounded-full bg-[#c9a84c] shrink-0" />}
    </div>
  );
}
