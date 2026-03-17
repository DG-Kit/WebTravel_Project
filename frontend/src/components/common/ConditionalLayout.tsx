'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

const NO_LAYOUT_ROUTES = ['/login', '/register'];

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Checks if the current route is one of the NO_LAYOUT_ROUTES
  const hideLayout = NO_LAYOUT_ROUTES.includes(pathname);

  return (
    <>
      {!hideLayout && <Header />}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      {!hideLayout && <Footer />}
    </>
  );
}
