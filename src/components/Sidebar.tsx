'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Compass, MessageCircle, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from './Avatar';
import Logo from './Logo';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/home', label: 'Inicio', icon: Home },
  { href: '/search', label: 'Búsqueda', icon: Search },
  { href: '/explore', label: 'Explorar', icon: Compass },
  { href: '/messages', label: 'Mensajes', icon: MessageCircle },
  { href: '/notifications', label: 'Notificaciones', icon: Bell },
  { href: '/profile', label: 'Perfil', icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try { await logout(); }
    catch { toast.error('Error al cerrar sesión'); }
  };

  return (
    <aside className="w-[180px] min-h-screen bg-[#0d0d0d] border-r border-[#1e1e1e] flex flex-col items-start px-5 py-6 fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="mb-8 self-center">
        <Logo size={72} />
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 w-full flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'text-[#c9a84c]' : 'text-gray-400 hover:text-white'
              }`}>
              <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      {user && (
        <div className="w-full mb-3 flex items-center gap-2">
          <Avatar src={user.avatar} username={user.username} size={28} />
          <span className="text-xs text-gray-400 truncate">{user.username}</span>
        </div>
      )}

      <button onClick={handleLogout}
        className="w-full py-2 px-3 rounded-lg border border-[#2a2a2a] text-gray-400 text-sm hover:text-white hover:border-[#444] transition-colors flex items-center gap-2">
        <LogOut size={16} />
        Cerrar Sesión
      </button>
    </aside>
  );
}
