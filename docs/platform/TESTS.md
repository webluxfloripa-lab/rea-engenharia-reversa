# Verificação e aceite

## Executado

- REA `npm ci` e `npm run build:cached`: PASS local e CI.
- Painel histórico `node --test studio/server.test.mjs`: PASS (1 integração; motor fixture do teste é simulado).
- Novo backend `node --test tests/api.test.mjs`: PASS, 17 testes em SQLite real, API real e Babel real. Autenticação de dois usuários é injetada na fronteira de confiança para os testes; não prova OAuth real.
- TypeScript `tsc --noEmit`: PASS após implementação.
- Build de produção Sites: PASS.
- Auditoria final de dependências de produção do portal: 0 alertas conhecidos no momento da consulta. Não equivale a pentest.
- CI REA real: PASS, fixture sem execução de código alvo; relatório bruto preservado.
- Navegador: landing, editor, análise com 9 evidências/2 imports, editar/salvar v3 e restaurar v1 como v4 com histórico preservado. Capturas desktop/mobile. Viewport 390: documento interno clientWidth=375 e scrollWidth=375 (desconta barra de rolagem); sem overflow horizontal. Mobile 360/768/desktop adicionais dependem da extensão do teste descrita abaixo; não declarar todas as larguras aprovadas sem medir.

## 20 cenários do documento mestre

| # | Resultado | Evidência / limite |
|---|---|---|
|1|PARCIAL|API anônima 401; login/logout/refresh de sessão hospedada ainda não homologados ponta a ponta|
|2|PASS no teste|Landing e demo abertas no navegador; API exige identidade|
|3|PARCIAL|CRUD privado testado na API; onboarding real com OAuth ainda precisa homologação|
|4|PASS na API|B recebe 404 ao ler/escrever/exportar/restaurar/excluir projeto de A|
|5|PASS no escopo|Import, edição, versão otimista e restore testados; edição/save/restore também no browser demo|
|6|PARCIAL|Capturas desktop e 390px, sem overflow medido em 390; demais larguras não certificadas|
|7|BLOQUEADO|Upload APK desativado; não foi feito teste sintético JDK/JADX|
|8|PASS de bloqueio|API/UI declaram motor Android não configurado|
|9|BLOQUEADO|Chromium analítico isolado não implantado; browser de QA não conta como motor de análise|
|10|PARCIAL|URL HTTPS pública registrada sem rede; não existe captura de destino|
|11|PASS de bloqueio|localhost, IPv4/IPv6, metadata, credenciais, portas e protocolos rejeitados. Sem fetch de alvo, não há resolução DNS/rebinding/redirecionamento a explorar|
|12|PASS no escopo|Traversal, symlink ZIP, expansão excessiva, arquivo gigante/extensão/binário rejeitados|
|13|PARCIAL|Catálogo iOS com resposta controlada e origem fixa; Android não implementado|
|14|PASS fixture|REA 6.8.0 real no GitHub Actions; hash/limitações no relatório original|
|15|PASS|IA não configurada visível; nenhuma resposta fictícia|
|16|BLOQUEADO|Nenhum agente/provedor IA existe; não houve teste de prompt injection de um agente real|
|17|PARCIAL|Adapter CLI tem abort/deadline; não há fila de produção nem teste real de processo cancelado neste host|
|18|PARCIAL|Autorização server-side, respostas privadas no-store, dados não inseridos em bundle; sem pentest completo|
|19|BLOQUEADO|Fila durável e worker de produção não implantados; não houve simulação de queda/retomada|
|20|PASS no escopo|ZIP determinístico; restore cria nova revisão e mantém revisões anteriores. Não é restauração de desastre|

A plataforma continua beta: resultados parciais/bloqueados não foram contados como aprovação integral dos 20 cenários.

## Verificação após publicação

Landing e demo abertas na URL pública. Análise ao vivo confirmada no navegador: 4 arquivos, 9 observações e 2 imports. CI completo aprovado em https://github.com/webluxfloripa-lab/rea-engenharia-reversa/actions/runs/40968040044 (REA real, painel legado e web-platform). Navegação next/link apresentou incompatibilidade no runtime e foi substituída por anchors nativos na versão Sites 2.
