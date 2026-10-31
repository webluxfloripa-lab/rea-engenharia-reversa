# Checkpoint 3 — Continuidade e uso

Registrado em 2026-10-31T06:38:44.944552+00:00.

## Retomar no Codex

Repositório: https://github.com/webluxfloripa-lab/rea-engenharia-reversa
Branch: feature/rea-studio-platform-v2
Aplicação: apps/web/

1. Leia estes três checkpoints e apps/web/README.md. Preserve rea-main/, studio/, fixtures e o Site existente. Não alterar voee360tour, Seven, Supabase ou domínios de clientes.
2. Use Node 24.22.1 compatível e pnpm 11.25.0. Na raiz do repositório, selecione a branch; dentro de apps/web, instale pelo lockfile e gere o índice: `node scripts/sync-rea-knowledge.mjs --repo ../..`.
3. Execute `pnpm test`, `pnpm exec tsc --noEmit` e `pnpm build`. O índice é gerado do REA preservado e não precisa ser duplicado no GitHub; a fonte Sites publicada mantém sua cópia usada no build.
4. GitHub e hospedagem Sites têm fontes separadas: alterar o GitHub não publica automaticamente. Use a skill Sites, reutilize project_id, preserve audiência e banco, sincronize código e publique pelo plugin.
5. Não ativar cobrança nem trocar para provedor pago. IA, corpus e testes estão em lib/ai.mjs, lib/knowledge.mjs, lib/assistant-orchestrator.mjs, lib/assistant-memory.mjs e tests/assistant-agent.test.mjs.

## Como usar

Abra o Site, entre no workspace e crie ou abra uma investigação. Abra REA IA. Mantenha Consultar base pública REA para respostas com referências e Usar histórico recente para continuidade. Incluir arquivo vem desmarcado: ative somente para o código escolhido.

Para criar código, selecione Gerar proposta de arquivo, informe um caminho como src/sugestao.ts e descreva o pedido. Para melhorar um arquivo existente, selecione-o e use Propor melhoria. Revise a comparação, marque a confirmação e clique Aplicar e criar revisão. O histórico permite recuperar versões. Exporte pelo botão do workspace.

Na demo pública você pode pesquisar a base; conversa privada e geração exigem workspace autenticado. Se houver 429, aguarde a cota; o sistema não ativa plano pago.

## Limites e próximos passos

O índice cobre documentação e arquivos selecionados; não treina pesos de um novo modelo. GitHub check verifica novos commits, sem atualizar o corpus automaticamente. REA CLI online, Chromium/website e JADX/APK continuam bloqueados por infraestrutura; não simular processamento real. Orquestração atual é determinística e limitada, sem tool-calling arbitrário do modelo. OAuth/persistência em duas contas reais e teclado Android ainda exigem homologação; testes de API usam identidade sintética na fronteira confiável. Não anunciar cobertura total ou produto comercial concluído.

Agendamento automático a cada cinco minutos não é suportado (mínimo de uma hora). Estes três checkpoints foram salvos nos marcos reais desta entrega; nenhum agendamento de cinco minutos foi criado.
