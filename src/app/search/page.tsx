'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import Avatar from '@/components/Avatar';
import AppLayout from '@/components/AppLayout';
import { searchApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface SearchResult {
  type: 'user' | 'post';
  _id: string;
  username?: string;
  name?: string;
  avatar?: string;
  caption?: string;
  mediaUrl?: string;
}

const RECENT_KEY = 'sc_recent_searches';
const getRecent = (): SearchResult[] => {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
};
const saveRecent = (item: SearchResult) => {
  const prev = getRecent().filter(r => r._id !== item._id).slice(0, 9);
  localStorage.setItem(RECENT_KEY, JSON.stringify([item, ...prev]));
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recent, setRecent] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const router = useRouter();

  useEffect(() => { setRecent(getRecent()); }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchApi.search(query);
        setResults(res.data.data || []);
      } catch { toast.error('Error al buscar'); }
      finally { setLoading(false); }
    }, 400);
  }, [query]);

  const handleSelect = (item: SearchResult) => {
    saveRecent(item);
    setRecent(getRecent());
    if (item.type === 'user') {
      router.push(`/profile/${item._id}`);
    }
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = getRecent().filter(r => r._id !== id);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    setRecent(updated);
  };

  const handleClearAll = () => {
    localStorage.removeItem(RECENT_KEY);
    setRecent([]);
  };

  const showRecent = !query && recent.length > 0;
  const showResults = !!query && results.length > 0;

  return (
    <AppLayout>
      <div className="max-w-[560px] mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-semibold text-white">Buscar</h1>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar usuarios o posts..."
            className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-sm text-white placeholder-gray-600 focus:border-[#c9a84c] transition-colors"
          />
        </div>

        <div className="bg-[#141414] rounded-xl border border-[#1e1e1e] overflow-hidden">
          {showRecent && (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e]">
                <span className="text-sm font-medium text-white">Recientes</span>
                <button onClick={handleClearAll} className="text-xs text-gray-400 hover:text-white transition-colors">Borrar todo</button>
              </div>
              {recent.map(item => (
                <ResultRow key={item._id} item={item} onSelect={handleSelect} onRemove={handleRemove} showRemove />
              ))}
            </>
          )}

          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {showResults && !loading && results.map(item => (
            <ResultRow key={item._id} item={item} onSelect={handleSelect} onRemove={handleRemove} />
          ))}

          {query && !loading && results.length === 0 && (
            <div className="py-8 text-center text-gray-500 text-sm">No se encontraron resultados para "{query}"</div>
          )}

          {!query && recent.length === 0 && (
            <div className="py-10 text-center text-gray-600 text-sm">Busca usuarios o publicaciones</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function ResultRow({ item, onSelect, onRemove, showRemove }: {
  item: SearchResult;
  onSelect: (item: SearchResult) => void;
  onRemove: (id: string, e: React.MouseEvent) => void;
  showRemove?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 hover:bg-[#1a1a1a] cursor-pointer transition-colors border-b border-[#1e1e1e] last:border-0"
      onClick={() => onSelect(item)}
    >
      {item.type === 'user' ? (
        <>
          <Avatar src={item.avatar} username={item.username} size={40} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">{item.username}</p>
            {item.name && <p className="text-xs text-gray-500 truncate">{item.name}</p>}
          </div>
          <span className="text-xs text-gray-600 bg-[#222] px-2 py-0.5 rounded-full shrink-0">usuario</span>
        </>
      ) : (
        <>
          {item.mediaUrl
            ? <img src={item.mediaUrl} alt="" className="w-10 h-10 rounded-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            : <div className="w-10 h-10 rounded-lg bg-[#222] flex items-center justify-center text-gray-500 text-sm">📷</div>
          }
          <p className="text-sm text-gray-300 flex-1 truncate">{item.caption}</p>
          <span className="text-xs text-gray-600 bg-[#222] px-2 py-0.5 rounded-full shrink-0">post</span>
        </>
      )}
      {showRemove && (
        <button onClick={(e) => onRemove(item._id, e)} className="w-5 h-5 rounded-full bg-[#2a2a2a] flex items-center justify-center text-gray-400 hover:text-white shrink-0 ml-1">
          <X size={10} />
        </button>
      )}
    </div>
  );
}
