# Instruções permanentes para agentes

Estas regras valem para qualquer agente, modelo ou automação que trabalhe neste repositório.

## Fonte de verdade

1. A issue aprovada define o problema e os critérios de aceite.
2. Este arquivo define o processo e os limites técnicos permanentes.
3. O código, as migrations e os contratos versionados definem o comportamento atual.
4. Em caso de conflito ou ambiguidade material, pare e peça decisão na issue ou no PR.

## Fluxo obrigatório: issue → branch → PR → deploy

- Não faça mudanças materiais sem uma issue no repositório.
- Cada branch deve partir da `main` atualizada e usar `codex/<descricao-curta>`.
- Nunca faça push direto na `main`.
- Mantenha cada PR pequeno, reversível e focado em uma responsabilidade.
- A descrição do PR deve conter `Closes #N` quando concluir a issue ou `Refs #N` quando entregar apenas parte dela.
- Todo PR deve explicar: problema, solução, impacto, validações, observabilidade, riscos, plano de deploy e rollback.
- Não misture refatorações ou atualizações não relacionadas sem issue e justificativa.
- O merge exige CI verde e revisão do diff. O deploy só pode usar um commit já integrado à `main`.
- Mudanças de banco devem ser backward-compatible durante a implantação e possuir migration versionada.
- Mantenha o serviço atual intacto até smoke tests do novo release. Registre o rollback antes do cutover.

## Padrões técnicos

- TypeScript estrito; prefira exports nomeados, funções pequenas e baixa complexidade.
- Frontend: React 19, Vite, TailwindCSS v4, React Router v7, TanStack Query v5, React Hook Form e Zod.
- Componentes não chamam `fetch` diretamente; integrações ficam em `src/services`.
- API: Fastify, Drizzle, PostgreSQL e Zod. Controllers devem ser finos e delegar regras a `src/functions`.
- Dados de negócio passam pela API. O frontend usa Supabase diretamente somente para autenticação.
- Nunca autorize pelo `user_metadata`; consulte o papel no schema privado `app`.
- Erros HTTP seguem `{ message: string, statusCode: number }`.
- Nunca versione `.env`, tokens, credenciais, dados pessoais ou exports de produção.

## Design, movimento e acessibilidade

- Movimento deve comunicar hierarquia, continuidade, causa ou progresso; não anime apenas para decorar.
- Evite stagger excessivo, hover-scale indiscriminado, blur em todas as entradas, springs em ações utilitárias e loops permanentes.
- Use transform e opacity quando possível, preserve 60 fps e evite layout shift.
- Toda animação deve respeitar `prefers-reduced-motion` e manter foco, teclado e leitores de tela funcionais.
- Todo fluxo assíncrono precisa de estados adequados de loading, erro, vazio, sucesso e retry. Skeletons devem refletir a geometria final.
- Valide visualmente em 375 px e 1440 px.

## Privacidade, observabilidade e comunicação

- Observabilidade não pode capturar senhas, tokens, cookies, corpos sensíveis, consultas ou documentos de clientes.
- Analytics e marketing permanecem desativados até consentimento aplicável e IDs reais configurados por ambiente.
- Textos de privacidade, cookies e marketing exigem revisão jurídica antes da produção.
- E-mail transacional e marketing são finalidades separadas. Marketing exige origem/base legal registrável e descadastro gratuito e fácil.

## Validação mínima antes do PR

Execute, conforme o escopo:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
DATABASE_URL=postgresql://... npm run db:check -w @juliana/api
```

Registre no PR o que foi executado e qualquer check impossível de executar, com motivo e risco residual.
