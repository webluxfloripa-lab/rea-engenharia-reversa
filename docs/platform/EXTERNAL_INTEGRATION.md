# Integração externa preparada, sem ativação

RemoteAnalysisClient.mjs é um transporte server-side, ainda não conectado à API pública. Nenhum serviço ou gasto foi ativado. Configuração ausente resulta em configured:false.

Contrato proposto: GET /v1/health; POST /v1/jobs; GET /v1/jobs/:id; POST /v1/jobs/:id/cancel. Submissão inclui owner obtido exclusivamente da sessão no servidor, projectId autorizado, versão, arquivos validados, declaração de autorização e chave idempotente. O serviço futuro deve validar autenticação, owner em cada operação, cotas e esquema; persistir jobs/leases; executar REA em sandbox; manter artefatos privados. O transporte não implementa essas garantias sozinho. Não expor as rotas antes de implementar e testar esse serviço.

Endpoint e token ficam apenas em secrets server-side. Sem URLs fornecidas por visitantes. HTTPS, redirects recusados e timeout de 10 segundos. Erros não repassam corpo remoto. Provedor IA, Chromium e JADX continuam ausentes. Contratação e credenciais não foram solicitadas.

Validação: node --test workers/analysis/RemoteAnalysisClient.test.mjs (4 testes com HTTP controlado; não comprovam backend real).
