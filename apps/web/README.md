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
- Duplicar, renomear, arquivar/reabrir, excluir com confirmação e export ZIP determinístico.

## Limitações explícitas

O motor web leve não é o REA. `public/evidence/rea-atlas.json` é uma execução real prévia do REA 6.8.0, verificada no GitHub Actions sobre a fixture Atlas. Sites não lança processos Node/JDK/JADX/Chromium. Captura web e análise APK bloqueadas. Sem uploads binários, IA, equipes, superadmin, filas duráveis, cobrança, restauração de desastre, white label ou PWA offline.

## Desenvolvimento

Node 24.22.1, pnpm 11.25.0. `pnpm test`; `pnpm exec tsc --noEmit`; `pnpm build`. Usar lockfile e instalador Sites. Migrações em `drizzle/`; `.openai/hosting.json` declara `DB`. Não modificar migrações aplicadas. Publicar pelo Sites com commit remoto e arquivo de build correspondentes. Identidade fornecida pelo Sites; nunca aceitar cabeçalho de identidade enviado diretamente pelo cliente.

REA preservado em `../../rea-main/`; painel histórico em `../../studio/`. Relatórios em `../../docs/platform/`.

24 arquivos, 64 KB/arquivo, 256 KB de código/projeto, 80 revisões e 45 escritas/minuto. Guardas conservadoras iniciais, ainda sem benchmark de carga. Código não é executado. Não enviar segredos. Projetos não são publicados no GitHub. Nenhuma cobrança ou serviço pago ativado.
