/**
 * The premium website templates. Each one is a look (colours, type, cards) plus a 3D hero
 * scene and a cursor effect; SiteView draws every template from this list. Original ibaxai
 * designs, free for every client.
 */

export type HeroArt =
  | "aurora" // drifting colour light
  | "rings" // 3D rings orbiting a glowing core
  | "cubes" // floating 3D cubes
  | "sphere" // glossy orb with an orbiting moon
  | "grid" // neon perspective grid with a sun
  | "cards" // stacked 3D cards with the services
  | "waves" // layered moving waves
  | "stars" // starfield with shooting stars
  | "beams" // sweeping light beams
  | "mesh" // slowly turning colour mesh
  | "embers" // rising sparks
  | "ripples" // calm ripples
  | "tunnel" // 3D tunnel rushing forward
  | "helix"; // rotating double helix

export type Theme = {
  id: string;
  label: string;
  note: string;
  dark: boolean;
  /** Page background (CSS). */
  bg: string;
  /** Text and muted text colours. */
  fg: string;
  muted: string;
  /** Card surface (CSS background) and border colour. */
  card: string;
  line: string;
  font: "display" | "serif" | "mono" | "sans";
  upper?: boolean;
  art: HeroArt;
  /** Second colour that mixes with the client's accent in the hero. */
  tint: string;
  /** Custom cursor on desktop: a glowing spotlight or a ring that follows. */
  cursor: "spot" | "ring";
  center?: boolean;
};

const darkCard = "linear-gradient(160deg, rgb(255 255 255 / 0.075), rgb(255 255 255 / 0.02))";
const lightCard = "linear-gradient(160deg, rgb(255 255 255 / 0.95), rgb(255 255 255 / 0.75))";

