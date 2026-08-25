'use client';

import { Switch } from '@heroui/react';
import { AlignLeft, BedDouble, CalendarRange, CircleDollarSign, Globe2, ImagePlus, Plane } from 'lucide-react';
import { TextInputField, TextareaField } from '@/components/admin/kit';
import HeroSelect from '@/components/ui/hero-select';
import AirlineCombobox from '@/components/ui/airline-combobox';
import RangeDatePickerField from '@/components/ui/range-date-picker-field';
import ItemListInput from '@/components/ui/item-list-input';
import CountryCombobox from '@/components/ui/country-combobox';
import CoverImageInput from '@/components/ui/cover-image-input';
import GalleryEditor from '@/components/ui/gallery-editor';
import HotelAddressSearch from '@/components/ui/hotel-address-search';
import {
  SectionCard, CollapsibleSection, FieldShell, SegmentedControl, ChipToggle, StarRating, NumberInput,
} from './parts';

const OPCIONES_MONEDA = [
  { value: 'ARS', label: 'ARS — Peso argentino' },
  { value: 'USD', label: 'USD — Dólar' },
  { value: 'EUR', label: 'EUR — Euro' },
];

const OPCIONES_TIPO_VIAJE = [
  { value: 'round-trip', label: 'Ida y vuelta' },
  { value: 'one-way', label: 'Solo ida' },
  { value: 'multi', label: 'Multi-destino' },
];

const OPCIONES_TIPO_VUELO = [
  { value: 'direct', label: 'Directo' },
  { value: 'stops', label: 'Con escala' },
];

/* All field groups for the offer form, in one scrollable column — no
   wizard: staff can fill fields in any order while the preview panel
   (rendered alongside, see preview-panel.jsx) reacts live. */
