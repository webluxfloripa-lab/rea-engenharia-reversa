# REA Studio 2.0 beta

Portal público e workspace privado para investigação autorizada de código. Uma iniciativa independente da Voee, sem afiliação ao mantenedor REA.

## Funciona nesta beta

- Landing pública e demonstração Atlas com código próprio.
- Login ChatGPT e API com autorização por usuário, armazenamento D1 e limite de 12 projetos.
- Importação JS/TS/HTML/CSS/JSON/Markdown/texto e ZIP com limites antes da descompressão.
- CodeMirror: autocomplete local, busca/substituição, undo/redo, autosave, diff, originais preservados.
- Histórico atômico via triggers SQLite; restauração cria nova revisão. Versão otimista.
- Análise AST real (Babel), SHA-256, arquivo/linha, grafo de imports e relatório JSON.
- Preview HTML estático isolado, HAR sanitizado e catálogo público iOS após login.
- Assistente de código via OVHcloud AI Endpoints / Llama 3.3 70B em acesso anônimo, sem chave nem cartão. A pergunta e um arquivo opcional são enviados somente ao solicitar. Respostas não modificam arquivos.
- Duplicar, renomear, arquivar/reabrir, excluir com confirmação e export ZIP determinístico.

## Limitações explícitas

O motor web leve não é o REA. `public/evidence/rea-atlas.json` é uma execução real prévia do REA 6.8.0, verificada no GitHub Actions sobre a fixture Atlas. Sites não lança processos Node/JDK/JADX/Chromium. Captura web e análise APK bloqueadas. Sem uploads binários, equipes, superadmin, filas duráveis, cobrança, restauração de desastre, white label ou PWA offline.

## Desenvolvimento

Node 24.22.1, pnpm 11.25.0. `pnpm test`; `pnpm exec tsc --noEmit`; `pnpm build`. Usar lockfile e instalador Sites. Migrações em `drizzle/`; `.openai/hosting.json` declara `DB`. Não modificar migrações aplicadas. Publicar pelo Sites com commit remoto e arquivo de build correspondentes. Identidade fornecida pelo Sites; nunca aceitar cabeçalho de identidade enviado diretamente pelo cliente.

REA preservado em `../../rea-main/`; painel histórico em `../../studio/`. Relatórios em `../../docs/platform/`.

24 arquivos, 64 KB/arquivo, 256 KB de código/projeto, 80 revisões e 45 escritas/minuto. Guardas conservadoras iniciais, ainda sem benchmark de carga. Código não é executado. Não enviar segredos. Projetos não são publicados no GitHub. Nenhuma cobrança ou serviço pago ativado.

## REA IA — GitHub, memória e propostas

A API OVHcloud / Llama 3.3 70B continua anônima, sem chave, cartão ou alternativa paga. A API pública do GitHub verifica a branch canônica, sem credenciais; seu limite público é compartilhado por IP. Não há sincronização automática GitHub → Sites.

O índice `lib/data/rea-knowledge.json` integra 97 documentos/arquivos selecionados e 1.939 trechos do REA 6.8.0, preservando commit, linha e SHA-256. Busca lexical com expansão de termos PT/EN, sem embeddings pagos. Fontes são dados não confiáveis, não instruções. O retriever consulta uma versão fixada do GitHub; não é treinamento de um novo modelo nem acesso a todos os arquivos do repositório. `scripts/sync-rea-knowledge.mjs --repo /checkout --ref SHA` regenera o índice a partir de arquivos realmente versionados.

- `GET /api/v1/knowledge?q=...`: pesquisa pública na base pública, com fontes e limites.
- `POST /api/v1/knowledge/check-github`: sessão e mesma origem obrigatórias; consulta uma branch fixa, no máximo uma vez/minuto pela implantação. Verifica novos commits; não substitui o índice em execução.
- `GET /api/v1/projects/:id/assistant`: conversa privada do proprietário.
- `POST /api/v1/projects/:id/assistant`: exige proprietário, mesma origem, versão atual e `consent: true`; `prompt`, `filePath` opcional, `useKnowledge`, `useHistory`, `threadVersion`, `mode: chat|generate`, `proposalPath` no modo geração.
- `POST /api/v1/projects/:id/apply-ai`: exige versão atual, `messageId` de proposta guardada no servidor e `confirm: true`; verifica versão/hash/sintaxe e cria revisão pelo mesmo mecanismo atômico dos demais salvamentos.

Orquestração limitada e determinística: busca na base REA → AST do arquivo explicitamente incluído → resposta do modelo → proposta JSON estrita → comparação/revisão humana → nova revisão. Não há execução de shell, ferramenta arbitrária definida pelo modelo, instalação de pacotes ou alteração automática de fontes. REA CLI/JADX/Chromium ainda exigem backend isolado externo.

Pergunta até 4.000 caracteres, arquivo opcional até 12.000. Até 8 mensagens recentes entram no contexto quando a opção estiver marcada. Até 10 turnos privados em `assistant_threads`; CAS previne sobrescrita concorrente. O histórico inclui perguntas, respostas e propostas e é removido por cascade ao excluir o projeto. Auditoria não contém o corpo das mensagens. Migração aditiva `drizzle/0001_absent_pet_avengers.sql`; nenhuma migração anterior foi modificada.

Timeout externo 45s, 1.600 tokens de conversa / 3.000 de geração, resposta HTTP até 128 KiB, proposta até 10.000 caracteres e intervalo global de 31s entre chamadas. Erros de cota não acionam plano pago. `scripts/verify-ai-live.mjs --allow-external-test` executa duas verificações reais em banco sintético, sem tocar nos dados de produção. Os testes normais não chamam provedores externos.

Fontes: https://docs.github.com/en/rest/branches/branches e https://docs.ovhcloud.com/en/guides/public-cloud/ai-machine-learning/ai-endpoints-getting-started .
