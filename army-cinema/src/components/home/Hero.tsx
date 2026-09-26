import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import type { ReactNode } from 'react';
import { WavingFlag } from './WavingFlag';

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};

/** Kerketta Auditorium hero: the big heading and the movie now showing — no photograph. */
export function Hero({ nowShowing }: { nowShowing: ReactNode }) {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      <div className="contour-bg absolute inset-0 -z-10 opacity-60" aria-hidden />
      <div className="absolute -right-40 -top-40 -z-10 size-[36rem] rounded-full bg-saffron/10 blur-3xl" aria-hidden />
      <div className="absolute -bottom-40 -left-40 -z-10 size-[30rem] rounded-full bg-india-green/10 blur-3xl" aria-hidden />

      <div className="container-page grid items-center gap-6 pb-6 pt-4 md:grid-cols-[1.25fr_0.75fr] md:gap-10 md:py-14 lg:py-20">
        <div className="space-y-7">
          <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }}>
            <motion.p variants={item} className="eyebrow flex items-center gap-2">
              <Star className="size-3.5 fill-current" aria-hidden /> Station cinema · <span lang="hi">जय हिन्द</span>
            </motion.p>
            <motion.h1
              variants={item}
              id="hero-title"
              className="mt-3 font-display text-[3.6rem] font-bold uppercase leading-[0.86] tracking-[0.01em] sm:text-7xl lg:text-[7.5rem]"
            >
              Kerketta
              <span className="block text-tricolour">Auditorium</span>
            </motion.h1>
            <motion.div variants={item} className="tricolour-rule mt-5 w-28 rounded" />
            <motion.p variants={item} className="mt-5 max-w-md text-base text-fg-muted sm:text-lg">
              Movie ticket booking for serving personnel and their families.{' '}
              <span lang="hi" className="text-fg">वीरों के लिए, वीरों के परिवार के लिए।</span>
            </motion.p>
          </motion.div>
          {nowShowing}
        </div>

        {/* Waving tricolour — first on phones, beside the heading on larger screens */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative order-first mx-auto w-full max-w-[14rem] md:order-none md:max-w-md"
        >
          <div className="absolute inset-x-6 top-1/4 -z-10 h-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_153_51/0.25),rgb(19_136_8/0.12),transparent)] blur-2xl" aria-hidden />
          <div className="aspect-[5/4] w-full">
            <WavingFlag />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
