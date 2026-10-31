# Atualização REA IA — 31/10/2026

A versão publicada atual é 5. Leia primeiro [os checkpoints atuais](checkpoints/03_CONTINUIDADE_CODEX.md). IA, GitHub/RAG, memória privada e propostas revisáveis foram implementados; as seções abaixo registram a entrega histórica anterior.

# Mapa de continuidade — REA Studio 2.0

## Leia antes de alterar

Este documento transfere o desenvolvimento da beta funcional para o Codex. **Continue o código existente, não recrie do zero e não substitua pelo ZIP antigo.** O produto completo do documento mestre ainda não está concluído.

- Repositório: https://github.com/webluxfloripa-lab/rea-engenharia-reversa
- Branch: `feature/rea-studio-platform-v2`
- Base anterior preservada: `f9c98563e1bed51f4faa0431a287e84be0fbdec6`
- Site público: https://rea-studio.wryroot65.chatgpt.site/
- Demo: https://rea-studio.wryroot65.chatgpt.site/demo
- Workspace privado: https://rea-studio.wryroot65.chatgpt.site/workspace
- Sites project_id: `appgprj_6ae3053895608191a4f09e007c4c7276`
- Versão Sites publicada: 2
- Commit da fonte Sites: `a098d74a48b48da55975ceb195bebb3959968c3c`
- Deployment: `appgdep_6ae3cc6bd72c8191bbbfe1bd7d8e826e` (succeeded)

**Atenção às duas fontes:** a hospedagem Sites usa repositório próprio mantido pelo plugin. `apps/web/` é a cópia versionada correspondente no GitHub canônico. Alterar o GitHub por si só ainda **não** dispara publicação automática no Sites. O próximo deploy precisa sincronizar a fonte Sites e publicar pelo plugin. Não criar outro Site; reutilizar o project_id.

## Mapa de arquivos

| Local | Responsabilidade |
|---|---|
| `rea-main/` | REA 6.8.0 completo, pinado e preservado; licença MIT e avisos originais |
| `studio/` | Painel local anterior por token, preservado; não é autenticação pública |
| `apps/web/` | Novo portal e aplicação web React/TypeScript/Vinext |
| `apps/web/app/page.tsx` | Landing pública |
| `apps/web/app/demo/page.tsx` | Demo pública Atlas, temporária |
| `apps/web/app/workspace/page.tsx` | Página com identidade ChatGPT obrigatória |
| `apps/web/app/chatgpt-auth.ts` | Helpers server-side de identidade fornecida pelo Sites |
| `apps/web/app/api/v1/[...path]/route.ts` | Fronteira HTTP; obtém usuário confiável e binding DB |
| `apps/web/components/Workspace.tsx` | Projetos, editor, evidências, grafo, histórico e operações |
| `apps/web/components/CodeEditor.tsx` | CodeMirror 6 com JS/TS/JSX e recursos locais |
| `apps/web/app/globals.css` | Design system escuro, verde discreto, responsividade |
| `apps/web/lib/api.mjs` | API, autorização por owner, cotas, projetos, revisões, catálogo |
| `apps/web/lib/analyze.mjs` | Análise sintática Babel real; não é o REA |
| `apps/web/lib/security.mjs` | Limites, paths, JSON limitado, Origin, hash, URL e HAR |
| `apps/web/lib/zip.mjs` | Import seguro e export determinístico |
| `apps/web/lib/fixture.mjs` | Fixture autoral da demonstração |
| `apps/web/db/schema.ts` | Projetos, revisões, auditoria e rate limits |
| `apps/web/drizzle/0000_remarkable_silk_fever.sql` | Migração inicial e triggers de revisão atômica |
| `apps/web/worker/index.ts` | Entrypoint Worker e headers de segurança |
| `apps/web/.openai/hosting.json` | ID existente do Site e binding D1 `DB` |
| `apps/web/pnpm-lock.yaml` | Dependências travadas; não descartar |
| `apps/web/tests/api.test.mjs` | 17 testes de integração real com SQLite/Babel |
| `workers/analysis/REAAdapter.mjs` | Adaptador CLI local real com limites e cancelamento |
| `fixtures/atlas/` | Fixture própria usada no CI real do REA |
| `.github/workflows/rea-platform.yml` | Verificação REA real + painel legado + checks web |
| `docs/platform/DELIVERY.md` | Inventário de entregas, exemplos, limitações e uso |
| `docs/platform/TESTS.md` | Resultado honesto dos 20 cenários |
| `docs/platform/SECURITY.md` | Controles e lacunas de segurança |
| `docs/platform/ROLLBACK.md` | Reversão de código e histórico; limites de backup |
| `docs/platform/inventory.json` | Hashes dos arquivos críticos e origem preservada |
| `docs/platform/evidence/` | Relatórios reais, auditorias e capturas |

