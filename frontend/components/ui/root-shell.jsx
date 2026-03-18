'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/inicio/ui/Navbar';
import Footer from '@/components/inicio/sections/Footer';
import ScrollToTop from '@/components/ui/scroll-to-top';

export default function RootShell({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return <div>{children}</div>;
  }

  return (
    <div>
      <Navbar />
      <div className={`mx-auto max-w-7xl px-4 ${['/contacto', '/nosotros', '/login', '/registro'].includes(pathname) ? 'pt-0' : pathname === '/' ? 'pt-4' : 'pt-[92px]'}`}>{children}</div>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
