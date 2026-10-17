# HELENA: mapas salvos e PDF revisado

Continuação autorizada pelo usuário após o PR #50. Issue #51. O admin prepara os conteúdos;
o cliente recebe somente documentos privados explicitamente liberados. Não há merge ou deploy.

## Fluxo

O cálculo existente continua disponível. Após calcular, o admin associa um cliente ativo,
preenche título e análise e salva o mapa. A API recalcula/valida o snapshot no servidor,
sem aceitar posições enviadas pelo navegador. Mapas podem ser listados e reabertos.
Editar o conteúdo salva nova revisão com controle otimista; conflitos retornam 409.

O admin gera o PDF da revisão salva e abre um link assinado de cinco minutos para revisar.
O PDF é armazenado em objeto privado imutável, ainda sem registro em `documents`.
Após declarar a revisão na tela, o admin libera esse PDF ao cliente. O endpoint recebe
`revision` e `reportId`; ambos devem corresponder ao mapa atual. A publicação cria o documento,
registra a aprovação e a auditoria na mesma transação. Repetir/concorrrer a publicação retorna
o mesmo documento. Alterar um mapa não modifica PDFs já entregues.

## Dados e limites

- Tabela `helena_drafts`: UUID, cliente, nome do mapa (120), título (160), análise (20.000),
  snapshot natal JSONB, revisão inteira, criador e timestamps. Somente admins AAL2 via API.
- Tabela `helena_reports`: UUID, mapa/revisão únicos, cliente, caminho privado único, hash SHA256,
  tamanho, versão de formato, documento opcional, aprovação e timestamps. PDF cacheado por revisão.
- Cadastro recebe UUID de operação gerado no navegador: repetição da mesma criação não duplica
  mapa; reutilização com conteúdo diferente retorna conflito.
- Atualização sempre exige revisão atual, recalcula apenas quando dados natais mudam e zera
  a seleção/revisão do PDF na UI. A numeração de revisões anteriores permanece imutável.
- Listagem paginada, 25 mapas por página. O seletor de clientes usa a busca paginada existente.
- PDF com marca HELENA/Juliana Manduca, dados e método, mandala vetorial, planetas, casas,
  aspectos e análise escrita pelo admin; paginação e fonte incorporada para português.
- Não gerar interpretações automaticamente. Sem e-mail, WhatsApp ou compartilhamento público.

## Transações e armazenamento

Geração usa objeto com UUID próprio e `upsert=false`. Antes de gravar o relatório, a API
bloqueia a linha do mapa, confere a revisão e reutiliza o PDF já existente se outra requisição
o criou. Remove somente seu objeto não referenciado, nunca um relatório já publicado.
Se a confirmação de commit for incerta, preserva o objeto privado para não apagar um PDF válido.
Uma falha de upload não cria relatório nem documento. Falha posterior deixa, no pior caso,
objeto privado sem acesso de cliente; a operação pode ser repetida.

Publicação não faz novo upload: referencia exatamente o PDF revisado. Bloqueia o mapa e o perfil
do cliente, verifica que está ativo e cria documento/aprovação/auditoria atomicamente.
Se um documento publicado for removido pelo fluxo administrativo existente, o vínculo fica nulo
e a data de publicação é preservada. Não republicar automaticamente objeto removido: exigir nova
revisão. Nomes, análise, dados natais, URLs assinadas e segredos ficam fora da telemetria.

## Opções consideradas

Recomendada: PDF privado imutável antes da publicação, com transação apenas de banco no envio.
Gerar novamente ao enviar perderia a garantia de usar o PDF revisado. Fila/outbox resolveria
trabalhos longos, mas acrescentaria processos sem necessidade para um relatório curto nesta unidade.

## Validação e implantação

Contratos, PDF real (inclusive texto longo e acentos), reabertura, conflito, autorização real,
falha de armazenamento e publicação concorrente/repetida. Clientes A/B veem somente seus documentos.
UI em 375/1440, Axe, erro/retry e invalidação de estado ao trocar mapa/editar.
Migration aditiva no schema privado, sem expô-lo a roles de navegador; CI com PostgreSQL.
Novo PR dependente do #50; sem integrar a main automaticamente. Rollback de aplicação preserva
tabelas/objetos e documentos entregues. Licenciamento do motor segue a condição do PR #50.
