'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/inicio/ui/Navbar';
import Footer from '@/components/inicio/sections/Footer';

export default function RootShell({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return <div>{children}</div>;
  }

  return (
    <div>
      <Navbar />
      <div className='mx-auto max-w-7xl px-4 pt-[68px]'>{children}</div>
      <Footer />
    </div>
  );
}
