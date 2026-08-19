'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/inicio/ui/Navbar';
import Footer from '@/components/inicio/sections/Footer';
import ScrollToTop from '@/components/ui/scroll-to-top';

export default function RootShell({ children }) {
  const pathname = usePathname();
  const isAdminRoute    = pathname?.startsWith('/admin');
  const isFullscreenRoute = ['/login', '/registro', '/cambiar-contrasena'].includes(pathname);

  if (isAdminRoute || isFullscreenRoute) {
    return <div>{children}</div>;
  }

  return (
    <div>
      <Navbar />
      <div className={`mx-auto max-w-[1440px] px-4 ${['/contacto', '/nosotros'].includes(pathname) ? 'pt-0' : 'pt-[92px]'}`}>{children}</div>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
