#!/usr/bin/env bash
set -Eeuo pipefail

# Never store database files on the student application volume.
pg_root=$(mktemp -d /tmp/eevee-postgres.XXXXXX)
pg_data="$pg_root/data"
pg_log="$pg_root/postgres.log"
worker_pid=''

cleanup() {
  local status=$?
  trap - EXIT TERM INT
  if [[ -n "$worker_pid" ]]; then
    kill -TERM -- "-$worker_pid" 2>/dev/null || true
  fi
  gosu postgres pg_ctl -D "$pg_data" -m fast -w -t 10 stop >/dev/null 2>&1 || true
  exit "$status"
}
trap cleanup EXIT
trap 'exit 143' TERM
trap 'exit 130' INT

chown postgres:postgres "$pg_root"
printf '%s\n' postgres > "$pg_root/password"
chown postgres:postgres "$pg_root/password"
chmod 600 "$pg_root/password"
gosu postgres initdb -D "$pg_data" --username=postgres \
  --auth-local=trust --auth-host=scram-sha-256 --pwfile="$pg_root/password" >/dev/null
rm "$pg_root/password"
# pg_ctl's bounded readiness wait includes server startup (no unbounded loop).
if ! gosu postgres pg_ctl -D "$pg_data" -l "$pg_log" \
  -o "-c listen_addresses=localhost -c unix_socket_directories=$pg_root -p 5432" \
  -w -t 30 start; then
  cat "$pg_log" >&2
  echo 'PostgreSQL was not ready within 30 seconds' >&2
  exit 1
fi
gosu postgres createdb -h "$pg_root" -U postgres eevee
if [[ -n "${EEVEE_INIT_SQL_FILE:-}" ]]; then
  gosu postgres psql -X -v ON_ERROR_STOP=1 -h "$pg_root" -U postgres -d eevee \
    -f "$EEVEE_INIT_SQL_FILE"
fi

if [[ $# -eq 0 ]]; then set -- npm start; fi
# A separate process group lets cancellation reach npm, shells and test children.
setsid "$@" &
worker_pid=$!
worker_status=0
wait "$worker_pid" || worker_status=$?
exit "$worker_status"
