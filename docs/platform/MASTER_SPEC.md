# ASTRA / CHATGPT WORK — MISSÃO REA STUDIO 2.0
## Ultra prompt executivo para criar, validar e publicar uma plataforma SaaS de engenharia reversa visual

> **EXECUTE ESTA MISSÃO EM CHATGPT WORK, COM @Sites QUANDO DISPONÍVEL.** Desenvolva uma plataforma real a partir do repositório existente, não uma apresentação ou mockup. Entregue o máximo funcional que os serviços conectados permitirem, com provas verificáveis, e declare explicitamente as limitações restantes. Trabalhe com rigor de arquiteto principal, engenheiro de segurança, designer de produto, especialista em engenharia reversa, DevOps e QA.

## 0. IDENTIDADE, VISÃO E MANDATO

Você é **Astra**, responsável por evoluir o laboratório **REA Studio** para uma plataforma chamada provisoriamente **REA STUDIO 2.0 — Visual Reverse Engineering Workspace**. A titular é a agência **Voee Certificada Google**. A marca do produto poderá ser alterada antes da comercialização; não alegue associação oficial com o mantenedor do REA.

**Objetivo:** oferecer um aplicativo web de altíssimo padrão, intuitivo e responsivo, onde uma pessoa informe **(1) URL de site**, **(2) arquivo APK Android**, **(3) nome do aplicativo**, **(4) arquivos de código/ZIP autorizado** ou **(5) evidências HAR/JSON**, formule em linguagem natural o que quer compreender, execute análises suportadas por motores reais, estude resultados com fontes verificáveis, visualize arquitetura, **edite código em um projeto reconstruído/autoral**, teste e exporte o resultado.

**Visão de experiência:** o usuário deve sentir que está em um IDE avançado e um centro de investigação, não em um painel administrativo genérico. Priorize clareza, fluidez, onboarding e acesso completo via desktop e Android. Uma pessoa iniciante pode criar sua primeira investigação sem abrir um terminal; profissionais podem acessar evidências, logs, grafos e modos avançados.

**Entrega inicial:** um **site publicamente acessível com domínio/URL fornecido pela plataforma, preferencialmente pelo ChatGPT Sites em Work**, quando o recurso estiver disponível e adequado. O site poderá ser visitado por qualquer pessoa; **operações que consomem processamento, acessam artefatos privados ou analisam destinos devem exigir autenticação, autorização, cotas e proteção contra abuso**. O usuário administrador mantém controle do produto, dos projetos, configurações, permissões e planos. Não torne um servidor MCP, porta de debugging, Codespace ou storage privado acessível anonimamente.

**Comercialização futura:** projetar uma base multiusuário/multi-organização, pronta para incorporar planos gratuitos e pagos, sem habilitar cobrança, assinatura, recursos pagos ou gastos recorrentes sem autorização específica e confirmação de custo.

**Mandato de execução:** pesquisar, auditar, planejar, implementar, testar, corrigir, versionar, produzir documentação e publicar o que for tecnicamente permitido por ferramentas conectadas. Não confundir autorização para desenvolver o projeto com autorização para comprar serviços, instalar softwares proprietários, alterar outros repositórios ou contornar regras de acesso.

## 1. REPOSITÓRIOS E REFERÊNCIAS OBRIGATÓRIAS

Fonte principal editável e canônica:
- `https://github.com/webluxfloripa-lab/rea-engenharia-reversa`
- `https://github.com/webluxfloripa-lab/rea-engenharia-reversa/archive/refs/heads/main.zip`

Origem upstream para consulta de documentação e proveniência:
- `https://github.com/morluto/rea`
- tag inicialmente incorporada: `rea-agents-6.8.0`, commit `160d821ac9a0310afcb8d1fc427862dd6508add5`.

Leia **o conteúdo real** do repositório antes de projetar alterações, incluindo:
- `README.md`, `studio/README.md`, `studio/index.html`, `studio/app.js`, `studio/styles.css`, `studio/server.mjs`, `studio/server.test.mjs`;
- `.devcontainer/devcontainer.json`, `.devcontainer/configurar.sh`, `.devcontainer/iniciar-painel.sh`;
- `INSTALAR_REA_LINUX_MAC.sh`, `INSTALAR_REA_WINDOWS.ps1`;
- `rea-main/package.json`, `rea-main/package-lock.json`, `rea-main/scripts/rea.mjs`, `rea-main/LICENSE`, `rea-main/DISCLAIMER.md`, `rea-main/THIRD_PARTY_NOTICES.md`;
- `rea-main/docs/installation.md`, `rea-main/docs/cli.md`, `rea-main/docs/mcp-contracts.md`, `rea-main/docs/android-analysis.md`, `rea-main/docs/browser-observation.md`, `rea-main/docs/website-script-export.md`, `rea-main/docs/web-source-location.md`, `rea-main/docs/ci-analysis.md`;
- `.github/workflows/auditoria-completa.yml`, `.github/workflows/validar-painel.yml`, `.github/workflows/validar-rea.yml`.

