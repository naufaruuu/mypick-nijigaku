import type { Character, Song } from './types';
import type { Lang } from './i18n';

export interface BucketConfig {
  bucket: string;
  label: string;
  color: string; // border + solid accent (and the button accent for the group)
  bg?: string; // header background CSS (e.g. a gradient); defaults to `color`
  textColor?: string; // header text color; defaults by luminance
  slots: number;
}

// Nijigasaki group card (top 3). Official golden yellow — light, so dark text.
export const GROUP: BucketConfig = {
  bucket: 'Nijigaku',
  label: 'Nijigasaki',
  color: '#F8D657',
  textColor: '#6B5A00',
  slots: 3,
};

export const OTHER: BucketConfig = {
  bucket: 'Others',
  label: 'Others',
  color: '#888780',
  slots: 2,
};

// Sub-units spread across distinct hue families, each anchored to its real logo.
// Order avoids putting QU4RTZ lime adjacent to the Nijigasaki yellow.
export const SUBUNITS: BucketConfig[] = [
  { bucket: 'AZUNA', label: 'AZUNA', color: '#E72247', slots: 1 }, // official red
  {
    bucket: 'DiverDiva',
    label: 'DiverDiva',
    color: '#B14FB0', // representative solid for the border
    bg: 'linear-gradient(90deg, #EC4899 0%, #6366CE 100%)', // its logo gradient
    textColor: '#ffffff',
    slots: 1,
  },
  { bucket: 'QU4RTZ', label: 'QU4RTZ', color: '#C2E812', textColor: '#3D4A00', slots: 1 }, // logo lime
  { bucket: 'R3BIRTH', label: 'R3BIRTH', color: '#3D4291', slots: 1 }, // logo indigo
];

// The 12 member image-colors in canonical order (mirrors the gen-2 `characters`
// table). Used for the static rainbow strips (header + global footer) where a
// DB round-trip would be wasteful.
export const MEMBER_COLORS: string[] = [
  '#ed7d95', // Ayumu
  '#e7d600', // Kasumi
  '#01b7ed', // Shizuku
  '#485ec6', // Karin
  '#ff5800', // Ai
  '#a664a0', // Kanata
  '#d81c2f', // Setsuna
  '#84c36e', // Emma
  '#9ca5b9', // Rina
  '#37b484', // Shioriko
  '#f8c8c4', // Lanzhu
  '#a9a898', // Mia
];

// 12 member cards, derived from characters (color + label), in id order,
// dropping any character without a song bucket (e.g. Yu Takasaki).
export function membersFromCharacters(
  characters: Character[],
  songs: Record<string, Song[]>,
  lang: Lang = 'en',
): BucketConfig[] {
  return characters
    .filter((c) => songs[c.slug]?.length)
    .map((c) => ({
      bucket: c.slug,
      label: lang === 'ja' ? c.jpName : c.name,
      color: c.color,
      slots: 1,
    }));
}

// --- header styling helpers (shared by app cards + export boards) ---

export function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length < 6) return false;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

// header background: explicit `bg` (gradient) wins, else the solid color
export function headerBg(cfg: { color: string; bg?: string }): string {
  return cfg.bg ?? cfg.color;
}

// header text: explicit `textColor` wins, else dark on light colors / white on dark
export function headerText(cfg: { color: string; textColor?: string }): string {
  return cfg.textColor ?? (isLightColor(cfg.color) ? '#3a3320' : '#ffffff');
}