export default function OfferFormBody({ form, update, setForm, showErrors, fieldErrors }) {
  const err = (key) => (showErrors ? fieldErrors[key] : undefined);

  return (
    <div className='space-y-4'>
      <SectionCard icon={Globe2} title='General' description='Título, tipo de viaje y ruta.'>
        <TextInputField
          label='Título de la oferta'
          required
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          placeholder='Ej: Vuelos nacionales, conoce Argentina'
          error={err('title')}
        />

        <FieldShell label='Tipo de viaje' fit>
          <SegmentedControl aria-label='Tipo de viaje' options={OPCIONES_TIPO_VIAJE} value={form.tripType} onChange={(v) => update('tripType', v)} />
        </FieldShell>

        {form.tripType === 'multi' ? (
          <TextInputField
            label='Descripción de la ruta'
            required
            value={form.customRoute}
            onChange={(e) => update('customRoute', e.target.value)}
            placeholder='Ej: Buenos Aires → Lima → Bogotá → Buenos Aires'
            error={err('customRoute')}
          />
        ) : (
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            <FieldShell label='País de origen'>
              <CountryCombobox value={form.originCountry} onChange={(v) => update('originCountry', v)} placeholder='Seleccionar país...' />
            </FieldShell>
            <TextInputField label='Ciudad de origen' value={form.originCity} onChange={(e) => update('originCity', e.target.value)} placeholder='Ej: Buenos Aires' />
            <TextInputField
              label='Código IATA aeropuerto'
              value={form.destinationAirport}
              onChange={(e) => update('destinationAirport', e.target.value)}
              placeholder='Ej: LIM'
              inputClassName='font-mono'
            />
            <FieldShell label='País de destino' required error={err('destinationCountry')}>
              <CountryCombobox value={form.destinationCountry} onChange={(v) => update('destinationCountry', v)} placeholder='Seleccionar país...' />
            </FieldShell>
            <TextInputField label='Ciudad de destino' value={form.destinationCity} onChange={(e) => update('destinationCity', e.target.value)} placeholder='Ej: Lima' />
          </div>
        )}
      </SectionCard>

      <SectionCard icon={CalendarRange} title='Fechas y duración' description='Cuándo viaja y por cuánto tiempo.'>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <FieldShell label='Rango de fechas' hint='Ida y vuelta / llegada'>
            <RangeDatePickerField
              startDate={form.startDate}
              endDate={form.endDate}
              tripType={form.tripType}
              onChange={({ start, end }) => setForm((prev) => ({ ...prev, startDate: start, endDate: end }))}
            />
          </FieldShell>
          <div className='grid grid-cols-2 gap-4'>
            <NumberInput label='Días' value={form.days} onChange={(v) => update('days', v ?? 1)} min={1} withButtons />
            <NumberInput label='Noches' value={form.nights} onChange={(v) => update('nights', v ?? 0)} min={0} withButtons />
          </div>
        </div>
        <TextInputField
          label='Meses disponibles'
          hint='Se muestra cuando no hay fechas exactas'
          value={form.availableMonths}
          onChange={(e) => update('availableMonths', e.target.value)}
          placeholder='Ej: Enero a Marzo, Junio a Agosto'
        />
      </SectionCard>

      <SectionCard icon={Plane} title='Vuelo y equipaje' description='Aerolínea, escalas y qué incluye.'>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <FieldShell label='Aerolínea'>
            <AirlineCombobox value={form.airline} iata={form.airlineIata} onChange={({ name, iata }) => setForm((prev) => ({ ...prev, airline: name, airlineIata: iata }))} />
          </FieldShell>
          <FieldShell label='Tipo de vuelo' fit>
            <SegmentedControl
              aria-label='Tipo de vuelo'
              options={OPCIONES_TIPO_VUELO}
              value={form.flightType}
              onChange={(v) => { update('flightType', v); if (v === 'direct') update('layoverCity', ''); }}
            />
          </FieldShell>
        </div>

        {form.flightType === 'stops' && (
          <TextInputField label='Ciudad de escala' value={form.layoverCity} onChange={(e) => update('layoverCity', e.target.value)} placeholder='Ej: São Paulo, Lima, Miami...' />
        )}

        <FieldShell label='Equipaje incluido'>
          <div className='flex flex-wrap gap-2'>
            <ChipToggle label='Artículo personal' checked={form.luggagePersonal} onChange={(v) => update('luggagePersonal', v)} />
            <ChipToggle label='Carry on' checked={form.luggageCarryOn} onChange={(v) => update('luggageCarryOn', v)} />
            <ChipToggle label='Equipaje despachado' checked={form.luggageChecked} onChange={(v) => update('luggageChecked', v)} />
          </div>
        </FieldShell>
      </SectionCard>

      <SectionCard icon={CircleDollarSign} title='Precio y cupos' description='Moneda, valores y disponibilidad.'>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          <FieldShell label='Moneda'>
            <HeroSelect
              value={form.currency}
              onValueChange={(v) => update('currency', v)}
              options={OPCIONES_MONEDA}
              triggerClassName='h-10 rounded-lg border border-default bg-surface px-3 transition-colors hover:border-muted/60'
            />
          </FieldShell>
          <NumberInput label='Precio base' value={form.price} onChange={(v) => update('price', v)} min={0} formatOptions={{ useGrouping: true, maximumFractionDigits: 0 }} />
          <NumberInput label='Precio original (tachado)' value={form.originalPrice} onChange={(v) => update('originalPrice', v)} min={0} formatOptions={{ useGrouping: true, maximumFractionDigits: 0 }} />
          <TextInputField label='Aclaración de precio' value={form.priceNote} onChange={(e) => update('priceNote', e.target.value)} placeholder='por persona' />
          <NumberInput label='Cupos disponibles' value={form.seats} onChange={(v) => update('seats', v ?? 1)} min={1} withButtons />
        </div>
      </SectionCard>

      <CollapsibleSection icon={BedDouble} title='Alojamiento' description={form.hasHotel && form.hotelName ? form.hotelName : 'Opcional — no incluido'} defaultExpanded={form.hasHotel}>
        <div className='flex items-center justify-between'>
          <span className='text-[13px] font-semibold text-foreground'>La oferta incluye alojamiento</span>
          <Switch
            isSelected={form.hasHotel}
            onChange={(v) => {
              if (!v) setForm((prev) => ({ ...prev, hasHotel: false, hotelName: '', hotelStars: 0, hotelAddress: '', hotelPlaceId: '', hotelMapsUrl: '' }));
              else update('hasHotel', true);
            }}
          >
            <Switch.Control><Switch.Thumb /></Switch.Control>
          </Switch>
        </div>
        {form.hasHotel && (
          <div className='space-y-4 border-t border-default/70 pt-4'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <TextInputField label='Nombre del hotel' value={form.hotelName} onChange={(e) => update('hotelName', e.target.value)} placeholder='Ej: Hotel Sheraton Buenos Aires' />
              <FieldShell label='Categoría (estrellas)'>
                <StarRating value={form.hotelStars} onChange={(v) => update('hotelStars', v)} />
              </FieldShell>
            </div>
            <FieldShell label='Dirección'>
              <HotelAddressSearch
                value={form.hotelAddress}
                mapsUrl={form.hotelMapsUrl}
                onChange={({ address, placeId, mapsUrl }) => setForm((prev) => ({ ...prev, hotelAddress: address, hotelPlaceId: placeId, hotelMapsUrl: mapsUrl }))}
              />
            </FieldShell>
          </div>
        )}
      </CollapsibleSection>

      <SectionCard icon={AlignLeft} title='Contenido' description='Descripción comercial, inclusiones y destacados.'>
        <TextareaField
          label='Resumen comercial'
          value={form.summary}
          onChange={(e) => update('summary', e.target.value)}
          placeholder='Descripción breve que aparece en la tarjeta de oferta...'
        />
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
          <FieldShell label='Incluye'>
            <ItemListInput label='' items={form.includes} onChange={(v) => update('includes', v)} placeholder='Ej: Vuelos, Hotel, Traslados...' />
          </FieldShell>
          <FieldShell label='No incluye'>
            <ItemListInput label='' items={form.notIncludes} onChange={(v) => update('notIncludes', v)} placeholder='Ej: Propinas, Gastos personales...' />
          </FieldShell>
          <FieldShell label='Highlights'>
            <ItemListInput label='' items={form.highlights} onChange={(v) => update('highlights', v)} placeholder='Ej: Asistencia local, Coordinación integral...' />
          </FieldShell>
        </div>
      </SectionCard>

      <SectionCard icon={ImagePlus} title='Imágenes' description='Portada y galería que se muestran en la oferta publicada.'>
        <div className='grid grid-cols-1 gap-5 lg:grid-cols-2'>
          <FieldShell label='Imagen de portada'>
            <CoverImageInput value={form.coverImage} onChange={(url) => update('coverImage', url)} />
          </FieldShell>
          <FieldShell label='Galería adicional' hint='Imágenes que se muestran en la página de la oferta'>
            <GalleryEditor images={form.galleryImages || []} onChange={(imgs) => update('galleryImages', imgs)} />
          </FieldShell>
        </div>
      </SectionCard>
    </div>
  );
}
