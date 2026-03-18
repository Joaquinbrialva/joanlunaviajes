'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LuMessageSquare, LuCircleCheck, LuClock, LuPhone, LuUser, LuLogOut } from 'react-icons/lu';

const STATUS_LABEL = {
  pending: 'Pendiente de respuesta',
  contacted: 'En proceso',
  closed: 'Finalizada',
};

const STATUS_CLASS = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  contacted: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  closed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

function formatDate(dateStr) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(dateStr));
}

function InquiryTitle({ inquiry }) {
  if (inquiry.offerTitle) return <span>{inquiry.offerTitle}</span>;
  if (inquiry.destinationSlug) {
    return <span className='capitalize'>{inquiry.destinationSlug.replace(/-/g, ' ')}</span>;
  }
  return <span className='text-muted italic'>Consulta general</span>;
}

export default function CuentaPage() {
  const [user, setUser] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => r.ok ? r.json() : null),
      fetch('/api/cotizaciones/mis').then((r) => r.ok ? r.json() : []),
    ]).then(([userData, inqData]) => {
      if (userData?.user) setUser(userData.user);
      if (Array.isArray(inqData)) setInquiries(inqData);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center py-24'>
        <div className='h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent' />
      </div>
    );
  }

  const pending = inquiries.filter((i) => i.status === 'pending').length;
  const inProgress = inquiries.filter((i) => i.status === 'contacted').length;

  return (
    <div className='max-w-3xl mx-auto space-y-6 py-8'>

      {/* Header */}
      <div className='flex items-start justify-between'>
        <div>
          <h1 className='text-4xl font-bold'>Mi cuenta</h1>
          <p className='text-muted mt-1'>Seguí el estado de tus consultas y viajes.</p>
        </div>
        <button
          onClick={handleLogout}
          className='flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors'
        >
          <LuLogOut className='h-4 w-4' />
          Cerrar sesión
        </button>
      </div>

      {/* Info del usuario */}
      {user && (
        <div className='rounded-2xl border border-default bg-surface p-5 flex items-center gap-4'>
          <div className='h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-lg shrink-0'>
            {user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div className='min-w-0'>
            <p className='font-semibold text-lg'>{user.name}</p>
            <p className='text-sm text-muted'>{user.email}</p>
          </div>
        </div>
      )}

      {/* Stats rápidas */}
      <div className='grid grid-cols-3 gap-3'>
        <div className='rounded-2xl border border-default bg-surface p-4 text-center'>
          <p className='text-3xl font-bold'>{inquiries.length}</p>
          <p className='text-xs text-muted mt-1'>Consultas totales</p>
        </div>
        <div className='rounded-2xl border border-default bg-surface p-4 text-center'>
          <p className='text-3xl font-bold text-amber-500'>{pending}</p>
          <p className='text-xs text-muted mt-1'>Pendientes</p>
        </div>
        <div className='rounded-2xl border border-default bg-surface p-4 text-center'>
          <p className='text-3xl font-bold text-sky-500'>{inProgress}</p>
          <p className='text-xs text-muted mt-1'>En proceso</p>
        </div>
      </div>

      {/* Lista de consultas */}
      <div className='rounded-2xl border border-default bg-surface overflow-hidden'>
        <div className='flex items-center justify-between px-5 py-4 border-b border-default'>
          <h2 className='text-xl font-bold'>Mis consultas</h2>
          <Link
            href='/consulta'
            className='text-sm font-semibold text-accent hover:underline'
          >
            + Nueva consulta
          </Link>
        </div>

        {inquiries.length === 0 ? (
          <div className='flex flex-col items-center gap-3 py-14 text-center px-6'>
            <LuMessageSquare className='h-10 w-10 text-muted/40' />
            <p className='font-semibold'>Todavía no hiciste ninguna consulta</p>
            <p className='text-sm text-muted'>Cuando consultes sobre una oferta o destino, las vas a ver acá.</p>
            <Link
              href='/consulta'
              className='mt-1 inline-flex h-9 items-center px-4 rounded-xl bg-accent text-white text-sm font-semibold'
            >
              Hacer una consulta
            </Link>
          </div>
        ) : (
          <ul className='divide-y divide-default'>
            {inquiries.map((inq) => (
              <li key={inq.id} className='px-5 py-4 space-y-2'>
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='font-semibold truncate'>
                      <InquiryTitle inquiry={inq} />
                    </p>
                    <p className='text-xs text-muted mt-0.5'>{formatDate(inq.createdAt)}</p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CLASS[inq.status] || STATUS_CLASS.pending}`}>
                    {inq.status === 'closed'
                      ? <LuCircleCheck className='h-3 w-3' />
                      : <LuClock className='h-3 w-3' />}
                    {STATUS_LABEL[inq.status] || inq.status}
                  </span>
                </div>
                {inq.message && (
                  <p className='text-sm text-muted line-clamp-2'>{inq.message}</p>
                )}
                <div className='flex items-center gap-4 text-xs text-muted'>
                  {inq.passengers > 1 && (
                    <span className='flex items-center gap-1'>
                      <LuUser className='h-3 w-3' /> {inq.passengers} pasajeros
                    </span>
                  )}
                  {inq.phone && (
                    <span className='flex items-center gap-1'>
                      <LuPhone className='h-3 w-3' /> {inq.phone}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}
