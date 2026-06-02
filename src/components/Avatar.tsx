'use client';
import { useState, useEffect } from 'react';

interface AvatarProps {
  src?: string | null;
  username?: string;
  size?: number;
  className?: string;
  onClick?: () => void;
}

// Stable inline SVG silhouette — never changes, no external dependency
const SILHOUETTE = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='50' fill='%232a2a2a'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%23666'/%3E%3Cellipse cx='50' cy='90' rx='32' ry='22' fill='%23666'/%3E%3C/svg%3E`;

function shouldUseSilhouette(src?: string | null): boolean {
  if (!src || src.trim() === '') return true;
  // Block known external placeholder services that change randomly
  const blocked = ['pravatar.cc', 'picsum.photos', 'placeholder.com', 'via.placeholder', 'unsplash.com', 'loremflickr'];
  if (blocked.some(b => src.includes(b))) return true;
  return false;
}

export default function Avatar({ src, username, size = 40, className = '', onClick }: AvatarProps) {
  const [imgSrc, setImgSrc] = useState<string>(shouldUseSilhouette(src) ? SILHOUETTE : src!);

  // Reset when src prop changes (e.g. after profile update)
  useEffect(() => {
    setImgSrc(shouldUseSilhouette(src) ? SILHOUETTE : src!);
  }, [src]);

  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        display: 'inline-block',
        backgroundColor: '#2a2a2a',
      }}
      className={`${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}`}
      onClick={onClick}
    >
      <img
        src={imgSrc}
        alt={username || ''}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onError={() => setImgSrc(SILHOUETTE)}
      />
    </div>
  );
}
