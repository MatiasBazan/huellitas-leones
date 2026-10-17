#!/usr/bin/env bash
# Postgres local del proyecto, sin sudo (puerto 5433, datos en ~/.local/share/huellitas-pg)
# Uso: scripts/db.sh start|stop|status
set -euo pipefail

PG_BIN="${PG_BIN:-/usr/lib/postgresql/18/bin}"
PG_HOME="${PG_HOME:-$HOME/.local/share/huellitas-pg}"
PG_PORT="${PG_PORT:-5433}"

case "${1:-status}" in
  start)
    "$PG_BIN/pg_ctl" -D "$PG_HOME/data" -l "$PG_HOME/postgres.log" \
      -o "-p $PG_PORT -k $PG_HOME -c listen_addresses=localhost" -w start
    ;;
  stop)
    "$PG_BIN/pg_ctl" -D "$PG_HOME/data" -w stop
    ;;
  status)
    "$PG_BIN/pg_ctl" -D "$PG_HOME/data" status
    ;;
  *)
    echo "Uso: $0 start|stop|status" >&2
    exit 1
    ;;
esac
