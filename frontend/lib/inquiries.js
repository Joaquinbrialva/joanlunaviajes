export const INQUIRY_STATUS_LABEL = {
  pending: 'Pendiente',
  contacted: 'Contactado',
  closed: 'Cerrado',
};

export const INQUIRY_STATUS_OPTIONS = [
  { value: 'pending',   label: 'Pendiente',  dotColor: '#f59e0b' },
  { value: 'contacted', label: 'Contactado', dotColor: '#38bdf8' },
  { value: 'closed',    label: 'Cerrado',    dotColor: '#34d399' },
];

export const INQUIRY_STATUS_CLASS = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  contacted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  closed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

export function normalizeInquiryStatus(status) {
  switch (status) {
    case 'new':
      return 'pending';
    case 'in_progress':
    case 'quoted':
      return 'contacted';
    case 'closed':
      return 'closed';
    case 'contacted':
      return 'contacted';
    case 'pending':
    default:
      return 'pending';
  }
}

export function normalizeInquiry(inquiry) {
  const normalizedStatus = normalizeInquiryStatus(inquiry?.status);
  const passengers = inquiry?.passengers ?? inquiry?.travelers ?? null;

  return {
    ...inquiry,
    name: inquiry?.name || inquiry?.fullName || 'Sin nombre',
    email: inquiry?.email || '',
    phone: inquiry?.phone || '',
    requestTitle: inquiry?.offerTitle || inquiry?.destination || 'Sin referencia',
    requestMeta: inquiry?.offerSlug
      ? 'Oferta'
      : inquiry?.travelMonth || 'Consulta general',
    passengers,
    status: normalizedStatus,
    statusLabel: INQUIRY_STATUS_LABEL[normalizedStatus],
    message: inquiry?.message || '',
    notes: inquiry?.notes || '',
    createdAt: inquiry?.createdAt || null,
  };
}
