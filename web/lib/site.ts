// Public origin of the deployed site — used as Next's `metadataBase` so
// relative Open Graph / share-preview URLs resolve to absolute ones. Defaults
// to prod so `next build` never requires it; override per-environment via env.
export const SITE_URL = process.env.SITE_URL ?? 'https://mypick-nijigaku.naufalalfa.com';
