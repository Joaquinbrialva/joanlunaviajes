'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertDialog, Button, Spinner } from '@heroui/react';
import Link from 'next/link';
import { LuMapPin, LuPhone, LuSend, LuCircleCheck, LuShieldCheck, LuBellRing, LuHistory, LuZap, LuCompass } from 'react-icons/lu';
import HeroSelect from '@/components/ui/hero-select';
import { toastError } from '@/lib/toast';

const PREFIX_OPTIONS = [
  { value: '+54', label: 'AR +54' },
  { value: '+598', label: 'UY +598' },
  { value: '+56', label: 'CL +56' },
  { value: '+55', label: 'BR +55' },
  { value: '+595', label: 'PY +595' },
  { value: '+591', label: 'BO +591' },
  { value: '+51', label: 'PE +51' },
  { value: '+57', label: 'CO +57' },
  { value: '+58', label: 'VE +58' },
  { value: '+52', label: 'MX +52' },
  { value: '+34', label: 'ES +34' },
  { value: '+1',  label: 'US +1' },
  { value: '+39', label: 'IT +39' },
  { value: '+33', label: 'FR +33' },
  { value: '+49', label: 'DE +49' },
];

function parsePhone(fullPhone) {
  const prefix = PREFIX_OPTIONS.find((p) => fullPhone.startsWith(p.value));
  if (prefix) return { code: prefix.value, number: fullPhone.slice(prefix.value.length).trim() };
  return { code: '+54', number: fullPhone };
}

