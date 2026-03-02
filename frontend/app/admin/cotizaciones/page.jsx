'use client';

import { useMemo, useState } from 'react';
import inquiries from '@/mocks/mock_inquiries_admin.json';
import HeroSelect from '@/components/ui/hero-select';

function formatUSD(value) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export default function AdminInquiriesPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const rows = useMemo(() => {
    return inquiries.filter((item) => {
      const statusMatch = statusFilter === 'all' || item.status === statusFilter;
      const priorityMatch = priorityFilter === 'all' || item.priority === priorityFilter;
      return statusMatch && priorityMatch;
    });
  }, [priorityFilter, statusFilter]);

  return (
    <div className='space-y-5'>
      <section>
        <h2 className='text-4xl font-bold'>Solicitudes de cotizacion</h2>
        <p className='text-muted'>Gestiona pipeline comercial, prioridades y seguimiento.</p>
      </section>

      <section className='rounded-2xl border border-default bg-surface p-4 md:p-5 space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          <HeroSelect
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value)}
            options={[
              { value: 'all', label: 'Todos los estados' },
              { value: 'new', label: 'Nuevas' },
              { value: 'in_progress', label: 'En proceso' },
              { value: 'quoted', label: 'Cotizadas' },
              { value: 'closed', label: 'Cerradas' },
            ]}
            triggerClassName='h-10 rounded-lg border border-default bg-surface-secondary px-3'
          />

          <HeroSelect
            value={priorityFilter}
            onValueChange={(value) => setPriorityFilter(value)}
            options={[
              { value: 'all', label: 'Todas las prioridades' },
              { value: 'high', label: 'Alta' },
              { value: 'medium', label: 'Media' },
              { value: 'low', label: 'Baja' },
            ]}
            triggerClassName='h-10 rounded-lg border border-default bg-surface-secondary px-3'
          />
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-surface-secondary text-muted'>
              <tr>
                <th className='text-left px-3 py-3 font-semibold'>Fecha</th>
                <th className='text-left px-3 py-3 font-semibold'>Cliente</th>
                <th className='text-left px-3 py-3 font-semibold'>Destino</th>
                <th className='text-left px-3 py-3 font-semibold'>Viajeros</th>
                <th className='text-left px-3 py-3 font-semibold'>Presupuesto</th>
                <th className='text-left px-3 py-3 font-semibold'>Estado</th>
                <th className='text-left px-3 py-3 font-semibold'>Prioridad</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className='border-t border-default'>
                  <td className='px-3 py-3'>{new Date(item.createdAt).toLocaleDateString('es-AR')}</td>
                  <td className='px-3 py-3'>
                    <p className='font-semibold'>{item.fullName}</p>
                    <p className='text-xs text-muted'>{item.email}</p>
                  </td>
                  <td className='px-3 py-3'>{item.destination}</td>
                  <td className='px-3 py-3'>{item.travelers}</td>
                  <td className='px-3 py-3'>{formatUSD(item.budgetUSD)}</td>
                  <td className='px-3 py-3'><StatusPill status={item.status} /></td>
                  <td className='px-3 py-3'><PriorityPill priority={item.priority} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    quoted: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    closed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  };

  return <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${map[status]}`}>{status.replace('_', ' ')}</span>;
}

function PriorityPill({ priority }) {
  const map = {
    high: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    medium: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    low: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  };

  return <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${map[priority]}`}>{priority}</span>;
}
