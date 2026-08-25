'use client';

import { useState } from 'react';
import { LuPhone, LuMail, LuMapPin, LuClock, LuSend, LuCheck, LuArrowUpRight } from 'react-icons/lu';
import { FaWhatsapp, FaInstagram, FaFacebook } from 'react-icons/fa';

const INFO_ITEMS = [
  { Icon: LuPhone, label: 'Teléfono', value: '011 5813-9420', href: 'tel:+541158139420' },
  { Icon: LuMail, label: 'Email', value: 'hola@joanlunaviajes.com', href: 'mailto:hola@joanlunaviajes.com' },
  { Icon: LuMapPin, label: 'Dirección', value: 'Av. Corrientes 2174 Local 192, CABA', href: 'https://maps.google.com/?q=Av.+Corrientes+2174+Local+192,+Buenos+Aires' },
  { Icon: LuClock, label: 'Horarios', value: 'Lun–Vie 9:00–18:00 · Sáb 10:00–14:00', href: null },
];

const SOCIAL = [
  { Icon: FaWhatsapp, href: 'https://wa.me/541158139420', label: 'WhatsApp' },
  { Icon: FaInstagram, href: 'https://www.instagram.com/p/DNOOawNOtbG/', label: 'Instagram' },
  { Icon: FaFacebook, href: 'https://www.facebook.com/JoanLunaViajes/', label: 'Facebook' },
];

const MOTIVOS = ['Consulta general', 'Cotización de viaje', 'Modificar una reserva', 'Reclamo o sugerencia', 'Otro'];

const INITIAL = { nombre: '', email: '', telefono: '', motivo: '', mensaje: '' };

const inputClass = 'w-full h-11 rounded-xl border border-border bg-surface px-4 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/50 transition-all';

export default function ContactoPage() {
  const [form, setForm] = useState(INITIAL);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      const res = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.nombre,
          email: form.email,
          phone: form.telefono,
          subject: form.motivo,
          message: form.mensaje,
        }),
      });
      if (!res.ok) throw new Error('No se pudo enviar el mensaje');
      setStatus('success');
      setForm(INITIAL);
    } catch (err) {
      setError(err.message || 'Error al enviar. Intenta de nuevo.');
      setStatus('error');
    }
  }

  return (
    <div>

      {/* ── Hero ── */}
      <section className="w-screen -mx-[calc((100vw-100%)/2)] relative overflow-hidden bg-gradient-to-b from-brand-primary/[0.08] to-surface-secondary">
        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 py-20">
          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground leading-tight tracking-tight mb-4 max-w-2xl">
            Hablemos de tu <span className="text-brand-primary">próximo viaje.</span>
          </h1>
          <p className="text-[15px] text-muted max-w-lg leading-relaxed">
            Escríbenos, llámanos o pasa por la oficina. Estamos para ayudarte a organizar la experiencia que sueñas.
          </p>
        </div>
      </section>

      {/* ── Contenido principal ── */}
      <section className="max-w-5xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-14">

        {/* Formulario */}
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-8 tracking-tight">
            ¿En qué te podemos ayudar?
          </h2>

          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-success/20 bg-success/5 p-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
                <LuCheck className="h-7 w-7 text-success" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground mb-1">¡Mensaje enviado!</p>
                <p className="text-sm text-muted">
                  Te respondemos a la brevedad, generalmente en menos de 24 horas.
                </p>
              </div>
              <button
                onClick={() => setStatus('idle')}
                className="text-sm font-semibold text-brand-primary hover:underline"
              >
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Nombre <span className="text-rose-500 normal-case">*</span>
                  </label>
                  <input
                    required
                    className={inputClass}
                    placeholder="Tu nombre"
                    value={form.nombre}
                    onChange={(e) => update('nombre', e.target.value)}
                   
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Email <span className="text-rose-500 normal-case">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    className={inputClass}
                    placeholder="nombre@email.com"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                   
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    className={inputClass}
                    placeholder="+54 11 ..."
                    value={form.telefono}
                    onChange={(e) => update('telefono', e.target.value)}
                   
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Motivo <span className="text-rose-500 normal-case">*</span>
                  </label>
                  <select
                    required
                    className={inputClass}
                    value={form.motivo}
                    onChange={(e) => update('motivo', e.target.value)}
                   
                  >
                    <option value="">Selecciona un motivo</option>
                    {MOTIVOS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Mensaje <span className="text-rose-500 normal-case">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/50 transition-all resize-none"
                  placeholder="Cuéntanos qué tienes en mente..."
                  value={form.mensaje}
                  onChange={(e) => update('mensaje', e.target.value)}
                />
              </div>

              {status === 'error' && (
                <p className="text-sm text-danger">{error}</p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-brand-primary px-8 text-sm font-semibold text-brand-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60 shadow-md shadow-brand-primary/20"
              >
                {status === 'loading' ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <LuSend size={14} />
                    Enviar mensaje
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Info de contacto */}
        <div className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            Encuéntranos
          </h2>

          <div className="space-y-5">
            {INFO_ITEMS.map(({ Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-4 group">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 group-hover:bg-brand-primary/20 transition-colors">
                  <Icon className="h-4.5 w-4.5 text-brand-primary" size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-0.5">
                    {label}
                  </p>
                  {href ? (
                    <a
                      href={href}
                      className="text-sm text-foreground hover:text-brand-primary transition-colors flex items-center gap-1 group/link"
                      target={href.startsWith('http') ? '_blank' : undefined}
                      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {value}
                      {href.startsWith('http') && (
                        <LuArrowUpRight size={12} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                      )}
                    </a>
                  ) : (
                    <p className="text-sm text-foreground">{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Redes */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-3">
              Síguenos
            </p>
            <div className="flex gap-2.5">
              {SOCIAL.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-muted hover:text-brand-primary hover:border-brand-primary/30 hover:bg-surface-secondary transition-all"
                >
                  <Icon size={17} />
                </a>
              ))}
            </div>
          </div>

          {/* Mapa */}
          <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3283.9685189677566!2d-58.40033972447615!3d-34.60495755756325!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bccaeb00b32c33%3A0x7398571e0444cb83!2sJOANLUNA!5e0!3m2!1ses-419!2sar!4v1773798013399!5m2!1ses-419!2sar"
              width="100%"
              height="220"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

    </div>
  );
}
