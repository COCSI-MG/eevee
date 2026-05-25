#!/bin/sh
set -e

# Replace build-time placeholders for NEXT_PUBLIC_* and APP_ENV with the
# actual runtime environment values. Next.js inlines these into the client
# bundle at build time, so we build with sentinel strings and rewrite them
# here when the container starts.

PLACEHOLDER_API_URL="__RUNTIME_NEXT_PUBLIC_API_URL__"
PLACEHOLDER_APP_ENV="__RUNTIME_APP_ENV__"

: "${NEXT_PUBLIC_API_URL:?NEXT_PUBLIC_API_URL must be set}"
: "${APP_ENV:?APP_ENV must be set}"

# Escape characters that are special to sed's s/// replacement.
escape_sed() {
  printf '%s' "$1" | sed -e 's/[\/&|]/\\&/g'
}

API_URL_ESCAPED=$(escape_sed "$NEXT_PUBLIC_API_URL")
APP_ENV_ESCAPED=$(escape_sed "$APP_ENV")

# Only patch text-ish bundle artifacts. Skip source maps for speed.
find .next -type f \( -name "*.js" -o -name "*.html" -o -name "*.json" \) \
  ! -name "*.map" \
  -exec sed -i \
    -e "s|${PLACEHOLDER_API_URL}|${API_URL_ESCAPED}|g" \
    -e "s|${PLACEHOLDER_APP_ENV}|${APP_ENV_ESCAPED}|g" \
    {} +

exec "$@"
