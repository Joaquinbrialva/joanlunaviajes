'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LuBell, LuImage, LuClipboardList } from 'react-icons/lu';

const POLL_MS = 30_000;

const TYPE_ICON = {
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
  const panelRef = useRef(null);
  const router = useRouter();

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, POLL_MS);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  // Cerrar al hacer click afuera
  useEffect(() => {
    function onClickOut(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOut);
    return () => document.removeEventListener('mousedown', onClickOut);
  }, []);

  const unread = notifications.filter((n) => !n.isRead).length;

  async function handleToggle() {
    const wasOpen = open;
    setOpen((v) => !v);
    if (!wasOpen && unread > 0) {
      // Marcar todo como leído al abrir
      try {
        await fetch('/api/notifications/read-all', { method: 'POST' });
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } catch {}
    }
  }

  function handleClick(notif) {
    if (notif.offerSlug) {
      router.push(`/admin/ofertas/${notif.offerSlug}/editar`);
      setOpen(false);
    }
  }

  return (
    <div className='relative' ref={panelRef}>
      <button
        type='button'
        onClick={handleToggle}
        title='Notificaciones'
        className='relative flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-secondary hover:text-foreground'
      >
        <LuBell className='h-4 w-4' />
        {unread > 0 && (
          <span className='absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white'>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className='absolute left-0 top-[calc(100%+0.5rem)] z-50 w-80 rounded-2xl border border-default bg-surface shadow-2xl'>
          {/* Header */}
          <div className='flex items-center justify-between border-b border-default px-4 py-3'>
            <span className='text-sm font-semibold'>Notificaciones</span>
            {notifications.length > 0 && (
              <span className='text-xs text-muted'>
                {unread === 0 ? 'Todo leído' : `${unread} sin leer`}
              </span>
            )}
          </div>

          {/* Lista */}
          <div className='max-h-[22rem] overflow-y-auto'>
            {notifications.length === 0 ? (
              <p className='px-4 py-8 text-center text-sm text-muted'>Sin notificaciones.</p>
            ) : (
              notifications.slice(0, 20).map((notif) => {
                const Icon = TYPE_ICON[notif.type] || LuBell;
                return (
                  <button
                    key={notif.id}
                    type='button'
                    onClick={() => handleClick(notif)}
                    className={`w-full border-b border-default px-4 py-3 text-left last:border-b-0 transition-colors hover:bg-surface-secondary ${!notif.isRead ? 'bg-accent/5' : ''}`}
                  >
                    <div className='flex items-start gap-3'>
                      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${!notif.isRead ? 'bg-accent/10 text-accent' : 'bg-surface-secondary text-muted'}`}>
                        <Icon className='h-3.5 w-3.5' />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm font-medium'>{notif.title}</p>
                        <p className='mt-0.5 line-clamp-2 text-xs text-muted'>{notif.body}</p>
                        <p className='mt-1 text-[11px] text-muted/60'>{timeAgo(notif.createdAt)}</p>
                      </div>
                      {!notif.isRead && (
                        <div className='mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent' />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
