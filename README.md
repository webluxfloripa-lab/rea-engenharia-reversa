# REA — Engenharia Reversa

Repositório público independente da conta **webluxfloripa-lab**, para estudar e desenvolver o **Reverse Engineer Anything (REA)**.

## Situação confirmada

- **REA 6.8.0 publicado** em `rea-main/`.
- **Origem:** [morluto/rea](https://github.com/morluto/rea), tag `rea-agents-6.8.0`, commit `160d821ac9a0310afcb8d1fc427862dd6508add5`.
- Instalação de dependências, compilação e comando `--help` **aprovados no GitHub Actions**, em Ubuntu com Node.js 24.
- **GitHub Codespaces configurado**, para abrir o editor, instalar dependências e trabalhar via navegador. **Um Codespace pessoal ainda precisa ser criado/aberto**.
- Nenhum arquivo nem ambiente de produção de `voee360tour` ou `sevensportsbar` foi modificado.

### Abrir e usar no celular ou computador

1. Abra [Codespaces do REA](https://codespaces.new/webluxfloripa-lab/rea-engenharia-reversa).
2. Confirme **Create codespace on main**. A configuração em `.devcontainer/` prepara Node.js e tenta instalar/compilar o REA automaticamente ao criar o ambiente.
3. Abra o **Terminal** do Codespaces. Após a configuração concluir:

```bash
cd rea-main
node scripts/rea.mjs --help
```

4. Para analisar um diretório JavaScript **seu ou autorizado**, coloque os arquivos de análise no Codespace e use, na pasta `rea-main`:

```bash
node scripts/rea.mjs analyze-javascript-application /CAMINHO/DO/ALVO --json
```

Consulte `--help` antes de outras opções. Algumas análises exigem ferramentas extras.

### Salvar edições

No terminal, a partir da raiz do repositório (ex.: `cd /workspaces/rea-engenharia-reversa`):

```bash
git status
git add -A
git commit -m "Descreva a alteracao"
git push origin main
```

### Instalar sem Codespaces

- Linux/macOS: `bash INSTALAR_REA_LINUX_MAC.sh`
- Windows PowerShell: `.\INSTALAR_REA_WINDOWS.ps1`

É necessário Node.js compatível com `rea-main/package.json` e acesso à internet.

### GitHub Actions

- [Importação inicial](https://github.com/webluxfloripa-lab/rea-engenharia-reversa/actions/workflows/importar-rea.yml) — importação da versão identificada, sem sobrescrever arquivos existentes de `rea-main/`.
- [Instalação e validação](https://github.com/webluxfloripa-lab/rea-engenharia-reversa/actions/workflows/validar-rea.yml) — instalação, compilação e CLI em runner temporário com permissão de leitura.

### Proveniência e segurança

A importação foi realizada a partir da **tag oficial 6.8.0**, não mediante upload do arquivo ZIP anteriormente compartilhado na conversa. Os dois conteúdos **não foram comparados arquivo a arquivo**; diferenças eventuais precisam ser verificadas antes de afirmar identidade exata.

A licença MIT e avisos do projeto original são preservados em `rea-main/`. Não publique tokens, dados privados de clientes ou materiais de terceiros sem permissão. Executar o REA no GitHub Actions **não** cria automaticamente um servidor MCP acessível a este chat.
