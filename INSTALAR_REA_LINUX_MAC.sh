#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT/rea-main"
node -e 'const [a,b,c]=process.versions.node.split(".").map(Number);if(!((a===22&&(b>23||(b===23&&c>=4)))||(a===24&&(b>22||(b===22&&c>=1)))||(a===26&&(b>12||(b===12&&c>=1)))||(a>26))){console.error("Node.js incompatível: "+process.version);process.exit(1)}'
npm ci --no-audit --no-fund
npm run build:cached
node scripts/rea.mjs --help
