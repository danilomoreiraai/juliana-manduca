# Baseline do BETA — 16/10/2026

Referência: issue #22. Commit de origem: `98b47a0f9e06c706d2e0a3ca360651447c052aca`
(`origin/main`). Branch de validação: `codex/beta-baseline`, criada em worktree isolado.

## Preservação do trabalho

O checkout original permanece em `codex/test-coverage`, commit `f246efd`, com suas duas
alterações locais preservadas (`apps/api/.env.example` e `docs/API-RESEARCH.md`). Nenhum
conteúdo desses arquivos foi copiado para esta entrega.

Os cinco commits exclusivos da branch original (`ab513c5`, `402f183`, `ae7e9e4`,
`3e2b6cb`, `f246efd`) aparecem no histórico descritivo do squash `29eeda1` (PR #14).
A comparação dos arquivos de qualidade, contratos, lockfile, tratamento de erros e testes
correspondentes não apresentou diferenças. Não é necessário reaplicá-los por cherry-pick.
A main inclui adicionalmente provisionamento de usuários (#16), modo demo (#18), Node 22
nas imagens Docker (#36) e tratamento do Instagram vazio (#38).

## Validação

Ambiente local: macOS, Node.js 24.15.0, npm 11.6.2, instalação limpa por `npm ci`.
A CI da main usa Node 20; as imagens de aplicação usam Node 22. Os resultados locais
não substituem a validação dessas versões na CI e nos smoke tests de release.

| Verificação                                     | Resultado                                                                               |
| ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| `npm run format:check`                          | Passou                                                                                  |
| `npm run lint`                                  | Passou, inclusive fronteiras arquiteturais                                              |
| `npm run knip`                                  | Passou                                                                                  |
| `npm run typecheck`                             | Passou                                                                                  |
| `npm run test`                                  | 39 testes passaram; 3 de integração ignorados sem opt-in                                |
| `npm run build`                                 | Passou                                                                                  |
| `npm run test:e2e`                              | 17 passaram; 1 repetição do baseline visual ignorada no projeto mobile por configuração |
| `npm run test:mutation`                         | Passou: 82,72%, 67 mutantes eliminados, 14 sobreviventes                                |
| `npm run test:db:prepare -w @juliana/api`       | Passou no PostgreSQL 16 descartável                                                     |
| `npm run db:migrate -w @juliana/api`            | Passou no PostgreSQL 16 descartável                                                     |
| `npm run db:check -w @juliana/api`              | Passou                                                                                  |
| `RUN_DB_INTEGRATION=true npm run test:coverage` | 42 testes passaram, sem skips; pisos de cobertura atendidos                             |

O PostgreSQL foi executado em container sem volume persistente, com porta vinculada somente
a localhost e credenciais sintéticas. Nenhuma conexão com banco ou Supabase real foi usada.
A preparação cria estruturas mínimas de Auth/Storage para integração; não comprova entrega
real de e-mail, login Supabase, MFA real ou políticas do Storage hospedado. O `db:check`
verifica consistência dos arquivos de migrations; a execução das migrations e a suíte de
integração são as evidências complementares contra o banco.

A primeira tentativa de migration foi interrompida pela validação de ambiente por ausência
das variáveis de aplicação. A repetição com URLs locais e chaves fictícias, como na CI,
concluiu a migration.

Evidência de CI na origem: [run 38816707436](https://github.com/danilomoreiraai/juliana-manduca/actions/runs/38816707436),
com quality, commits, mutation e E2E verdes.

## Pendências e risco residual

`npm audit` reportou 21 vulnerabilidades: 2 críticas, 6 altas e 13 moderadas. O tratamento
foi separado na [issue #39](https://github.com/danilomoreiraai/juliana-manduca/issues/39).
Esses números descrevem alertas da árvore de dependências, não exploração comprovada na
aplicação. Não foram feitas atualizações de dependências neste trabalho.

CI verde não representa aprovação do BETA: contas e MFA reais (#15), demais entregas
#23–#33 e decisão go/no-go (#34) continuam pendentes. Os alertas altos/críticos precisam
ser avaliados antes do lançamento.

## Impacto, observabilidade, deploy e rollback

Entrega exclusivamente documental: não altera contratos, banco, interfaces ou comportamento.
Não adiciona logs ou coleta de dados. Não requer deploy. Para rollback do registro,
reverter o commit documental por PR. Nenhum cutover ou mudança em serviço foi realizado.
