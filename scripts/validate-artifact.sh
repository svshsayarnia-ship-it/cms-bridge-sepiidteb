#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

required_files=(
  "package.json"
  "package-lock.json"
  "vercel.json"
  "next.config.ts"
  "app/layout.tsx"
  "app/page.tsx"
  "app/cms/page.tsx"
  "app/cms/login/page.tsx"
  "app/api/cms/products/route.ts"
  "public/images/drive/hero-rejuvenation.webp"
)

for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    printf 'Missing required artifact file: %s\n' "$file" >&2
    exit 1
  fi
done

if [[ -f .env || -f .env.local || -f .env.production ]]; then
  printf 'Private environment file found in the artifact root. Remove it before upload.\n' >&2
  exit 1
fi

node <<'NODE'
const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const scripts = pkg.scripts ?? {};

for (const name of ["dev", "build", "start", "lint", "test", "validate:artifact"]) {
  if (typeof scripts[name] !== "string" || scripts[name].length === 0) {
    throw new Error(`Missing npm script: ${name}`);
  }
}

if (scripts.build !== "next build" || scripts.start !== "next start") {
  throw new Error("Vercel scripts must use next build and next start");
}

const vercel = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
if (vercel.framework !== "nextjs" || vercel.buildCommand !== "npm run build") {
  throw new Error("vercel.json does not describe the expected Next.js build");
}
NODE

if rg -n --hidden \
  --glob '!node_modules/**' \
  --glob '!.next/**' \
  --glob '!.git/**' \
  '(^|[[:space:]])(ck_[A-Za-z0-9]{20,}|cs_[A-Za-z0-9]{20,})([[:space:]]|$)' .; then
  printf 'A live WooCommerce credential pattern was found in the artifact.\n' >&2
  exit 1
fi

printf 'Artifact validation passed.\n'
