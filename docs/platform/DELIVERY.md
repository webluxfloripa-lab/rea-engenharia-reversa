# REA Studio 2.0 — entrega beta

Data: 29/10/2026. Base preservada: `f9c98563e1bed51f4faa0431a287e84be0fbdec6`. Branch: `feature/rea-studio-platform-v2`. O núcleo `rea-main/` e o painel histórico `studio/` permanecem íntegros.

## Implementado

Portal público PT-BR com design próprio; demo Atlas; login por ChatGPT; projetos D1 privados por proprietário; cadastro, duplicação, renomeação, arquivo/reabertura, exclusão confirmada; editor CodeMirror com recursos locais e autosave; originais preservados; revisões atômicas e concorrência otimista; restore como nova revisão; import de código e ZIP validado; análise AST Babel real com SHA-256/arquivo/linha; imports navegáveis; preview HTML estático isolado; HAR sanitizado; pesquisa de metadados iOS em origem fixa; export ZIP determinístico; políticas e auditoria de ações.

## REA real comprovado

Compilação local bem-sucedida. A análise local foi recusada pela supervisão de processos (`ps` incompatível com o host). Diagnóstico preservado em `evidence/rea-local-blocked.json`. Não foi contornada essa proteção.

A mesma fixture executou com sucesso em Linux Ubuntu no CI: https://github.com/webluxfloripa-lab/rea-engenharia-reversa/actions/runs/40845616075 . Evidence original em `evidence/rea-atlas.json`: 3 arquivos JS/TS, 153 nós AST visitados, 9 achados, 0 falhas de parsing. Evidence ID `ev_f1c6b6799cb3e74bf87b1bfefde9d641610683d342c0374f3bad85f7129fbf5f`.

A análise ao vivo do portal usa **Studio AST/Babel**, identificada na UI e no relatório. A Evidence REA pública é pré-executada, não muda ao editar a demo e não prova que o Sites executa o REA. `workers/analysis/REAAdapter.mjs` oferece adaptador CLI real para ambiente local autorizado; não é um backend de produção.

## Não concluído

Workers nativos isolados/JDK/JADX/Chromium, filas duráveis/leases/idempotência, malware scanning, APK, captura de website, coleta de metadados Android, agente IA/tool calling, equipes/multiempresa/RBAC, painel superadmin, cobrança/planos, retenção automática, observabilidade completa, backup de desastre e restauração, PWA. Não foram ativados gastos, licenças proprietárias ou provedores IA. Esta entrega é beta funcional; não atende ainda aos critérios totais do documento mestre para comercialização.

## Exemplos

1. Código: abra Demo, analise Atlas; clique na evidência para abrir a fonte. Edite derivado, salve, abra Histórico, restaure v1; a versão editada continua no histórico.
2. URL: crie projeto e registre `https://example.com`; ela é validada sem nenhuma requisição ao destino. Estado explícito bloqueado por falta de motor isolado.
3. APK: a tela informa JDK/JADX ausentes na produção e não aceita binário. Nenhuma decompilação falsa é exibida.
4. Nome: após login pesquise um nome no catálogo público Apple; resultado informa desenvolvedor, plataforma, versão e fonte quando retornados. Não obtém APK ou código. A integração foi testada com resposta controlada; disponibilidade do catálogo externo não é garantida.

## Guia rápido

Abrir portal → Explorar demo, ou Abrir workspace → entrar com ChatGPT → criar projeto e confirmar autorização → importar código/ZIP → editar → salvar automaticamente ou por botão → Analisar código → explorar Evidências/Arquitetura → criar checkpoint/restaurar → Exportar implementação. HAR está em Adicionar outro alvo. Arquivar e excluir estão em Opções do projeto.

## Infraestrutura e custo

Sites/Cloudflare Worker + D1, sem backend externo ou assinatura IA contratados. Cobrança do produto desativada. Não foi possível comprovar franquia/preço futuro do plano de hospedagem; não prometer gratuidade ilimitada ou disponibilidade perpétua. Workers nativos, storage volumoso, filas e IA exigem infraestrutura/orçamento adicional antes de ativação.

## Prioridades seguintes

1. Homologar login e persistência em contas reais distintas; automatizar E2E autenticado.
2. Preparar isolamento e fila durável para REA nativo; só depois habilitar websites/APK.
3. Testar restauração de desastre e resolver alertas do REA pinado em upgrade separado e revisado.
4. Integrar provedor IA com segredo server-side, limites e aprovação de custo.
5. Equipes, papéis, planos e revisão jurídica de comercialização/marca.
