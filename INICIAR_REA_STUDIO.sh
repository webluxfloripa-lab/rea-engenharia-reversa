#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"
if [[ ! -f rea-main/dist/cli-runtime/cli.js ]]; then
  echo "REA ainda não foi compilado. Execute: bash INSTALAR_REA_LINUX_MAC.sh"
  exit 1
fi
echo "REA Studio: abra a porta 4173 na aba Ports do Codespaces (visibilidade Private)."
echo "Seu token de acesso:"
if [[ -f .rea-studio-token ]]; then cat .rea-studio-token; else echo "O token será criado ao iniciar. Depois execute: cat .rea-studio-token"; fi
exec node studio/server.mjs