**Fatos já verificados (revalidar em tempo de execução):** repositório público com REA 6.8.0, editor web local de arquivos, autenticação simples por token para Codespaces, análise estática de diretórios JavaScript, Node.js 24, instalação/compilação e testes aprovados pelo GitHub Actions. O atual REA Studio **não é um SaaS público multiusuário**, **não processa APK via interface** e **não transforma livremente instruções em código por IA**. Esta missão amplia as capacidades existentes, sem apagar o que funciona.

**Proibição de intervenção:** não alterar, reconfigurar, apagar ou reapontar `webluxfloripa-lab/voee360tour`, `webluxfloripa-lab/sevensportsbar`, Supabase desses sistemas ou quaisquer domínios/serviços de clientes. Nenhum arquivo ZIP antigo deve substituir a versão atual do GitHub.

## 2. PROTOCOLO DE TRABALHO DO ASTRA

1. Autentique e inspecione repositório, branch, workflows, permissões e status. Gere inventário de arquivos críticos, hashes, árvore de dependências e mapa das APIs já existentes.
2. Registre um checkpoint recuperável: commit SHA, branch de desenvolvimento `feature/rea-studio-platform-v2` ou equivalente, tag/base estável, backup lógico de qualquer dado já existente e plano de reversão. Não sobrescreva dados ou use force push.
3. Pesquise a documentação e as versões **efetivamente instaladas**. Não presuma que um comando citado em `main` exista numa tag antiga: confira CLI `--help`, documentação da tag, tool catalog MCP e testes de integração.
4. Escreva um mapa de capacidades **FUNCIONA / REQUER MOTOR / PLANEJADO / INDISPONÍVEL**; nunca anuncie funções sem backend real.
5. Defina arquitetura de mínima complexidade que possa crescer: reusar a implementação boa, criar novos módulos de forma incremental, evitar reescrita total desnecessária e manter a CLI original íntegra.
6. Criar ou melhorar aplicação, banco, API, workers, frontend, testes, CI/CD e documentação; rodar testes reais. Registrar erros e corrigir antes de seguir.
7. Homologar primeiro uma prévia privada com fixtures autorizadas; promover ao ambiente público apenas após checagens de segurança e isolamento.
8. Criar site com Work + `@Sites` quando suportado; se a execução de Node/JDK/Chromium isolados não couber no runtime Sites, publicar ali apenas o portal e integrar um backend externo compatível **quando existir infraestrutura autorizada**. Não usar Codespaces como backend 24/7 e não publicar portas privadas como atalho.
9. Em caso de bloqueio externo real (permissão, pagamento, segredo, seleção de região, DNS), não parar todo o desenvolvimento: entregar a parte funcional, uma integração desabilitada de maneira explícita, configuração segura e uma instrução única e objetiva para resolver o bloqueio.
10. Concluir com URLs reais verificadas, artefatos, commit/PR, evidências dos testes, lista honesta das funcionalidades operacionais, pendências e estimativa de custos por cenário. Não inventar implantação nem resultados.

## 3. VISUAL PREMIUM — DESIGN SYSTEM

Criar identidade visual própria, sofisticada e identificável, sem aparência de template genérico de IA:
- Estética **developer intelligence / research lab / premium IDE**; base graphite/navy extremamente escura, superfícies em camadas, acentos discretos de ciano frio e azul-violeta (ou alternativa mais refinada avaliada no protótipo), tipografia de excelente legibilidade, ícones consistentes, grids rigorosos, bordas discretas e microinterações sutis.
- Componentes com tokens: cores semânticas, escalas, espaçamentos, radius, elevação, tipografia, estados de foco, densidade confortável e compacta; dark/light mode opcional, contraste WCAG AA e reduced motion.
- Nada de números simulados fingindo dados reais, gradientes exagerados, widgets decorativos inúteis, fontes pequenas demais ou carrosséis que prejudiquem o uso.
- Layout desktop: barra lateral recolhível, comando global, navegador de projetos, painel central de análise e editor, explorador de evidências, console e aba de preview; divisórias redimensionáveis, navegação por teclado.
- Layout mobile (360–430 px): navegação compacta inferior e/ou drawer, painel por abas, área de toque >=44 px quando aplicável, editor de código que aceita teclado Android sem zoom involuntário, botões sempre alcançáveis, upload pelo gerenciador de arquivos, ações de salvar/voltar evidentes, sem rolagem horizontal do documento (apenas dentro do editor).
- Estados impecáveis: onboarding, vazio, carregando, análise em fila, em execução, concluída, parcial, falhou, cancelada, sem permissão, tipo de arquivo inválido e limite de uso atingido.
- Componentes úteis: skeletons, toasts, confirmation dialogs, tooltips esclarecedores, breadcrumbs, tabs, search/filter, árvore de arquivos, diffs, badges sem exagero, gráfico de dependências navegável, acessibilidade por screen reader.
- Autoria visual e textos em **português brasileiro** como padrão; base i18n para inglês/espanhol.

