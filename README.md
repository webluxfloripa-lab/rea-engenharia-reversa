# REA — Engenharia Reversa

Este repositório público foi criado para trabalhar com o REA (Reverse Engineer Anything) separadamente dos projetos existentes.

**Estado:** repositório criado; o código-fonte completo ainda precisa ser importado.

## Importação do pacote fornecido

1. Abra este repositório e selecione **Code → Codespaces → Create codespace on main**.
2. No Codespaces, envie o arquivo `REA_GitHub_Publico_Pronto.zip` para a pasta raiz do projeto (Explorer → Upload).
3. No terminal do Codespaces execute:

```bash
mkdir -p /tmp/rea-import
unzip -q REA_GitHub_Publico_Pronto.zip -d /tmp/rea-import
cp -a /tmp/rea-import/rea-engenharia-reversa/. .
rm -f REA_GitHub_Publico_Pronto.zip
git add -A
git commit -m "Importa REA 6.8.0 e scripts de instalação"
git push origin main
```

O ZIP inclui a pasta `rea-main/` com o código original e os instaladores auxiliares. **Não execute código de terceiros ou publique segredos sem revisão.**

## Próximo passo

Após a importação, abra **Actions → Validar REA (manual) → Run workflow** para testar instalação, build e CLI no ambiente GitHub. O REA é um aplicativo CLI/MCP; publicar o código no GitHub **não** o torna automaticamente um serviço online.

Fonte: https://github.com/morluto/rea (licença e avisos originais preservados no pacote).
