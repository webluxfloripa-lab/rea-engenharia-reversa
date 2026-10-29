#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo "Configurando REA e painel web com Node.js 24..."
if command -v nvm >/dev/null 2>&1; then
  nvm install 24
  nvm alias default 24
elif [[ -s /usr/local/share/nvm/nvm.sh ]]; then
  source /usr/local/share/nvm/nvm.sh
  nvm install 24
  nvm alias default 24
fi
node --version
npm --version
bash INSTALAR_REA_LINUX_MAC.sh
bash .devcontainer/iniciar-painel.sh
printf '\nPainel: aba PORTS -> 4173 -> Open in Browser (Private).\nToken: cat .rea-studio-token\n'
