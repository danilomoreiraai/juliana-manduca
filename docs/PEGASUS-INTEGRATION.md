# Pegasus como ferramenta administrativa do portal

Data: 17/10/2026. Issue: [#47](https://github.com/danilomoreiraai/juliana-manduca/issues/47).
Base examinada: `438b9ac9b0bd2f1fabc46e8a7323204ff8280df5`.
Estado: adequação de arquitetura para revisão; funcionalidades astrológicas ainda não implementadas.

## Objetivo e fluxo

Integrar as funcionalidades do Pegasus Photon SE ao site Juliana Manduca como uma ferramenta
de trabalho do administrador. O admin seleciona o cliente, realiza cálculos, prepara um conteúdo,
revisa o material e o disponibiliza na área privada do destinatário. O cliente recebe os materiais
liberados no portal existente. Este fluxo substitui a proposta inicial de um aplicativo independente
em que cada cliente operaria as ferramentas astrológicas.

“Enviar internamente” significa disponibilizar o conteúdo ao destinatário no portal. A primeira
entrega usará PDF e a seção atual de materiais privados. Mensagens, notificações por e-mail, geração
de texto por IA e publicações externas não foram solicitadas e não são pressupostos da integração.
O conteúdo editorial pode ser preparado pelo admin a partir dos resultados e de modelos revisáveis.

Esta é uma ampliação planejada do portal. O escopo atual do MVP descrito no README continua
representando o comportamento disponível; a matriz do legado orienta entregas futuras, incluindo
idiomas e técnicas especializadas, sem adicioná-las implicitamente à versão já implantada.

A meta de reconstruir todas as funções verificadas do Pegasus é preservada na
[matriz funcional](pegasus/FEATURE-MATRIX.md). Essas funções pertencerão ao ambiente de produção
de conteúdo do admin; sua presença no motor não concede ao cliente acesso a cálculos ou rascunhos.

## Estrutura existente que será reutilizada

As capacidades abaixo foram verificadas no código da revisão indicada. Isso não equivale a executar
os testes ou comprovar a implantação real nesta entrega documental.

| Capacidade           | Implementação existente                                            | Consequência para a integração                                           |
| -------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| Frontend             | React 19, Vite, Tailwind v4 e React Router em `apps/web`           | Adicionar a ferramenta à área administrativa do próprio site             |
| Integração de telas  | `apps/web/src/services/portal.ts` e TanStack Query                 | Novas chamadas ficam em services; componentes não acessam infraestrutura |
| Login e MFA          | Supabase Auth, `AdminRoute` e `apps/api/src/plugins/auth.ts`       | Reutilizar identidade, papel no banco e exigência de `aal2`              |
| API                  | Fastify, rotas finas e `src/functions`                             | Acrescentar funções de astrologia à API existente                        |
| Contratos            | `packages/contracts/src/index.ts`, Zod e TypeScript                | Definir schemas e tipos compartilhados neste pacote                      |
| Dados                | Drizzle e schema privado `app`                                     | Novas tabelas por migrations incrementais                                |
| Entrega de materiais | `documents`, bucket privado e downloads assinados por 300 segundos | Publicar o PDF como documento para `userId` e consulta opcional          |
| Área do cliente      | `apps/web/src/pages/DashboardPage.tsx`                             | O material publicado aparece na seção de arquivos já existente           |
| Auditoria            | `app.audit_events` e funções de documentos                         | Registrar cálculo, revisão, publicação e retirada sem corpos sensíveis   |
| Operação             | Docker Compose/EasyPanel e CI existente                            | Adicionar componentes de cálculo por entregas reversíveis                |

Os contratos atuais de perfil não possuem dados de nascimento. Esses dados precisarão de modelo
próprio, separado do perfil de autenticação. A função atual `uploadDocument` recebe arquivo
multipart; ela não pode ser tratada como um método já disponível para publicar buffers gerados.
A implementação deverá extrair uma função de persistência comum mantendo a autorização e o
contrato do upload existente, com testes para ambos os produtores.

## Arquitetura adequada ao monorepo

```text
Admin autenticado com MFA
  → React /admin/astrologia
  → Fastify /admin/astrology/*
  → dados/rascunhos no schema privado app
  → worker interno de cálculo, quando necessário
  → resultado versionado → conteúdo revisado
  → publicação explícita → documents + Storage privado
  → /dashboard do cliente → download autorizado
```

A API pública permanece Fastify. Não será criado outro backend público FastAPI, outro cadastro
de usuários ou outro portal. Um componente Python poderá executar Swiss Ephemeris e técnicas
astrológicas como worker interno. A escolha é uma separação de responsabilidade numérica, não
uma substituição da stack do site.

O worker proposto fica em `services/astrology`, fora dos workspaces npm `apps/*` e `packages/*`.
Ele consome jobs de cálculo persistidos no PostgreSQL usando uma identidade de serviço com
permissão restrita às tabelas necessárias; não recebe tokens Supabase de clientes nem a chave
administrativa de Storage. Não haverá porta pública para o motor. O contrato numérico e seus
fixtures deverão ser versionados e validados também na fronteira Python.

Um job processa apenas uma configuração de cálculo de cada vez no processo que usa a biblioteca,
reaplicando explicitamente opções como topocentria e ayanamsa. O estado de um cálculo não pode
afetar o cálculo seguinte. Configurações, versão do motor e origem das efemérides acompanham a saída.

Workers usarão claim transacional, prazo de posse, tentativas limitadas e recuperação após falha.
Resultados só serão aceitos para a mesma versão de entrada do job. A fila deve sobreviver ao restart
da API e do worker. A identidade do admin que solicitou a operação fica no job e na auditoria;
o serviço executor não se torna seu destinatário ou proprietário editorial.

## Permissões e destinatários

| Operação                                                  | Admin com `aal2`          | Admin com `aal1`          | Cliente                 |
| --------------------------------------------------------- | ------------------------- | ------------------------- | ----------------------- |
| Cadastrar dados de nascimento e sujeitos dos mapas        | Permitido                 | Negado                    | Negado                  |
| Calcular, importar legado e consultar resultados internos | Permitido                 | Negado                    | Negado                  |
| Criar, editar e revisar conteúdo                          | Permitido                 | Negado                    | Negado                  |
| Publicar ou retirar uma entrega                           | Permitido                 | Negado                    | Negado                  |
| Ler rascunhos e notas técnicas internas                   | Permitido                 | Negado                    | Negado                  |
| Listar/baixar material liberado para si                   | Conforme rotas existentes | Conforme rotas existentes | Apenas próprio material |

Reutilizar `app.requireAdmin` em todas as rotas da ferramenta e os guards existentes no frontend.
Os grants e a arquitetura atuais mantêm dados de negócio na API; não acrescentar acesso direto
do navegador às tabelas `app` ou ao Storage. O papel autorizado continua vindo de `app.profiles`,
nunca de `user_metadata`.

O operador e o destinatário são entidades distintas: `createdBy`/`requestedBy` identificam o admin;
`recipientUserId` identifica o cliente. Não usar `currentUser.id` como destinatário por padrão.
Na publicação, validar que o destinatário é um cliente ativo e que a consulta opcional pertence a ele.
Validar novamente no comando de publicação, mesmo que a seleção tenha sido válida na edição.

Um mapa pode conter sujeitos sem conta, como o parceiro em uma sinastria. Isso não cria conta,
convite ou compartilhamento automático. Os dados desses sujeitos e os detalhes técnicos só entram
no material entregue quando o admin os inclui e revisa expressamente.

## Modelo de domínio proposto

As tabelas abaixo são propostas. Nenhuma migration ou coluna correspondente é criada neste PR.

| Tabela no schema `app`      | Responsabilidade                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `astrology_subjects`        | Dados de nascimento e local, calendário, modo de fuso e precisão/conhecimento da hora; vínculo opcional com cliente |
| `astrology_calculations`    | Técnica, sujeitos e entradas congeladas, versão do motor, configuração, resultado e autor                           |
| `astrology_jobs`            | Estado persistente, prazo de posse, tentativas e referência da versão de entrada                                    |
| `astrology_report_versions` | Conteúdo editorial e seleção de resultados, número da versão, revisão e autor                                       |
| `astrology_publications`    | Relação da versão revisada com destinatário, consulta, `documentId` e estado da entrega                             |

Reutilizar `profiles`, `consultations`, `documents` e `audit_events`, sem duplicá-los. Cada mapa/relatório
referencia snapshots de suas entradas; editar dados de nascimento não altera retroativamente um
conteúdo revisado. As tabelas terão FKs e índices para cliente, consulta, versão e trabalhos pendentes.

As versões de relatório têm estados `draft`, `reviewed` e `published`; a entrega tem estado
`published` ou `withdrawn`. Editar um conteúdo revisado cria nova versão em rascunho e exige nova
revisão. Uma nova versão não altera o PDF já entregue. Não é exigido um segundo administrador:
a revisão é uma ação explícita que o mesmo admin pode executar.

A revisão congela também destinatário, consulta opcional, versão das entradas e hash do PDF
aprovado. O artefato exato revisado é reutilizado na publicação, evitando diferenças por regeneração
ou edição concorrente. Sua prévia é servida apenas por rota administrativa autenticada; o objeto
interno de revisão não recebe registro em `documents` nem link de cliente.

Rascunhos não geram registros em `documents` nem URLs de download para clientes. A listagem
atual dessa tabela já os exporia ao destinatário; por isso ela será usada somente na publicação.
Notas internas e resultados completos do motor também não entram automaticamente na
`summary` de consultas, que já é visível no dashboard do cliente.

## Publicação e entrega interna

1. O admin escolhe cliente e consulta opcional, calcula e prepara uma versão do relatório.
2. A revisão apresenta o PDF exato, os dados que serão incluídos e o destinatário.
3. O admin confirma a publicação da versão revisada. O servidor revalida papel, MFA, versão,
   destinatário, estado da conta e consulta; alterações concorrentes invalidam a revisão usada.
4. O servidor grava o PDF em caminho privado e persiste documento, publicação e auditoria.
5. O cliente encontra esse documento em `/documents`, no dashboard atual, e solicita o download
   por `/documents/:id/download`. A propriedade continua sendo verificada na API.

A chave de idempotência da entrega liga versão e destinatário. Duplo clique, retry ou timeout após
commit não criam documentos duplicados. Um documento gerado terá `createdBy` igual ao admin
e `userId` igual ao destinatário. O navegador não fornece `storagePath` nem o autor da operação.

Storage e PostgreSQL não compartilham transação. A implementação deve reservar a entrega,
gravar o objeto privado e concluir documento/publicação/auditoria numa transação do banco.
Falhas intermediárias não podem expor rascunhos. Reservas e objetos órfãos terão limpeza
idempotente e recuperável, com checagem de que não existe publicação confirmada antes de excluir.
O worker numérico não fará upload nem publicará conteúdos por conta própria.

Retirar a entrega impede novas listagens e emissão de links e agenda a remoção do objeto com
retry quando necessário. A auditoria da publicação/retirada é preservada. URLs já emitidas têm
validade de até 300 segundos e arquivos baixados não podem ser recolhidos. Cache e links emitidos
precisam ser considerados na validação; não prometer revogação instantânea de uma cópia entregue.

O registro de publicação será o dono da relação com o documento gerado. A exclusão pela rota
administrativa atual de documentos também precisará atualizar essa relação e a auditoria, sem
deixar uma entrega marcada como disponível após excluir seu arquivo. Uploads manuais existentes
continuarão usando seu fluxo atual.

## Pontos de integração e contratos propostos

| Arquivo/área                                      | Adequação futura                                                       |
| ------------------------------------------------- | ---------------------------------------------------------------------- |
| `apps/web/src/App.tsx`                            | Rota `/admin/astrologia` dentro dos mesmos guards administrativos      |
| `apps/web/src/components/DashboardShell.tsx`      | Entrada “Astrologia” no menu administrativo                            |
| `apps/web/src/pages/AdminPage.tsx`                | Atalho preservando cliente/consulta selecionados                       |
| `apps/web/src/services/astrology.ts` (novo)       | Cliente HTTP tipado para cálculos e relatórios                         |
| `apps/api/src/routes/astrology.ts` (novo)         | Controllers administrativos finos com `requireAdmin`                   |
| `apps/api/src/functions/astrology/` (novo)        | Casos de uso de cálculo, conteúdo, revisão e publicação                |
| `apps/api/src/functions/documents.ts`             | Persistência comum para upload e material gerado, mantendo autorização |
| `apps/api/src/db/schema.ts` e `apps/api/drizzle/` | Tabelas e migrations aditivas para domínio astrológico                 |
| `packages/contracts/src/astrology.ts` (novo)      | Schemas Zod, estados e tipos exportados pelo índice atual              |
| `apps/web/src/services/demo.ts`                   | Fixtures sintéticas para os novos fluxos no modo demo existente        |
| `compose.yaml` e `docs/DEPLOYMENT.md`             | Worker e identidade interna quando houver cálculo homologado           |

Rotas futuras sugeridas, todas sob `requireAdmin`: `/admin/astrology/subjects`,
`/admin/astrology/calculations`, `/admin/astrology/calculations/:id` e
`/admin/astrology/reports/:id`, com comandos `/review`, `/publish` e `/withdraw`.
As rotas de documentos do cliente serão reaproveitadas. Estes caminhos são contratos propostos,
não endpoints atualmente disponíveis. Os erros públicos seguem `{ message, statusCode }`.

Datas astrológicas preservam ano civil/era, calendário, hora e seu grau de precisão, fuso aplicado
e coordenadas. Não transportar datas antigas só como `Date` do JavaScript. Usar conversão explícita
para ano astronômico e dia Juliano, distinguindo zona IANA de deslocamento manual do legado.
A flag legada de horário especial não deve somar uma correção antes de seu efeito ser verificado.

Os dados técnicos completos permanecem internos. O JSON de cálculo não deve ser colocado como
documento no bucket atual: os tipos permitidos não incluem JSON, e o cliente deve receber apenas
o conteúdo revisado. Exportações de investigação/importação serão funções administrativas.

## Sequência de entregas e aceite

Cada entrega segue issue própria, branch `codex/*`, PR, CI e revisão, conforme [AGENTS.md](../AGENTS.md).

| Entrega                     | Conteúdo                                                   | Aceite observável                                                                        |
| --------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Adequação atual             | Arquitetura e matriz nesta issue                           | Pontos existentes mapeados, funções futuras identificadas e fluxo do admin definido      |
| Fundação numérica           | Contratos de tempo, motor e comparador                     | Saídas medidas contra casos sintéticos do Pegasus; diferenças e tolerâncias documentadas |
| Primeiro fluxo completo     | Mapa natal, rascunho, revisão e PDF no portal              | Admin AAL2 gera/revisa/publica; só o cliente selecionado lista e baixa                   |
| Migração e complementos     | Paradox, históricos, harmônicas, pontos e editor           | Reconciliação de dados e comparação por técnica, sem expor notas internas                |
| Técnicas avançadas          | Relacionamentos, revoluções, direções, trânsitos e mundial | Variantes ativas comparadas com o original e disponíveis ao admin                        |
| Especializados e fechamento | Retificação, Local Space, pontos sensíveis e tabelas       | Regras recuperadas, paridade demonstrada e matriz de funções ativas concluída            |

O primeiro fluxo completo deverá usar apenas capacidades homologadas. Nenhuma tela em modo demo
ou resultado aproximado autoriza marcar a reconstrução completa como concluída. Itens como Hindu,
Programa Rei e Teste Gestacional continuam dependendo de verificação de disponibilidade no original.

## Validação necessária na implementação

- API: anônimo 401; cliente e admin AAL1 não calculam, revisam, publicam ou consultam rascunhos;
  conta desativada continua negada. Testar MFA também em reabertura e retry.
- Destinatários: cliente A não vê, baixa ou obtém metadados de conteúdo de B, mesmo conhecendo IDs;
  consulta de outro cliente é rejeitada. Trocar destinatário invalida revisão anterior.
- Publicação: rascunho invisível, versão imutável, idempotência, falha de Storage, rollback do banco,
  queda entre upload e commit e concorrência entre edição/revisão/publicação.
- Operação: recuperação de jobs abandonados, limites de tempo, erro de efeméride, limpeza de órfãos
  e exclusão/retirada coerente pelos dois fluxos administrativos.
- Cálculo: comparação por técnica e configuração, limites de calendário, normalização circular,
  latitudes extremas e ausência de mistura de estado entre jobs.
- Interface: fluxo real admin → cliente, estados de loading/erro/vazio/retry, foco e teclado,
  redução de movimento e revisão visual em 375 px e 1440 px.
- Documentos: PDF renderizado e inspecionado, cabeçalhos de download, autorização e duração
  declarada/efetiva de URLs assinadas. Fixtures sintéticas em ambiente isolado.

Reutilizar e ampliar os testes em `apps/api/test/documents.test.ts`,
`apps/api/test/app.integration.test.ts`, `apps/web/e2e/portal.spec.ts` e a validação de isolamento
existente. O [registro atual de isolamento](REAL-ISOLATION-VALIDATION.md) não é prova de teste de
um módulo que ainda será implementado. Nenhum teste com produção faz parte desta adequação.

## Observabilidade, distribuição, deploy e rollback

Métricas propostas: duração/estado dos jobs, falhas por técnica, publicações, retries e limpeza
pendente. Auditoria usa IDs opacos de ator/entidade e ações; não inclui nomes, nascimento, mapas,
interpretações, documentos, tokens ou URLs assinadas. Não incluir payloads numéricos/editoriais
em logs, Sentry ou traces. O modo demo permanece condicionado a DEV e a sua configuração atual.

A Swiss Ephemeris atual possui modelos AGPL e profissional; a escolha deverá ser resolvida antes
de ativar o serviço, conforme a [documentação do fornecedor](https://www.astro.com/swisseph/swephinfo_e.htm).
Os binários, a licença instalada, bancos pessoais, textos e fontes do programa original não entram
no deploy automaticamente. A investigação do legado continua local e alimenta regras verificadas.

Para o runtime futuro: migrations aditivas primeiro, permissões restritas de worker, serviço interno,
API e depois interface com liberação gradual. Um sinalizador de recurso desativado por padrão
permitirá ligar o módulo somente no ambiente de homologação e aos admins autorizados. O cliente
recebe materiais apenas após o fluxo completo de revisão/publicação e smoke tests com dois clientes.

Rollback: desativar o módulo, pausar os workers e voltar imagens ao commit anterior integrado à
`main`, preservando tabelas aditivas e materiais já entregues. Migrações destrutivas e exclusão de
documentos publicados não são procedimento padrão de rollback. A retomada deve recuperar jobs
e reservas pendentes sem republicar uma mesma versão/destinatário.

**Esta entrega altera somente documentação. Não aplica migrations, não inicia worker, não altera
autenticação, não gera conteúdo para clientes e não faz deploy.** A implementação segue após
a revisão desta adequação e o planejamento da primeira entrega.
