# mypick-nijigasaki Helm chart

Kubernetes deployment of the My Pick Nijigasaki app, ported from
[`docker-compose.yml`](../docker-compose.yml). Modeled on the `ll-archive`
chart's conventions (per-component env Secrets, `global.images`, nginx sidecar,
ingress).

## What it deploys

| compose service | chart equivalent |
| --------------- | ---------------- |
| `web` (Next.js standalone, :3000) | `web` Deployment |
| `nginx` (edge proxy) | nginx **sidecar** in the web Pod (`web.sidecars.nginx`) — listens on 3001 |
| `redis` (LRU cache) | `redis` Deployment + Service |
| Postgres (LAN) | external — `POSTGRES_HOST` in `web.config`, no in-chart DB |

`nginx` becomes a sidecar (not its own Deployment) so external traffic reaches
Next.js over loopback with no extra Service hop — the same pattern `ll-archive`
uses for `web`/`api`. `REDIS_URL` is injected by the web template from the
release name, so it always tracks the in-cluster redis Service. `SITE_URL` is
likewise injected as `https://<ingress.hosts.web>`, so the public origin (OG /
canonical URLs) can't drift from the host that actually receives traffic.

## Usage

First create your real values from the template (the real `values.yaml` is
gitignored — it carries your LAN host / credentials):

```bash
cp values.yaml.example values.yaml   # then edit Postgres host/password, ingress host
```

```bash
make template   # render to stdout
make install    # helm upgrade --install into the `nijigasaki` namespace
```

Or directly:

```bash
helm upgrade --install mypick-nijigasaki . -n nijigasaki --create-namespace
```

## Configuration

All knobs live in [`values.yaml`](values.yaml):

- `global.images.*` — bump image repos/tags in one place. Set `web.tag` to your
  built `mypick-nijigasaki-web` image.
- `web.config` — the web env Secret (Postgres, R2/S3, CDN, Next.js runtime).
  These mirror `.env`; rotate secrets here (or via `--set`/a values overlay).
- `web.sidecars.nginx.enabled` — `false` exposes Next.js directly on 3000 and
  drops the sidecar + ConfigMap.
- `ingress.hosts.web` — public hostname; `ingress.className` defaults to
  `traefik`. Add `ingress.tls` for certs.
- `redis.maxmemory` / `redis.maxmemoryPolicy` — mirror the compose cache flags.

> The compose stack published nginx on host port `8088`. In-cluster, traffic
> arrives via the Ingress; to reproduce a NodePort instead, set
> `web.service.type: NodePort` and `web.service.nodePort: 30088`.