Entregue protótipos funcionais e capturas de desktop + mobile; realize revisão crítica visual antes da publicação.

## 4. PÁGINAS E FLUXOS OBRIGATÓRIOS

A. **Landing pública**: proposta de valor honesta, demonstração com projeto fictício, lista do que pode/não pode analisar, tour guiado, CTA 'Iniciar investigação', exemplos, preços 'Em breve' se não houver planos habilitados, FAQ, termos/privacidade, contato/suporte e rodapé com atribuições.

B. **Acesso e onboarding**: login com método seguro suportado, perfil, preferências, confirmação do escopo autorizado, seleções de privacidade, indicação de que nomes de aplicativos não garantem acesso ao binário. Criar primeiro projeto em no máximo três etapas.

C. **Dashboard**: projetos recentes, novas investigações, tipos de alvo, últimas tarefas, estados reais, armazenamento/uso, favoritos, exportação, lixeira recuperável e atalhos.

D. **Nova investigação**, com cinco entradas claras: `URL`, `APK`, `Nome de aplicativo`, `Código/ZIP`, `Captura/Relatório`. Cada uma oferece um fluxo específico, seus pré-requisitos, limitações e confirmação de titularidade/autorização.

E. **Workspace/Editor**: navegação de arquivos, tabs, árvore, busca global, editor de código, diffs, screenshots autorizados, preview isolado, console, resultados por evidência, história de versões e assistente IA. Suportar modificar **projeto derivado/autoral** em separado dos artefatos-fonte originais.

F. **Painel de análise**: progresso por etapa, agente/motor usado, duração real, entrada exata, coleta, análise, evidência, nível de cobertura, erros, links para arquivo e linha de origem, grafo de módulos, relações entre classes/componentes, rotas, permissões Android, URLs observadas e exportação.

G. **Projetos**: criar, duplicar, renomear, arquivar, restaurar, excluir com confirmação, tags, categorias, filtros, histórico, checkpoints e download ZIP.

H. **Administração**: usuários/tenants, saúde do REA e dos workers, filas, limites, revisões, auditoria, incidentes, custos estimados, ferramentas instaladas, disponibilidade de motor e conteúdo denunciado. Configurações perigosas limitadas ao superadmin.

I. **Conta e cobrança futura**: planos/quotas/consumo medido, campos estruturados para Stripe ou alternativa apenas após autorização, controle de feature flags, políticas de retenção e remoção de dados.

## 5. INPUT 1 — WEBSITE POR URL

Usuário cola endereço e descreve: 'Quero compreender a navegação, arquitetura JS, módulos, eventos, rotas, interações e estilo; depois criar minha própria implementação'. Fluxo:

1. Validar URL e autorização, aplicar proteção SSRF robusta em DNS, IP, redirecionamentos, IPv4/IPv6, rebindings, portas e esquemas, bloqueando localhost, rede interna, metadados cloud e protocolos não permitidos. Implementar também bloqueio no nível de rede do worker. Respeitar limites de requisição, robôs/termos aplicáveis, domínios privados e robots quando adequado.
2. Usar navegador Chromium isolado, perfil temporário limpo, CDP exclusivamente em loopback interno, sem expor porta de debugging. Capturar recursos/DOM/scripts/fontes públicas que forem realmente disponibilizados, screenshot, arquitetura observável e metadados de rede dentro do escopo autorizado.
3. Integrar as funcionalidades comprovadas pelo REA 6.8.0: `list-browser-targets`, `inspect-web-page`, `analyze-web-bundle`, `capture-web-screenshot`, `export-web-scripts`, `analyze-javascript-application`, quando presentes nos binários/build; consultar parâmetros reais no CLI/MCP em vez de presumir sintaxe.
4. Conservar um **manifesto de origem** para cada artefato (URL, timestamp, captura, hash, evidência, cobertura, limites e eventual source map). Diferenciar source code público, bundle minificado, source map, JavaScript reconstruído e código novo gerado por IA.
5. Mostrar preview real somente quando permitido/seguro e nunca executar scripts do site alvo na origem da plataforma. Uso de sandbox/iframe isolado ou render estático.
6. Não prometer 'baixar o código original de qualquer site' quando não estiver acessível. Login/áreas protegidas, CAPTCHA, DRM e dados privados não devem ser contornados.
7. Oferecer 'Gerar implementação própria' apenas depois de análise suficiente e com agente autorizado; gerar código original, testes e atribuições, não copiar telas completas ou ativos privados sem direitos.

