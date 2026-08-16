import { metrics, trace } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { CompositePropagator, W3CTraceContextPropagator } from '@opentelemetry/core';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  BatchSpanProcessor,
  ParentBasedSampler,
  type SpanProcessor,
  TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-base';
import {
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import * as Sentry from '@sentry/node';
import { SentryPropagator, SentrySampler, SentrySpanProcessor } from '@sentry/opentelemetry';
import type { Env } from './env.js';
import { sanitizeSentryEvent } from './lib/sentry-sanitization.js';

type FailureKind = 'authentication' | 'server' | 'upload';

export type Observability = {
  shutdown: () => Promise<void>;
};

const meter = metrics.getMeter('juliana-manduca-api');
const requestCounter = meter.createCounter('http.server.requests', {
  description: 'Quantidade de respostas HTTP da API.',
});
const requestDuration = meter.createHistogram('http.server.duration', {
  description: 'Duração das respostas HTTP da API em milissegundos.',
  unit: 'ms',
});
const failureCounter = meter.createCounter('app.failures', {
  description: 'Falhas operacionais por categoria.',
});

const hasOtlpExporter = (env: Env) =>
  Boolean(env.OTEL_EXPORTER_OTLP_ENDPOINT || env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT);

const createSdk = (env: Env, sentryClient: ReturnType<typeof Sentry.init>) => {
  const spanProcessors: SpanProcessor[] = [];
  if (sentryClient) spanProcessors.push(new SentrySpanProcessor());
  if (hasOtlpExporter(env)) spanProcessors.push(new BatchSpanProcessor(new OTLPTraceExporter()));
  if (spanProcessors.length === 0) return null;

  const propagators = [new W3CTraceContextPropagator()];
  if (sentryClient) propagators.push(new SentryPropagator());

  return new NodeSDK({
    ...(sentryClient ? { contextManager: new Sentry.SentryContextManager() } : {}),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
    metricReaders: hasOtlpExporter(env)
      ? [new PeriodicExportingMetricReader({ exporter: new OTLPMetricExporter() })]
      : [],
    resource: resourceFromAttributes({
      [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: env.NODE_ENV,
      [ATTR_SERVICE_NAME]: env.OTEL_SERVICE_NAME,
      [ATTR_SERVICE_VERSION]: env.RELEASE_SHA ?? 'development',
    }),
    sampler: sentryClient
      ? new SentrySampler(sentryClient)
      : new ParentBasedSampler({
          root: new TraceIdRatioBasedSampler(env.OTEL_TRACES_SAMPLE_RATE),
        }),
    spanProcessors,
    textMapPropagator: new CompositePropagator({ propagators }),
  });
};

export const startObservability = (env: Env): Observability => {
  const sentryClient = env.SENTRY_DSN
    ? Sentry.init({
        beforeSend: sanitizeSentryEvent,
        dsn: env.SENTRY_DSN,
        environment: env.NODE_ENV,
        integrations: (defaults) => [
          ...defaults.filter((integration) => integration.name !== 'Http'),
          Sentry.httpIntegration({
            maxIncomingRequestBodySize: 'none',
            spans: false,
            tracePropagation: false,
          }),
        ],
        release: env.RELEASE_SHA,
        sendDefaultPii: false,
        skipOpenTelemetrySetup: true,
        tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
      })
    : undefined;

  const sdk = createSdk(env, sentryClient);
  sdk?.start();
  if (sentryClient) Sentry.validateOpenTelemetrySetup();

  return {
    shutdown: async () => {
      await Promise.all([sdk?.shutdown(), sentryClient ? Sentry.close(2_000) : undefined]);
    },
  };
};

export const activeTraceId = () => trace.getActiveSpan()?.spanContext().traceId;

export const recordHttpResponse = (input: {
  durationMs: number;
  method: string;
  route: string;
  statusCode: number;
}) => {
  const attributes = {
    'http.request.method': input.method,
    'http.response.status_code': input.statusCode,
    'http.route': input.route,
  };
  requestCounter.add(1, attributes);
  requestDuration.record(input.durationMs, attributes);
};

export const recordFailure = (kind: FailureKind, statusCode: number) => {
  const attributes = { kind, status_code: statusCode };
  failureCounter.add(1, attributes);
  Sentry.metrics.count('app.failure', 1, { attributes });
};

export const captureServerError = (error: unknown, requestId: string) => {
  const traceId = activeTraceId();
  Sentry.captureException(error, {
    tags: {
      request_id: requestId,
      ...(traceId ? { trace_id: traceId } : {}),
    },
  });
};

export const safeErrorForLog = (error: Error) => ({
  stack: error.stack?.split('\n').slice(1).join('\n'),
  type: error.name,
});
