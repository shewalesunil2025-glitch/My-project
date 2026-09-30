import { cn } from "@/lib/cn";
import { heroCharacterConfig } from "@/config/site";

/**
 * Shambhu's face for round avatars: the whole head (turban to chin) sized and
 * centred from the mascot image, on a soft green glow.
 */
export function ShambhuAvatar({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("block bg-no-repeat", className)}
      style={{
        backgroundImage: `url(${heroCharacterConfig.src}), radial-gradient(circle at 50% 40%, #2c4d20, #0a130b 75%)`,
        backgroundSize: "116%, 100%",
        backgroundPosition: "62% 30%, center",
      }}
    />
  );
}