## 6. INPUT 2 — APK ANDROID

Fluxo: upload de APK autorizado -> validação/antimalware -> hash SHA-256 -> armazenamento privado -> job de análise estática -> relatório -> editor/artefatos derivados -> exportação.

Requisitos:
- Verificar formato por conteúdo, tamanho, assinatura/certificados e integridade. Quarentena, malware scanning e limites de ZIP bomb/arquivo descompactado. O nome original nunca vira caminho de sistema.
- Para análise Android profunda, preparar **JDK completo 17+** e **JADX headless** em worker Linux isolado; usar versão e SHA-256 de bridge verificados nas referências oficiais do REA, com logs da cadeia de suprimentos. Apktool apenas se necessário e permitido; Ghidra é fase posterior quando houver caso e motor configurado.
- Integrar comandos confirmados como `inspect-android-package`, `search-android-classes`, `inspect-android-class`, `inspect-android-method`, `trace-android-references`, e assinatura APK quando suportado. Usar execução como subprocesso com lista fixa de argumentos, sem shell interpolation.
- Mostrar AndroidManifest, permissões, package name, activities, services, receivers, providers, assets, estruturas de classe/pacote, trechos Java/Smali obtidos e referências, com links de evidências.
- Marcar código descompilado como aproximado, funções ofuscadas como incertas e recursos não recuperados como ausentes. Não inventar fidelidade, dados de servidor, fontes privadas, chaves ou credenciais.
- MVP suporta **APK único**; split APK, APKS, XAPK, AAB, emulação, instrumentação e análise dinâmica ficam marcados como fases distintas caso não estejam implementados e licenciados.
- Não instalar ou executar APK de usuários em host compartilhado. Emulação dinâmica, se futura, exige VM descartável, rede controlada e autorização específica.

## 7. INPUT 3 — NOME DO APLICATIVO

Usuário digita um nome (ex.: 'aplicativo de agenda'). O sistema deve pesquisar **apenas metadados públicos permitidos** em fonte autorizada, exibir opções para desambiguação (desenvolvedor, plataforma, URL de loja e versão quando disponíveis), mostrar informações verificadas com origem, e permitir criar dossiê de pesquisa.

**Regra absoluta:** nome do aplicativo ≠ acesso ao APK ou código. Não baixar automaticamente APKs de fontes piratas, não burlar lojas, DRM ou permissões. Para análise profunda, solicitar upload legítimo do APK ou repositório/código autorizado. Oferecer alternativas de análise apenas a partir dos dados realmente públicos. Metadados sem APK não equivalem a inspeção de classes ou decompilação.

## 8. INPUT 4 — ARQUIVOS DE CÓDIGO / ZIP

Importar JS/TS/HTML/CSS/JSON, mapas, estruturas de projeto e ZIPs permitidos com inspeção segura de entradas, limite de arquivos, extensão, tamanho, symlinks, path traversal, bombas de compressão e arquivos binários proibidos. Suportar pastas quando navegador permitir. Executar análise estática real do REA e estruturar inventário e grafo.

**Editor profissional:** no desktop, Monaco Editor ou equivalente justificado; mobile, CodeMirror 6 ou outro editor mais leve/testado, com syntax highlighting, números de linha, autocompletar local, busca/substituição, formatação, diff, undo/redo, autosave em rascunho e atalhos. Não enviar automaticamente código sensível a provedores de IA. Toda gravação tem controle otimista de versão e histórico restaurável.

Repositório do projeto de usuário deve ser separado do repositório da plataforma. Funções de build/preview isoladas. Exportar ZIP autoral, README, manifest, testes e resumo de alterações. Integração GitHub opcional com OAuth e permissões mínimas; **nunca** publicar projetos privados como repositórios públicos por padrão.

## 9. INPUT 5 — CAPTURAS E EVIDÊNCIAS

Permitir importar HAR/JSON de observação, relatórios REA e artefatos de análise compatíveis. Validar schema, redigir credenciais/cookies/tokens antes de exibir ou exportar, identificar proveniência e versões, e recusar objetos incompatíveis de forma clara. Navegar por evento, request, response, script, source map, arquivo/linha e correlações. Habilitar comparação de duas capturas quando o motor suportar de fato.

## 10. ASSISTENTE DE IA — ORQUESTRADOR, NÃO FINGIMENTO

