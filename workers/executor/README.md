# REA Executor (laboratório privado, v0.1)

Serviço Node.js 24 que invoca o **REA 6.8.0 real** usando uma API HTTP **somente em 127.0.0.1**.
É uma etapa de integração e testes; **não é um backend SaaS público**.

## Painel visual local (celular e PC)

Com o executor iniciado, abra **http://127.0.0.1:4183/** no navegador do próprio computador. O painel tem layout responsivo, envio de arquivos, seletor de operação, status do job, cancelamento e download de evidências JSON. Informe o token privado no campo Conexão; ele não é gravado no armazenamento do browser.

**Não exponha a porta 4183 na internet, em túnel público ou no roteador.** A interface responde apenas no loopback do computador, portanto o celular só terá acesso caso exista uma solução privada adicional projetada e autenticada; a interface responsiva ainda não foi homologada em dispositivo Android real.

## Operações reais disponíveis pela API local

| Operation | CLI REA | Requisito |
|---|---|---|
| javascript | analyze-javascript-application | build e `ps` compatível |
| android-package | inspect-android-package | JDK 17+ e `REA_JADX_MCP_JAR` confiável |
| managed-artifact | inspect-managed-artifact | assembly PE/CLI válido |
| managed-members | inspect-managed-members | assembly PE/CLI válido |
| artifact | inspect-artifact | formato reconhecido |
| network-har | inspect-web-network-capture ... har | arquivo HAR válido |
| network-saz | inspect-web-network-capture ... saz | SAZ válido |
| network-qlog | inspect-web-network-capture ... qlog | qlog válido |
| browser-targets | list-browser-targets | `REA_BROWSER_CDP=http://127.0.0.1:9222` |
| browser-page | inspect-web-page | `REA_BROWSER_CDP` e ID de aba existente |

O executor **não navega até uma URL automaticamente**. `POST /v1/website/preflight` verifica HTTPS, domínio explicitamente permitido e DNS público, **mas não autoriza fetch/navegação**: re-resolução, redirecionamentos, DNS rebinding, WebSockets, iframes e todos os sub-recursos precisam ser controlados em uma sandbox com egress policy. Não abra CDP ao público.

## Preparar no computador

- Node.js compatível com `rea-main/package.json` (**24.22.1+ na linha 24**), Git e dependências REA.
- No Windows PowerShell, a partir da raiz do repositório: `./INSTALAR_REA_WINDOWS.ps1`.
- Linux/macOS: `bash INSTALAR_REA_LINUX_MAC.sh`.
- Configure um **segredo aleatório** de 32 bytes ou mais; não coloque em arquivos versionados. Por exemplo, no PowerShell:

```powershell
$env:REA_EXECUTOR_TOKEN = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
$env:REA_EXECUTOR_HOST = '127.0.0.1'
$env:REA_EXECUTOR_PORT = '4183'
node workers/executor/server.mjs
```

No Linux/macOS, gere um segredo com `openssl rand -hex 32` e exporte `REA_EXECUTOR_TOKEN` de modo privado antes de iniciar.

A API local responde a `GET http://127.0.0.1:4183/v1/capabilities` somente com `Authorization: Bearer <segredo>`. Upload:

```powershell
$head = @{ Authorization = "Bearer $env:REA_EXECUTOR_TOKEN" }
Invoke-WebRequest -Uri 'http://127.0.0.1:4183/v1/artifact?project=meu-projeto&name=exemplo.js' -Method PUT -Headers $head -ContentType 'application/octet-stream' -InFile '.\exemplo.js'
$job = Invoke-RestMethod -Uri 'http://127.0.0.1:4183/v1/jobs' -Method POST -Headers $head -ContentType 'application/json' -Body '{"project":"meu-projeto","file":"exemplo.js","operation":"javascript"}'
Invoke-RestMethod -Uri ("http://127.0.0.1:4183/v1/jobs?id=" + $job.id) -Headers $head
```

