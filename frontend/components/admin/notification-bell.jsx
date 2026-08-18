'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Popover, Chip } from '@heroui/react';
import { LuBell, LuInbox, LuMessageSquare, LuImage, LuClipboardList, LuX } from 'react-icons/lu';
import EmptyState from '@/components/admin/kit/empty-state';

const POLL_MS = 30_000;

const TYPE_ICON = {
  new_inquiry: LuMessageSquare,
  pending_media: LuImage,
  media_uploaded: LuClipboardList,
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hs = Math.floor(mins / 60);
  if (hs < 24) return `hace ${hs}h`;
  return `hace ${Math.floor(hs / 24)}d`;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setNotifications(data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, POLL_MS);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  const unread = notifications.filter((n) => !n.isRead).length;

  async function handleOpenChange(next) {
    setOpen(next);
    if (next && unread > 0) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      try {
        const res = await fetch('/api/notifications/read-all', { method: 'POST' });
        if (!res.ok) throw new Error();
      } catch {
        fetchNotifs();
      }
    }
  }

  async function handleDismiss(e, id) {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      fetchNotifs();
    }
  }

  function handleClick(notif) {
    if (notif.inquiryId) router.push(`/admin/cotizaciones?inquiry=${notif.inquiryId}`);
    else if (notif.offerSlug) router.push(`/admin/ofertas/${notif.offerSlug}/editar`);
    else return;
    setOpen(false);
  }

  return (
    <Popover isOpen={open} onOpenChange={handleOpenChange} placement='bottom end'>
      <Popover.Trigger>
        <button
          type='button'
          className='relative flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-secondary hover:text-foreground'
        >
          <LuBell className='h-4 w-4' />
          {unread > 0 && (
            <Chip color='accent' size='sm' className='absolute -right-1 -top-1 h-4 min-w-4 px-1'>
              <Chip.Label className='text-[10px] font-bold leading-none'>{unread > 9 ? '9+' : unread}</Chip.Label>
            </Chip>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Content className='w-[22rem] max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-default bg-surface shadow-2xl'>
        <div className='border-b border-default px-4 py-3'>
          <span className='text-sm font-semibold text-foreground'>Notificaciones</span>
        </div>
        <div className='max-h-[22rem] overflow-y-auto'>
          {notifications.length === 0 ? (
            <EmptyState icon={LuInbox} title='Sin notificaciones' description='Las novedades del panel aparecerán acá.' />
          ) : (
            notifications.slice(0, 20).map((notif) => {
              const Icon = TYPE_ICON[notif.type] || LuBell;
              const clickable = !!(notif.inquiryId || notif.offerSlug);
              return (
                <div
                  key={notif.id}
                  className='group relative border-b border-default px-4 py-3 last:border-b-0 hover:bg-surface-secondary'
                >
                  <button
                    type='button'
                    onClick={() => handleClick(notif)}
                    className={`flex w-full items-start gap-3 text-left ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${notif.isRead ? 'bg-surface-secondary text-muted' : 'bg-accent/15 text-accent'}`}>
                      <Icon className='h-3.5 w-3.5' />
                    </div>
                    <div className='min-w-0 flex-1 pr-4'>
                      <p className='truncate text-sm font-medium text-foreground'>{notif.title}</p>
                      <p className='mt-0.5 truncate text-xs text-muted'>{notif.body}</p>
                      <p className='mt-1 text-[11px] text-muted/60'>{timeAgo(notif.createdAt)}</p>
                    </div>
                  </button>
                  <button
                    type='button'
                    onClick={(e) => handleDismiss(e, notif.id)}
                    className='absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-md text-muted opacity-0 transition-opacity hover:bg-surface-tertiary hover:text-foreground group-hover:opacity-100'
                  >
                    <LuX className='h-3 w-3' />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </Popover.Content>
    </Popover>
  );
}
