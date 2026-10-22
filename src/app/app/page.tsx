"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ArrowRight, CirclePlay, Fingerprint, KeyRound, LogIn, ScanFace, UserPlus } from "lucide-react";
import { product } from "@/config/product";
import { logOut, useSession } from "@/lib/app/store";
import { LOCK_EVENT, bioName, forgetUnlocked, getLock, unlockWithBiometric } from "@/lib/app/appLock";
import { BrandMark } from "@/components/app/ui";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { Wordmark } from "@/components/navigation/Logo";
import { cn } from "@/lib/cn";

/** Soft green light arcs in two corners, like the edge of a glowing planet. */
function Arc({ className }: { className: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute aspect-square rounded-full border border-flow/45",
        "bg-[radial-gradient(circle_at_center,rgb(37_211_102/0.05)_40%,rgb(37_211_102/0.14)_78%,rgb(111_227_160/0.32)_100%)]",
        "shadow-[0_0_70px_rgb(37_211_102/0.35),inset_0_0_60px_rgb(37_211_102/0.18)]",
        className,
      )}
    />
  );
}

const onLockChange = (cb: () => void) => {
  window.addEventListener(LOCK_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(LOCK_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};

/** The app's own primary button (glowing green ring, see .btn-3d), just taller. */
const primary =
  "btn-3d group inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-full text-[1.02rem] font-semibold tracking-tight transition-transform duration-200 active:scale-[0.98]";
const secondary =
  "group inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-full border border-flow/45 bg-white/[0.02] text-[1.02rem] font-semibold tracking-tight text-fg " +
  "backdrop-blur-sm transition-colors duration-200 hover:border-flow/70 hover:bg-flow/[0.06] active:scale-[0.98]";

/** The app's first page: the brand, the slogan and the next step — nothing else. */
export default function WelcomePage() {
  const { ready, user, workspace } = useSession();
  const router = useRouter();
  const signedIn = ready && user && !workspace?.sample;
  // This account has an app lock on this phone: it opens with what the client set up — Face ID,
  // fingerprint and/or PIN — straight from here, with no email or password.
  const lockState = useSyncExternalStore(
    onLockChange,
    () => {
      const lock = user ? getLock(user.id) : null;
      if (!lock) return "";
      return `${lock.credentialId ? (lock.bioKind ?? "face") : ""}|${lock.hash ? "pin" : ""}`;
    },
    () => "",
  );
  const [bioKind, pinOn] = lockState.split("|");
  const bioLabel = bioName(bioKind === "fingerprint" ? "fingerprint" : "face");
  const [bioError, setBioError] = useState("");
  const locked = signedIn && lockState !== "";
  // Opening the app always asks again (also when it was unlocked a moment ago).
  useEffect(() => {
    if (locked) forgetUnlocked();
  }, [locked]);
  const bio = async () => {
    setBioError("");
    if (user && (await unlockWithBiometric(user.id))) router.push("/app/home");
    else setBioError(`${bioLabel} didn't match${pinOn ? " — use your PIN" : " — try again"}.`);
  };
  /** Another account on this phone: sign the current one out first (its data stays safe in the cloud). */
  const switchTo = (path: "/app/signup" | "/app/login") => {
    logOut();
    router.push(path);
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[#020a05]">
      <Arc className="-top-[40vmax] -left-[30vmax] w-[64vmax]" />
      <Arc className="-right-[34vmax] -bottom-[44vmax] w-[66vmax]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,rgb(37_211_102/0.10),transparent_60%)]" />
      <ThemeToggle className="absolute top-[max(env(safe-area-inset-top),0.75rem)] right-3 z-10" />

      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-7 pt-[max(env(safe-area-inset-top),2rem)] pb-[max(env(safe-area-inset-bottom),1.75rem)]">
        <section className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="relative">
            <span aria-hidden className="absolute inset-[-30%] rounded-full bg-flow/25 blur-3xl" />
            <BrandMark className="relative size-28 drop-shadow-[0_0_28px_rgb(37_211_102/0.55)] sm:size-32" />
          </span>
          <h1 className="mt-7">
            <Wordmark className="text-[3.3rem] leading-none sm:text-[3.8rem]" />
          </h1>
          <p className="mt-4 text-[0.6rem] font-medium tracking-[0.2em] whitespace-nowrap text-fg-muted uppercase min-[400px]:tracking-[0.26em] sm:text-[0.7rem]">{product.logoTagline}</p>
          <span aria-hidden className="mt-7 h-px w-36 bg-[linear-gradient(90deg,transparent,#25d366,transparent)] shadow-[0_0_12px_#25d366]" />
          <p className="mt-7 text-[1.35rem] font-medium tracking-tight text-fg">
            Just say it. <span className="text-flow">IBAX</span> does it.
          </p>
        </section>

        <nav aria-label="Get started" className="flex flex-col items-center gap-3.5">
          {locked ? (
            <>
              <p className="mb-1 max-w-full truncate text-sm text-fg-muted">
                Welcome back{workspace?.business?.name ? `, ${workspace.business.name}` : ""}
              </p>
              {bioKind && (
                <button type="button" onClick={() => void bio()} className={primary}>
                  {bioKind === "fingerprint" ? <Fingerprint className="size-5" aria-hidden /> : <ScanFace className="size-5" aria-hidden />}
                  Unlock with {bioLabel}
                </button>
              )}
              {pinOn && (
                <Link href="/app/home" className={bioKind ? secondary : primary}>
                  <KeyRound className="size-5 text-flow" aria-hidden /> Unlock with PIN
                </Link>
              )}
              {bioError && (
                <p role="alert" className="text-sm text-red-300">
                  {bioError}
                </p>
              )}
              <div className="mt-1 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-fg-muted">
                <button type="button" onClick={() => switchTo("/app/login")} className="inline-flex items-center gap-1.5 py-2 transition-colors hover:text-fg">
                  <LogIn className="size-4 text-flow" aria-hidden /> Use another account
                </button>
                <button type="button" onClick={() => switchTo("/app/signup")} className="inline-flex items-center gap-1.5 py-2 transition-colors hover:text-fg">
                  <UserPlus className="size-4 text-flow" aria-hidden /> Create account
                </button>
              </div>
            </>
          ) : signedIn ? (
            <>
              <Link href="/app/home" className={primary}>
                Continue to {workspace?.business?.name || "your workspace"}
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <p className="-mt-1 max-w-full truncate text-xs text-fg-subtle">Logged in as {user.email}</p>
              <button type="button" onClick={() => switchTo("/app/signup")} className={secondary}>
                <UserPlus className="size-5 text-flow" aria-hidden /> Create New Account
              </button>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-fg-muted">
                <button type="button" onClick={() => switchTo("/app/login")} className="inline-flex items-center gap-1.5 py-2 transition-colors hover:text-fg">
                  <LogIn className="size-4 text-flow" aria-hidden /> Login to another account
                </button>
                <Link href="/app/demo" className="inline-flex items-center gap-1.5 py-2 transition-colors hover:text-fg">
                  <CirclePlay className="size-4 text-flow" aria-hidden /> Watch Demo
                </Link>
              </div>
            </>
          ) : (
            <>
              <Link href="/app/signup" className={primary}>
                Create Account
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <Link href="/app/login" className={secondary}>
                Login
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <Link href="/app/demo" className="mt-1 inline-flex items-center gap-1.5 py-2 text-sm text-fg-muted transition-colors hover:text-fg">
                <CirclePlay className="size-4 text-flow" aria-hidden /> Watch Demo
              </Link>
            </>
          )}
        </nav>
      </main>
    </div>
  );
}
