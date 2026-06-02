'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from './Avatar';
import { X } from 'lucide-react';
import { usersApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface FollowUser {
  _id: string;
  username: string;
  avatar: string;
  name?: string;
}

interface Props {
  userId: string;
  mode: 'followers' | 'following';
  onClose: () => void;
}

export default function FollowListModal({ userId, mode, onClose }: Props) {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const { user: me } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetch = mode === 'followers'
      ? usersApi.getFollowers(userId)
      : usersApi.getFollowing(userId);

    fetch
      .then(res => setUsers(res.data.data || []))
      .catch(() => toast.error('Error al cargar lista'))
      .finally(() => setLoading(false));

    // Also get my following to show follow/unfollow buttons
    if (me) {
      usersApi.getFollowing(me._id)
        .then(res => {
          const ids = new Set<string>((res.data.data || []).map((u: FollowUser) => u._id));
          setFollowingSet(ids);
        })
        .catch(() => {});
    }
  }, [userId, mode, me]);

  const handleFollow = async (targetId: string) => {
    try {
      if (followingSet.has(targetId)) {
        await usersApi.unfollow(targetId);
        setFollowingSet(prev => { const s = new Set(prev); s.delete(targetId); return s; });
      } else {
        await usersApi.follow(targetId);
        setFollowingSet(prev => new Set(prev).add(targetId));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleUserClick = (targetId: string) => {
    onClose();
    if (targetId === me?._id) router.push('/profile');
    else router.push(`/profile/${targetId}`);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-sm max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a]">
          <h2 className="text-base font-semibold text-white">{mode === 'followers' ? 'Seguidores' : 'Siguiendo'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">
              {mode === 'followers' ? 'Aún no tienes seguidores' : 'No sigues a nadie aún'}
            </div>
          ) : (
            users.map(u => (
              <div key={u._id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#1a1a1a] transition-colors">
                <Avatar src={u.avatar} username={u.username} size={40} onClick={() => handleUserClick(u._id)} />
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleUserClick(u._id)}>
                  <p className="text-sm font-medium text-white truncate">{u.username}</p>
                  {u.name && <p className="text-xs text-gray-500 truncate">{u.name}</p>}
                </div>
                {me && u._id !== me._id && (
                  <button
                    onClick={() => handleFollow(u._id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                      followingSet.has(u._id)
                        ? 'border border-[#2a2a2a] text-white hover:bg-[#1a1a1a]'
                        : 'bg-[#c9a84c] text-black hover:bg-[#e4c46a]'
                    }`}
                  >
                    {followingSet.has(u._id) ? 'Siguiendo' : 'Seguir'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
