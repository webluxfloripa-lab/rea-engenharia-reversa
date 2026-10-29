# REA Studio — painel do projeto REA

Interface web **local e protegida por token** para visualizar arquivos JavaScript/TypeScript fornecidos pelo usuário e executar o REA 6.8.0 em um projeto permitido. Sem dependências npm adicionais para o painel.

## No GitHub Codespaces (celular ou PC)

1. Abra seu Codespace existente do repositório `webluxfloripa-lab/rea-engenharia-reversa` e atualize o repositório com `git pull origin main`.
2. Se o Codespace já existia antes da instalação da configuração, execute `bash .devcontainer/configurar.sh` no Terminal. Caso queira aplicar a nova imagem/versão do Node ao container, use **Codespaces: Rebuild Container** na paleta de comandos. Para o primeiro Codespace criado com a configuração atual, o setup será automático.
3. Se necessário, execute `bash .devcontainer/iniciar-painel.sh`.
4. Abra a aba **Ports**, localize a porta `4173` e selecione **Open in Browser**. Mantenha **Visibility = Private**.
5. No terminal, execute `cat .rea-studio-token`, copie o token e cole no login do painel.
6. Crie um nome de projeto, descreva a investigação, selecione e envie arquivos locais. Clique **Executar análise**, leia o relatório e exporte o JSON.

**Observação:** não execute o antigo bloco `unzip`/`git push` do ZIP de importação — o REA já está publicado em `rea-main/`.

## Controles e limites

- Os arquivos enviados são armazenados **apenas no Codespace**, em `.rea-studio-data/alvos`. Nenhuma publicação automática no GitHub.
- Só extensões voltadas a artefatos de código e documentos auxiliares são aceitas. Até 10 MB por arquivo, 60 MB / 100 arquivos por projeto.
- O analisador roda sem shell, apenas com o comando de análise de diretórios JavaScript do REA; uma análise por vez e limite de 3 minutos.
- O token local fica em `.rea-studio-token` e **não deve ser enviado ou versionado**.
- Portas encaminhadas do Codespaces devem permanecer privadas. Nunca altere para Public.
- A análise trata somente artefatos acessíveis; não recupera código privado de serviços externos nem gera código novo por IA. Consulte o projeto REA para usar recursos adicionais como análise web e ferramentas nativas.

## Comandos

```bash
bash .devcontainer/configurar.sh  # setup/compilação + inicia painel (quando necessário)
bash .devcontainer/iniciar-painel.sh  # inicia painel sem recompilar
cat .rea-studio-token  # token para login
node --version
cd rea-main && node scripts/rea.mjs --help
```

O Codespace com o painel **não é um serviço 24/7**: ele pode parar por inatividade, e o GitHub pode cobrar consumo conforme seu plano. Consulte limites no GitHub. O Node.js é fornecido pela imagem da Microsoft ou instalado via nvm dentro do Codespace, não criado do zero.
