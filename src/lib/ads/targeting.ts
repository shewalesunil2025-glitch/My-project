import type { Area } from "./types";

/** Where an ad may be shown. Radius targeting is only valid where the platform supports it (Meta does, 1–80 km). */

export const RADIUS_PRESETS_KM = [5, 10, 15] as const;
export const MIN_RADIUS_KM = 1;
export const MAX_RADIUS_KM = 80;
export const MAX_AREAS = 10;

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry",
] as const;

/** Rough box around India, to catch a pin dropped in the wrong country or with lat and lng swapped. */
const inIndia = (lat: number, lng: number) => lat >= 6 && lat <= 37.5 && lng >= 68 && lng <= 98;

const text = (v: unknown, min: number, max: number) => (typeof v === "string" && v.trim().length >= min && v.trim().length <= max ? v.trim() : null);

export type AreasResult = { ok: true; areas: Area[] } | { ok: false; error: string };

export function validateAreas(input: unknown): AreasResult {
  if (!Array.isArray(input) || input.length === 0) return { ok: false, error: "Choose where your ad should be shown." };
  if (input.length > MAX_AREAS) return { ok: false, error: `Choose at most ${MAX_AREAS} areas for one campaign.` };
  const areas: Area[] = [];
  for (const raw of input) {
    const a = raw as Record<string, unknown> | null;
    if (!a || typeof a !== "object") return { ok: false, error: "One of the areas is not valid." };
    if (a.type === "india") {
      areas.push({ type: "india" });
    } else if (a.type === "state") {
      const name = INDIAN_STATES.find((s) => s === a.name);
      if (!name) return { ok: false, error: "Pick the state from the list." };
      areas.push({ type: "state", name });
    } else if (a.type === "city") {
      const name = text(a.name, 2, 80);
      const state = a.state === undefined || a.state === "" ? undefined : INDIAN_STATES.find((s) => s === a.state);
      if (!name) return { ok: false, error: "Enter the city name." };
      if (a.state && !state) return { ok: false, error: "Pick the city's state from the list." };
      areas.push({ type: "city", name, ...(state ? { state } : {}) });
    } else if (a.type === "radius") {
      const km = Number(a.km);
      const label = text(a.label, 2, 120);
      if (!Number.isFinite(km) || km < MIN_RADIUS_KM || km > MAX_RADIUS_KM) return { ok: false, error: `The radius must be between ${MIN_RADIUS_KM} and ${MAX_RADIUS_KM} km.` };
      if (!label) return { ok: false, error: "Tell us the place the radius is measured from (your shop address or area)." };
      const hasPin = a.lat !== undefined || a.lng !== undefined;
      const lat = Number(a.lat);
      const lng = Number(a.lng);
      if (hasPin && (!Number.isFinite(lat) || !Number.isFinite(lng) || !inIndia(lat, lng))) return { ok: false, error: "That map position isn't in India. Please check the location." };
      areas.push({ type: "radius", km: Math.round(km * 10) / 10, label, ...(hasPin ? { lat, lng } : {}) });
    } else {
      return { ok: false, error: "One of the areas is not valid." };
    }
  }
  if (areas.some((a) => a.type === "india") && areas.length > 1) return { ok: false, error: "All India can't be combined with other areas." };
  return { ok: true, areas };
}

/** One readable line for the review screen and the dashboard. */
export function describeAreas(areas: Area[]): string {
  return areas
    .map((a) => (a.type === "radius" ? `Within ${a.km} km of ${a.label}` : a.type === "city" ? `${a.name}${a.state ? `, ${a.state}` : ""}` : a.type === "state" ? a.name : "All India"))
    .join(" · ");
}

/** True when every radius has a map position, which the platform needs to create the campaign. */
export const radiiHavePins = (areas: Area[]) => areas.every((a) => a.type !== "radius" || (a.lat !== undefined && a.lng !== undefined));

/** What the client is told about targeting, before paying. */
export const TARGETING_NOTES = [
  "Radius, city and state targeting follow what Meta supports. Meta decides the final delivery area and who sees the ad.",
  "Meta shows an estimated audience size when it has one. It is an estimate, not a promise of reach or results.",
  "People inside the area are targeted by the location Meta knows for them (recent location or home), not by an exact boundary.",
];
