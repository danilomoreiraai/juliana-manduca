# Observabilidade e resposta a incidentes

## Arquitetura do MVP

- **Sentry web e API:** erros, performance, métricas de falha e releases pelo SHA do Git.
- **OpenTelemetry na API:** traces e métricas RED exportados por OTLP/HTTP.
- **Pino no EasyPanel:** logs JSON com `requestId`, `traceId`, rota normalizada, status e duração.
- **Uptime Kuma:** disponibilidade externa da home e da prontidão da API.

OpenTelemetry é a camada neutra. O endpoint OTLP pode ser um Collector ou a entrada OTLP de
Datadog, New Relic ou outro backend, sem instalar agentes concorrentes dentro da API. O Sentry
continua sendo a integração específica do MVP para erros e experiência do frontend.

## Configuração

Defina o mesmo SHA em `RELEASE_SHA` e `VITE_RELEASE_SHA`. Em produção, comece com amostragem de
`0.1` (10%) e ajuste com base no volume:

```dotenv
SENTRY_DSN=https://...
SENTRY_TRACES_SAMPLE_RATE=0.1
RELEASE_SHA=<git-sha>
OTEL_SERVICE_NAME=juliana-manduca-api
OTEL_TRACES_SAMPLE_RATE=0.1
OTEL_EXPORTER_OTLP_ENDPOINT=https://collector.example.com
OTEL_EXPORTER_OTLP_HEADERS=authorization=Bearer%20...

VITE_SENTRY_DSN=https://...
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
VITE_RELEASE_SHA=<git-sha>
```

Sem DSN e sem endpoint OTLP, a instrumentação permanece desabilitada. Tokens do exportador são
segredos de runtime e nunca devem usar variáveis `VITE_*`.

## Dados e privacidade

- `sendDefaultPii` permanece desativado.
- Eventos removem usuário, corpo, cookies, query string, e-mail e tokens.
- Logs não registram corpos e redigem authorization, cookie, senha, token, segredo, e-mail e nome.
- Métricas usam apenas categoria, rota parametrizada, método e status; nunca IDs de clientes.
- Session Replay não é habilitado no MVP.

Antes de adicionar um atributo, verifique se ele continua útil agregado. Não envie nomes de
arquivos, conteúdo de consultas, e-mails, IDs de usuário ou URLs assinadas.

## Painéis, SLOs e alertas

SLO inicial mensal: **99,5%** de disponibilidade para a home e `/health/ready`; p95 da API menor
que **750 ms**, excluindo uploads. Retenção sugerida: 30 dias para erros/traces e 14 dias para logs.

Configure no backend de observabilidade:

| Alerta            | Condição inicial                                        | Ação                          |
| ----------------- | ------------------------------------------------------- | ----------------------------- |
| Indisponibilidade | 2 falhas consecutivas em 60 s                           | alta prioridade               |
| Erros 5xx         | taxa > 2% por 5 min ou 5 ocorrências                    | alta prioridade               |
| Login             | `app.failure{kind:authentication}` acima de 10 em 5 min | investigar abuso/configuração |
| Upload            | `app.failure{kind:upload}` acima de 5 em 10 min         | verificar Storage e limites   |
| Latência          | p95 > 750 ms por 10 min                                 | investigar DB/Supabase        |

O dashboard RED deve exibir taxa de requisições (`http.server.requests`), erros por status e duração
(`http.server.duration`) por rota. Crie dois monitores no Uptime Kuma:

1. `GET https://julianamanduca.com.br/`, esperado HTTP 200 a cada 60 s.
2. `GET https://api.julianamanduca.com.br/health/ready`, esperado HTTP 200 a cada 60 s.

## Smoke test e runbook

Após cada deploy:

```bash
curl -fsS https://api.julianamanduca.com.br/health/live
curl -fsS https://api.julianamanduca.com.br/health/ready
curl -fsSI https://julianamanduca.com.br/
```

Valide no painel que a release possui o SHA correto e que uma chamada da web para a API gera
trace distribuído. Em ambiente de teste, provoque uma rota inexistente e uma falha controlada sem
dados reais; confirme que o evento não contém corpo, query, cookies, token ou usuário.

Em incidente:

1. Confirme o impacto no Uptime Kuma e a release que iniciou a regressão.
2. Localize o erro por `request_id` no Sentry e no log JSON; use `trace_id` para o trace.
3. Verifique dependências no span: PostgreSQL, Supabase Storage e HTTP externo.
4. Faça rollback conforme `docs/DEPLOYMENT.md` se o SLO estiver em risco.
5. Registre causa, janela, usuários afetados e ação preventiva, sem copiar dados pessoais.

Referências técnicas: [OpenTelemetry JS](https://opentelemetry.io/docs/languages/js/),
[exportadores OTLP](https://opentelemetry.io/docs/languages/js/exporters/) e
[Sentry para Fastify ESM](https://docs.sentry.io/platforms/javascript/guides/fastify/install/esm__v8.x).