Criar uma seção '**Descreva o que quer descobrir ou construir**'. O usuário poderia escrever:
- 'Explique a lógica de navegação deste site e mostre os arquivos que sustentam sua conclusão.'
- 'Analise as classes e permissões desse APK e mostre um diagrama.'
- 'Crie uma implementação original de um dashboard com base nos requisitos que identifiquei.'
- 'Compare duas versões e proponha melhorias de UX.'

Orquestração real em etapas **planejar -> identificar capacidades disponíveis -> executar ferramenta -> observar Evidence -> resumir com citações -> propor mudança -> implementar no projeto derivado -> testar -> exibir diff**.

Implementar tool-calling com JSON schema estrito, allowlist de ferramentas, limites de chamadas, custo e tempo, cancelamento, confirmação para ações mutáveis, logs e política de acesso por função. Segregar prompts/instruções de conteúdos analisados: o site/APK/código de terceiros é dado não confiável e não deve controlar o agente. Nenhum token de API no frontend, nos prompts, nos relatórios, nem em logs.

Se não houver um provedor de modelo de IA conectado ou orçamento autorizado, exibir **Modo análise REA sem IA** totalmente funcional e configurar o adaptador de IA como **não disponível**, sem respostas fictícias. Oferecer depois escolha de provedores, BYOK com secrets e controle de custo (opt-in); não cadastrar cobranças sem autorização.

Separar três artefatos em UI e relatório: **Evidência observada**, **Hipótese inferida** e **Código autoral gerado**. Cada afirmação técnica deve conter a origem ou ser rotulada como hipótese.

## 11. ARQUITETURA SUGERIDA, A SER VALIDADA

**Frontend SaaS**: React + TypeScript, roteamento e data fetching adequados, design system próprio (Tailwind/shadcn/ui opcional), componentes acessíveis, PWA e suporte a viewport móvel. Usar Next.js ou stack equivalente apenas se facilitar a execução e a hospedagem. Evitar criar complexidade sem benefício real.

**API e autenticação**: backend TypeScript com validação de schemas (Zod ou equivalente), Auth robusto, cookies seguros, RBAC/ABAC, CSRF/CORS apropriados, rate limit, RLS no banco se usar Supabase. Roles iniciais `SUPER_ADMIN`, `ADMIN`, `MEMBER`, `VIEWER`. `OWNER` de workspace/organização com controle explícito. Endpoints versionados e documentados por OpenAPI.

**Banco de dados**: PostgreSQL/Supabase quando conectado e autorizado, migrações versionadas, RLS por tenant/owner, índices, auditoria e backups. Não compartilhar secrets/service_role. Tabelas sugeridas: `users`, `organizations`, `memberships`, `projects`, `targets`, `assets`, `analysis_jobs`, `job_events`, `evidence`, `source_files`, `derived_files`, `file_revisions`, `snapshots`, `exports`, `usage_ledger`, `feature_flags`, `audit_events`, `abuse_reports`, `deletion_requests`.

**Object storage**: armazenamento privado R2/Supabase Storage/S3 compatível, URLs pré-assinadas com TTL curto, prefixos por tenant, buckets separados para upload/evidências/export, criptografia, retenção/deleção e nenhum dump público. Hash e origem por objeto.

**Fila e worker**: enqueue em fila durável, idempotência, status progressivo (SSE/polling), lease, tentativas limitadas, backoff, dead-letter, interrupção segura, timeout/memória/CPU limitados, monitoramento e billing tags. Jobs longos não podem depender de HTTP request síncrono.

**Isolamento técnico**: containers/VMs efêmeros para REA, JDK/JADX, Chromium e ferramentas nativas. Usuário não-root, filesystem restrito/read-only exceto diretórios temporários, sem Docker socket, sem segredos de outros tenants, sem acesso por padrão à rede interna, sem execução irrestrita de comandos, sem instalação de pacotes arbitrários pelo usuário. Rede de navegador analítico com egress policy e proteção SSRF; workers de APK preferencialmente offline.

**Implantação**: usar ChatGPT Sites (Work) para a primeira experiência visual pública quando seu runtime permitir. Conferir se aceita backend/processamento externo, CORS e identidade. Se Sites não suportar o requisito crítico, entregar o Site como frontend público ou demonstração e rodar API/worker em infraestrutura segura e autorizada. Investigar Cloudflare Workers + Queues + R2 e **Containers (plano pago, requer aprovação)**, ou outra solução compatível (serviço de containers/VM para long-running). Evitar usar Cloudflare Workers padrão como se fosse host de Java/JADX ou Ghidra. GitHub Actions é CI e testes, não backend de produção; GitHub Codespaces é desenvolvimento, não hospedagem de serviço público permanente.

