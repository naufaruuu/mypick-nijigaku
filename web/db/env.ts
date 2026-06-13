// DB + CDN config. Read LAZILY (inside functions) so importing these modules
// during `next build` doesn't require the env to be present — the vars only
// need to exist at runtime.
function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`missing env var: ${name}`);
  return v;
}

export function dbEnv() {
  return {
    host: req('POSTGRES_HOST'),
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    database: req('POSTGRES_DB'),
    user: req('POSTGRES_USER'),
    password: req('POSTGRES_PASSWORD'),
  };
}

// Public CDN url for a song cover.
export function coverUrl(slug: string): string {
  return `https://${req('CDN_ENDPOINT')}/nijigasaki-album/${slug}.webp`;
}
