'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import PostModal, { PostData } from '@/components/PostModal';
import FollowListModal from '@/components/FollowListModal';
import { usersApi, postsApi, chatsApi } from '@/lib/api';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

function formatCount(n: number) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' M';
  if (n >= 1000) return (n / 1000).toFixed(0) + ' mil';
  return n.toString();
}

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const [followModal, setFollowModal] = useState<'followers' | 'following' | null>(null);
  const [startingChat, setStartingChat] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      usersApi.getProfile(userId),
      postsApi.getPostsByUser(userId),
      user ? usersApi.getFollowing(user._id) : Promise.resolve({ data: { data: [] } }),
    ])
      .then(([pRes, postsRes, followingRes]) => {
        setProfile(pRes.data);
        setPosts(postsRes.data.data || []);
        const ids = (followingRes.data.data || []).map((u: any) => u._id);
        setFollowing(ids.includes(userId));
      })
      .catch(() => toast.error('Error al cargar perfil'))
      .finally(() => setLoading(false));
  }, [userId, user]);

  const handleFollow = async () => {
    try {
      if (following) {
        await usersApi.unfollow(userId);
        setFollowing(false);
        setProfile((p: any) => p ? { ...p, followersCount: p.followersCount - 1 } : p);
      } else {
        await usersApi.follow(userId);
        setFollowing(true);
        setProfile((p: any) => p ? { ...p, followersCount: p.followersCount + 1 } : p);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleMessage = async () => {
    setStartingChat(true);
    try {
      const res = await chatsApi.createChat([userId]);
      router.push(`/messages?chat=${res.data._id}`);
    } catch {
      toast.error('Error al abrir chat');
    } finally {
      setStartingChat(false);
    }
  };

  const updatePost = (id: string, changes: Partial<PostData>) => {
    setPosts(prev => prev.map(p => p._id === id ? { ...p, ...changes } : p));
    if (selectedPost?._id === id) setSelectedPost(p => p ? { ...p, ...changes } : p);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="text-center py-20 text-gray-500">Usuario no encontrado</div>
      </AppLayout>
    );
  }

  const isOwn = user?._id === profile._id;

  return (
    <AppLayout>
      <div className="max-w-[720px] mx-auto px-6 py-8">
        <div className="flex items-start gap-8 mb-8">
          <div className="w-20 h-20 shrink-0">
            <Avatar src={profile.avatar} username={profile.username} size={80} className="border-2 border-[#2a2a2a]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <h1 className="text-xl font-semibold text-white">{profile.username}</h1>
              {!isOwn && (
                <>
                  <button
                    onClick={handleFollow}
                    className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-colors ${following ? 'border border-[#2a2a2a] text-white hover:bg-[#1a1a1a]' : 'bg-[#c9a84c] text-black hover:bg-[#e4c46a]'}`}
                  >
                    {following ? 'Siguiendo' : 'Seguir'}
                  </button>
                  <button
                    onClick={handleMessage}
                    disabled={startingChat}
                    className="w-9 h-9 rounded-lg border border-[#2a2a2a] flex items-center justify-center text-gray-400 hover:text-[#c9a84c] hover:border-[#c9a84c] transition-colors"
                    title="Enviar mensaje"
                  >
                    <MessageCircle size={17} />
                  </button>
                </>
              )}
            </div>
            <div className="flex gap-6 mb-3">
              <span className="text-sm text-gray-400"><b className="text-white">{posts.length}</b> publicaciones</span>
              <button onClick={() => setFollowModal('followers')} className="text-sm text-gray-400 hover:text-white transition-colors">
                <b className="text-white">{formatCount(profile.followersCount)}</b> seguidores
              </button>
              <button onClick={() => setFollowModal('following')} className="text-sm text-gray-400 hover:text-white transition-colors">
                <b className="text-white">{formatCount(profile.followingCount)}</b> seguidos
              </button>
            </div>
            {profile.name && <p className="text-sm font-medium text-white mb-1">{profile.name}</p>}
            {profile.bio && <p className="text-sm text-gray-400">{profile.bio}</p>}
          </div>
        </div>

        <div className="border-t border-[#1e1e1e] mb-6" />

        <div className="grid grid-cols-3 gap-1">
          {posts.map(post => (
            <div
              key={post._id}
              onClick={() => setSelectedPost(post)}
              className="aspect-square rounded-sm overflow-hidden bg-[#141414] relative group cursor-pointer"
            >
              {post.mediaUrl ? (
                <img
                  src={post.mediaUrl}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a] text-gray-600 text-xs p-2 text-center">
                  {post.caption?.slice(0, 30)}
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <span className="text-white text-xs font-bold">♥ {post.likesCount}</span>
                <span className="text-white text-xs font-bold">💬 {post.commentsCount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onUpdate={changes => updatePost(selectedPost._id, changes)}
        />
      )}
      {followModal && profile && (
        <FollowListModal userId={profile._id} mode={followModal} onClose={() => setFollowModal(null)} />
      )}
    </AppLayout>
  );
}