export const themes: Theme[] = [
  { id: "aurora", label: "Aurora", note: "Glowing colour light", dark: true, bg: "#05060a", fg: "#f5f7fb", muted: "rgb(255 255 255 / 0.62)", card: darkCard, line: "rgb(255 255 255 / 0.1)", font: "display", art: "aurora", tint: "#22d3ee", cursor: "spot" },
  { id: "orbit", label: "Orbit", note: "3D rings around a glowing core", dark: true, bg: "#04050c", fg: "#eef1ff", muted: "rgb(225 230 255 / 0.6)", card: darkCard, line: "rgb(255 255 255 / 0.1)", font: "display", art: "rings", tint: "#818cf8", cursor: "ring", center: true },
  { id: "cubix", label: "Cubix", note: "Floating 3D cubes", dark: true, bg: "#060a16", fg: "#eef4ff", muted: "rgb(220 232 255 / 0.6)", card: darkCard, line: "rgb(255 255 255 / 0.1)", font: "display", art: "cubes", tint: "#38bdf8", cursor: "spot" },
  { id: "glass", label: "Glass", note: "Glossy 3D orb, frosted cards", dark: true, bg: "#070a12", fg: "#f3f6fb", muted: "rgb(255 255 255 / 0.6)", card: darkCard, line: "rgb(255 255 255 / 0.12)", font: "display", art: "sphere", tint: "#6366f1", cursor: "ring" },
  { id: "neon", label: "Neon", note: "Night city, 3D neon grid", dark: true, bg: "#000000", fg: "#ffffff", muted: "rgb(255 255 255 / 0.58)", card: darkCard, line: "rgb(255 255 255 / 0.12)", font: "display", upper: true, art: "grid", tint: "#f0abfc", cursor: "spot", center: true },
  { id: "prism", label: "Prism", note: "Bright, 3D service cards", dark: false, bg: "linear-gradient(160deg,#ffffff,#eef0ea)", fg: "#0c0d0c", muted: "rgb(20 20 20 / 0.58)", card: lightCard, line: "rgb(0 0 0 / 0.07)", font: "display", art: "cards", tint: "#a3e635", cursor: "ring" },
  { id: "luxe", label: "Luxe", note: "Ivory and serif, quiet luxury", dark: false, bg: "#fbf8f2", fg: "#1a1712", muted: "rgb(40 33 20 / 0.6)", card: lightCard, line: "rgb(60 45 20 / 0.1)", font: "serif", art: "beams", tint: "#d4a54a", cursor: "ring", center: true },
  { id: "nova", label: "Nova", note: "Starfield and shooting stars", dark: true, bg: "#03040a", fg: "#f4f6ff", muted: "rgb(230 235 255 / 0.6)", card: darkCard, line: "rgb(255 255 255 / 0.1)", font: "display", art: "stars", tint: "#a78bfa", cursor: "spot", center: true },
  { id: "ocean", label: "Ocean", note: "Deep blue moving waves", dark: true, bg: "#031322", fg: "#eaf6ff", muted: "rgb(214 238 255 / 0.62)", card: darkCard, line: "rgb(255 255 255 / 0.1)", font: "display", art: "waves", tint: "#22d3ee", cursor: "ring" },
  { id: "ember", label: "Ember", note: "Warm night, rising sparks", dark: true, bg: "#0b0605", fg: "#fff4ec", muted: "rgb(255 232 214 / 0.6)", card: darkCard, line: "rgb(255 255 255 / 0.1)", font: "display", art: "embers", tint: "#f97316", cursor: "spot" },
  { id: "mesh", label: "Mesh", note: "Soft colour mesh, light", dark: false, bg: "#f7f7fb", fg: "#0f1020", muted: "rgb(20 22 45 / 0.58)", card: lightCard, line: "rgb(20 20 60 / 0.08)", font: "display", art: "mesh", tint: "#f472b6", cursor: "spot", center: true },
  { id: "zen", label: "Zen", note: "Calm sand tones, ripples", dark: false, bg: "#f4efe6", fg: "#24211b", muted: "rgb(50 44 32 / 0.6)", card: lightCard, line: "rgb(60 50 30 / 0.1)", font: "serif", art: "ripples", tint: "#a3a380", cursor: "ring", center: true },
  { id: "tunnel", label: "Tunnel", note: "3D tunnel rushing forward", dark: true, bg: "#000000", fg: "#ffffff", muted: "rgb(255 255 255 / 0.6)", card: darkCard, line: "rgb(255 255 255 / 0.12)", font: "display", upper: true, art: "tunnel", tint: "#e879f9", cursor: "spot", center: true },
  { id: "helix", label: "Helix", note: "Rotating 3D helix, science feel", dark: true, bg: "#03100f", fg: "#eafffb", muted: "rgb(210 255 245 / 0.6)", card: darkCard, line: "rgb(255 255 255 / 0.1)", font: "display", art: "helix", tint: "#2dd4bf", cursor: "ring" },
  { id: "velvet", label: "Velvet", note: "Deep purple, serif elegance", dark: true, bg: "#0d0614", fg: "#f8f0ff", muted: "rgb(240 225 255 / 0.62)", card: darkCard, line: "rgb(255 255 255 / 0.1)", font: "serif", art: "aurora", tint: "#c084fc", cursor: "ring", center: true },
  { id: "royal", label: "Royal", note: "Navy and gold light beams", dark: true, bg: "#050a1a", fg: "#f6f1e3", muted: "rgb(245 235 210 / 0.62)", card: darkCard, line: "rgb(212 165 74 / 0.22)", font: "serif", art: "beams", tint: "#d4a54a", cursor: "ring", center: true },
  { id: "mono", label: "Mono", note: "Black and white, editorial", dark: false, bg: "#ffffff", fg: "#000000", muted: "rgb(0 0 0 / 0.55)", card: "#ffffff", line: "rgb(0 0 0 / 0.14)", font: "mono", upper: true, art: "cards", tint: "#000000", cursor: "ring" },
  { id: "frost", label: "Frost", note: "Icy glass and a cool orb", dark: false, bg: "linear-gradient(180deg,#f5fbff,#e6f2fb)", fg: "#0b1726", muted: "rgb(15 35 60 / 0.58)", card: lightCard, line: "rgb(15 60 110 / 0.1)", font: "display", art: "sphere", tint: "#7dd3fc", cursor: "spot", center: true },
  { id: "bloom", label: "Bloom", note: "Pastel colour blooms", dark: false, bg: "#fff8fa", fg: "#24121a", muted: "rgb(60 25 40 / 0.58)", card: lightCard, line: "rgb(90 30 60 / 0.08)", font: "serif", art: "aurora", tint: "#f9a8d4", cursor: "spot", center: true },
  { id: "carbon", label: "Carbon", note: "Graphite with light sweeps", dark: true, bg: "#0b0c0e", fg: "#f2f3f5", muted: "rgb(235 238 242 / 0.58)", card: darkCard, line: "rgb(255 255 255 / 0.1)", font: "display", upper: true, art: "beams", tint: "#94a3b8", cursor: "spot" },
  { id: "sunset", label: "Sunset", note: "Orange-pink dusk waves", dark: true, bg: "linear-gradient(180deg,#1a0716,#2a0b12 60%,#120509)", fg: "#fff1ea", muted: "rgb(255 225 210 / 0.62)", card: darkCard, line: "rgb(255 255 255 / 0.1)", font: "display", art: "waves", tint: "#fb7185", cursor: "ring", center: true },
  { id: "jungle", label: "Jungle", note: "Deep green, glowing life", dark: true, bg: "#03100a", fg: "#ecfff3", muted: "rgb(215 255 230 / 0.6)", card: darkCard, line: "rgb(255 255 255 / 0.1)", font: "display", art: "embers", tint: "#4ade80", cursor: "spot" },
  { id: "pop", label: "Pop", note: "Bold colour, big type, 3D cubes", dark: false, bg: "#fff6d6", fg: "#141414", muted: "rgb(20 20 20 / 0.62)", card: "#ffffff", line: "rgb(0 0 0 / 0.9)", font: "display", upper: true, art: "cubes", tint: "#ff4d6d", cursor: "ring" },
  { id: "slate", label: "Slate", note: "Clean corporate, 3D rings", dark: false, bg: "#f5f7fa", fg: "#0f172a", muted: "rgb(30 41 59 / 0.6)", card: lightCard, line: "rgb(15 23 42 / 0.08)", font: "display", art: "rings", tint: "#60a5fa", cursor: "spot" },
];

/** Older template names saved in projects → their closest new template. */
const legacy: Record<string, string> = { classic: "aurora", bold: "prism", minimal: "luxe", elegant: "glass" };

export const themeIds = themes.map((t) => t.id);
export const themeFor = (id: string): Theme => themes.find((t) => t.id === id) ?? themes.find((t) => t.id === legacy[id]) ?? themes[0];
