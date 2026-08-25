'use client';

import { Button, Spinner, Switch } from '@heroui/react';
import { Check, ImagePlus, Plane } from 'lucide-react';
import { SegmentedControl, buildRouteLabel, formatPrice } from './parts';

const FLIGHT_LABEL = { direct: 'Directo', stops: 'Con escala' };

function ChecklistItem({ done, label }) {
  return (
    <div className='flex items-center gap-2 text-[13px]'>
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
          done ? 'bg-success text-success-foreground' : 'border border-default'
        }`}
      >
        {done && <Check size={10} strokeWidth={3.5} />}
      </span>
      <span className={done ? 'text-foreground' : 'text-muted'}>{label}</span>
    </div>
  );
}

function OfferCardPreview({ form }) {
  return (
    <div className='overflow-hidden rounded-2xl border border-default bg-surface'>
      <div className='relative h-40 bg-gradient-to-br from-surface-tertiary via-surface-secondary to-surface-tertiary'>
        {form.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.coverImage} alt='' className='h-full w-full object-cover' />
        ) : (
          <div className='flex h-full items-center justify-center text-muted/30'>
            <ImagePlus size={28} />
          </div>
        )}
        <div className='absolute left-2.5 top-2.5 flex gap-1.5'>
          {form.featured && (
            <span className='rounded-full bg-accent px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-accent-foreground'>DESTACADA</span>
          )}
          {form.isSpecialOffer && (
            <span className='rounded-full bg-warning px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-warning-foreground'>ESPECIAL</span>
          )}
        </div>
        {form.seats ? (
          <div className='absolute bottom-2 right-2.5 rounded-lg bg-surface-night/70 px-2.5 py-1 text-[11px] text-white backdrop-blur-sm'>
            {form.seats} cupo{form.seats !== 1 ? 's' : ''}
          </div>
        ) : null}
      </div>

      <div className='space-y-2.5 p-4'>
        <p className='text-[15px] font-extrabold leading-snug text-foreground'>{form.title || 'Título de la oferta'}</p>
        <p className='flex items-center gap-1.5 text-xs text-muted'>
          <Plane size={12} />
          {buildRouteLabel(form)}
        </p>
        <p className='flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-default pt-2.5 text-[11.5px] text-muted'>
          {form.days || form.nights ? <span>{form.days || 0} días / {form.nights || 0} noches</span> : null}
          {form.flightType && <span>· {FLIGHT_LABEL[form.flightType] || form.flightType}</span>}
          {form.airline && <span>· {form.airline}</span>}
        </p>
        <p className='flex items-baseline gap-2 pt-0.5'>
          {form.originalPrice ? (
            <span className='text-xs text-muted line-through'>{formatPrice(form.originalPrice, form.currency)}</span>
          ) : null}
          <span className={`text-xl font-extrabold ${form.price != null ? 'text-accent' : 'text-muted/40'}`}>{formatPrice(form.price, form.currency)}</span>
          {form.priceNote && <span className='text-[11px] text-muted'>{form.priceNote}</span>}
        </p>
      </div>
    </div>
  );
}

export default function OfferPreviewPanel({
  form, update, fieldErrors, showErrors, pending, pendingLabel, label, onSave, errorCount,
}) {
  return (
    <div className='sticky top-20 space-y-4'>
      <p className='text-[11px] font-bold uppercase tracking-[0.08em] text-muted'>Vista previa</p>

      <OfferCardPreview form={form} />

      <div className='space-y-2.5 rounded-2xl border border-default bg-surface p-4'>
        <p className='text-xs font-semibold text-muted'>Antes de publicar</p>
        <div className='space-y-2'>
          <ChecklistItem done={!fieldErrors.title && !fieldErrors.customRoute && !fieldErrors.destinationCountry} label='Título y destino' />
          <ChecklistItem done={form.price != null && form.price !== ''} label='Precio cargado' />
          <ChecklistItem done={Boolean(form.coverImage)} label='Imagen de portada' />
        </div>
      </div>

      <div className='space-y-4 rounded-2xl border border-default bg-surface p-4'>
        <div className='space-y-1.5'>
          <span className='text-[13px] font-medium text-foreground'>Estado</span>
          <SegmentedControl
            aria-label='Estado de la oferta'
            options={[{ value: 'draft', label: 'Borrador' }, { value: 'published', label: 'Publicado' }]}
            value={form.status}
            onChange={(v) => update('status', v)}
          />
          {showErrors && fieldErrors.status && <p className='text-xs text-danger'>{fieldErrors.status}</p>}
        </div>

        <div className='flex items-center justify-between'>
          <span className='text-[13px] font-semibold text-foreground'>Oferta destacada</span>
          <Switch isSelected={form.featured} onChange={(v) => update('featured', v)}>
            <Switch.Control><Switch.Thumb /></Switch.Control>
          </Switch>
        </div>

        <div className='flex items-center justify-between'>
          <span className='text-[13px] font-semibold text-foreground'>Oferta especial</span>
          <Switch isSelected={form.isSpecialOffer} onChange={(v) => update('isSpecialOffer', v)}>
            <Switch.Control><Switch.Thumb /></Switch.Control>
          </Switch>
        </div>
        {form.isSpecialOffer && (
          <p className='rounded-lg bg-warning/10 px-3 py-2 text-xs text-foreground'>
            Solo puede haber una a la vez. La oferta especial anterior se desactivará automáticamente.
          </p>
        )}

        <div className='h-px bg-default' />

        <Button
          type='button'
          isPending={pending}
          onClick={onSave}
          className='flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-bold text-accent-foreground shadow-sm shadow-accent/20 transition-all hover:bg-orange-500'
        >
          {({ isPending }) => (
            <>
              {isPending && <Spinner color='current' size='sm' />}
              {isPending ? pendingLabel : label}
            </>
          )}
        </Button>

        {showErrors && errorCount > 0 && (
          <p className='text-center text-xs font-medium text-danger'>
            {errorCount} campo{errorCount !== 1 ? 's' : ''} sin completar
          </p>
        )}
      </div>
    </div>
  );
}
