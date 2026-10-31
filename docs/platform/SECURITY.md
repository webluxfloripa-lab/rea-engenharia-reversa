# Segurança e auditoria

A identidade é fornecida pelo dispatch do Sites, nunca por token em frontend. `getChatGPTUser` é chamado server-side. Toda operação de projeto exige owner=id da identidade autenticada; histórico e export passam pela mesma verificação. Escritas exigem Origin da mesma origem e JSON; cotas são atômicas no D1. SQL parametrizado, gravações com versão esperada, triggers de revisão no mesmo transaction boundary. Arquivos enviados não são executados.

ZIP: tamanho compactado, diretório central, número de entradas, expansão, duplicatas, criptografia, symlinks e caminhos inspecionados antes da inflação. Cotas rígidas por arquivo e projeto. APK bloqueado até existir quarentena e engine isolado. URLs de alvo só são registradas; não há fetch arbitrário. Catálogo usa origem Apple fixa, redirects recusados e prazo de 8s.

HAR usa allowlist: apenas origem, método, status e duração. Não guarda caminhos/queries/cookies/corpos/headers. Conteúdo React é escapado; não usa innerHTML com conteúdo alvo. Preview em iframe sandbox vazio e CSP default-src none, sem script, rede ou formulários. Headers de segurança no Worker, respostas privadas no-store.

Auditoria de dependências encontrou no REA preservado: zod (alta) e fast-uri (moderada) no lockfile 6.8.0. Não modificar silenciosamente o núcleo pinado; planejar atualização isolada com testes completos. REA não é exposto como serviço público nesta beta. Portal teve dependências atualizadas e componentes de starter não usados removidos; auditoria final prod zerada. Inventário e hashes em inventory.json. Resultado depende do estado do catálogo de advisories na data da consulta.

Limitações: autorização é por proprietário individual; organizações, convites e papéis não foram implementados. Auditoria não equivale a registro externo imutável. Falta pentest independente, teste de carga, quotas globais antiautomação, backup operacional e validação jurídica. UI de políticas é informação da beta, não parecer jurídico. Nenhum segredo, token do painel local ou projeto privado foi versionado.