export default function ConsultaPage() {
  const [offers, setOffers] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | success

  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [name, setName] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+54');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [selection, setSelection] = useState('general');

  const MODAL_KEY = 'jlv_consulta_modal_ts';
  const MODAL_DAYS = 7;

  function shouldShowModal() {
    try {
      const ts = localStorage.getItem(MODAL_KEY);
      if (!ts) return true;
      return (Date.now() - Number(ts)) / 86400000 >= MODAL_DAYS;
    } catch { return true; }
  }

  function markModalSeen() {
    try { localStorage.setItem(MODAL_KEY, String(Date.now())); } catch {}
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => r.ok ? r.json() : null),
      fetch('/api/ofertas').then((r) => r.json()),
      fetch('/api/destinos').then((r) => r.json()),
    ]).then(([userData, o, d]) => {
      if (userData?.user) {
        setUser(userData.user);
        setName(userData.user.name || '');
        setEmail(userData.user.email || '');
        if (userData.user.phone) {
          const { code, number } = parsePhone(userData.user.phone);
          setPhonePrefix(code);
          setPhoneNumber(number);
        }
      } else if (shouldShowModal()) {
        setShowAuthModal(true);
        markModalSeen();
      }
      if (Array.isArray(o)) setOffers(o.filter((x) => x.status === 'published'));
      if (Array.isArray(d)) setDestinations(d.filter((x) => x.status === 'published'));
    }).catch(() => {
      if (shouldShowModal()) { setShowAuthModal(true); markModalSeen(); }
    });
  }, []);

  // Opciones planas — valor 'general' evita el bug de HeroSelect con string vacío
  const selectionOptions = useMemo(() => {
    const opts = [{ value: 'general', label: 'Consulta general' }];
    offers.forEach((o) => opts.push({ value: `offer:${o.slug}:${o.title}`, label: `✈ ${o.title} — ${o.location?.city ?? ''}` }));
    destinations.forEach((d) => opts.push({ value: `dest:${d.slug}`, label: `🌍 ${d.name}, ${d.country}` }));
    return opts;
  }, [offers, destinations]);

  async function handleSubmit(e) {
    e.preventDefault();
    const phone = `${phonePrefix} ${phoneNumber}`.trim();
    if (!name.trim() || !phoneNumber.trim()) {
      toastError('Completa nombre y teléfono.');
      return;
    }
    setStatus('loading');

    let offerSlug = null, offerTitle = null, destinationSlug = null;
    if (selection.startsWith('offer:')) {
      const [, slug, ...titleParts] = selection.split(':');
      offerSlug = slug;
      offerTitle = titleParts.join(':');
    } else if (selection.startsWith('dest:')) {
      destinationSlug = selection.replace('dest:', '');
    }

    try {
      const res = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          email: email.trim(),
          message: message.trim(),
          offerSlug,
          offerTitle,
          destinationSlug,
        }),
      });
      if (!res.ok) {
        let errMsg = 'No se pudo enviar la consulta.';
        try {
          const data = await res.json();
          errMsg = data?.error || errMsg;
        } catch {}
        throw new Error(errMsg);
      }
      setStatus('success');
    } catch (err) {
      toastError(err, 'Error al enviar');
      setStatus('idle');
    }
  }

  if (status === 'success') {
    return (
      <div className='max-w-lg mx-auto py-20 text-center space-y-4'>
        <div className='flex justify-center'>
          <LuCircleCheck className='h-16 w-16 text-emerald-500' />
        </div>
        <h2 className='text-3xl font-bold'>¡Consulta enviada!</h2>
        <p className='text-muted'>
          Recibimos tu mensaje. Te vamos a contactar pronto por WhatsApp o email para coordinar los
          detalles.
        </p>
        <div className='flex gap-3 justify-center'>
          <Button
            className='bg-accent text-white mt-2'
            onClick={() => { setStatus('idle'); setMessage(''); setSelection(''); }}
          >
            Hacer otra consulta
          </Button>
          {user && (
            <Link
              href='/cuenta'
              className='inline-flex items-center h-10 px-4 mt-2 rounded-xl border border-default text-sm font-medium hover:bg-surface-secondary transition-colors'
            >
              Ver mis consultas
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modal: invitación a registrarse (informativo, no bloqueante) */}
      <AlertDialog isOpen={showAuthModal} onOpenChange={setShowAuthModal}>
        <AlertDialog.Backdrop variant='blur'>
          <AlertDialog.Container>
            <AlertDialog.Dialog className='max-w-md w-full overflow-hidden rounded-3xl p-0'>
              <AlertDialog.CloseTrigger className='absolute top-4 right-4 z-10 text-white/70 hover:text-white' />

              {/* Header gradiente */}
              <div className='bg-gradient-to-br from-orange-500 to-orange-400 px-6 pt-8 pb-6 text-white text-center'>
                <div className='flex justify-center mb-4'>
                  <div className='h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center'>
                    <LuCompass className='h-8 w-8 text-white' />
                  </div>
                </div>
                <h2 className='text-xl font-bold mb-1'>Consultá tu próximo viaje</h2>
                <p className='text-sm text-white/80'>Creá tu cuenta gratis en segundos</p>
              </div>

              {/* Beneficios */}
              <div className='px-6 py-5 bg-surface space-y-3'>
                {[
                  { icon: LuShieldCheck, text: 'Registro 100% gratuito, sin tarjeta' },
                  { icon: LuZap,         text: 'Tu consulta llega directamente a un agente con todo el contexto' },
                  { icon: LuHistory,     text: 'Sigue el estado de todas tus consultas en tiempo real' },
                  { icon: LuBellRing,    text: 'Te avisamos ante novedades y ofertas exclusivas' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className='flex items-center gap-3'>
                    <div className='h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0'>
                      <Icon className='h-4 w-4 text-accent' />
                    </div>
                    <p className='text-sm text-foreground'>{text}</p>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className='px-6 pb-5 bg-surface space-y-2'>
                <Link
                  href='/registro'
                  onClick={() => setShowAuthModal(false)}
                  className='flex items-center justify-center h-12 w-full rounded-2xl bg-accent text-white text-sm font-bold hover:bg-accent/90 transition-colors shadow-md shadow-orange-500/25'
                >
                  Crear cuenta gratis
                </Link>
                <Link
                  href='/login'
                  onClick={() => setShowAuthModal(false)}
                  className='flex items-center justify-center h-11 w-full rounded-2xl border border-default text-sm font-medium hover:bg-surface-secondary transition-colors'
                >
                  Ya tengo cuenta — Iniciar sesión
                </Link>
              </div>

              {/* Opción de continuar sin cuenta */}
              <div className='px-6 pb-6 bg-surface text-center'>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className='text-xs text-muted hover:text-foreground transition-colors underline underline-offset-2'
                >
                  Continuar sin registrarme
                </button>
              </div>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>

      <div className='max-w-2xl mx-auto space-y-8 py-8'>

        {/* Header */}
        <div className='space-y-2'>
          <h1 className='text-4xl font-bold'>Consulta sobre tu viaje</h1>
          <p className='text-muted text-lg'>
            Cuéntanos qué estás buscando y te preparamos una propuesta a medida.
          </p>
        </div>

        <div className='rounded-2xl border border-default bg-surface p-6 md:p-8 space-y-5'>

          {/* Selector de oferta/destino */}
          <div>
            <label className='text-sm font-medium text-foreground block mb-1.5'>
              ¿Sobre qué quieres consultar?
            </label>
            <HeroSelect
              value={selection}
              onValueChange={setSelection}
              options={selectionOptions}
              className='w-full'
            />
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='text-sm font-medium text-foreground block mb-1.5'>
                  Nombre completo <span className='text-accent'>*</span>
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='Tu nombre completo'
                  className='w-full h-11 px-3 rounded-xl border border-default bg-field-background text-foreground placeholder:text-field-placeholder focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors text-sm'
                />
              </div>

              <div>
                <label className='text-sm font-medium text-foreground block mb-1.5'>
                  Teléfono / WhatsApp <span className='text-accent'>*</span>
                </label>
                <div className='flex gap-2 min-w-0'>
                  <HeroSelect
                    value={phonePrefix}
                    onValueChange={setPhonePrefix}
                    options={PREFIX_OPTIONS}
                    className='w-28 shrink-0'
                  />
                  <input
                    required
                    type='tel'
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder='11 1234-5678'
                    className='min-w-0 flex-1 h-10 px-3 rounded-xl border border-default bg-field-background text-foreground placeholder:text-field-placeholder focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors text-sm'
                  />
                </div>
              </div>
            </div>

            <div>
              <label className='text-sm font-medium text-foreground block mb-1.5'>Email</label>
              <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='tu@email.com'
                className='w-full h-11 px-3 rounded-xl border border-default bg-field-background text-foreground placeholder:text-field-placeholder focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors text-sm'
              />
            </div>

            <div>
              <label className='text-sm font-medium text-foreground block mb-1.5'>
                ¿Qué necesitas?
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder='Cuéntanos fechas tentativas, cantidad de personas, preferencias...'
                rows={4}
                className='w-full px-3 py-2.5 rounded-xl border border-default bg-field-background text-foreground placeholder:text-field-placeholder focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors text-sm resize-none'
              />
            </div>

            <Button
              type='submit'
              isPending={status === 'loading'}
              size='lg'
              className='w-full bg-accent text-white font-semibold'
            >
              {({ isPending }) => (
                <>
                  {isPending ? <Spinner color='current' size='sm' /> : <LuSend className='h-4 w-4' />}
                  {isPending ? 'Enviando...' : 'Enviar consulta'}
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Contacto directo */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <a
            href='https://wa.me/541158139420'
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center gap-3 rounded-2xl border border-default bg-surface p-4 hover:bg-surface-secondary transition-colors'
          >
            <div className='h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600'>
              <LuPhone className='h-5 w-5' />
            </div>
            <div>
              <p className='text-sm font-semibold'>WhatsApp</p>
              <p className='text-xs text-muted'>Respuesta inmediata</p>
            </div>
          </a>
          <a
            href='mailto:hola@joanlunaviajes.com'
            className='flex items-center gap-3 rounded-2xl border border-default bg-surface p-4 hover:bg-surface-secondary transition-colors'
          >
            <div className='h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent'>
              <LuMapPin className='h-5 w-5' />
            </div>
            <div>
              <p className='text-sm font-semibold'>Email</p>
              <p className='text-xs text-muted'>hola@joanlunaviajes.com</p>
            </div>
          </a>
        </div>

      </div>
    </>
  );
}
