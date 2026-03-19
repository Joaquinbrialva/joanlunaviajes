'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertDialog, Button, toast } from '@heroui/react';
import { Mail, Plus, Trash2, Users, Send, ToggleLeft, ToggleRight } from 'lucide-react';
import { toastError } from '@/lib/toast';

/* ─── Date helper ─────────────────────────────────────────── */
function fmtDate(v) {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ─── Stat card ───────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div
      style={{
        padding: '18px 20px', borderRadius: 14,
        background: 'var(--surface)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 14,
      }}
    >
      <div
        style={{
          width: 40, height: 40, borderRadius: 11,
          background: color + '18', color,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        <Icon size={18} />
      </div>
      <div>
        <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', margin: 0, lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: 11, color: 'var(--muted)', margin: '3px 0 0', fontWeight: 500 }}>{label}</p>
      </div>
    </div>
  );
}

/* ─── Tabs ────────────────────────────────────────────────── */
function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
        background: active ? 'var(--surface-secondary)' : 'transparent',
        color: active ? 'var(--foreground)' : 'var(--muted)',
        border: active ? '1px solid var(--border)' : '1px solid transparent',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

/* ─── Main page ───────────────────────────────────────────── */

export default function NewsletterPage() {
  const [tab, setTab]                 = useState('subscribers');
  const [subscribers, setSubscribers] = useState([]);
  const [campaigns, setCampaigns]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/newsletter/subscribers').then((r) => r.json()),
      fetch('/api/newsletter/campaigns').then((r) => r.json()),
    ])
      .then(([subs, cams]) => {
        setSubscribers(Array.isArray(subs) ? subs : []);
        setCampaigns(Array.isArray(cams) ? cams : []);
      })
      .catch(() => toastError('No se pudo cargar el newsletter.'))
      .finally(() => setLoading(false));
  }, []);

  async function toggleActive(sub) {
    try {
      const res = await fetch(`/api/newsletter/subscribers/${sub.id}`, { method: 'PATCH' });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setSubscribers((prev) => prev.map((s) => (s.id === sub.id ? updated : s)));
    } catch {
      toastError('No se pudo actualizar el suscriptor.');
    }
  }

  function executeDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete;
    const deleteFn = async () => {
      const res = await fetch(`/api/newsletter/subscribers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar.');
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
    };
    toast.promise(deleteFn, {
      loading: 'Eliminando...',
      success: 'Suscriptor eliminado',
      error: (err) => err?.message || 'Error al eliminar',
    });
  }

  const activeCount = subscribers.filter((s) => s.active).length;

  return (
    <div className='space-y-6'>

      <AlertDialog isOpen={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialog.Backdrop variant='blur'>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status='danger' />
                <AlertDialog.Heading>¿Eliminar suscriptor?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className='text-sm text-muted'>Esta acción no se puede deshacer.</p>
              </AlertDialog.Body>
              <AlertDialog.Footer className='flex justify-end gap-2'>
                <Button slot='close' variant='tertiary'>Cancelar</Button>
                <Button onClick={executeDelete} slot='close' variant='danger'>Eliminar</Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>

      {/* Header */}
      <section className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
        <div>
          <p className='text-xs uppercase tracking-[0.2em] font-semibold text-muted mb-1'>Comunicación</p>
          <h1 className='text-3xl font-bold tracking-tight'>Newsletter</h1>
          <p className='text-sm text-muted mt-1'>Gestioná suscriptores y enviá campañas por email.</p>
        </div>
        <Link
          href='/admin/newsletter/nuevo'
          className='inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-orange-500 transition-colors shrink-0'
        >
          <Plus size={15} />
          Nueva campaña
        </Link>
      </section>

      {/* Stats */}
      <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
        <StatCard label='Suscriptores activos' value={activeCount}          icon={Users} color='#34d399' />
        <StatCard label='Total suscriptores'   value={subscribers.length}   icon={Mail}  color='#38bdf8' />
        <StatCard label='Campañas enviadas'    value={campaigns.length}     icon={Send}  color='#ff7e2d' />
      </div>

      {/* Tabs */}
      <div className='rounded-2xl border border-default bg-surface overflow-hidden'>
        <div className='px-5 py-3 border-b border-default flex gap-2'>
          <Tab label='Suscriptores' active={tab === 'subscribers'} onClick={() => setTab('subscribers')} />
          <Tab label='Campañas'     active={tab === 'campaigns'}   onClick={() => setTab('campaigns')} />
        </div>

        {loading ? (
          <div className='py-16 text-center text-sm text-muted'>Cargando...</div>
        ) : tab === 'subscribers' ? (

          /* ── Subscribers table ── */
          <div>
            {subscribers.length === 0 ? (
              <p className='py-12 text-center text-sm text-muted'>Aún no hay suscriptores.</p>
            ) : (
              <table className='w-full'>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Email', 'Nombre', 'Estado', 'Fecha', ''].map((h, i) => (
                      <th key={i} className='px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-muted'>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub) => (
                    <tr
                      key={sub.id}
                      style={{ borderBottom: '1px solid var(--border)' }}
                      className='hover:bg-surface-secondary/40 transition-colors'
                    >
                      <td className='px-5 py-3 text-[13px] font-medium'>{sub.email}</td>
                      <td className='px-5 py-3 text-[13px] text-muted'>{sub.name || '—'}</td>
                      <td className='px-5 py-3'>
                        <span
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                            background: sub.active ? 'rgba(52,211,153,0.12)' : 'rgba(156,163,175,0.12)',
                            color: sub.active ? '#34d399' : '#9ca3af',
                          }}
                        >
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                          {sub.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className='px-5 py-3 text-xs text-muted whitespace-nowrap'>{fmtDate(sub.createdAt)}</td>
                      <td className='px-5 py-3'>
                        <div className='flex items-center justify-end gap-1'>
                          <button
                            onClick={() => toggleActive(sub)}
                            title={sub.active ? 'Desactivar' : 'Activar'}
                            className='w-8 h-8 rounded-lg flex items-center justify-center transition-colors'
                            style={{ color: sub.active ? '#34d399' : 'var(--muted)' }}
                          >
                            {sub.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          </button>
                          <button
                            onClick={() => setPendingDelete(sub.id)}
                            className='w-8 h-8 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors'
                            title='Eliminar'
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {subscribers.length > 0 && (
              <div className='px-5 py-3 border-t border-default'>
                <p className='text-xs text-muted'>{subscribers.length} suscriptor{subscribers.length !== 1 ? 'es' : ''}</p>
              </div>
            )}
          </div>

        ) : (

          /* ── Campaigns list ── */
          <div>
            {campaigns.length === 0 ? (
              <p className='py-12 text-center text-sm text-muted'>No hay campañas enviadas aún.</p>
            ) : (
              <div className='divide-y divide-default'>
                {campaigns.map((c) => (
                  <div key={c.id} className='px-5 py-4 flex items-center gap-4 hover:bg-surface-secondary/40 transition-colors'>
                    <div
                      style={{
                        width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                        background: 'rgba(255,126,45,0.1)', color: '#ff7e2d',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Send size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className='font-semibold text-[13px] truncate'>{c.subject}</p>
                      <p className='text-xs text-muted mt-0.5'>
                        {c.sentCount} envíos · {fmtDate(c.sentAt || c.createdAt)}
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                        background: 'rgba(52,211,153,0.12)', color: '#34d399',
                      }}
                    >
                      Enviada
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        )}
      </div>

    </div>
  );
}
