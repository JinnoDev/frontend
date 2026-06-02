'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Heart, Repeat2, Send } from 'lucide-react';
import { postsApi, commentsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from './Avatar';
import toast from 'react-hot-toast';

export interface PostData {
  _id: string;
  authorId: { _id: string; username: string; avatar: string } | string;
  caption: string;
  mediaUrl: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  createdAt?: string;
  liked?: boolean;
  reposted?: boolean;
  isRepost?: boolean;
}

interface Props {
  post: PostData;
  onClose: () => void;
  onUpdate?: (updated: Partial<PostData>) => void;
}

export default function PostModal({ post: initialPost, onClose, onUpdate }: Props) {
  const [post, setPost] = useState(initialPost);
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const author = typeof post.authorId === 'object' ? post.authorId : null;
  const username = author?.username || 'usuario';
  const authorId = author?._id;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    commentsApi.getComments(post._id)
      .then(res => setComments((res.data.data || []).reverse()))
      .catch(() => {});
  }, [post._id]);

  const handleLike = async () => {
    if (post.liked) {
      try {
        await postsApi.unlikePost(post._id);
        const u = { liked: false, likesCount: Math.max(0, post.likesCount - 1) };
        setPost(p => ({ ...p, ...u })); onUpdate?.(u);
      } catch {}
    } else {
      try {
        await postsApi.likePost(post._id);
        const u = { liked: true, likesCount: post.likesCount + 1 };
        setPost(p => ({ ...p, ...u })); onUpdate?.(u);
      } catch (err: any) {
        if (err.response?.status === 409) setPost(p => ({ ...p, liked: true }));
      }
    }
  };

  const handleRepost = async () => {
    try {
      const res = await postsApi.repost(post._id);
      const u = { reposted: res.data.reposted, repostsCount: res.data.repostsCount };
      setPost(p => ({ ...p, ...u })); onUpdate?.(u);
      toast(res.data.reposted ? 'Reposteado ✓' : 'Repost quitado', { icon: res.data.reposted ? '🔁' : 'ℹ️' });
    } catch { toast.error('Error al repostear'); }
  };

  const handleComment = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await commentsApi.createComment(post._id, text);
      // API now returns populated authorId — use it directly
      // If not populated (old API), inject current user as fallback
      const commentData = res.data;
      if (!commentData.authorId || typeof commentData.authorId === 'string') {
        commentData.authorId = { _id: user?._id, username: user?.username, avatar: user?.avatar || null };
      }
      setComments(prev => [...prev, commentData]);
      setText('');
      const u = { commentsCount: post.commentsCount + 1 };
      setPost(p => ({ ...p, ...u })); onUpdate?.(u);
    } catch { toast.error('Error al comentar'); }
    finally { setSending(false); }
  };

  const goToAuthor = () => {
    if (!authorId) return;
    onClose();
    if (authorId === user?._id) router.push('/profile');
    else router.push(`/profile/${authorId}`);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden max-w-3xl w-full max-h-[90vh] flex flex-col md:flex-row"
        onClick={e => e.stopPropagation()}
      >
        {/* Image */}
        <div className="flex-1 bg-black flex items-center justify-center min-h-[250px]">
          {post.mediaUrl ? (
            <img src={post.mediaUrl} alt="" className="max-h-[85vh] max-w-full object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div className="text-gray-600 text-sm p-8 text-center">{post.caption || 'Sin imagen'}</div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-full md:w-[300px] flex flex-col shrink-0 max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
            <div className="flex items-center gap-2 cursor-pointer" onClick={goToAuthor}>
              <Avatar src={author?.avatar} username={username} size={32} />
              <span className="text-sm font-semibold text-white hover:text-[#c9a84c] transition-colors">{username}</span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={18} /></button>
          </div>

          {/* Caption + comments */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
            {post.caption && (
              <p className="text-sm text-gray-300 leading-relaxed">
                <button onClick={goToAuthor} className="font-semibold text-white hover:text-[#c9a84c] mr-1 transition-colors">{username}</button>
                {post.caption}
              </p>
            )}
            {comments.map(c => {
              const cAuthor = typeof c.authorId === 'object' && c.authorId ? c.authorId : null;
              // Only use the comment's own author data — never borrow from current user
              const cUsername = cAuthor?.username || 'usuario';
              const cAvatar = cAuthor?.avatar || null;
              const cId = cAuthor?._id;
              return (
                <div key={c._id} className="flex gap-2">
                  <Avatar src={cAvatar} username={cUsername} size={28}
                    onClick={() => {
                      if (!cId) return;
                      onClose();
                      if (cId === user?._id) router.push('/profile');
                      else router.push(`/profile/${cId}`);
                    }} />
                  <p className="text-sm text-gray-300">
                    <span className="font-semibold text-white mr-1">{cUsername}</span>{c.text}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="px-4 py-3 border-t border-[#2a2a2a]">
            <div className="flex items-center gap-4 mb-3">
              <button onClick={handleLike}
                className={`flex items-center gap-1.5 transition-colors ${post.liked ? 'text-red-400' : 'text-gray-400 hover:text-[#c9a84c]'}`}>
                <Heart size={20} strokeWidth={1.5} fill={post.liked ? 'currentColor' : 'none'} />
                <span className="text-xs">{post.likesCount}</span>
              </button>
              <button onClick={handleRepost}
                className={`flex items-center gap-1.5 transition-colors ${post.reposted ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}>
                <Repeat2 size={20} strokeWidth={1.5} />
                <span className="text-xs">{post.repostsCount}</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Avatar src={user?.avatar} username={user?.username} size={28} />
              <input value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleComment()}
                placeholder="Añade un comentario..."
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none" />
              <button onClick={handleComment} disabled={sending || !text.trim()} className="text-[#c9a84c] disabled:opacity-30">
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
