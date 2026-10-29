#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -f .rea-studio.pid ] && kill -0 "$(cat .rea-studio.pid)" 2>/dev/null; then
  echo "REA Studio já está em execução (PID $(cat .rea-studio.pid))."
  exit 0
fi
if ! command -v node >/dev/null; then
  echo "Node.js não encontrado."
  exit 1
fi
nohup node studio/server.mjs > .rea-studio.log 2>&1 < /dev/null &
echo "$!" > .rea-studio.pid
sleep 1
if kill -0 "$(cat .rea-studio.pid)" 2>/dev/null; then
  echo "REA Studio iniciado na porta 4173. Token: cat .rea-studio-token"
else
  cat .rea-studio.log
  exit 1
fi
