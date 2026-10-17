# HELENA Natal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** entregar cálculo natal real e telas administrativas HELENA no portal existente.

**Architecture:** contratos Zod compartilhados, Fastify como única API pública e serviço Python
interno autenticado para Swiss Ephemeris. UI React com formulário, mandala e tabelas; esta unidade
é transitória, sem gravação de mapas nem entrega automática de conteúdo.

**Tech Stack:** React 19, Vite, Fastify, Zod, Python 3.12 e pysweph 2.10.3.6.

**Spec:** [HELENA](../../HELENA.md).

## Global Constraints

- Nome do produto: HELENA. Admin com `aal2`; clientes sem acesso às ferramentas.
- Preservar API Fastify, Supabase Auth, contratos Zod e limites de arquitetura do AGENTS.md.
- Datas gregorianas de 1600 a 2399 e deslocamento UTC manual explícito.
- Casas P/K/E/W; tropical/Lahiri/Fagan-Bradley; dez planetas e cinco aspectos maiores.
- Efeméride Moshier explicitamente solicitada e identificada, sem fallback silencioso.
- Segredo somente no servidor; nenhum dado de nascimento em logs/telemetria.
- Execução inline autorizada pelo usuário: “pode iniciar”. Não fazer merge ou deploy.

## Review Focus

- Fuso fracionário cruzando meia-noite deve alterar corretamente o dia Juliano UT.
- Latitude polar deve gerar erro de domificação, sem casas de outro método.
- Troca de zodíaco entre pedidos não pode contaminar o próximo cálculo tropical.
- Edição durante uma requisição não pode apresentar resultado da entrada anterior como atual.
- Erros/timeouts do motor não podem expor segredo ou conteúdo de uma resposta externa.

## Task 1: Contratos e fundação numérica

**Files:** `packages/contracts/src/helena.ts`, índice atual, `packages/contracts/test/helena.test.ts`,
`services/astrology/helena_engine.py`, `services/astrology/tests/test_engine.py`, requirements.

**Interfaces:** `helenaNatalInputSchema`, `helenaNatalResultSchema`, tipos `HelenaNatalInput` e
`HelenaNatalResult`; Python `calculate_natal(input: dict) -> dict`.

- [x] Escrever e executar testes RED de contrato: datas impossíveis, fuso, coordenadas e opções.
- [x] Implementar schemas com limites explícitos e saída finita com dez corpos/doze casas.
- [x] Escrever/rodar testes RED de cálculo: J2000, fuso, casas, estados e erros polares.
- [x] Implementar cálculo e aspectos; testar resultados contra referências identificadas.
- [x] Executar suites de contratos e Python; registrar método numérico e limitações.

## Task 2: Fronteiras de serviço e API administrativa

**Files:** `services/astrology/server.py`, testes do servidor, Dockerfile;
`apps/api/src/functions/helena.ts`, `routes/helena.ts`, env/app e testes.

**Interfaces:** `POST /natal` interno com Bearer de serviço; `POST /admin/helena/natal` público
autorizado; função `calculateHelenaNatal(services, input)` retorna `HelenaNatalResult`.

- [x] RED: segredo incorreto, payload excessivo/inválido e falha do cálculo no servidor interno.
- [x] Implementar servidor serial, limite de corpo, timeout de socket e erros sanitizados.
- [x] RED: URL/segredo ausentes, timeout, resposta inválida e acesso anônimo/cliente/AAL1.
- [x] Implementar adaptador HTTP com timeout, sem redirects, validação da saída e `requireAdmin`.
- [x] Cobrir autenticação real na suíte de integração e um cálculo real API → motor local.

## Task 3: Telas administrativas

**Files:** `apps/web/src/pages/HelenaPage.tsx`, `components/helena/`,
`services/helena.ts`, `App.tsx`, `DashboardShell.tsx`, testes e E2E HELENA.

**Interfaces:** `calculateNatal(input, signal)` via `apiRequest`, componentes de formulário,
`HelenaChart` e `HelenaResults` consomem os contratos da Task 1.

- [x] RED: entrada administrativa HELENA, cálculo e tabela, erro/retry e limpeza após edição.
- [x] Implementar formulário RHF/Zod, serviço, renderização SVG acessível e exportação JSON.
- [x] Tratar recálculo/edição concorrentes e impedir apresentação/exportação de dados obsoletos.
- [x] E2E: guards, admin AAL2, sucesso/erro e acessibilidade nos dois tamanhos de viewport.
- [x] Validar visualmente em 375 px e 1440 px com fixtures sintéticas.

## Task 4: Operação, integração e revisão

**Files:** Compose/env examples, CI do motor, README, `docs/HELENA.md`.

- [x] Documentar segredo/URL somente no servidor e serviço interno opcional, sem porta pública.
- [x] Registrar configuração, limites numéricos, instalação, rollback e pendências de paridade.
- [ ] Executar formatação, lint, arquitetura, tipos, testes, build, Python e E2E relevantes.
- [x] Revisão independente do diff completo; corrigir achados importantes com teste de regressão.
- [ ] Abrir PR ligado à #49 com validação real e limites; manter sem merge/deploy.
