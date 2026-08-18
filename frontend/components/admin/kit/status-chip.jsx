'use client';

import { Chip } from '@heroui/react';

/**
 * Unified status pill for the admin surface. Every domain (offers, destinations,
 * inquiries, roles) maps its own status strings onto the same 5 HeroUI Chip
 * colors so the whole admin reads from one status vocabulary instead of each
 * page inventing its own pill markup/colors.
 */
export default function StatusChip({ color = 'default', variant = 'soft', size = 'sm', children, className = '' }) {
  return (
    <Chip color={color} variant={variant} size={size} className={className}>
      <Chip.Label>{children}</Chip.Label>
    </Chip>
  );
}

export const OFFER_STATUS = {
  active:    { color: 'success', label: 'Activa' },
  featured:  { color: 'accent',  label: 'Destacada' },
  low_stock: { color: 'danger',  label: 'Pocos cupos' },
};

export const INQUIRY_STATUS = {
  pending:   { color: 'warning', label: 'Pendiente' },
  contacted: { color: 'accent',  label: 'Contactado' },
  closed:    { color: 'default', label: 'Cerrado' },
};

export const ROLE_STATUS = {
  admin:    { color: 'accent',  label: 'Administrador' },
  agent:    { color: 'success', label: 'Agente' },
  designer: { color: 'warning', label: 'Diseñador' },
  client:   { color: 'default', label: 'Cliente' },
};

export const NOVEDAD_STATUS = {
  published: { color: 'success', label: 'Publicada' },
  draft:     { color: 'default', label: 'Borrador' },
};

export function OfferStatusChip({ status }) {
  const s = OFFER_STATUS[status] || OFFER_STATUS.active;
  return <StatusChip color={s.color}>{s.label}</StatusChip>;
}

export function InquiryStatusChip({ status }) {
  const s = INQUIRY_STATUS[status] || INQUIRY_STATUS.pending;
  return <StatusChip color={s.color}>{s.label}</StatusChip>;
}

export function RoleStatusChip({ role }) {
  const s = ROLE_STATUS[role] || ROLE_STATUS.client;
  return <StatusChip color={s.color}>{s.label}</StatusChip>;
}

export function NovedadStatusChip({ status, solid = false }) {
  const s = NOVEDAD_STATUS[status] || NOVEDAD_STATUS.published;
  return <StatusChip color={s.color} variant={solid ? 'solid' : 'soft'}>{s.label}</StatusChip>;
}
