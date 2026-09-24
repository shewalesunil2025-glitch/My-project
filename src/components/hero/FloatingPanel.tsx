"use client";

import { useId, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SolutionId } from "@/content/solutions";
import { SolutionInfo } from "./SolutionInfo";

type FloatingPanelProps = {
  children: ReactNode;
  solution: SolutionId;
  /** Accessible name, e.g. "About the AI voice receptionist". */
  label: string;
  open: boolean;
  onToggle: () => void;
  /** Where the info card opens relative to the panel. */
  placement?: "below" | "above";
  /** Which edge the info card lines up with. */
  align?: "start" | "end";
  delay?: number;
  className?: string;
};

/**
 * Fixed glass panel around the hero character. Clicking it opens a short
 * explainer right beside it, without leaving the hero.
 */
export function FloatingPanel({
  children,
  solution,
  label,
  open,
  onToggle,
  placement = "below",
  align = "start",
  delay = 0,
  className,
}: FloatingPanelProps) {
  const id = useId();
  const infoId = `${id}-info`;

  return (
    <div className={cn("pointer-events-auto absolute", open ? "z-40" : "z-20", className)}>
      <motion.button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={infoId}
        onClick={onToggle}
        initial={{ opacity: 0, y: 24, scale: 0.94, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "glass group block w-full cursor-pointer rounded-2xl p-3.5 text-left transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-flow/50 hover:shadow-[0_0_40px_-10px_rgb(69_214_176/0.55)] sm:p-4",
          open && "border-flow/60 shadow-[0_0_40px_-10px_rgb(69_214_176/0.6)]",
        )}
      >
        {children}
        <span className="mt-2.5 flex items-center gap-1 font-mono text-[0.6rem] tracking-[0.16em] text-flow-soft/70 uppercase transition-colors group-hover:text-flow-soft">
          {open ? "Close" : "Know more"}
          <Plus
            className={cn("size-3 transition-transform duration-300", open && "rotate-45")}
            aria-hidden
          />
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={infoId}
            role="region"
            aria-labelledby={`${infoId}-title`}
            initial={{ opacity: 0, y: placement === "below" ? -8 : 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: placement === "below" ? -8 : 8, scale: 0.97, transition: { duration: 0.18 } }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "absolute w-[min(20rem,80vw)]",
              placement === "below" ? "top-full mt-3" : "bottom-full mb-3",
              align === "start" ? "left-0" : "right-0",
            )}
          >
            <SolutionInfo id={solution} onClose={onToggle} headingId={`${infoId}-title`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
