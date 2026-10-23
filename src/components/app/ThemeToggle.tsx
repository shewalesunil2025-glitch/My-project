"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

export type Theme = "light" | "dark";
const KEY = "ibax-theme";
const BAR = { light: "#f4f8f3", dark: "#030703" };
/** "only light" stops Android Chrome / MIUI from force-darkening the Day look. */
const SCHEME = { light: "only light", dark: "dark" };

/** Runs before the page paints, so a Day (light) user never sees a dark flash. */
export const themeScript = `try{var t=localStorage.getItem('${KEY}');if(t==='light'){document.documentElement.dataset.theme='light';var m=document.querySelector('meta[name=theme-color]');if(m)m.setAttribute('content','${BAR.light}');var c=document.querySelector('meta[name=color-scheme]');if(c)c.setAttribute('content','${SCHEME.light}')}}catch(e){}`;

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", BAR[theme]);
  document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", SCHEME[theme]);
  try {
    localStorage.setItem(KEY, theme);
  } catch {}
}

const currentTheme = (): Theme => (document.documentElement.dataset.theme === "light" ? "light" : "dark");
/** Every switch on the page follows the choice the head script (or another switch) applied. */
function watchTheme(onChange: () => void) {
  const o = new MutationObserver(onChange);
  o.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => o.disconnect();
}

/** Day / Night switch: the client's choice is kept on this device. */
export function ThemeToggle({ className, withLabel }: { className?: string; withLabel?: boolean }) {
  const theme = useSyncExternalStore(watchTheme, currentTheme, () => "dark" as Theme);
  const next: Theme = theme === "light" ? "dark" : "light";
  const label = next === "light" ? "Switch to Day mode" : "Switch to Night mode";
  return (
    <button
      type="button"
      onClick={() => apply(next)}
      aria-label={label}
      title={label}
      className={cn("grid size-10 place-items-center rounded-full text-fg-muted hover:bg-white/[0.06] hover:text-fg", withLabel && "flex w-auto gap-2 px-3 text-sm", className)}
    >
      {theme === "light" ? <Moon className="size-[1.15rem]" aria-hidden /> : <Sun className="size-[1.15rem]" aria-hidden />}
      {withLabel && <span>{theme === "light" ? "Night" : "Day"}</span>}
    </button>
  );
}
