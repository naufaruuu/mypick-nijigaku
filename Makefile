.PHONY: build up down restart logs logs-web ps seed db-push push

# Override if your docker doesn't need sudo:  make up COMPOSE="docker compose"
COMPOSE ?= sudo docker compose
DOCKER  ?= sudo docker

# --- registry (GHCR) ---
GHCR_USER ?= naufaruuu
GHCR_TAG  ?= latest
# Unique tag per `make push` (evaluated once so every image in one push shares
# the same timestamp).
PUSH_STAMP := $(shell date -u +%Y%m%d-%H%M%S)
IMAGES    := mypick-nijigasaki-web

build:
	$(COMPOSE) build web

# Tag + push built image(s) to GHCR as :latest and :<timestamp>.
push:
	@echo "==> tags this push: $(GHCR_TAG), $(PUSH_STAMP)"
	@for img in $(IMAGES); do \
		echo "==> $$img"; \
		$(DOCKER) tag $$img ghcr.io/$(GHCR_USER)/$$img:$(GHCR_TAG)   && \
		$(DOCKER) tag $$img ghcr.io/$(GHCR_USER)/$$img:$(PUSH_STAMP) && \
		$(DOCKER) push ghcr.io/$(GHCR_USER)/$$img:$(GHCR_TAG)        && \
		$(DOCKER) push ghcr.io/$(GHCR_USER)/$$img:$(PUSH_STAMP)      || exit 1; \
	done
	@echo "==> done. timestamp tag: $(PUSH_STAMP)"

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

restart:
	$(COMPOSE) restart web

# All services interleaved.
logs:
	$(COMPOSE) logs -f

# Web-facing tier: nginx + Next.js web.
logs-web:
	$(COMPOSE) logs -f nginx web

ps:
	$(COMPOSE) ps

# --- DB tasks (run on the host via Bun; Postgres is external on the LAN) ---
db-push:
	cd web && bun run db:push

seed:
	cd web && bun run seed
