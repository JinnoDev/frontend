'use client';
import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Send, Pencil, X } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { chatsApi, usersApi, searchApi } from '@/lib/api';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import toast from 'react-hot-toast';

interface ChatUser {
  _id: string;
  username: string;
  avatar: string;
}

interface Chat {
  _id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  otherUser?: ChatUser;
}

interface Message {
  _id: string;
  senderId: string;
  chatId: string;
  content: string;
  createdAt: string;
}

function MessagesInner() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [searching, setSearching] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const activeChatRef = useRef<Chat | null>(null);

  // Get token for socket auth
  const token = typeof window !== 'undefined' ? document.cookie.match(/accessToken=([^;]+)/)?.[1] ?? null : null;
  const { joinChat, leaveChat, sendMessage: socketSend, onNewMessage, onChatUpdated } = useSocket(token);

  // Keep activeChatRef in sync
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  // Socket: listen for new messages
  useEffect(() => {
    const cleanup = onNewMessage((msg: Message) => {
      const currentChat = activeChatRef.current;
      if (currentChat && msg.chatId === currentChat._id) {
        setMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    });
    return cleanup;
  }, [onNewMessage]);

  // Socket: listen for chat list updates
  useEffect(() => {
    const cleanup = onChatUpdated((data: any) => {
      setChats(prev => prev.map(c =>
          c._id === data.chatId
              ? { ...c, lastMessage: data.lastMessage, lastMessageAt: data.lastMessageAt }
              : c
      ));
    });
    return cleanup;
  }, [onChatUpdated]);

  useEffect(() => {
    loadChats();
  }, [user]);

  useEffect(() => {
    const chatId = searchParams.get('chat');
    if (chatId && chats.length > 0) {
      const found = chats.find(c => c._id === chatId);
      if (found) setActiveChat(found);
    }
  }, [searchParams, chats]);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat._id);
      joinChat(activeChat._id);
    }
    return () => {
      if (activeChat) leaveChat(activeChat._id);
    };
  }, [activeChat]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchApi.search(searchQuery);
        const users = (res.data.data || []).filter((r: any) => r.type === 'user' && r._id !== user?._id);
        setSearchResults(users);
      } catch {} finally { setSearching(false); }
    }, 400);
  }, [searchQuery]);

  const loadChats = async () => {
    if (!user) return;
    try {
      const res = await chatsApi.getChats();
      const rawChats: Chat[] = res.data.data || [];
      const enriched = await Promise.all(rawChats.map(async (chat) => {
        const otherId = chat.participants.find((p: string) => p && p !== user._id);
        if (!otherId || otherId === 'undefined') return chat;
        try {
          const uRes = await usersApi.getProfile(otherId);
          return { ...chat, otherUser: { _id: uRes.data._id, username: uRes.data.username, avatar: uRes.data.avatar } };
        } catch { return chat; }
      }));
      setChats(enriched);
    } catch { toast.error('Error cargando chats'); }
    finally { setLoading(false); }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const res = await chatsApi.getMessages(chatId);
      const msgs = (res.data.data || []).reverse();
      setMessages(msgs);
      await chatsApi.markAsRead(chatId);
    } catch {}
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activeChat) return;
    const text = newMessage;
    setNewMessage('');
    // Send via socket — the gateway saves it and broadcasts back
    socketSend(activeChat._id, text);
  };

  const handleStartChat = async (targetUser: ChatUser) => {
    try {
      const res = await chatsApi.createChat([targetUser._id]);
      const newChat: Chat = { ...res.data, otherUser: targetUser };
      setChats(prev => {
        const exists = prev.find(c => c._id === newChat._id);
        return exists ? prev : [newChat, ...prev];
      });
      setActiveChat(newChat);
      setShowNewChat(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch { toast.error('Error al crear chat'); }
  };

  return (
      <AppLayout>
        <div className="flex h-screen">
          {/* Chat list */}
          <div className="w-[260px] border-r border-[#1e1e1e] flex flex-col shrink-0">
            <div className="px-4 py-4 border-b border-[#1e1e1e] flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">{user?.username}</h2>
                <p className="text-xs text-gray-500">Mensajes</p>
              </div>
              <button
                  onClick={() => setShowNewChat(true)}
                  className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-gray-400 hover:text-[#c9a84c] hover:border-[#c9a84c] transition-colors"
                  title="Nuevo chat"
              >
                <Pencil size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
                  </div>
              ) : chats.length === 0 ? (
                  <div className="text-center py-10 text-gray-600 text-sm px-4">
                    No tienes chats aún.<br />
                    <button onClick={() => setShowNewChat(true)} className="text-[#c9a84c] mt-1 hover:underline">Iniciar uno</button>
                  </div>
              ) : (
                  chats.map(chat => (
                      <div
                          key={chat._id}
                          onClick={() => setActiveChat(chat)}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${activeChat?._id === chat._id ? 'bg-[#1a1a1a]' : 'hover:bg-[#141414]'}`}
                      >
                        <Avatar src={chat.otherUser?.avatar} username={chat.otherUser?.username} size={36} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{chat.otherUser?.username || 'Usuario'}</p>
                          {chat.lastMessage && <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>}
                        </div>
                      </div>
                  ))
              )}
            </div>
          </div>

          {/* Conversation */}
          <div className="flex-1 flex flex-col">
            {activeChat ? (
                <>
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1e1e1e]">
                    <Avatar src={activeChat.otherUser?.avatar} username={activeChat.otherUser?.username} size={32}
                            onClick={() => activeChat.otherUser && router.push(`/profile/${activeChat.otherUser._id}`)} />
                    <button
                        onClick={() => activeChat.otherUser && router.push(`/profile/${activeChat.otherUser._id}`)}
                        className="text-sm font-semibold text-white hover:text-[#c9a84c] transition-colors"
                    >
                      {activeChat.otherUser?.username || 'Usuario'}
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2">
                    {messages.map(msg => {
                      const isMe = msg.senderId === user?._id;
                      return (
                          <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[65%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-[#c9a84c] text-black font-medium rounded-br-sm' : 'bg-[#1a1a1a] text-white rounded-bl-sm'}`}>
                              {msg.content}
                            </div>
                          </div>
                      );
                    })}
                    <div ref={endRef} />
                  </div>

                  <div className="px-5 py-3 border-t border-[#1e1e1e] flex items-center gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 bg-[#141414] border border-[#2a2a2a] rounded-full px-4 py-2 text-sm text-white placeholder-gray-600 focus:border-[#c9a84c] transition-colors"
                    />
                    <button onClick={handleSend} className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-gray-400 hover:text-[#c9a84c] transition-colors">
                      <Send size={15} />
                    </button>
                  </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
                  <p className="text-lg mb-2">Selecciona un chat</p>
                  <button onClick={() => setShowNewChat(true)} className="text-sm text-[#c9a84c] hover:underline">o inicia uno nuevo</button>
                </div>
            )}
          </div>
        </div>

        {/* New chat modal */}
        {showNewChat && (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Nuevo mensaje</h2>
                  <button onClick={() => { setShowNewChat(false); setSearchQuery(''); setSearchResults([]); }} className="text-gray-500 hover:text-white"><X size={20} /></button>
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar usuario..."
                    autoFocus
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#c9a84c] transition-colors mb-3"
                />
                {searching && <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" /></div>}
                {searchResults.map(u => (
                    <div key={u._id} onClick={() => handleStartChat(u)}
                         className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#1a1a1a] cursor-pointer transition-colors">
                      <Avatar src={u.avatar} username={u.username} size={36} />
                      <span className="text-sm text-white">{u.username}</span>
                    </div>
                ))}
                {searchQuery && !searching && searchResults.length === 0 && (
                    <p className="text-center text-gray-500 text-sm py-4">Sin resultados</p>
                )}
              </div>
            </div>
        )}
      </AppLayout>
  );
}

export default function MessagesPage() {
  return (
      <Suspense fallback={<div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" /></div>}>
        <MessagesInner />
      </Suspense>
  );
}
