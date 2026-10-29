# Recuperação

Base canônica preservada: f9c98563e1bed51f4faa0431a287e84be0fbdec6. Desenvolvimento separado em feature/rea-studio-platform-v2. main e rea-main não foram substituídos. Para inspeção local, use checkout separado de main; não use reset destrutivo ou force push em trabalho de outra pessoa.

Sites versiona código e publica commits exatos. Para reverter aplicação, selecione a versão anterior salva e publique-a. Reversão de código não reverte D1. A migração inicial é aditiva e não altera bancos de outros sistemas. Nunca reexecute/mude migração aplicada.

Recuperação de conteúdo: cada salvamento cria revisão no mesmo commit SQL. Restaurar v1 após v2 gera v3, preservando v2. Original importado é conservado e não pode ser alterado pelo endpoint save. Arquivar é reversível; exclusão definitiva requer projeto arquivado e nome exato, removendo conteúdo e revisões no banco ativo.

Export ZIP inclui arquivos derivados, manifesto e relatório. Ainda não há export integral/restore do banco com todos os usuários, disaster recovery, política de backups testada ou garantia de recuperação após exclusão definitiva. Nenhum dump de produção foi feito porque este era um Site novo e sem dados existentes; os projetos do painel antigo não foram acessados nem migrados.
