"use client";

import { useEffect, useRef } from "react";

/**
 * The interactive layer of a client website: the hero scene drifts with the mouse, cards
 * tilt toward the cursor with a moving spotlight, buttons lean toward it (magnetic), and on
 * desktop a custom cursor follows the pointer. Only CSS variables are set here; the looks
 * live in globals.css (sx-*). Off for touch screens and reduced-motion users.
 */
export function SiteFx({ cursor }: { cursor: "spot" | "ring" | "none" }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = anchor.current?.parentElement;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const custom = fine && cursor !== "none";
    if (custom) root.classList.add("sx-cursor-on");

    let x = -100;
    let y = -100;
    let rx = -100;
    let ry = -100;
    let tilted: HTMLElement | null = null;
    let pulled: HTMLElement | null = null;
    let frame = 0;

    const loop = () => {
      // The ring trails the pointer a little, for a smooth, premium feel.
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      if (dot.current) dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      frame = requestAnimationFrame(loop);
    };
    if (custom) frame = requestAnimationFrame(loop);

    const reset = (el: HTMLElement | null) => {
      if (!el) return;
      el.style.removeProperty("--rx");
      el.style.removeProperty("--ry");
    };

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      const box = root.getBoundingClientRect();
      root.style.setProperty("--mx", ((x - box.left) / box.width - 0.5).toFixed(3));
      root.style.setProperty("--my", ((y - window.innerHeight / 2) / window.innerHeight).toFixed(3));

      const target = e.target as HTMLElement;
      const card = target.closest<HTMLElement>(".sx-tilt");
      if (card !== tilted) {
        reset(tilted);
        tilted = card;
      }
      if (card) {
        const r = card.getBoundingClientRect();
        const px = (x - r.left) / r.width;
        const py = (y - r.top) / r.height;
        card.style.setProperty("--rx", `${((0.5 - py) * 10).toFixed(2)}deg`);
        card.style.setProperty("--ry", `${((px - 0.5) * 12).toFixed(2)}deg`);
        card.style.setProperty("--px", `${(px * 100).toFixed(1)}%`);
        card.style.setProperty("--py", `${(py * 100).toFixed(1)}%`);
      }

      const btn = target.closest<HTMLElement>(".sx-magnetic");
      if (btn !== pulled) {
        if (pulled) pulled.style.transform = "";
        pulled = btn;
      }
      if (btn) {
        const r = btn.getBoundingClientRect();
        btn.style.transform = `translate(${((x - r.left - r.width / 2) * 0.18).toFixed(1)}px, ${((y - r.top - r.height / 2) * 0.25).toFixed(1)}px)`;
      }
      root.classList.toggle("sx-hovering", Boolean(btn || target.closest("a, button, summary, input, textarea")));
    };
    const onLeave = () => {
      reset(tilted);
      tilted = null;
      if (pulled) pulled.style.transform = "";
      pulled = null;
      x = y = -100;
    };

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.classList.remove("sx-cursor-on", "sx-hovering");
    };
  }, [cursor]);

  return (
    <>
      <span ref={anchor} hidden />
      {cursor !== "none" && (
        <>
          <div ref={ring} aria-hidden className={`sx-cursor-ring ${cursor === "spot" ? "sx-cursor-spot" : ""}`} />
          <div ref={dot} aria-hidden className="sx-cursor-dot" />
        </>
      )}
    </>
  );
}