## Estado dos módulos

**Funcional:** landing/demo; projetos privados via API; CodeMirror; import código/ZIP; originais/derivados; autosave/version conflict; checkpoints/restore; diff; grafo imports; evidências com hashes/linha; HAR sanitizado; preview HTML estático sandbox; ZIP/JSON; gestão de projeto; catálogo iOS em origem fixa após login; auditoria de ações.

**Implementado, mas exige homologação real:** login/logout/refresh do ChatGPT e CRUD persistente por navegador no Site. Testes da API injetam identidade na fronteira server-side; não comprovam OAuth. Validar com duas contas reais antes de alegar isolamento ponta a ponta. Catálogo iOS foi testado com resposta controlada, não como garantia de disponibilidade externa.

**REA comprovado:** compilou localmente e rodou no GitHub Actions sobre Atlas. 3 arquivos, 153 nós AST, 9 achados, zero falhas de parsing. Execução local de análise recusada por `ps` incompatível no host; não contornar supervisão. CI aprovado: https://github.com/webluxfloripa-lab/rea-engenharia-reversa/actions/runs/40845616075 . O relatório público é pré-executado. Análise ao vivo do portal usa Babel.

**Bloqueado por infraestrutura:** REA como serviço online, website/Chromium, JDK/JADX/APK, quarentena e antimalware, fila durável e processamento isolado. Sites Worker não é host de processos nativos.

**Não implementado:** assistente IA/tool calling; tenant de equipe/convites/RBAC/superadmin; cobrança; planos; recuperação de desastre; PWA offline; metas de carga e observabilidade completa.

## Como abrir no Codex

```bash
git clone https://github.com/webluxfloripa-lab/rea-engenharia-reversa.git
cd rea-engenharia-reversa
git switch feature/rea-studio-platform-v2
cd apps/web
corepack pnpm install --frozen-lockfile
corepack pnpm test
corepack pnpm exec tsc --noEmit
corepack pnpm build
```

Usar Node **24.22.1+ compatível** e pnpm **11.25.0** conforme packageManager. Em ambiente Sites, usar a habilidade Sites e seus instaladores/preview/build. No Windows, Git Bash/WSL pode ser necessário para scripts gerados do perfil Linux; não alterar o projeto inteiro para resolver apenas o perfil de execução. Para desenvolvimento portable, reaplicar o configurador de perfil Sites, preservando código e identidade.

### Banco local

Após build, aplicar uma única vez a migração ao D1 local com Wrangler e o config gerado:

```bash
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_remarkable_silk_fever.sql
```

Banco local e produção são separados. Nunca colocar secrets, runtime state, uploads ou dump de usuário no Git. Nunca editar migração já aplicada. Criar migrações aditivas para evoluir esquema.

## Contratos centrais

Identidade: `getChatGPTUser()` recebe headers autenticados do dispatch Sites; id estável por Site, não e-mail, é o owner. Headers não podem ser aceitos como credencial em implantação fora do Sites. Se migrar a hospedagem, implementar identidade equivalente antes de expor a API.

