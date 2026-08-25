'use client';

import { Avatar } from '@heroui/react';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

const TONE = {
  admin: 'accent',
  agent: 'success',
  designer: 'warning',
  client: 'default',
};

export default function InitialsAvatar({ name, role = 'client', size = 'md', src, className = '' }) {
  return (
    <Avatar color={TONE[role] || 'default'} size={size} className={className}>
      {src && <Avatar.Image src={src} alt={name} />}
      <Avatar.Fallback>{getInitials(name)}</Avatar.Fallback>
    </Avatar>
  );
}
