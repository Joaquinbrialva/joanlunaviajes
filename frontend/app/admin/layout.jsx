'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar, { RAIL_WIDTH } from '@/components/admin/shell/sidebar';
import Topbar from '@/components/admin/shell/topbar';
import MobileNav from '@/components/admin/shell/mobile-nav';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.user) setUser(d.user); })
      .catch(() => {});
  }, []);

  useEffect(() => setMobileNavOpen(false), [pathname]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div className='min-h-dvh bg-background'>
      <Sidebar role={user?.role} />
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} user={user} onLogout={handleLogout} />

      <div className='flex min-h-dvh flex-col md:pl-[var(--rail-w)]' style={{ '--rail-w': `${RAIL_WIDTH}px` }}>
        <Topbar user={user} onLogout={handleLogout} onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className='flex-1 p-4 md:p-8'>
          <div className='mx-auto w-full max-w-[1400px] space-y-6'>{children}</div>
        </main>
      </div>
    </div>
  );
}
