#!/usr/bin/env bash
# ============================================================
# Upload the warm-paper catalogue product shots to Supabase Storage.
#
# Source images live locally; targets mirror the listing_images
# storage_path rows exactly: catalogue/<wheel>/<file>.jpg in the
# public `listing-images` bucket. Upsert (overwrite) on conflict.
# The DB already points at these paths — nothing here touches the DB.
#
# Secrets: SUPABASE_SERVICE_ROLE_KEY is read from .env and never
# echoed. Run from repo root: bash scripts/upload-catalogue-images.sh
# ============================================================
set -euo pipefail

SRC_ROOT="/Users/renatogusani/Downloads/catalogue"
BUCKET="listing-images"

# Extract only the two vars we need (avoid sourcing the whole .env,
# which may contain lines bash can't parse). Strip optional quotes.
read_env() { grep -E "^$1=" ./.env | head -1 | cut -d= -f2- | sed -e 's/^["'"'"']//' -e 's/["'"'"']$//'; }
BASE="$(read_env VITE_SUPABASE_URL)"
KEY="$(read_env SUPABASE_SERVICE_ROLE_KEY)"

if [[ -z "${BASE:-}" || -z "${KEY:-}" ]]; then
  echo "ERROR: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env" >&2
  exit 1
fi

PATHS=(
  "catalogue/bmw-m/front-1x1.jpg"
  "catalogue/bmw-m/three-quarter-1x1.jpg"
  "catalogue/audi-rs/front-1x1.jpg"
  "catalogue/audi-rs/three-quarter-1x1.jpg"
  "catalogue/mercedes-w205/front-1x1.jpg"
  "catalogue/mercedes-w205/three-quarter-1x1.jpg"
  "catalogue/vw-golf-mk7/front-1x1.jpg"
  "catalogue/vw-golf-mk7/three-quarter-1x1.jpg"
)

echo "== Uploading ${#PATHS[@]} files to bucket '${BUCKET}' =="
for p in "${PATHS[@]}"; do
  local_file="${SRC_ROOT}/${p#catalogue/}"
  if [[ ! -f "$local_file" ]]; then
    echo "MISSING LOCAL: $local_file" >&2; exit 1
  fi
  code=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "${BASE}/storage/v1/object/${BUCKET}/${p}" \
    -H "Authorization: Bearer ${KEY}" \
    -H "apikey: ${KEY}" \
    -H "x-upsert: true" \
    -H "Content-Type: image/jpeg" \
    --data-binary "@${local_file}")
  echo "  upload ${p} -> HTTP ${code}"
done

echo "== Verifying public URLs =="
for p in "${PATHS[@]}"; do
  url="${BASE}/storage/v1/object/public/${BUCKET}/${p}"
  out=$(curl -s -o /dev/null -w "%{http_code} %{content_type} %{size_download}b" "$url")
  echo "  GET ${p} -> ${out}"
done
echo "== done =="
