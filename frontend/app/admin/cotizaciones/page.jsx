'use client';

import { useMemo, useState } from 'react';
import inquiries from '@/mocks/mock_inquiries_admin.json';
import HeroSelect from '@/components/ui/hero-select';
import { Table } from '@heroui/react';

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
        <h2 className='text-4xl font-bold'>Solicitudes de cotización</h2>
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

        <Table>
          <Table.ScrollContainer minWidth={600}>
            <Table.Content aria-label='Solicitudes de cotización'>
              <Table.Header>
                <Table.Column>Fecha</Table.Column>
                <Table.Column isRowHeader>Cliente</Table.Column>
                <Table.Column>Destino</Table.Column>
                <Table.Column>Viajeros</Table.Column>
                <Table.Column>Presupuesto</Table.Column>
                <Table.Column>Estado</Table.Column>
                <Table.Column>Prioridad</Table.Column>
              </Table.Header>
              <Table.Body
                items={rows}
                renderEmptyState={() => (
                  <p className='py-10 text-center text-sm text-muted'>
                    No hay solicitudes que coincidan con los filtros.
                  </p>
                )}
              >
                {(item) => (
                  <Table.Row id={item.id}>
                    <Table.Cell>{new Date(item.createdAt).toLocaleDateString('es-AR')}</Table.Cell>
                    <Table.Cell>
                      <p className='font-semibold'>{item.fullName}</p>
                      <p className='text-xs text-muted'>{item.email}</p>
                    </Table.Cell>
                    <Table.Cell>{item.destination}</Table.Cell>
                    <Table.Cell>{item.travelers}</Table.Cell>
                    <Table.Cell className='font-medium'>{formatUSD(item.budgetUSD)}</Table.Cell>
                    <Table.Cell><StatusPill status={item.status} /></Table.Cell>
                    <Table.Cell><PriorityPill priority={item.priority} /></Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
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
  const label = { new: 'Nueva', in_progress: 'En proceso', quoted: 'Cotizada', closed: 'Cerrada' };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${map[status]}`}>
      {label[status] ?? status}
    </span>
  );
}

function PriorityPill({ priority }) {
  const map = {
    high: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    medium: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    low: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  };
  const label = { high: 'Alta', medium: 'Media', low: 'Baja' };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${map[priority]}`}>
      {label[priority] ?? priority}
    </span>
  );
}
