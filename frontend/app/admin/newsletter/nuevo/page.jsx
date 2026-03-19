'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Spinner } from '@heroui/react';
import {
  Plus, Trash2, ChevronUp, ChevronDown, Eye, EyeOff,
  Image as ImageIcon, Type, Tag, MapPin, MousePointer, Minus,
  Send,
} from 'lucide-react';
import { toastError, toastSuccess } from '@/lib/toast';
import { blocksToHtml, BLOCK_DEFAULTS, BLOCK_LABELS } from '@/lib/newsletter-html';
import HeroSelect from '@/components/ui/hero-select';

/* ─── Block type icons ────────────────────────────────────── */
const BLOCK_ICONS = {
  header:      ImageIcon,
  text:        Type,
  offer:       Tag,
  destination: MapPin,
  cta:         MousePointer,
  divider:     Minus,
};

const BLOCK_TYPES = ['header', 'text', 'offer', 'destination', 'cta', 'divider'];

/* ─── Block card ──────────────────────────────────────────── */
function BlockCard({ block, index, total, onChange, onDelete, onMove, offers, destinations }) {
  const [expanded, setExpanded] = useState(index === 0);
  const Icon = BLOCK_ICONS[block.type] || Type;

  function update(key, value) {
    onChange({ ...block, data: { ...block.data, [key]: value } });
  }

  function updateOfferData(offerId) {
    const found = offers.find((o) => o.id === offerId || o.slug === offerId);
    onChange({ ...block, data: { ...block.data, offerId, offerData: found || null } });
  }

  function updateDestData(destinationId) {
    const found = destinations.find((d) => d.id === destinationId || d.slug === destinationId);
    onChange({ ...block, data: { ...block.data, destinationId, destinationData: found || null } });
  }

  const fieldStyle = {
    width: '100%', padding: '8px 12px', borderRadius: 10,
    border: '1px solid var(--border)', background: 'var(--surface-secondary)',
    color: 'var(--foreground)', fontSize: 13, lineHeight: 1.5,
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block', fontSize: 11, color: 'var(--muted)',
    marginBottom: 5, fontWeight: 500,
  };

  return (
    <div
      style={{
        borderRadius: 14, border: '1px solid var(--border)',
        background: 'var(--surface)', overflow: 'hidden',
      }}
    >
      {/* Block header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', cursor: 'pointer',
          background: expanded ? 'var(--surface-secondary)' : 'transparent',
          borderBottom: expanded ? '1px solid var(--border)' : 'none',
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          style={{
            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
            background: 'rgba(255,126,45,0.12)', color: '#ff7e2d',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon size={14} />
        </div>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>
          {BLOCK_LABELS[block.type]}
        </span>
        <div
          style={{ display: 'flex', gap: 2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            disabled={index === 0}
            onClick={() => onMove(index, -1)}
            style={{
              width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: index === 0 ? 0.3 : 1,
            }}
          >
            <ChevronUp size={14} />
          </button>
          <button
            disabled={index === total - 1}
            onClick={() => onMove(index, 1)}
            style={{
              width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: index === total - 1 ? 0.3 : 1,
            }}
          >
            <ChevronDown size={14} />
          </button>
          <button
            onClick={() => onDelete(index)}
            style={{
              width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'transparent', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Block fields */}
      {expanded && (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {block.type === 'header' && (
            <>
              <div>
                <label style={labelStyle}>URL de imagen (opcional)</label>
                <input style={fieldStyle} value={block.data.imageUrl || ''} onChange={(e) => update('imageUrl', e.target.value)} placeholder='https://...' />
              </div>
              <div>
                <label style={labelStyle}>Eyebrow</label>
                <input style={fieldStyle} value={block.data.eyebrow || ''} onChange={(e) => update('eyebrow', e.target.value)} placeholder='ej: Oferta especial' />
              </div>
              <div>
                <label style={labelStyle}>Titular</label>
                <input style={fieldStyle} value={block.data.headline || ''} onChange={(e) => update('headline', e.target.value)} placeholder='Título principal' />
              </div>
              <div>
                <label style={labelStyle}>Subtexto</label>
                <textarea style={{ ...fieldStyle, minHeight: 64, resize: 'vertical' }} value={block.data.subtext || ''} onChange={(e) => update('subtext', e.target.value)} placeholder='Descripción breve...' />
              </div>
            </>
          )}

          {block.type === 'text' && (
            <div>
              <label style={labelStyle}>Contenido (doble enter = nuevo párrafo)</label>
              <textarea
                style={{ ...fieldStyle, minHeight: 100, resize: 'vertical' }}
                value={block.data.content || ''}
                onChange={(e) => update('content', e.target.value)}
                placeholder='Escribí el contenido del texto...'
              />
            </div>
          )}

          {block.type === 'offer' && (
            <div>
              <label style={labelStyle}>Oferta</label>
              {offers.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>No hay ofertas publicadas.</p>
              ) : (
                <HeroSelect
                  value={block.data.offerId || ''}
                  onValueChange={updateOfferData}
                  options={offers.map((o) => ({ value: o.id, label: o.title }))}
                  triggerClassName='h-9 rounded-xl border border-default bg-surface-secondary px-3 text-sm w-full'
                />
              )}
            </div>
          )}

          {block.type === 'destination' && (
            <div>
              <label style={labelStyle}>Destino</label>
              {destinations.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>No hay destinos disponibles.</p>
              ) : (
                <HeroSelect
                  value={block.data.destinationId || ''}
                  onValueChange={updateDestData}
                  options={destinations.map((d) => ({ value: d.id, label: `${d.name} — ${d.country}` }))}
                  triggerClassName='h-9 rounded-xl border border-default bg-surface-secondary px-3 text-sm w-full'
                />
              )}
            </div>
          )}

          {block.type === 'cta' && (
            <>
              <div>
                <label style={labelStyle}>Texto del botón</label>
                <input style={fieldStyle} value={block.data.label || ''} onChange={(e) => update('label', e.target.value)} placeholder='ej: Ver oferta' />
              </div>
              <div>
                <label style={labelStyle}>URL de destino</label>
                <input style={fieldStyle} value={block.data.url || ''} onChange={(e) => update('url', e.target.value)} placeholder='https://...' />
              </div>
              <div>
                <label style={labelStyle}>Estilo</label>
                <HeroSelect
                  value={block.data.style || 'primary'}
                  onValueChange={(v) => update('style', v)}
                  options={[{ value: 'primary', label: 'Naranja (principal)' }, { value: 'secondary', label: 'Oscuro (secundario)' }]}
                  triggerClassName='h-9 rounded-xl border border-default bg-surface-secondary px-3 text-sm w-full'
                />
              </div>
            </>
          )}

          {block.type === 'divider' && (
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>Línea divisoria — sin opciones.</p>
          )}

        </div>
      )}
    </div>
  );
}

