import { motion } from 'framer-motion';
import { ShieldCheck, Star, Ticket } from 'lucide-react';
import { useState } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import type { Movie } from '@/types';
import { QuickBook } from './QuickBook';

const HERO_SRC = '/images/hero/hero.jpg';

function HeroImage({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    // Designed fallback until the hero photograph is added to /public/images/hero/hero.jpg
    return (
      <div className={className} role="img" aria-label="Decorative tricolour star emblem">
        <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(120%_80%_at_50%_0%,#12224a_0%,#050b18_70%)]">
          <div className="contour-bg absolute inset-0 opacity-80" />
          <svg viewBox="0 0 200 200" className="absolute left-1/2 top-[38%] w-2/3 -translate-x-1/2 -translate-y-1/2" aria-hidden>
            <defs>
              <linearGradient id="hf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FF9933" />
                <stop offset=".5" stopColor="#F5F7FB" />
                <stop offset="1" stopColor="#1DA01D" />
              </linearGradient>
            </defs>
            <path d="M100 18 160 44v46c0 38-25 68-60 80-35-12-60-42-60-80V44z" fill="none" stroke="url(#hf)" strokeWidth="5" />
            <path d="m100 58 11 23 25 3.6-18 17.6 4.3 25L100 115.4 77.7 127.2 82 102.2 64 84.6 89 81z" fill="#E9B95C" />
          </svg>
        </div>
      </div>
    );
  }
  return (
    <img
      src={HERO_SRC}
      alt="An Army officer in uniform and a woman in a saree stand hand in hand in the rain"
      width={736}
      height={1104}
      fetchPriority="high"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

export function Hero({ movies, featured }: { movies: Movie[]; featured?: Movie }) {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
      {/* ---------- Mobile: full-bleed photograph with text over it ---------- */}
      <div className="relative -mt-16 md:hidden">
        <HeroImage className="h-[78svh] min-h-[520px] w-full object-cover object-[50%_20%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-900/70 via-transparent to-ink-900" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink-900 via-ink-900/85 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-4 pb-6">
          <HeroCopy featured={featured} />
        </div>
      </div>

      {/* ---------- Desktop: copy left, framed portrait right ---------- */}
      <div className="container-page hidden items-center gap-12 py-14 md:grid md:grid-cols-[1.1fr_0.9fr] lg:py-20">
        <div>
          <HeroCopy featured={featured} />
          <div className="mt-8 max-w-xl">
            <QuickBook movies={movies} />
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-md"
        >
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-[conic-gradient(from_200deg,#ff9933_0deg,#f5f7fb_120deg,#138808_240deg,#ff9933_360deg)] opacity-25 blur-3xl" />
          <div className="overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl">
            <div className="tricolour-rule" />
            <HeroImage className="aspect-[2/3] w-full object-cover" />
          </div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="glass absolute -left-8 bottom-16 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-green/15 text-green">
              <ShieldCheck className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold">Verified personnel</p>
              <p className="text-xs text-fg-muted">Service ID check before booking</p>
            </div>
          </motion.div>
          {featured && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="glass absolute -right-6 top-10 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-saffron/15 text-saffron">
                <Ticket className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-xs text-fg-muted">Now showing</p>
                <p className="text-sm font-semibold">{featured.title}</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Mobile quick booking sits right under the photo */}
      <div className="container-page -mt-1 md:hidden">
        <QuickBook movies={movies} />
      </div>
    </section>
  );
}

function HeroCopy({ featured }: { featured?: Movie }) {
  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }}>
      <motion.p variants={item} className="eyebrow flex items-center gap-2">
        <Star className="size-3.5 fill-current" aria-hidden /> Salute to the brave · <span lang="hi">जय हिन्द</span>
      </motion.p>
      <motion.h1 variants={item} id="hero-title" className="mt-3 text-[2.35rem] font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
        Movie nights for the ones <span className="text-tricolour">who guard the nation.</span>
      </motion.h1>
      <motion.p variants={item} className="mt-4 max-w-lg text-base text-fg-muted sm:text-lg">
        Book garrison theatre seats for yourself and your family in under a minute — verified, secure and made for serving
        personnel. <span lang="hi" className="text-fg">वीरों के लिए, वीरों के परिवार के लिए।</span>
      </motion.p>
      <motion.div variants={item} className="mt-6 flex flex-wrap gap-3">
        <ButtonLink to={featured ? `/book/${featured.slug}` : '/movies'} size="lg" className="flex-1 sm:flex-none">
          <Ticket className="size-5" aria-hidden /> Book tickets
        </ButtonLink>
        <ButtonLink to="/#how-it-works" variant="secondary" size="lg" className="flex-1 sm:flex-none">
          How it works
        </ButtonLink>
      </motion.div>
    </motion.div>
  );
}

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};