Projeto: `id, owner, name, version, payload, archived, created, updated`. Payload contém files derivados, original preservado, objetivo, relatório, autorização declarada e rótulo. Every save usa `WHERE owner=? AND version=?`, e triggers fazem snapshot na mesma transação. Restore gera nova revisão.

Rotas GET: `/api/v1/me`, `/capabilities` públicas; `/projects`, `/projects/:id`, `/history`, `/revision?version=N`, `/export`, `/audit` autenticadas.

Escritas JSON de mesma origem: `/projects` cria; `/projects/:id/{save,import,analyze,checkpoint,restore,rename,archive,target,har}`; DELETE confirmado para projeto arquivado; `/app-search` consulta catálogo fixo. Sem rota genérica de shell, MCP ou fetch de destino.

Limites: 12 projetos/conta, 24 arquivos/projeto, 64KB/arquivo, 256KB código/projeto, 80 revisões, 45 escritas/minuto. São guardas iniciais, não capacidade comercial medida. Há oportunidade de medir latência/memória e melhorar quotas globais antes de escalar.

## Próximas tarefas em ordem

1. Homologar OAuth e persistência em duas contas reais; corrigir eventuais problemas de Origin/proxy/headers. Fazer testes E2E autenticados sem divulgar contas/tokens.
2. Revalidar mobile em 360/390/768/1440 e teclado Android real. Há captura 390 e desktop; não alegar aparelho Android real testado.
3. Refatorar Workspace grande em módulos mantendo fluxos e testes. Verificar autosave em falhas/retry, troca rápida de arquivo, seleção de versões, modais acessíveis e menu móvel.
4. Fila durável, sandbox, storage privado, egress policy e recursos de worker nativo. Não expor o adaptador CLI diretamente. Definir custo e obter autorização antes de serviço pago.
5. Integrar REA real por adapter sobre artefatos privados, com Evidence, versionamento e timeout; confirmar CLI/MCP da tag instalada.
6. Website: SSRF robusto (DNS+IPv4/IPv6+redirect/rebinding+rede) antes de habilitar fetch; Chromium/CDP exclusivamente internos.
7. APK: quarentena, antimalware, ZIP limits, assinatura, JDK completo e JADX bridge oficial com SHA verificado. Não instalar APK em host compartilhado.
8. IA somente com provedor autorizado, segredo server-side, tool schemas allowlist, limites e custo. Dados analisados não são instruções do agente.
9. Organizações/memberships/roles, quotas globais, auditoria externa, retenção e restore de desastre testado.
10. Comercialização após fechar cenários de aceite, revisar marca/licenças e validar custos. Billing permanece off até autorização.

## Instrução pronta para o próximo Codex

> Continue o REA Studio 2.0 a partir da branch feature/rea-studio-platform-v2. Leia integralmente docs/platform/CODEX_HANDOFF.md, DELIVERY.md, TESTS.md, SECURITY.md e ROLLBACK.md e a especificação original em docs/platform/MASTER_SPEC.md. Preserve rea-main e studio, não use o ZIP antigo, não altere projetos de clientes. Revalide o estado antes de implementar. Priorize autenticação/persistência E2E e os testes incompletos, depois o backend isolado do REA. Reutilize o Site existente e registre evidências reais. Não anuncie website/APK/IA enquanto os respectivos motores estiverem ausentes. Sem gastos, credenciais no código, operações destrutivas ou publicação de dados privados.

## Verificação pública posterior

Landing e demonstração foram abertas na URL externa. A análise ao vivo gerou 9 observações sintáticas e 2 imports. Uma incompatibilidade de next/link com o runtime foi resolvida usando navegação por anchors nativos. Isso preserva o caminho de autenticação com navegação top-level. Não reintroduzir next/link sem testar produção.

CI completo (REA real + painel legado + testes/types/build do portal) aprovado: https://github.com/webluxfloripa-lab/rea-engenharia-reversa/actions/runs/40968040044 . Pull request de entrega: https://github.com/webluxfloripa-lab/rea-engenharia-reversa/pull/1 .
