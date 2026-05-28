'use client';

import { User } from '@/types';

interface UserAvatarProps {
  user?: Pick<User, 'name' | 'profileImage'> | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-16 w-16 text-xl',
  xl: 'h-28 w-28 text-3xl',
};

export function UserAvatar({ user, size = 'md', className = '' }: UserAvatarProps) {
  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? 'T';

  return (
    <div className={`${sizes[size]} relative shrink-0 overflow-hidden rounded-full border border-white/70 bg-gradient-to-br from-orange-500 to-zinc-950 font-bold text-white shadow-sm ${className}`}>
      {user?.profileImage ? (
        <img src={user.profileImage} alt={user.name ? `${user.name} profile` : 'Profile'} className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center">{initial}</span>
      )}
    </div>
  );
}
