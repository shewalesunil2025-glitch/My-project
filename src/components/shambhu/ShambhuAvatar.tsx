import { cn } from "@/lib/cn";
import { heroCharacterConfig } from "@/config/site";

const images = {
  /** The voice assistant's face: the little robot, cropped to head and shoulders. */
  robot: { src: "/images/shambhu/robot-avatar.webp", size: "cover", position: "center" },
  /** The mascot: the whole head (turban to chin) sized and centred from the mascot image. */
  mascot: { src: heroCharacterConfig.src, size: "116%", position: "62% 30%" },
} as const;

/** Shambhu's face for round avatars, on a soft green glow. */
export function ShambhuAvatar({ image = "mascot", className }: { image?: keyof typeof images; className?: string }) {
  const img = images[image];
  return (
    <span
      aria-hidden
      className={cn("block bg-no-repeat", className)}
      style={{
        backgroundImage: `url(${img.src}), radial-gradient(circle at 50% 40%, #2c4d20, #0a130b 75%)`,
        backgroundSize: `${img.size}, 100%`,
        backgroundPosition: `${img.position}, center`,
      }}
    />
  );
}
