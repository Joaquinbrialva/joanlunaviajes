'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LuBell,
  LuInbox,
  LuMessageSquare,
  LuImage,
  LuClipboardList,
  LuTrash2,
  LuCheckCheck,
} from 'react-icons/lu';

const POLL_MS = 30_000;

const TYPE_META = {
  new_inquiry:   { icon: LuMessageSquare },
  pending_media: { icon: LuImage },
  media_uploaded:{ icon: LuClipboardList },
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
  const [open, setOpen]                   = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const panelRef = useRef(null);
  const router   = useRouter();

  /* ── fetch ─────────────────────────────────────────────────── */
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

  /* ── close on outside click ─────────────────────────────────── */
  useEffect(() => {
    function onOut(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
        setDeleteConfirm(false);
      }
    }
    document.addEventListener('mousedown', onOut);
    return () => document.removeEventListener('mousedown', onOut);
  }, []);

  /* ── auto-reset confirm after 3 s ───────────────────────────── */
  useEffect(() => {
    if (!deleteConfirm) return;
    const t = setTimeout(() => setDeleteConfirm(false), 3000);
    return () => clearTimeout(t);
  }, [deleteConfirm]);

  const unread  = notifications.filter((n) => !n.isRead).length;
  const hasRead = notifications.some((n) => n.isRead);

  /* ── open / mark-read ───────────────────────────────────────── */
  async function handleToggle() {
    const wasOpen = open;
    setOpen((v) => !v);
    if (wasOpen) { setDeleteConfirm(false); return; }

    if (unread > 0) {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      try {
        const res = await fetch('/api/notifications/read-all', { method: 'POST' });
        if (!res.ok) throw new Error();
      } catch {
        // Si falló, re-sincronizar con el servidor
        fetchNotifs();
      }
    }
  }

  /* ── delete read ────────────────────────────────────────────── */
  async function handleDeleteRead() {
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => !n.isRead));
    setDeleteConfirm(false);
    try {
      const res = await fetch('/api/notifications/read', { method: 'DELETE' });
      if (!res.ok) throw new Error();
      // Confirmar estado real del servidor
      await fetchNotifs();
    } catch {
      // Si falló, restaurar desde el servidor
      fetchNotifs();
    }
  }

  /* ── navigate on click ──────────────────────────────────────── */
  function handleClick(notif) {
    if (notif.inquiryId) {
      router.push(`/admin/cotizaciones?inquiry=${notif.inquiryId}`);
      setOpen(false);
    } else if (notif.offerSlug) {
      router.push(`/admin/ofertas/${notif.offerSlug}/editar`);
      setOpen(false);
    }
  }

  /* ── render ─────────────────────────────────────────────────── */
  return (
    <div className='relative' ref={panelRef}>

      {/* ── Bell button ── */}
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

      {/* ── Panel ── */}
      {open && (
        <div className='absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[22rem] rounded-2xl border border-default bg-surface shadow-2xl'>

          {/* Header */}
          <div className='flex items-center justify-between border-b border-default px-4 py-3'>
            <div className='flex items-center gap-2'>
              <span className='text-sm font-semibold'>Notificaciones</span>
              {notifications.length > 0 && unread === 0 && (
                <span className='flex items-center gap-1 rounded-full bg-surface-secondary px-2 py-0.5 text-[11px] text-muted'>
                  <LuCheckCheck className='h-3 w-3' />
                  Todo leído
                </span>
              )}
            </div>

            {/* Slide-to-confirm delete */}
            {hasRead && (
              <button
                type='button'
                onClick={deleteConfirm ? handleDeleteRead : () => setDeleteConfirm(true)}
                title={deleteConfirm ? 'Confirmar eliminación' : 'Eliminar leídas'}
                className='flex h-7 items-center gap-1.5 overflow-hidden rounded-lg transition-all duration-300 ease-out'
                style={{
                  /* BUG FIX: control width entirely via inline style — no conflicting w-* class */
                  width:      deleteConfirm ? '108px' : '28px',
                  paddingLeft:  deleteConfirm ? '10px' : '6px',
                  paddingRight: deleteConfirm ? '10px' : '6px',
                  background: deleteConfirm ? 'color-mix(in srgb, #ef4444 12%, transparent)' : 'transparent',
                  color:      deleteConfirm ? '#ef4444' : 'var(--muted)',
                }}
              >
                <LuTrash2 className='h-3.5 w-3.5 shrink-0' />
                <span
                  className='whitespace-nowrap text-xs font-semibold transition-all duration-300 ease-out'
                  style={{
                    opacity:  deleteConfirm ? 1 : 0,
                    maxWidth: deleteConfirm ? '80px' : '0px',
                    overflow: 'hidden',
                  }}
                >
                  Confirmar
                </span>
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className='max-h-[22rem] overflow-x-hidden overflow-y-auto rounded-b-2xl'>
            {notifications.length === 0 ? (
              <div className='flex flex-col items-center gap-2.5 px-4 py-10 text-center'>
                <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary text-muted'>
                  <LuInbox className='h-5 w-5' />
                </div>
                <p className='text-sm text-muted'>Sin notificaciones</p>
              </div>
            ) : (
              notifications.slice(0, 20).map((notif) => {
                const Icon = (TYPE_META[notif.type] || {}).icon || LuBell;
                const isClickable = !!(notif.inquiryId || notif.offerSlug);
                return (
                  <button
                    key={notif.id}
                    type='button'
                    onClick={() => handleClick(notif)}
                    className={[
                      'relative w-full border-b border-default px-4 py-3 text-left',
                      'last:border-b-0 transition-colors hover:bg-surface-secondary',
                      !notif.isRead ? 'bg-accent/5' : '',
                      isClickable ? 'cursor-pointer' : 'cursor-default',
                    ].join(' ')}
                  >
                    {/* Unread accent bar */}
                    {!notif.isRead && (
                      <div className='absolute bottom-3 left-0 top-3 w-0.5 rounded-r-full bg-accent' />
                    )}

                    <div className='flex items-start gap-3'>
                      <div
                        className={[
                          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                          !notif.isRead
                            ? 'bg-accent/10 text-accent'
                            : 'bg-surface-secondary text-muted',
                        ].join(' ')}
                      >
                        <Icon className='h-3.5 w-3.5' />
                      </div>

                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-sm font-medium leading-snug'>{notif.title}</p>
                        <p className='mt-0.5 line-clamp-2 text-xs text-muted'>{notif.body}</p>
                        <p className='mt-1 text-[11px] text-muted/50'>{timeAgo(notif.createdAt)}</p>
                      </div>

                      {!notif.isRead && (
                        <div className='mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent' />
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
