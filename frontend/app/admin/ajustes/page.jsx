'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { LuMonitor, LuMoon, LuSun } from 'react-icons/lu';

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro', icon: LuSun },
  { value: 'dark', label: 'Oscuro', icon: LuMoon },
  { value: 'system', label: 'Sistema', icon: LuMonitor },
];

export default function AjustesPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className='space-y-6 max-w-2xl mx-auto'>
      <section>
        <p className='text-sm text-muted mb-1'>
          <Link href='/admin' className='hover:underline'>Panel</Link> / Ajustes
        </p>
        <h2 className='text-4xl font-bold'>Ajustes</h2>
        <p className='text-muted'>Personaliza la experiencia del panel.</p>
      </section>

      {/* Appearance */}
      <div className='rounded-2xl border border-default bg-surface p-5 space-y-4'>
        <div>
          <h3 className='text-lg font-semibold'>Apariencia</h3>
          <p className='text-sm text-muted'>Selecciona el tema visual del panel de administración.</p>
        </div>

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
                    active
                      ? 'border-accent bg-accent/5 text-accent'
                      : 'border-default bg-surface-secondary text-foreground hover:border-accent/40'
                  }`}
                >
                  <Icon className='h-5 w-5' />
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* App info */}
      <div className='rounded-2xl border border-default bg-surface p-5 space-y-3'>
        <h3 className='text-lg font-semibold'>Información del sistema</h3>
        <dl className='space-y-2 text-sm'>
          <Row label='Aplicación' value='Joanluna Viajes — Panel Admin' />
          <Row label='Versión' value='1.0.0' />
          <Row label='Frontend' value='Next.js 15' />
          <Row label='Backend' value='Express 4' />
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className='flex items-center justify-between'>
      <dt className='text-muted'>{label}</dt>
      <dd className='font-medium'>{value}</dd>
    </div>
  );
}