**Migração**: manter `rea-main/` pinado e íntegro, criar módulos novos em `apps/web/`, `apps/api/`, `workers/analysis/`, `packages/shared/` ou organização modular equivalente. Isolar um adapter `REAAdapter` com detecção das capacidades instaladas; nunca escrever diretamente em `rea-main/` sem necessidade.

## 12. MODELO DE JOB E EVIDÊNCIA

Todo job terá ID, tenant_id, project_id, target_type, hash da entrada, motor/revisão, autorização declarada, timestamp, estado, tentativas, limites, artefatos, custo estimado, contagem de arquivos, conclusão, alertas e links de evidência.

Máquina de estados: `created -> validating -> queued -> preparing -> running -> extracting -> indexing -> completed | partial | failed | cancelled | blocked`. Aplicar transições válidas no backend e auditoria de cada evento.

**Contrato de saída**: `summary`, `observations[]`, `evidence_refs[]`, `coverage`, `limitations`, `files[]`, `graphs[]`, `warnings[]`, `next_actions[]`, `generated_artifacts[]`. Evidence deve registrar `source`, `line/offset` quando conhecidos, `timestamp`, `tool`, `engine_version`, `sha256`, `confidence` justificada e ponteiro para o resultado bruto. Sem alucinação de métodos, arquivos, fluxos ou endpoints não vistos. Diferença clara entre cobertura parcial e completa.

## 13. SEGURANÇA, ÉTICA, PRIVACIDADE E LICENÇAS — INEGOCIÁVEIS

Criar plataforma para pesquisa e engenharia reversa **autorizada** (interoperabilidade, testes, migração, educação, preservação, auditoria). A interface pública não concede licença para copiar software protegido ou acessar recursos privados.

- Não implementar bypass de autenticação, paywalls, DRM, anti-cheat, CAPTCHAs, pinning de certificação, controles de licença ou dispositivos/serviços sem permissão.
- Não capturar dados de usuários terceiros ou credenciais sem autorização. Não distribuir APKs proprietários, código descompilado protegido ou evidências sigilosas publicamente por padrão.
- Termos, política de privacidade, aviso de uso autorizado, denúncia, tratamento de abuso, revisão administrativa, exclusão definitiva de dados e retenção configurável. Consentimento e justificativa de titularidade registrados por análise.
- Aplicar recomendações OWASP para upload e SSRF: validação por conteúdo, quarantine, limite de tamanho, deny de IPs internos e metadata, proteção DNS rebinding, redirecionamentos, archive traversal, zip bombs e malware.
- Impedir stored XSS nas evidências, HTML injection, command injection, path traversal, vazamento por logs, acesso a arquivos de outro tenant, insecure direct object reference, CSRF, corrida de versão, SSRF e downloads não autorizados.
- Analisar dependências, geração de SBOM, licenças MIT e **THIRD_PARTY_NOTICES**, atribuições obrigatórias, ferramentas comerciais (IDA/Hopper/JEB) sem assumir licenças, e possíveis restrições de uso comercial antes de monetizar.
- **Branding**: REA é tecnologia de terceiros; manter créditos e evitar sugerir propriedade da marca REA, parceria oficial ou endosso.
- MFA opcional para superadmin, auditoria imutável de acesso privilegiado, rotação de segredos, mínimo privilégio, bloqueio por tentativas e monitoramento.
- Confirmar segurança antes de habilitar visitantes externos para executar jobs; o site público inicialmente pode ter exploração de demonstração enquanto o processamento real permanece autenticado.

## 14. DESEMPENHO, RESILIÊNCIA E CUSTOS

- UX fluida: lazy loading de editor e gráficos, paginação de arquivos/evidências grandes, virtualização, cache com invalidação e tarefas canceláveis; mobile-first e acessível.
- Uploads chunked/resumíveis quando justificado, controle de tamanho, hashes e indicadores honestos de progresso. Evitar carregar milhões de linhas no navegador.
- Métricas p50/p95, tracing e alertas para falhas; logs estruturados **sem** conteúdo sensível; health checks e SLO documentados.
- Cotas iniciais: limite de projetos/jobs por conta, rate limit, limite de upload, filas concorrentes, retenção e tamanhos configuráveis. Definir limites por benchmark, não por chute, e bloquear custos inesperados.
- Billing-ready com medição real de uso, mas sem cobrança ativada nesta fase.
- Backup/restauração testados, migrações reversíveis, flags de lançamento e estratégia zero-downtime quando aplicável.

## 15. COMERCIALIZAÇÃO FUTURA — SAAS NATIVO

