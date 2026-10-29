# REA Studio — Laboratório de Engenharia Reversa

**Código REA 6.8.0 + painel web de investigação em português**, pronto para GitHub Codespaces e desenvolvimento pelo navegador (inclusive no celular).

## Abra seu painel

[**Abrir Codespaces do REA**](https://github.com/codespaces) · [**Código do painel**](studio/) · [**Manual completo**](studio/README.md)

### Para os Codespaces que já foram criados antes do painel

No editor do Codespaces, abra o menu **Terminal → New Terminal** e execute na raiz do repositório:

```bash
git pull origin main
bash .devcontainer/configurar.sh
```

A configuração prepara Node.js **24** (versão compatível), instala dependências REA, compila o projeto e inicia o painel na porta **4173**. Se a instalação já estiver pronta, basta iniciar novamente com `bash .devcontainer/iniciar-painel.sh`.

No Codespaces, acesse **Ports → 4173 → Open in Browser** e mantenha a visibilidade da porta como **Private**. O painel solicitará um token, que você encontra executando no terminal:

```bash
cat .rea-studio-token
```

Se preferir reconstruir todo o ambiente para aplicar a configuração de desenvolvimento nova, use **Codespaces: Rebuild Container** pela paleta de comandos. O REA Studio é executado dentro da sua máquina Codespaces, não em uma hospedagem pública.

### O que o painel faz

- Recebe **um objetivo em texto** e guarda-o no relatório para orientar a investigação;
- Permite enviar arquivos autorizados (`.js`, `.ts`, `.json`, `.html`, `.css` e relacionados);
- Permite **criar, editar, salvar, copiar e baixar arquivos** diretamente no painel, tanto no celular como no PC;
- Confere a versão original antes de salvar para não sobrescrever edições realizadas em paralelo;
- Executa o comando real `rea analyze-javascript-application` sobre esses arquivos;
- Exibe as evidências do analisador e permite **exportar o relatório JSON**;
- Protege a execução com um **token gerado no Codespace** e mantém os arquivos fora do GitHub.

O campo de texto do painel **não é um modelo de IA**: sem integração adicional ele não interpreta instruções livres para escrever código novo. O REA inspeciona artefatos acessíveis e não extrai automaticamente código privado de websites. Para usar análise web, binários e agentes MCP completos consulte a [documentação REA](rea-main/README.md).


### Como editar no celular ou computador

**Dentro do REA Studio:** selecione um arquivo em **Arquivos editáveis**, toque em **Editar**, faça a alteração e toque em **Salvar**. Também é possível usar **+ Novo arquivo** e **Baixar**.

**Para editar o próprio código-fonte do REA** (`rea-main/`) ou o aplicativo (`studio/`), abra o editor do [GitHub Codespaces](https://github.com/codespaces). O painel edita somente arquivos enviados para seus projetos, não altera os arquivos internos da ferramenta.

**Para aplicar as atualizações aos Codespaces antigos:** execute `git pull origin main` seguido de `bash .devcontainer/configurar.sh` no terminal. Na aba **Ports**, abra a porta **4173**, com visibilidade **Private**. Esses comandos são executados *no Codespace*, não no GitHub Actions.

**Auditoria automática:** [testes integrados de instalação e painel](https://github.com/webluxfloripa-lab/rea-engenharia-reversa/actions/workflows/auditoria-completa.yml).

### Pacote ZIP antigo versus repositório

O antigo `REA_GitHub_Publico_Pronto.zip` contém 6.700 arquivos sob `rea-main/` e os instaladores locais, mas **não inclui `.devcontainer/` nem `studio/`**. Também não inclui `node_modules/` ou `dist/`, que são gerados pela instalação/compilação. Use a versão atual do [repositório no branch main](https://github.com/webluxfloripa-lab/rea-engenharia-reversa/archive/refs/heads/main.zip), que inclui o painel e as configurações revisadas. Não sobrescreva o repositório atual com o ZIP antigo.

### Ambiente

- Projeto original: [morluto/rea](https://github.com/morluto/rea), tag `rea-agents-6.8.0`, commit `160d821ac9a0310afcb8d1fc427862dd6508add5`.
- Código original sob `rea-main/`, com licença MIT e avisos originais preservados.
- Instalação/compilação REA confirmadas em GitHub Actions com Node.js 24. O painel tem sua própria suíte de testes.
- Scripts de instalação de sistema: `INSTALAR_REA_WINDOWS.ps1`, `INSTALAR_REA_LINUX_MAC.sh`.
- A versão que foi importada veio da **tag oficial do GitHub**, não diretamente do ZIP anexado anteriormente; não foi estabelecida equivalência arquivo a arquivo entre os pacotes.

**Segurança e custos:** não publique o token, não configure a porta 4173 como pública e não inclua materiais de terceiros sem permissão. Dois Codespaces ativos podem consumir recursos simultaneamente; pare o que não estiver usando. O GitHub pode cobrar uso conforme os limites do plano. Não houve ativação de API de IA paga.
