'use client';


import { useTheme } from 'next-themes';
import { useMounted } from '@/hooks/use-mounted';
import { LuMonitor, LuMoon, LuSun } from 'react-icons/lu';
import { PageHeader, Section } from '@/components/admin/kit';

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro', icon: LuSun },
  { value: 'dark', label: 'Oscuro', icon: LuMoon },
  { value: 'system', label: 'Sistema', icon: LuMonitor },
];

const INFO_ROWS = [
  { label: 'Aplicación', value: 'Joanluna Viajes — Panel Admin' },
  { label: 'Versión', value: '1.0.0' },
  { label: 'Frontend', value: 'Next.js 15' },
  { label: 'Backend', value: 'Express 4' },
];

export default function AjustesPage() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <div className='mx-auto max-w-2xl space-y-6'>
      <PageHeader crumbs={[{ label: 'Panel', href: '/admin' }, { label: 'Ajustes' }]} title='Ajustes' description='Personaliza la experiencia del panel.' />

      <Section title='Apariencia' description='Selecciona el tema visual del panel de administración.' bodyClassName='p-5 pt-0'>
        {mounted && (
          <div className='grid grid-cols-3 gap-3'>
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
              const active = theme === value;
              return (
                <button
                  key={value}
                  type='button'
                  onClick={() => setTheme(value)}
                  className={`flex flex-col items-center gap-2.5 rounded-xl border-2 p-4 text-sm font-medium transition-colors ${
                    active ? 'border-accent bg-accent/5 text-accent' : 'border-default bg-surface-secondary text-foreground hover:border-accent/40'
                  }`}
                >
                  <Icon className='h-5 w-5' />
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </Section>

      <Section title='Información del sistema' bodyClassName='p-5 pt-0 space-y-2 text-sm'>
        {INFO_ROWS.map((row) => (
          <div key={row.label} className='flex items-center justify-between'>
            <dt className='text-muted'>{row.label}</dt>
            <dd className='font-medium'>{row.value}</dd>
          </div>
        ))}
      </Section>
    </div>
  );
}