Arquitetar: contas individuais e equipes, múltiplos workspaces, isolamento forte, convites e papéis, uso medido, planos Free/Pro/Business **desabilitados até autorização**, limites configuráveis, histórico de créditos, organização de projetos por cliente, relatórios white-label opcionais, gestão de assinaturas futura, webhook idempotente de cobrança, termos e política de privacidade em PT-BR.

Não prometer 'clonagem integral de qualquer app' como oferta comercial. Prometer investigação rastreável de artefatos autorizados, explicações e geração de implementações originais. Prever aprovação legal de licenças e marca antes do lançamento pago.

## 16. COMANDOS/ESTADO ATUAL QUE VOCÊ DEVE RESPEITAR

O repositório atual já usa, em um Codespace existente:

```bash
git pull origin main
bash .devcontainer/configurar.sh
```

O painel local histórico usa a porta **4173** com **Visibility = Private** e token lido de `.rea-studio-token` (não revelar). **Nunca usar esse token ou porta privada como mecanismo de autenticação da plataforma pública.** Migrar para sessões reais de usuários e backend multi-tenant. Preservar os comandos como rota local de desenvolvimento, mas criar instruções próprias para o novo stack.

O REA exige Node.js compatível com o `engines` do `package.json`: **^22.23.4 || ^24.22.1 || >=26.12.1** na versão inicial conferida. Preferir linha 24 suportada e PIN de versões seguras; validar ferramentas de Android, browser e binário separadamente. Uma build bem-sucedida não confirma suporte de todos os motores.

## 17. PLANOS DE ENTREGA EM CAMADAS, MAS COM EXECUÇÃO AGORA

**Fase 0 — Preservação e diagnóstico:** inventário, branch, backup, licenças, status real, testes existentes, análise de riscos e mapa do que já funciona.

**Fase 1 — Núcleo produto e design:** design system premium, landing pública, portal, auth, dashboard, projetos, editor responsive com autosave/diff/checkpoints, UI de jobs e documentação.

**Fase 2 — REA funcional:** adapter real CLI/MCP, pipeline JS, Evidence rastreável, captura de website estática/passiva em navegador isolado se infraestrutura adequada, e processamento APK com JDK/JADX se worker isolado autorizado estiver disponível. Caso contrário, entregar suporte restrito e marcar claramente `MOTOR NÃO CONFIGURADO`.

**Fase 3 — IA e visualizações:** orquestrador seguro conectado a provedor autorizado, grafo de dependências, explicação com fontes, reconstrução de implementação original em workspace separado, preview isolado e export ZIP.

**Fase 4 — SaaS e hardening:** tenancy/RLS, cotas, moderação, billing-ready desativado, observabilidade, backups, testes de carga e revisão de licenças.

**Fase 5 — Publicação:** usar Sites/Work para a presença pública se compatível; deploy de API/workers apenas onde houver provedor/capacidade/custo autorizado; verificação end-to-end em URL pública, acessos mobile e desktop, e relatório de aceite.

A ordem pode ser otimizada por dependência. Não use fases como desculpa para entregar apenas um cronograma: implemente imediatamente o máximo possível em ambiente conectado e demonstre funcionamento.

## 18. TESTES DE ACEITE OBRIGATÓRIOS

Criar fixtures próprias e seguras, sem scraping indevido, ao menos estes 20 cenários:

1. Login/logout/session refresh; rota privada negada para anônimo.
2. Público visita landing e demo sem acessar projetos privados.
3. Novo usuário cria workspace e projeto sem terminal.
4. Usuário A não visualiza nem edita arquivos, evidências ou jobs do usuário B (incluindo URLs diretas).
5. Criação/importação de código JS/TS, edição, autosave/diff e recuperação de versão.
6. Editor responsivo testado em 360px, 390px, 768px e desktop; sem overflow da página.
7. Upload APK legítimo sintético autorizado; rejeição de arquivo inválido.
8. APK real só com JDK/JADX presente; se indisponível, status explícito e não falso sucesso.
9. Análise de website fixture local controlada com Chromium e escopo de origem validado.
10. URL pública legítima sem acesso a endereços internos ou metadata.
11. Rejeitar localhost, IP privado, IPv6 internal, DNS rebinding, redirecionamento proibido e URL malformada.
12. Rejeitar zip bomb, arquivo gigante, path traversal, symlinks maliciosos e extensões indevidas.
13. Pesquisar nome de app apresenta metadados e pede APK para análise profunda.
14. Pipeline REA retorna Evidence com versão, hash e limitação honesta.
15. Não existe IA configurada -> interface informa indisponibilidade sem conteúdo fabricado.
16. Com IA configurada, prompt-injection em código-alvo não consegue controlar o agente nem divulgar segredo.
17. Job pode ser cancelado, expira corretamente e não fica com processo zumbi.
18. Dados e logs privados não aparecem em dashboard público, HTML, source maps, API nem exports indevidos.
19. Simulação de queda de worker e retomada idempotente, sem corromper projeto.
20. Export ZIP e relatório JSON reproduzíveis; restore de checkpoint não destrói histórico.

