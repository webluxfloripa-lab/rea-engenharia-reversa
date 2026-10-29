#!/usr/bin/env bash
set -euo pipefail
echo "Preparando REA em Codespaces..."
if [ ! -f rea-main/package.json ]; then
  echo "Importacao do REA ainda nao disponivel em rea-main/."
  exit 1
fi
bash INSTALAR_REA_LINUX_MAC.sh
echo "REA pronto para uso: cd rea-main && node scripts/rea.mjs --help"
