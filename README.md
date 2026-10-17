# Juliana Manduca

MVP institucional e portal privado para clientes de Juliana Manduca. Esta é uma base nova: os projetos anteriores foram usados apenas como referência de produto e conteúdo.

## O que está incluído

- página institucional responsiva com identidade cósmica refinada;
- autenticação Supabase apenas por convite, recuperação de senha e MFA TOTP para admin;
- dashboard do cliente com consultas, materiais privados e perfil;
- dashboard administrativo para clientes, consultas e arquivos;
- HELENA: ferramenta administrativa de mapa natal, mandala, posições, casas, aspectos e exportação JSON ([operação e limites](docs/HELENA.md));
- API Fastify com validação Zod, Drizzle ORM, auditoria e autorização server-side;
- Supabase PostgreSQL em schema privado e Storage com bucket privado;
- Vitest, Testing Library, Playwright, GitHub Actions, Sentry, logs JSON e Uptime Kuma;
- Docker Compose preparado para EasyPanel.

Não fazem parte deste MVP: Desenho Humano nativo, pagamentos, agenda automática, cursos, blog, CMS, cadastro público, i18n e migração do banco antigo.

## Estrutura

```text
apps/web             React 19 + Vite + TailwindCSS v4
apps/api             Fastify + Drizzle + PostgreSQL
packages/contracts   schemas Zod e tipos compartilhados
services/astrology   motor natal HELENA (Python, serviço interno opcional)
docs                  implantação e operação
```

## Fluxo de contribuição e deploy

Todo trabalho material segue **issue → branch `codex/*` → PR → CI/revisão → merge → deploy**. Push direto na `main` não é permitido. A descrição do PR deve vincular a issue com `Closes #N` ou `Refs #N` e registrar validação, observabilidade, deploy e rollback.

Agentes e automações devem ler [AGENTS.md](AGENTS.md) antes de alterar o projeto. Os templates em `.github/` formalizam esse padrão para issues e PRs.

## Desenvolvimento

Requisitos: Node.js 20.19+ e npm 11+.

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
npm install
npm run db:migrate
npm run dev
```

O frontend fica em `http://localhost:5173` e a API em `http://localhost:3333`.

### Demonstração local dos portais

Para validar as telas sem conectar Supabase ou API, crie `apps/web/.env.local` com:

```env
VITE_DEMO_MODE=true
VITE_DEMO_ADMIN_EMAIL=admin.local@example.com
VITE_DEMO_CLIENT_EMAIL=cliente.local@example.com
VITE_DEMO_PASSWORD=uma-senha-temporaria
VITE_DEMO_MFA_CODE=123456
```

Execute `npm run dev -w @juliana/web`. O login mostra os dois acessos configurados. O modo
demo fornece dados fictícios e mantém alterações apenas em memória; nenhuma chamada é feita ao
Supabase ou à API. Ele depende simultaneamente de `import.meta.env.DEV` e
`VITE_DEMO_MODE=true`, portanto não pode ser ativado pelo bundle de produção. O `.env.local` é
ignorado pelo Git e deve ser removido quando a validação terminar.

## Supabase

Crie um projeto novo na região mais próxima do servidor. Em Auth:

1. desabilite novos cadastros públicos;
2. configure `https://julianamanduca.com.br` como Site URL;
3. adicione `https://julianamanduca.com.br/auth/callback` e `http://localhost:5173/**` aos redirects;
4. use chaves assimétricas para permitir validação local via JWKS;
5. aplique `npm run db:migrate` com a connection string direta ou pooler de sessão.

A migration cria o schema privado `app`, revoga acesso de `anon` e `authenticated`, cria índices, referências para `auth.users` e o bucket privado `consultation-files`. A chave secreta fica somente na API.

Para criar o primeiro administrador:

```bash
INITIAL_ADMIN_EMAIL=admin@example.com \
INITIAL_ADMIN_PASSWORD='uma-senha-temporaria-forte' \
INITIAL_ADMIN_NAME='Nome do admin' \
npm run bootstrap:admin -w @juliana/api
```

Após o primeiro login, o admin precisa cadastrar um autenticador TOTP para alcançar `aal2`.

### Usuários de validação

Crie ou atualize os acessos controlados de administrador e cliente sem habilitar cadastro
público. As senhas devem ter ao menos 12 caracteres, ficam somente no ambiente e nunca são
impressas pelo script:

```bash
TEST_ADMIN_PASSWORD='senha-temporaria-forte' \
TEST_CLIENT_PASSWORD='outra-senha-temporaria-forte' \
npm run bootstrap:test-users -w @juliana/api
```

Por padrão, são usados `admin.validacao@julianamanduca.com.br` e
`cliente.validacao@julianamanduca.com.br`. Use `TEST_ADMIN_EMAIL`, `TEST_ADMIN_NAME`,
`TEST_CLIENT_EMAIL` e `TEST_CLIENT_NAME` para substituí-los. A execução é idempotente: usuários
existentes têm senha, confirmação e perfil sincronizados. Depois da validação, rotacione as
senhas ou remova os usuários pelo Supabase Auth e os respectivos perfis. O admin permanece em
`aal1` até cadastrar e validar o TOTP na tela de MFA.

## Qualidade

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
DATABASE_URL=postgresql://... npm run db:check -w @juliana/api
```

## Configuração obrigatória para produção

- `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SECRET_KEY`;
- `VITE_WHATSAPP_NUMBER` no formato internacional, somente dígitos;
- e-mail e senha temporária do primeiro admin;
- DSNs de frontend/backend do Sentry;
- URLs públicas `https://julianamanduca.com.br` e `https://api.julianamanduca.com.br`.

Consulte [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) antes de conectar o domínio principal.
