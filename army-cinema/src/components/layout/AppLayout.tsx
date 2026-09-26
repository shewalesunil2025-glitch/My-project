import { AnimatePresence, motion } from 'framer-motion';
import { Suspense, useEffect } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { LoadingState } from '@/components/ui/States';
import { DemoBanner } from './DemoBanner';
import { Footer } from './Footer';
import { MobileTabBar, Navbar } from './Navbar';

export function AppLayout() {
  const outlet = useOutlet();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-xl focus:bg-saffron focus:px-4 focus:py-2 focus:text-ink-950">
        Skip to content
      </a>
      <DemoBanner />
      <Navbar />
      <main id="main" className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <Suspense fallback={<LoadingState className="min-h-[60vh]" />}>{outlet}</Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <MobileTabBar />
    </div>
  );
}
