#!/usr/bin/env bash
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
infra="$(cd "$here/.." && pwd)"
site="$here/../../apps/site"

pnpm -C "$infra" install --frozen-lockfile --ignore-workspace
SITE_URL=https://ardia.dev pnpm -C "$site" exec astro build
rsync -a --delete "$site/dist/" "$here/dist/"
cd "$here"
"$infra/node_modules/.bin/hexclave" deploy --cloud-project-id 49be2e2e-87c4-433e-b42f-f255854bff56
