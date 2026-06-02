'use client';
import { useState, useEffect, useRef } from 'react';
import { Plus, X, Camera, Repeat2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import PostModal, { PostData } from '@/components/PostModal';
import FollowListModal from '@/components/FollowListModal';
import Avatar from '@/components/Avatar';
import { postsApi, uploadAvatar, usersApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import toast from 'react-hot-toast';

function formatCount(n: number) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' M';
  if (n >= 1000) return (n / 1000).toFixed(0) + ' mil';
  return n.toString();
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const [followModal, setFollowModal] = useState<'followers' | 'following' | null>(null);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [caption, setCaption] = useState('');
  const [postFile, setPostFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const postFileRef = useRef<HTMLInputElement>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const loadPosts = async () => {
    try {
      const res = await postsApi.getMyPosts();
      setPosts(res.data.data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditBio(user.bio || '');
      loadPosts();
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      if (avatarFile) {
        await uploadAvatar(avatarFile);
      }
      await usersApi.updateMe({ name: editName, bio: editBio });
      // Refresh user data from server to get updated avatar URL everywhere
      await refreshUser();
      setShowEditModal(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast.success('Perfil actualizado');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleNewPost = async () => {
    if (!caption.trim() && !postFile) { toast.error('Agrega una imagen o caption'); return; }
    setPosting(true);
    try {
      const fd = new FormData();
      fd.append('caption', caption);
      if (postFile) fd.append('media', postFile);
      const res = await postsApi.createPost(fd);
      toast.success('Post publicado!');
      setShowNewPost(false); setCaption(''); setPostFile(null);
      // Add new post immediately to the top
      setPosts(prev => [res.data, ...prev]);
    } catch { toast.error('Error al publicar'); }
    finally { setPosting(false); }
  };

  const updatePost = (id: string, changes: Partial<PostData>) => {
    setPosts(prev => prev.map(p => p._id === id ? { ...p, ...changes } : p));
    if (selectedPost?._id === id) setSelectedPost(p => p ? { ...p, ...changes } : p);
  };

  if (!user) return null;

  const currentAvatar = avatarPreview || user.avatar;
  const ownPostCount = posts.filter(p => !p.isRepost).length;

  return (
    <AppLayout>
      <div className="max-w-[720px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start gap-8 mb-8">
          <div className="shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-[#1a1a1a] border-2 border-[#2a2a2a]">
              {currentAvatar
                ? <img src={currentAvatar} alt={user.username} className="w-full h-full object-cover" />
                : <Logo size={80} />}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <h1 className="text-xl font-semibold text-white">{user.username}</h1>
              <button onClick={() => setShowEditModal(true)}
                className="px-4 py-1.5 rounded-lg border border-[#2a2a2a] text-sm text-white hover:bg-[#1a1a1a] transition-colors">
                Editar perfil
              </button>
            </div>
            <div className="flex items-center gap-6 mb-3">
              <span className="text-sm text-gray-400"><b className="text-white">{ownPostCount}</b> Publicaciones</span>
              <button onClick={() => setFollowModal('followers')} className="text-sm text-gray-400 hover:text-white transition-colors">
                <b className="text-white">{formatCount(user.followersCount)}</b> seguidores
              </button>
              <button onClick={() => setFollowModal('following')} className="text-sm text-gray-400 hover:text-white transition-colors">
                <b className="text-white">{formatCount(user.followingCount)}</b> seguidos
              </button>
            </div>
            {user.name && <p className="text-sm font-medium text-white mb-1">{user.name}</p>}
            {user.bio && <p className="text-sm text-gray-400">{user.bio}</p>}
          </div>
        </div>

        <div className="border-t border-[#1e1e1e] mb-6" />

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => setShowNewPost(true)}
              className="aspect-square rounded-lg border-2 border-dashed border-[#2a2a2a] flex flex-col items-center justify-center gap-1 hover:border-[#c9a84c] hover:text-[#c9a84c] text-gray-600 transition-colors">
              <Plus size={22} /><span className="text-xs">Nueva</span>
            </button>

            {posts.map(post => {
              const postAuthor = typeof post.authorId === 'object' ? post.authorId : null;
              const isRepost = post.isRepost;
              return (
                <div key={post._id} onClick={() => setSelectedPost(post)}
                  className="aspect-square rounded-lg overflow-hidden bg-[#141414] relative group cursor-pointer">
                  {post.mediaUrl
                    ? <img src={post.mediaUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    : <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a] text-gray-600 text-xs p-1 text-center">{post.caption?.slice(0, 30)}</div>}

                  {/* Repost badge */}
                  {isRepost && (
                    <div className="absolute top-1.5 left-1.5 bg-black/70 rounded-full px-1.5 py-0.5 flex items-center gap-1">
                      <Repeat2 size={10} className="text-green-400" />
                      {postAuthor && (
                        <button
                          onClick={e => { e.stopPropagation(); if (postAuthor._id === user._id) router.push('/profile'); else router.push(`/profile/${postAuthor._id}`); }}
                          className="text-[10px] text-gray-300 hover:text-white leading-none"
                        >
                          {postAuthor.username}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <span className="text-white text-xs font-bold">♥ {post.likesCount}</span>
                    <span className="text-white text-xs font-bold">💬 {post.commentsCount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Editar perfil</h2>
              <button onClick={() => { setShowEditModal(false); setAvatarPreview(null); setAvatarFile(null); }} className="text-gray-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-[#1a1a1a] border-2 border-[#2a2a2a]">
                    {(avatarPreview || user.avatar)
                      ? <img src={avatarPreview || user.avatar} alt="" className="w-full h-full object-cover" />
                      : <Logo size={80} />}
                  </div>
                  <button onClick={() => avatarFileRef.current?.click()}
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#c9a84c] flex items-center justify-center text-black hover:bg-[#e4c46a]">
                    <Camera size={14} />
                  </button>
                </div>
                <input ref={avatarFileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); } }} />
                {avatarFile && <p className="text-xs text-[#c9a84c]">Nueva foto seleccionada ✓</p>}
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nombre</label>
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:border-[#c9a84c] transition-colors" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Biografía</label>
                <textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={3} maxLength={160}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white resize-none focus:border-[#c9a84c] transition-colors" />
              </div>
              <button onClick={handleSaveProfile} disabled={saving}
                className="w-full bg-[#c9a84c] hover:bg-[#e4c46a] disabled:opacity-50 text-black font-semibold py-2.5 rounded-lg text-sm transition-colors">
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Post Modal */}
      {showNewPost && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Nueva publicación</h2>
              <button onClick={() => { setShowNewPost(false); setCaption(''); setPostFile(null); }} className="text-gray-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="flex flex-col gap-3">
              <div onClick={() => postFileRef.current?.click()}
                className="w-full h-44 rounded-xl border-2 border-dashed border-[#2a2a2a] hover:border-[#c9a84c] flex items-center justify-center cursor-pointer transition-colors overflow-hidden">
                {postFile
                  ? <img src={URL.createObjectURL(postFile)} alt="" className="w-full h-full object-cover" />
                  : <div className="text-center text-gray-500"><div className="text-3xl mb-2">📷</div><p className="text-xs">Click para subir imagen</p></div>}
              </div>
              <input ref={postFileRef} type="file" accept="image/*" className="hidden" onChange={e => setPostFile(e.target.files?.[0] || null)} />
              <textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="Escribe un caption..." rows={3} maxLength={2200}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white resize-none focus:border-[#c9a84c] transition-colors placeholder-gray-600" />
              <button onClick={handleNewPost} disabled={posting}
                className="w-full bg-[#c9a84c] hover:bg-[#e4c46a] disabled:opacity-50 text-black font-semibold py-2.5 rounded-lg text-sm transition-colors">
                {posting ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPost && <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} onUpdate={changes => updatePost(selectedPost._id, changes)} />}
      {followModal && user && <FollowListModal userId={user._id} mode={followModal} onClose={() => setFollowModal(null)} />}
    </AppLayout>
  );
}