Para receber uma Evidence completa, consulte o job depois de `status=completed`.
A API de jobs fica em memória enquanto o processo está ativo; relatórios concluídos são persistidos em `.rea-executor-data/reports/`. O envio de arquivo **não** substitui arquivo existente. O gateway serializa os trabalhos, possui prazo de 180 s e não interpreta argumentos ou comandos arbitrários enviados pelo cliente.

## Android e Docker

O `Dockerfile` define uma imagem **experimental**, não homologada, com Node 24, JDK 17, `procps`, REA compilado e um JAR JADX versionado cuja assinatura SHA-256 é verificada na construção.

```sh
docker build --file workers/executor/Dockerfile --tag rea-executor-lab .
```

**Não publique a porta 4183.** A imagem é apenas para laboratório; rode-a com a rede desativada, permissões mínimas, armazenamento temporário e limites de CPU/RAM e inspecione seu conteúdo antes de analisar APKs. Com rede desligada, os métodos de navegador/CDP não funcionarão; para observação web, crie um sandbox de navegação separado com regras de saída restritas. Nenhuma política de rede do Docker foi ativada automaticamente neste repositório.

## Segurança e limites que impedem exposição pública

- Token único de operador local: **não há autenticação multiusuário, organizações nem isolamento real entre tenants** neste serviço.
- Não há antivírus/quarentena, revogação de credenciais, quota global durável, worker autoscalável, backup, retenção agendada ou política de rede neste serviço.
- `REA_EXECUTOR_TOKEN` não pode ser distribuído ao browser, nem exposto em Cloudflare Worker, Site ou logs.
- A API não é uma interface genérica para executar comandos: somente operações da allowlist são permitidas.
- O executor deve rodar numa sandbox Linux dedicada para cada job quando se tornar serviço SaaS.
- Não existem pagamentos ativados, endpoints de cobrança ou licenças proprietárias concedidas pelo REA.
- A interface `apps/web/` permanece usando AST/Babel para análise online, enquanto aguarda broker autenticado + fila durável + R2 privado + worker isolado.

### Validação disponível no GitHub Actions

Além dos testes de unidade, os workflows verificam o REA compilado com JavaScript, captura HAR sintética, DLL .NET compilada, Chromium/CDP em página local controlada e APK público Appium ApiDemos 6.0.18, cujo SHA-256 é validado antes do teste JADX/JDK21. Isso valida os fluxos específicos do laboratório, **não** o tratamento seguro de APKs arbitrários nem a segurança de um serviço público.

## Testes

```sh
node --test workers/executor/server.test.mjs workers/executor/website-preflight.test.mjs
# Após instalar e compilar o REA:
node --test workers/executor/real-smoke.test.mjs
python3 docs/platform/schema/test_schema.py
```

O workflow `.github/workflows/rea-executor.yml` executa esses testes no GitHub Actions. Para MCP local, use o próprio servidor stdio do REA (`node rea-main/scripts/rea.mjs mcp`) sob o contexto de um agente de confiança. **Não** abra a porta `rea mcp --http` para a internet.

### Próximos requisitos antes de ativar no portal

1. Contrato de identidade assinado do Sites/ChatGPT para serviço broker; autoria e autorização server-side com tenant.
2. Armazenamento privado criptografado, quarentena e verificação de tipo, assinaturas e tamanho de APK.
3. Fila durável, jobId, replays idempotentes, cancelamento e retomada; isolamento no nível do sistema operacional.
4. Rotas de saída da sandbox limitadas e validadas por DNS, IPv4/IPv6, redirects e subrecursos.
5. Aplicar migrações de organizações e papéis com testes de conta real; não habilitar pagamentos sem PSP, compliance e aprovação de custos.
6. Testar casos reais de JS, DLL/.NET, HAR, APK e website em runners controlados; Android exige assinatura/métodos sem falsificar evidência.
7. Homologar mobile e desktop reais; ativar observabilidade e backup/restore.

O draft SQL dessas estruturas está em `docs/platform/schema/saas-foundation.sql`. **Não foi aplicado no banco de produção.**
