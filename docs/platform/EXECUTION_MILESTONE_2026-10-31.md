# REA Studio 2.0 — marco de integração nativa

**Data:** 31/10/2026  
**Base:** `feature/rea-studio-platform-v2` (REA 6.8.0 + portal Sites beta v5)  
**Trabalho:** `feature/rea-executor-hardened-20261031`

## Status verificável

| Recurso pedido | Entrega nesta branch | Status real |
|---|---|---|
| IA solicita REA e recebe Evidence | Gateway local REST com job e evidência JSON, testado com REA real | **Prova funcional de laboratório**; IA Sites não conectada |
| JavaScript | `analyze-javascript-application` | **Teste real** via gateway GitHub Actions |
| APK Android | REA inspect-android-package, JDK21/JADX com APK Appium de hash fixado | **Teste real com amostra aprovado**; produção ainda não homologada |
| Websites por URL | Preflight de HTTPS/DNS e REA com Chromium/CDP em página de teste local | **Teste CDP real aprovado**; navegação de URLs públicas continua bloqueada |
| .NET | REA inspect-managed-artifact/members | **Teste real de DLL compilada no CI aprovado**, outros formatos pendentes |
| Inventário/formato | `inspect-artifact` | **Código de integração**; formatos exigem homologação |
| HAR/SAZ/QLOG | REA inspect-web-network-capture offline | **HAR sintético aprovado**; SAZ/qlog ainda sem teste real |
| MCP | REA 6.8.0 inclui servidor stdio/HTTP; orientação para conexão local | **Disponível no REA**; não conectado ao público |
| Empresas e permissões | SQL de tenants, membros e papéis com integridade | **Esquema rascunho testado**, sem política de acesso ativa |
| Planos/cotas | Tabelas, valores simulados gratuitos e constraints de não cobrança | **Rascunho**, sem produto faturável |
| Observabilidade | Relatórios de execução por UUID e testes CI | **Laboratório**, sem logs centralizados/monitoramento |
| Backups | Código e CI versionados no GitHub | **Dados de produção não cobertos** |
| Mobile/desktop | Editor CodeMirror da beta e UI local responsiva em localhost:4183 | **Código responsivo**, sem homologação em aparelhos reais |

## Fluxo de produção proposto (não implantado)

```
Navegador autenticado
  |
  v
REA Studio Sites (identidade ChatGPT / tenant / RBAC)
  |
  v
Broker de execução autenticado (servidor, nunca no browser)
  |-- quota por organização e usuário
  |-- validação e idempotência de job
  |-- quarentena de upload em storage privado
  |-- malware/type/signature scan + tamanho máximo
  v
Fila persistente (retry, lease, cancelamento, Dead Letter Queue)
  |
  v
Worker por job em VM/container não privilegiado, FS restrito
  |-- JS: REA CLI
  |-- .NET: parser estático
  |-- Android: JDK + JADX verificados
  |-- Rede: análise HAR/SAZ/QLOG offline
  |-- Website: Chromium separado egress-filtered (DNS/redirect/subresources)
  |
  v
Evidence privada, hash, data e versão do motor
  |
  v
Resultados no Studio + IA com tool calls *restringidos*
  |
  v
Proposta de código -> diff -> aprovação humana -> revisão atômica
```

**Condições antes de habilitar produção:**

1. JWT/assinatura de serviço entre Sites e broker, ligado ao tenant real; tokens de laboratório nunca no frontend.
2. Fila persistente, banco e storage privados; idempotência, recuperação após falhas e cancelamento ativo.
3. Descompressão segura de APK/ZIP, validação de assinaturas de arquivo, scanning e quotas globais.
4. Rede isolada para páginas externas, DNS recheck, bloqueio metadata/private, redirects e subresource policy.
5. Hardening do container: user namespace, seccomp/AppArmor, limites CPU/memória/processos, mounts read-only, sem acesso Docker socket, sem credenciais do serviço principal.
6. Review de licenças, termos e uso de JADX/Ghidra/IDA; sem obtenção de licenças comerciais por conta do usuário.
7. Testes E2E com duas contas reais, dois tenants, fuzz de upload, cross-tenant access, pen test independente.
8. Política de retenção, backup criptografado e restauração de desastre testada.
9. Contabilização real de uso e integração com PSP somente após aprovação comercial; chaves somente server-side.
10. Validação móvel em Android real e desktop, incluindo fluxo de upload, histórico, digitação e longas análises.

**Não ativar endpoint público do executor local:** ele tem um segredo único, sem isolamento multi-tenant. Rodar direto em um Worker ou página pública exporia sistemas a execução de análises de arquivos não confiáveis. A plataforma pública existente usa AST/Babel e IA com limites, não o executor nativo.

## Verificação

- `.github/workflows/rea-executor.yml`: testes de API de gateway, segurança de URLs, execução real do REA e integridade do schema.
- `workers/executor/README.md`: comandos de instalação, configuração local, segurança e limites.
- `workers/executor/Dockerfile`: imagem de laboratório não homologada.
- O REA upstream permanece em `rea-main/` sem modificações; o site publicado não foi alterado.
- Antes de merge, checar resultado dos CI da última revisão da branch, Docker build não foi homologado, e nunca afirmar APK/website público já funcional.

## Critério para próximos marcos

**Marco B:** broker real, autenticação entre serviços e persistência de job com E2E tenant A/B.  
**Marco C:** APK real com JDK/JADX, scanner e sandbox.  
**Marco D:** browser isolado e egress protegido, coleta com consentimento e evidence.  
**Marco E:** SaaS com planos, pagamento opt-in, backups, observabilidade, homologação móvel.

Não é possível declarar o escopo integral concluído sem cumprir os marcos B–E.
