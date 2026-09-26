import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { KerkettaSign } from '@/components/ui/KerkettaSign';

const HERO_SRC = `${import.meta.env.BASE_URL}images/hero/hero.jpg`;

function HeroImage({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    // Designed fallback until the hero photograph is added to /public/images/hero/hero.jpg
    return (
      <div className={className} role="img" aria-label="Kerketta Auditorium sign">
        <div className="relative grid h-full w-full place-items-center overflow-hidden bg-[radial-gradient(120%_80%_at_50%_0%,#12224a_0%,#050b18_70%)]">
          <div className="contour-bg absolute inset-0 opacity-80" />
          <KerkettaSign className="relative size-[55%] max-w-72 opacity-90" />
        </div>
      </div>
    );
  }
  return (
    <img
      src={HERO_SRC}
      alt="An Army officer in a winter uniform reads a letter, seated on a snow-covered bench below misty mountains"
      width={600}
      height={768}
      fetchPriority="high"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};

function Heading({ withTagline = true }: { withTagline?: boolean }) {
  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }}>
      <motion.p variants={item} className="eyebrow flex items-center gap-2">
        <Star className="size-3.5 fill-current" aria-hidden /> Veer Cinema presents
      </motion.p>
      <motion.h1
        variants={item}
        id="hero-title"
        className="mt-2 font-display text-[3.4rem] font-bold uppercase leading-[0.88] tracking-[0.01em] sm:text-7xl lg:text-8xl"
      >
        Kerketta
        <span className="block text-tricolour">Auditorium</span>
      </motion.h1>
      <motion.div variants={item} className="tricolour-rule mt-4 w-28 rounded" />
      {withTagline && (
        <motion.div variants={item}>
          <Tagline />
        </motion.div>
      )}
    </motion.div>
  );
}

function Tagline() {
  return (
    <p className="mt-4 max-w-md text-base text-fg-muted sm:text-lg">
      Movie ticket booking for serving personnel and their families.{' '}
      <span lang="hi" className="text-fg">वीरों के लिए, वीरों के परिवार के लिए।</span>
    </p>
  );
}

/** Kerketta Auditorium hero: big heading over the photograph, with the now-showing card below. */
export function Hero({ nowShowing }: { nowShowing: ReactNode }) {
  return (
    <section aria-labelledby="hero-title" className="relative isolate">
      {/* Phones: full photograph with the heading over the mountains, the soldier stays clear */}
      <div className="relative -mt-16 md:hidden">
        <HeroImage className="block aspect-[600/768] w-full object-cover" />
        <div className="absolute inset-x-0 top-0 h-[55%] bg-gradient-to-b from-ink-900 via-ink-900/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-ink-900 to-transparent" />
        <div className="absolute inset-x-0 top-16 px-4 pt-3">
          <Heading withTagline={false} />
        </div>
      </div>
      <div className="container-page relative -mt-4 space-y-5 md:hidden">
        <Tagline />
        {nowShowing}
      </div>

      {/* Tablet & desktop: heading and movie left, framed photograph right */}
      <div className="container-page hidden items-center gap-12 py-12 md:grid md:grid-cols-[1.15fr_0.85fr] lg:py-16">
        <div className="space-y-8">
          <Heading />
          {nowShowing}
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-sm"
        >
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-[conic-gradient(from_200deg,#ff9933_0deg,#f5f7fb_120deg,#138808_240deg,#ff9933_360deg)] opacity-25 blur-3xl" />
          <div className="overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl">
            <div className="tricolour-rule" />
            <HeroImage className="aspect-[600/768] w-full object-cover" />
          </div>
          <KerkettaSign className="absolute -bottom-6 -left-6 size-24 drop-shadow-[0_10px_30px_rgb(0_0_0/0.6)]" />
        </motion.div>
      </div>
    </section>
  );
}
