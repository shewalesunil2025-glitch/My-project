import { cn } from "@/lib/cn";
import { heroCharacterConfig } from "@/config/site";
import { ShambhuBot, type BotMood } from "./ShambhuBot";

type Props = { image?: "robot" | "mascot"; mood?: BotMood; className?: string };

/**
 * Shambhu's face for round avatars. "robot" is Shambhu's own animated chatbot
 * face (SVG); "mascot" is the whole head (turban to chin) of the mascot image.
 */
export function ShambhuAvatar({ image = "mascot", mood, className }: Props) {
  if (image === "robot") return <ShambhuBot mood={mood} className={cn("overflow-hidden", className)} />;
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
