#requires -Version 5.1
$ErrorActionPreference = 'Stop'
$project = Join-Path $PSScriptRoot 'rea-main'
if (-not (Test-Path (Join-Path $project 'package.json'))) { throw "Pasta rea-main inexistente" }
Push-Location $project
try {
  $version = (& node --version).Trim()
  if ($LASTEXITCODE -ne 0) { throw 'Instale Node.js 24.22.1+ antes de continuar.' }
  node -e 'const [a,b,c]=process.versions.node.split(".").map(Number);if(!((a===22&&(b>23||(b===23&&c>=4)))||(a===24&&(b>22||(b===22&&c>=1)))||(a===26&&(b>12||(b===12&&c>=1)))||(a>26)))process.exit(1)'
  if ($LASTEXITCODE -ne 0) { throw "Node.js $version incompatível com REA" }
  npm ci --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) { throw 'Falha na instalacao de dependencias' }
  npm run build:cached
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao compilar' }
  node scripts/rea.mjs --help
  if ($LASTEXITCODE -ne 0) { throw 'Falha no teste de CLI' }
} finally { Pop-Location }
