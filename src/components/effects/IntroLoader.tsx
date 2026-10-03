import { LogoMark, Wordmark } from "@/components/navigation/Logo";

/** When the hero entrances should start: part-way into the curtain lift (ms after the intro starts). */
const HERO_CUE_MS = 1350;

/**
 * Opening screen: the logo lights up, a line fills, then the curtain lifts off the
 * hero. Pure CSS, so it never waits on JavaScript. Shown once per visit on larger
 * screens; skipped on phones and for reduced motion.
 */
export function IntroLoader() {
  return (
    <>
      <script
        // Runs before paint: skip the intro if it was already seen this session, and
        // always on phones, where it would run alongside every hero entrance at once.
        dangerouslySetInnerHTML={{
          __html:
            "try{if(sessionStorage.getItem('nx-intro')||matchMedia('(max-width: 767px)').matches)document.documentElement.classList.add('intro-seen');else sessionStorage.setItem('nx-intro','1')}catch(e){}",
        }}
      />
      <div aria-hidden className="intro">
        <div className="intro-glow" />
        <div className="intro-mark">
          <LogoMark className="size-20" />
        </div>
        <Wordmark className="text-[2.6rem]" />
        <p className="intro-name">INTELLIGENT BUSINESS AUTOMATION</p>
        <div className="intro-line">
          <span />
        </div>
      </div>
    </>
  );
}

/**
 * Extra delay (s) for hero entrances so they play as the intro curtain lifts, read
 * from the running CSS animation itself. 0 when there is no intro.
 */
export function introDelay() {
  if (typeof document === "undefined") return 0;
  const intro = document.querySelector<HTMLElement>(".intro");
  if (!intro || getComputedStyle(intro).display === "none") return 0;
  const lift = intro.getAnimations().find((a) => (a as CSSAnimation).animationName === "intro-lift");
  if (!lift || lift.playState === "finished") return 0;
  return Math.max(0, (HERO_CUE_MS - Number(lift.currentTime ?? 0)) / 1000);
}
