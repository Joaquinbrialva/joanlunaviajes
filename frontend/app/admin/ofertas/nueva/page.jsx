'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toastError } from '@/lib/toast';
import { PageHeader, LinkButton } from '@/components/admin/kit';
import OfferFormBody from '@/components/admin/offer-form/offer-form';
import OfferPreviewPanel from '@/components/admin/offer-form/preview-panel';
import { validateOfferForm } from '@/components/admin/offer-form/parts';

const initialForm = {
  title: '',
  tripType: 'round-trip',
  customRoute: '',
  originCountry: '',
  originCity: '',
  destinationCountry: '',
  destinationCity: '',
  destinationAirport: '',
  startDate: '',
  endDate: '',
  availableMonths: '',
  days: null,
  nights: null,
  airline: '',
  airlineIata: '',
  flightType: 'direct',
  layoverCity: '',
  luggagePersonal: false,
  luggageCarryOn: false,
  luggageChecked: false,
  currency: 'ARS',
  price: null,
  originalPrice: null,
  priceNote: '',
  seats: 1,
  status: 'draft',
  featured: false,
  isSpecialOffer: false,
  summary: '',
  includes: [],
  notIncludes: [],
  highlights: [],
  coverImage: '',
  galleryImages: [],
  hotelName: '',
  hasHotel: false,
  hotelStars: 0,
  hotelAddress: '',
  hotelPlaceId: '',
  hotelMapsUrl: '',
};

const DRAFT_KEY = 'admin_nueva_oferta_draft';

export default function AdminNewOfferPage() {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [showErrors, setShowErrors] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.user) setRole(data.user.role); })
      .catch(() => { });
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) setForm(JSON.parse(saved));
    } catch { }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch { }
  }, [form]);

  useEffect(() => {
    if (form.startDate && form.endDate) {
      const start = new Date(form.startDate + 'T12:00:00');
      const end = new Date(form.endDate + 'T12:00:00');
      const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        setForm((prev) => ({ ...prev, nights: diffDays, days: diffDays + 1 }));
      }
    }
  }, [form.startDate, form.endDate]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const fieldErrors = validateOfferForm(form);
  const errorCount = Object.keys(fieldErrors).length;

  async function guardarOferta() {
    if (errorCount > 0) { setShowErrors(true); return; }
    setGuardando(true);
    try {
      const res = await fetch('/api/ofertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      let data = {};
      try { data = await res.json(); } catch {}
      if (!res.ok) throw new Error(data?.error || 'No se pudo guardar la oferta.');
      try { localStorage.removeItem(DRAFT_KEY); } catch { }
      router.push('/admin/ofertas');
    } catch (err) {
      toastError(err, 'No se pudo guardar la oferta');
    } finally {
      setGuardando(false);
    }
  }

  if (role === 'designer') {
    return (
      <div className='flex flex-col items-center justify-center gap-4 py-20 text-center'>
        <div className='grid h-14 w-14 place-content-center rounded-2xl bg-danger/10 text-danger'>
          <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' viewBox='0 0 24 24'><circle cx='12' cy='12' r='10' /><line x1='12' y1='8' x2='12' y2='12' /><line x1='12' y1='16' x2='12.01' y2='16' /></svg>
        </div>
        <div>
          <h2 className='text-2xl font-bold'>Sin permiso</h2>
          <p className='mt-1 text-muted'>Los diseñadores no pueden crear ofertas.</p>
        </div>
        <LinkButton href='/admin/ofertas'>Volver a ofertas</LinkButton>
      </div>
    );
  }

  return (
    <div className='max-w-[1240px] space-y-6'>
      <PageHeader
        crumbs={[{ label: 'Ofertas', href: '/admin/ofertas' }, { label: 'Nueva' }]}
        title='Nueva oferta'
        description='Completá los datos a la izquierda — la vista previa se arma sola a la derecha.'
      />

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]'>
        <OfferFormBody form={form} update={update} setForm={setForm} showErrors={showErrors} fieldErrors={fieldErrors} />
        <OfferPreviewPanel
          form={form}
          update={update}
          fieldErrors={fieldErrors}
          showErrors={showErrors}
          pending={guardando}
          pendingLabel='Publicando...'
          label='Publicar oferta'
          onSave={guardarOferta}
          errorCount={errorCount}
        />
      </div>
    </div>
  );
}
