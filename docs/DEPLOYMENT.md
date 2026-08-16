# Deploy seguro no EasyPanel

## 1. Preparação

1. Crie um **Compose Service** a partir deste repositório.
2. Configure todos os valores de `.env.example` no painel, sem criar `.env` no Git.
3. Use `api.julianamanduca.com.br` para `api:3333` e o domínio principal para `web:80`.
4. Mantenha o serviço atual associado ao domínio até o novo Compose passar nos smoke tests.

O frontend é servido por Nginx com fallback para SPA. API e web escutam em `0.0.0.0`; isso evita o problema de processos acessíveis apenas dentro do container.

## 2. Banco e primeiro admin

No console do serviço API:

```bash
npm run db:migrate -w @juliana/api
npm run bootstrap:admin -w @juliana/api
```

Valide no Supabase:

- schema `app` sem exposição na Data API;
- bucket `consultation-files` privado, limite de 50 MB e tipos permitidos;
- cadastro público desabilitado;
- URLs de redirect corretas;
- usuário admin presente em Auth e `app.profiles`.

## 3. Smoke tests antes do domínio

Use as URLs internas geradas pelo EasyPanel:

```bash
curl -fsS https://URL-INTERNA-API/health/live
curl -fsS https://URL-INTERNA-API/health/ready
curl -fsSI https://URL-INTERNA-WEB/
```

Depois valide manualmente:

- página inicial em 375 px e 1440 px;
- login, recuperação de senha e logout;
- cadastro MFA do admin;
- convite de cliente;
- criação de consulta;
- upload, download assinado e exclusão de arquivo;
- cliente A não consegue acessar recursos do cliente B.

## 4. Observabilidade

- Preencha `SENTRY_DSN`, `VITE_SENTRY_DSN` e o SHA do commit em `RELEASE_SHA`; o Compose o
  reutiliza no build web como `VITE_RELEASE_SHA`.
- Configure um destino OTLP em `OTEL_EXPORTER_OTLP_ENDPOINT` quando quiser traces e métricas no
  Collector, Datadog, New Relic ou outro backend compatível.
- Ative o profile `monitoring` do Compose para Uptime Kuma ou use uma instância externa.
- Monitore `https://julianamanduca.com.br/` e `https://api.julianamanduca.com.br/health/ready` a cada 60 segundos.
- Configure alerta por e-mail ou Telegram após duas falhas consecutivas.
- Os logs da API são JSON, possuem request ID e removem authorization, cookies, senhas e tokens.
- Siga os SLOs, alertas, política de dados e runbook em `docs/OBSERVABILITY.md`.

## 5. Troca e rollback

1. Salve screenshots das configurações atuais de domínio no EasyPanel e Cloudflare.
2. Conecte primeiro `api.julianamanduca.com.br` e valide `/health/ready`.
3. Mova `julianamanduca.com.br` para o serviço web somente depois do teste da API.
4. Execute novamente os smoke tests pelo domínio público.
5. Mantenha o serviço anterior intacto por pelo menos 24 horas.

Rollback: remova o domínio do novo web, reatribua ao serviço anterior e valide HTTP 200. As tabelas novas não interferem no projeto antigo porque usam outro projeto Supabase.
