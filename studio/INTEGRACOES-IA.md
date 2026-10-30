# Integrações opcionais REA Studio (Microlink + FreeLLMAPI)

## Importar texto de uma URL pública
No painel privado, informe URL HTTP(S) pública e confirme autorização. O backend chama **Microlink REST** e salva `pesquisa-web/<hash>.txt` no projeto no Codespace. O arquivo registra URL e título. **Texto extraído não equivale ao código-fonte original** e não representa engenharia reversa de servidores privados. O arquivo fica sujeito aos limites normais de espaço e arquivos. O frontend nunca recebe chaves privadas.

- Sem chave: usa `https://api.microlink.io`, sujeito à cota gratuita.
- Com `MICROLINK_API_KEY`: usa `https://pro.microlink.io` e o header `x-api-key`.
- URLs com IPs, host local/interno, credenciais e portas customizadas são rejeitadas. Não envie URLs internas nem dados de cliente para ferramentas terceiras.

## Revisão de relatório por IA
Opcional, **somente leitura**. Após concluir análise local, clique em **Revisar com IA** e confirme o envio de um trecho das evidências ao roteador. Requer que a FreeLLMAPI esteja executando **no mesmo ambiente que o servidor REA**, escutando `127.0.0.1:3001`, e que `FREELLMAPI_API_KEY` esteja configurada **somente no servidor**. Não instala FreeLLMAPI automaticamente; configure provedores e suas cotas separadamente.

A revisão envia objetivo e até 20 mil caracteres de evidências aos provedores habilitados na FreeLLMAPI. **Não use com informações confidenciais sem consentimento**. O resultado pode conter erros e não altera arquivos, nem conclui ações por conta própria.

Como referência, o ZIP fornecido contém FreeLLMAPI 0.8.2 CLI, código MIT. Não foi copiado para este repositório. Os limites e condições dos provedores gratuitos podem restringir uso comercial; não use essas cotas como backend de SaaS público sem análise contratual.

## Testes
`node --test studio/integrations.test.mjs studio/server.test.mjs`

Links: https://microlink.io/docs/api/parameters/data · https://microlink.io/integrations/mcp · https://github.com/tashfeenahmed/freellmapi