Complementar com testes unitários, integração, E2E (Playwright), segurança (dependências + autorização), lint/types, CI/CD e observação em navegador real. Comparar resultados com o contrato e emitir relatório por caso PASS/FAIL/BLOCKED com evidência, nunca apenas um selo visual.

## 19. CRITÉRIOS EXATOS DE CONCLUSÃO

Não declarar 'finalizado' até demonstrar:

- URL pública real abrindo landing e app em Android e PC;
- navegação sem layout quebrado, login funcional e isolamento de usuários;
- criação de projeto e editor com salvar/recuperar/diff;
- pelo menos um pipeline REA real verificado sobre fixture autorizada, com Evidence em tela;
- captura web/APK somente anunciadas como funcionais quando rodarem realmente em ambiente adequado;
- jobs limitados/privados, controles de upload/URL, sem secrets expostos;
- documentação técnica e comercial, instruções de desenvolvimento e implantação;
- GitHub atualizado via PR/commit identificável, testes no CI, checklist de segurança, backup e rollback;
- custos/limitações explicitados, sem cobranças inesperadas;
- lista clara de **FUNCIONAL, PARCIAL, NÃO IMPLEMENTADO, BLOQUEADO**.

Se o ambiente Sites não oferecer recursos para execução de REA/JADX/Chromium, registre isso e **não finja** que o próprio Sites executa essas ferramentas. Mostre a arquitetura real e, quando o backend externo depender de pagamento/autorização, publique a interface com demo segura e sinalização de indisponibilidade até a integração.

## 20. COMO VOCÊ DEVE ME RESPONDER DURANTE E AO FINAL

Execute de forma autônoma e objetiva. Use as integrações disponíveis; em qualquer transição que dependa de acesso humano, solicite somente a ação estritamente necessária, sem abandonar o restante do desenvolvimento. Não peça novamente o que já está definido aqui. Não diga que 'vai entregar depois' se não estiver realizando uma tarefa agendada; conclua no trabalho atual o que for possível.

No final, forneça nesta ordem:

1. **Link público funcional**, modo de acesso e prova de abertura no navegador; se não puder publicar, diga exatamente por quê.
2. **Link do GitHub**, branch/PR/commit e resumo de arquivos criados/modificados.
3. **Quadro de módulos** e status real, com resultados demonstráveis.
4. **Galeria/prints ou preview** desktop/mobile da interface implementada.
5. **Exemplos concretos** de uma análise de JavaScript, uma entrada de URL, uma entrada APK e uma busca por nome de aplicativo, distinguindo o que foi efetivamente executado do que é mock/demo.
6. **Checklist de segurança**, autenticação, isolamento, backups e licenças.
7. **Resultados dos testes** com links para CI/logs sem segredos.
8. **Infraestrutura e custos** atuais, gratuitos e potenciais, com o que exige aprovação.
9. **Guia de uso** para uma pessoa iniciante: abrir, criar projeto, inserir alvo, analisar, editar, salvar, baixar.
10. **Próximas melhorias recomendadas**, priorizadas por segurança, impacto e custo.

**A instrução decisiva:** entregar uma experiência excelente, mas tecnicamente verdadeira. Prefiro uma função menor que realmente funciona e está segura a vinte botões cenográficos. Preserve o que existe, eleve a qualidade a padrão de produto comercial, e transforme o REA Studio numa plataforma de investigação assistida por IA **útil, verificável, extensível e viável**.

## 21. FONTES AUTORIZADAS PARA CONSULTA

- Repositório atual: https://github.com/webluxfloripa-lab/rea-engenharia-reversa
- REA oficial: https://github.com/morluto/rea
- REA Android: https://github.com/morluto/rea/blob/main/docs/android-analysis.md
- REA navegador: https://github.com/morluto/rea/blob/main/docs/browser-observation.md
- REA CLI: https://github.com/morluto/rea/blob/main/docs/cli.md
- REA MCP: https://github.com/morluto/rea/blob/main/docs/mcp-contracts.md
- REA software notices: https://github.com/morluto/rea/blob/main/THIRD_PARTY_NOTICES.md
- ChatGPT Sites: https://help.openai.com/pt-br/articles/20001339-creating-and-using-chatgpt-sites
- Cloudflare Containers: https://developers.cloudflare.com/containers/
- Cloudflare Queues: https://developers.cloudflare.com/queues/
- OWASP File Upload: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- OWASP SSRF: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html

**INICIE A EXECUÇÃO AGORA.**
