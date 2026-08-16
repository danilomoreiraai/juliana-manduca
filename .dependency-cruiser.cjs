/* global module */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'apps-are-independent',
      severity: 'error',
      from: { path: '^apps/web/' },
      to: { path: '^apps/api/' },
    },
    {
      name: 'api-does-not-depend-on-web',
      severity: 'error',
      from: { path: '^apps/api/' },
      to: { path: '^apps/web/' },
    },
    {
      name: 'contracts-remain-app-agnostic',
      severity: 'error',
      from: { path: '^packages/contracts/' },
      to: { path: '^apps/' },
    },
    {
      name: 'api-routes-use-functions',
      comment:
        'Controllers devem permanecer finos e não acessar DB, Storage ou Supabase diretamente.',
      severity: 'error',
      from: { path: '^apps/api/src/routes/' },
      to: { path: '^apps/api/src/(db|lib/(storage|supabase))/' },
    },
    {
      name: 'domain-does-not-depend-on-controllers',
      severity: 'error',
      from: { path: '^apps/api/src/(functions|db|lib)/' },
      to: { path: '^apps/api/src/routes/' },
    },
    {
      name: 'web-components-do-not-access-infrastructure',
      comment: 'Componentes e páginas consomem services/context, nunca Supabase diretamente.',
      severity: 'error',
      from: { path: '^apps/web/src/(components|pages)/' },
      to: { path: '^apps/web/src/lib/supabase[.]ts$' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: '(^|/)(dist|coverage|node_modules|drizzle)/',
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },
  },
};
