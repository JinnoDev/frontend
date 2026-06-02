'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, Repeat2 } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import PostModal, { PostData } from '@/components/PostModal';
import Avatar from '@/components/Avatar';
import { postsApi, usersApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

function PostCard({ post, onLike, onComment, onRepost, onImageClick }: {
  post: PostData;
  onLike: (id: string) => void;
  onComment: (post: PostData) => void;
  onRepost: (id: string) => void;
  onImageClick: (post: PostData) => void;
}) {
  const router = useRouter();
  const author = typeof post.authorId === 'object' ? post.authorId : null;
  const username = author?.username || 'usuario';
  const authorId = author?._id;

  const timeAgo = (() => {
    try {
      const mins = Math.round((Date.now() - new Date(post.createdAt!).getTime()) / 60000);
      if (mins < 60) return `${mins} min`;
      if (mins < 1440) return `${Math.round(mins / 60)} h`;
      return `${Math.round(mins / 1440)} d`;
    } catch { return ''; }
  })();

  const goToProfile = () => {
    if (!authorId) return;
    router.push(`/profile/${authorId}`);
  };

  return (
    <div className="mb-8 max-w-[480px] mx-auto">
      {/* Author row */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar src={author?.avatar} username={username} size={36} onClick={goToProfile} />
        <div className="flex-1 min-w-0">
          <button
            onClick={goToProfile}
            className="text-sm font-semibold text-white hover:text-[#c9a84c] transition-colors"
          >
            {username}
          </button>
          {timeAgo && <p className="text-xs text-gray-500">{timeAgo}</p>}
        </div>
      </div>

      {/* Image */}
      {post.mediaUrl && (
        <div className="rounded-xl overflow-hidden mb-3 bg-[#141414] cursor-pointer" onClick={() => onImageClick(post)}>
          <img
            src={post.mediaUrl}
            alt=""
            className="w-full max-h-[500px] object-cover hover:opacity-95 transition-opacity"
            onError={(e) => { (e.target as HTMLImageElement).parentElement?.remove(); }}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => onLike(post._id)}
          className={`flex items-center gap-1.5 transition-colors ${post.liked ? 'text-red-400' : 'text-gray-400 hover:text-[#c9a84c]'}`}>
          <Heart size={20} strokeWidth={1.5} fill={post.liked ? 'currentColor' : 'none'} />
          <span className="text-xs">{post.likesCount}</span>
        </button>
        <button onClick={() => onComment(post)} className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors">
          <MessageCircle size={20} strokeWidth={1.5} />
          <span className="text-xs">{post.commentsCount}</span>
        </button>
        <button onClick={() => onRepost(post._id)}
          className={`flex items-center gap-1.5 transition-colors ${post.reposted ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}>
          <Repeat2 size={20} strokeWidth={1.5} />
          <span className="text-xs">{post.repostsCount}</span>
        </button>
      </div>

      {/* Caption */}
      {post.caption && (
        <p className="text-sm text-gray-300 leading-relaxed">
          <button onClick={goToProfile} className="font-semibold text-white hover:text-[#c9a84c] mr-1 transition-colors">
            {username}
          </button>
          {post.caption}
        </p>
      )}
    </div>
  );
}

export default function HomePage() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const { user } = useAuth();

  const fetchFeed = useCallback(async () => {
    if (!user) return;
    try {
      const res = await postsApi.getFeed();
      setPosts(res.data.data || []);
    } catch { toast.error('Error al cargar el feed'); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  const updatePost = (id: string, changes: Partial<PostData>) => {
    setPosts(prev => prev.map(p => p._id === id ? { ...p, ...changes } : p));
    if (selectedPost?._id === id) setSelectedPost(p => p ? { ...p, ...changes } : p);
  };

  const handleLike = async (postId: string) => {
    const post = posts.find(p => p._id === postId);
    if (!post) return;
    if (post.liked) {
      try { await postsApi.unlikePost(postId); updatePost(postId, { liked: false, likesCount: Math.max(0, post.likesCount - 1) }); } catch {}
    } else {
      try { await postsApi.likePost(postId); updatePost(postId, { liked: true, likesCount: post.likesCount + 1 }); }
      catch (err: any) { if (err.response?.status === 409) updatePost(postId, { liked: true }); }
    }
  };

  const handleRepost = async (postId: string) => {
    try {
      const res = await postsApi.repost(postId);
      updatePost(postId, { reposted: res.data.reposted, repostsCount: res.data.repostsCount });
      toast(res.data.reposted ? 'Reposteado ✓' : 'Repost quitado', { icon: res.data.reposted ? '🔁' : 'ℹ️' });
    } catch { toast.error('Error'); }
  };

  return (
    <AppLayout>
      <div className="max-w-[560px] mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg mb-2">Tu feed está vacío</p>
            <p className="text-sm">Sigue a usuarios en <span className="text-[#c9a84c]">Explorar</span> para ver sus publicaciones</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard key={post._id} post={post}
              onLike={handleLike}
              onComment={p => setSelectedPost(p)}
              onRepost={handleRepost}
              onImageClick={p => setSelectedPost(p)}
            />
          ))
        )}
      </div>

      {selectedPost && (
        <PostModal post={selectedPost} onClose={() => setSelectedPost(null)}
          onUpdate={changes => updatePost(selectedPost._id, changes)} />
      )}
    </AppLayout>
  );
}
