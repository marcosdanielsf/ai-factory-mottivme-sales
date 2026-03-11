import React, { useState } from 'react';

const AVATAR_COLORS = [
  'bg-blue-600', 'bg-purple-600', 'bg-pink-600', 'bg-orange-600',
  'bg-teal-600', 'bg-cyan-600', 'bg-indigo-600', 'bg-rose-600',
];

const getAvatarColor = (name: string): string => {
  const charCode = (name || 'A').charCodeAt(0);
  return AVATAR_COLORS[charCode % AVATAR_COLORS.length];
};

const isValidImageUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

interface ContactAvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ContactAvatar: React.FC<ContactAvatarProps> = ({
  name,
  photoUrl,
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-7 h-7 text-[11px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  };

  if (photoUrl && !imgError && isValidImageUrl(photoUrl)) {
    return (
      <img
        src={photoUrl}
        alt={name}
        onError={() => setImgError(true)}
        className={`${sizeClasses[size]} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 ${getAvatarColor(name)} ${className}`}
    >
      {(name || '?')[0]?.toUpperCase() || '?'}
    </div>
  );
};