/* ─── Main composer ───────────────────────────────────────── */

function NewsletterComposer() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [subject, setSubject]       = useState('');
  const [blocks, setBlocks]         = useState([{ type: 'header', data: BLOCK_DEFAULTS.header() }]);
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending]       = useState(false);
  const [offers, setOffers]         = useState([]);
  const [destinations, setDestinations] = useState([]);

  const iframeRef = useRef(null);

  // Fetch offers and destinations for block selectors
  useEffect(() => {
    fetch('/api/ofertas').then((r) => r.ok ? r.json() : []).then((d) => setOffers(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/destinos').then((r) => r.ok ? r.json() : []).then((d) => setDestinations(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  // Pre-populate offer block if offerSlug provided
  useEffect(() => {
    const slug = searchParams.get('offerSlug');
    if (!slug || offers.length === 0) return;
    const found = offers.find((o) => o.slug === slug);
    if (!found) return;
    setBlocks([
      { type: 'header', data: { ...BLOCK_DEFAULTS.header(), headline: found.title, subtext: found.subtitle || '' } },
      { type: 'offer',  data: { offerId: found.id, offerData: found } },
      { type: 'cta',    data: { label: 'Ver oferta completa', url: `${window.location.origin}/ofertas/${found.slug}`, style: 'primary' } },
    ]);
    if (!subject) setSubject(`¡Nueva oferta: ${found.title}!`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offers]);

  function addBlock(type) {
    setBlocks((prev) => [...prev, { type, data: BLOCK_DEFAULTS[type]() }]);
  }

  function deleteBlock(index) {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  }

  function updateBlock(index, updated) {
    setBlocks((prev) => prev.map((b, i) => (i === index ? updated : b)));
  }

  function moveBlock(index, dir) {
    setBlocks((prev) => {
      const next = [...prev];
      const swap = index + dir;
      if (swap < 0 || swap >= next.length) return next;
      [next[index], next[swap]] = [next[swap], next[index]];
      return next;
    });
  }

  const previewHtml = blocksToHtml(subject || 'Newsletter', blocks);

  // Sync iframe when preview changes
  useEffect(() => {
    if (!showPreview || !iframeRef.current) return;
    const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
    if (!doc) return;
    doc.open(); doc.write(previewHtml); doc.close();
  }, [showPreview, previewHtml]);

  async function handleSend() {
    if (!subject.trim()) { toastError('El asunto es requerido.'); return; }
    if (blocks.length === 0) { toastError('Agregá al menos un bloque.'); return; }
    setSending(true);
    try {
      const html = blocksToHtml(subject, blocks);
      const res  = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, blocks, html }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar.');
      toastSuccess(`¡Newsletter enviado a ${data.sent} suscriptores!`);
      router.push('/admin/newsletter');
    } catch (err) {
      toastError(err, 'No se pudo enviar el newsletter');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className='space-y-6 max-w-5xl'>

      {/* Header */}
      <section className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <p className='text-xs uppercase tracking-[0.2em] font-semibold text-muted mb-1'>
            <Link href='/admin/newsletter' className='hover:text-accent transition-colors'>Newsletter</Link>
            <span className='mx-1.5 opacity-40'>·</span>Nueva campaña
          </p>
          <h2 className='text-3xl font-bold tracking-tight'>Compositor</h2>
        </div>
        <div className='flex items-center gap-2 shrink-0'>
          <button
            onClick={() => setShowPreview((v) => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 38, padding: '0 14px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--foreground)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPreview ? 'Editar' : 'Vista previa'}
          </button>
          <Button
            isPending={sending}
            onClick={handleSend}
            style={{
              height: 38, padding: '0 18px', borderRadius: 10,
              background: '#ff7e2d', color: '#fff',
              fontSize: 13, fontWeight: 700,
            }}
          >
            {({ isPending }) => (
              <span className='flex items-center gap-2'>
                {isPending ? <Spinner size='sm' style={{ color: '#fff' }} /> : <Send size={13} />}
                {isPending ? 'Enviando...' : 'Enviar ahora'}
              </span>
            )}
          </Button>
        </div>
      </section>

      {/* Subject */}
      <div
        style={{
          padding: '16px 20px', borderRadius: 14,
          border: '1px solid var(--border)', background: 'var(--surface)',
        }}
      >
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: 8 }}>
          Asunto del email
        </label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder='ej: ¡Nueva oferta exclusiva para vos!'
          style={{
            width: '100%', padding: '9px 14px', borderRadius: 10,
            border: '1px solid var(--border)', background: 'var(--surface-secondary)',
            color: 'var(--foreground)', fontSize: 15, fontWeight: 500,
            outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />
      </div>

      {showPreview ? (

        /* ── Preview panel ── */
        <div
          style={{
            borderRadius: 14, border: '1px solid var(--border)',
            background: 'var(--surface)', overflow: 'hidden',
          }}
        >
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Eye size={14} style={{ color: 'var(--muted)' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>Vista previa del email</span>
          </div>
          <iframe
            ref={iframeRef}
            title='Newsletter preview'
            style={{ width: '100%', height: 600, border: 'none', display: 'block' }}
          />
        </div>

      ) : (

        /* ── Block editor ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {blocks.length === 0 && (
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', padding: '24px 0' }}>
              Sin bloques. Agregá uno a continuación.
            </p>
          )}

          {blocks.map((block, i) => (
            <BlockCard
              key={i}
              block={block}
              index={i}
              total={blocks.length}
              onChange={(updated) => updateBlock(i, updated)}
              onDelete={deleteBlock}
              onMove={moveBlock}
              offers={offers}
              destinations={destinations}
            />
          ))}

          {/* Add block row */}
          <div
            style={{
              padding: '14px 16px', borderRadius: 14,
              border: '1px dashed var(--border)', background: 'var(--surface)',
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: 10 }}>
              Agregar bloque
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {BLOCK_TYPES.map((type) => {
                const Icon = BLOCK_ICONS[type] || Plus;
                return (
                  <button
                    key={type}
                    onClick={() => addBlock(type)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 9,
                      border: '1px solid var(--border)', background: 'var(--surface-secondary)',
                      color: 'var(--foreground)', fontSize: 12, fontWeight: 500,
                      cursor: 'pointer', transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#ff7e2d')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <Icon size={12} style={{ color: '#ff7e2d' }} />
                    {BLOCK_LABELS[type]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      )}

    </div>
  );
}

export default function NewsletterNuevoPage() {
  return (
    <Suspense>
      <NewsletterComposer />
    </Suspense>
  );
}
