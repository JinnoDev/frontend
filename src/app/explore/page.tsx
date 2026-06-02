'use client';
import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import PostModal, { PostData } from '@/components/PostModal';
import { postsApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ExplorePage() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);

  useEffect(() => {
    postsApi.getExplorePosts()
      .then(res => setPosts(res.data.data || []))
      .catch(() => toast.error('Error al cargar'))
      .finally(() => setLoading(false));
  }, []);

  const updatePost = (id: string, changes: Partial<PostData>) => {
    setPosts(prev => prev.map(p => p._id === id ? { ...p, ...changes } : p));
    if (selectedPost?._id === id) setSelectedPost(p => p ? { ...p, ...changes } : p);
  };

  return (
    <AppLayout>
      <div className="px-4 py-6 max-w-[900px] mx-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No hay publicaciones todavía</div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((post, i) => {
              const isTall = i % 7 === 0;
              return (
                <div key={post._id} onClick={() => setSelectedPost(post)}
                  className={`relative group cursor-pointer overflow-hidden rounded-sm bg-[#141414] ${isTall ? 'row-span-2' : ''}`}
                  style={{ aspectRatio: isTall ? undefined : '1/1', minHeight: isTall ? '320px' : '170px' }}>
                  {post.mediaUrl ? (
                    <img src={post.mediaUrl} alt=""
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}/>
                  ) : (
                    <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center text-gray-600 text-xs p-2 text-center">{post.caption?.slice(0, 40) || '📷'}</div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <span className="text-white text-sm font-bold">♥ {post.likesCount}</span>
                    <span className="text-white text-sm font-bold">💬 {post.commentsCount}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedPost && (
        <PostModal post={selectedPost} onClose={() => setSelectedPost(null)}
          onUpdate={changes => updatePost(selectedPost._id, changes)} />
      )}
    </AppLayout>
  );
}
