# Política de qualidade

## Gates obrigatórios

| Comando                     | Responsabilidade                                                      |
| --------------------------- | --------------------------------------------------------------------- |
| `npm run lint:biome`        | organização determinística de imports; formatter e linter desativados |
| `npm run lint:eslint`       | regras semânticas de TypeScript e imports de tipo                     |
| `npm run lint:architecture` | fronteiras entre apps, controllers, domínio e infraestrutura          |
| `npm run knip`              | arquivos, exports e dependências não usados                           |
| `npm run lint:commits`      | Conventional Commits no último commit                                 |
| `npm run test:mutation`     | força dos testes dos contratos compartilhados                         |

O Biome não substitui o Prettier ou o ESLint nesta fase: ele executa somente o assist de imports.
Isso entrega feedback rápido sem rodar dois formatters ou dois conjuntos equivalentes de regras.

## Contratos arquiteturais

- web e API não podem importar uma à outra;
- `packages/contracts` não depende de apps;
- routes Fastify não acessam DB, Storage ou Supabase diretamente;
- domínio/infraestrutura da API não dependem de routes;
- páginas e componentes web não acessam o cliente Supabase diretamente;
- dependências circulares falham.

Para testar uma regra, introduza temporariamente um import proibido e execute
`npm run lint:architecture`. Nunca faça allowlist sem registrar a justificativa na issue e no PR.

## Mutation testing e budgets

O primeiro alvo é `packages/contracts/src`, por concentrar validação e tipos usados por web e API.
O baseline de 16/08/2026 é **82,72%** (67 de 81 mutantes eliminados). O score é publicado pelo
job `mutation`, com relatório HTML como artifact. Budgets:

- verde: 85% ou mais;
- atenção: abaixo de 70%;
- CI falha: abaixo de 60%.

Amplie o alvo gradualmente para funções de domínio quando elas tiverem serviços isoláveis. Não rode
mutation testing sobre componentes visuais, migrations ou adapters de infraestrutura.

## Cobertura e integração

- `npm run test:coverage` executa contratos, API e web com V8 e produz LCOV separado em `coverage/`.
- A API possui uma suíte de integração opt-in com PostgreSQL real. Use `RUN_DB_INTEGRATION=true`, prepare as tabelas compatíveis com Supabase por `npm run test:db:prepare -w @juliana/api` e aplique as migrations antes dos testes.
- O CI publica os três relatórios no Codecov por OIDC, sem armazenar token de upload no repositório.
- Os thresholds do Vitest são pisos locais; o `codecov.yml` protege a tendência do projeto e exige 70% no patch com tolerância inicial controlada.
- Baseline inicial de 16/08/2026: contratos 100%; API 47,42% de statements e 50,73% de linhas sem a integração opt-in; web 17,91% de statements e 18,79% de linhas. Os pisos nunca devem ser reduzidos e sobem conforme cada fluxo entra no MVP.

## Playwright

- A matriz funcional cobre usuário anônimo, cliente, admin em `aal1` e admin em `aal2`.
- Os fluxos de autenticação do browser usam um Supabase isolado por interceptação de rede; autorização e isolamento de dados são novamente verificados na integração da API com JWT assinado e PostgreSQL real.
- Há apenas uma repetição no CI. Trace é coletado na primeira repetição; vídeo, screenshot e relatório são retidos por sete dias somente quando o job falha.
- Axe verifica landing page, login e dashboards, e a home em 375 px possui baseline visual versionado.

## Commits e execução local

O Husky executa commitlint em `commit-msg`. Use mensagens como `feat: adicionar convite de cliente`
ou `fix: impedir acesso a documento alheio`. A CI valida todos os commits do PR com checkout completo.

Antes de abrir PR:

```bash
npm run format:check
npm run lint
npm run knip
npm run typecheck
npm run test
npm run build
npm run test:mutation
npm run test:coverage
npm run test:e2e
```

Atualize baselines visuais somente após validar intencionalmente a mudança com
`npm run test:e2e -- --update-snapshots`.
