# HELENA Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** salvar mapas e publicar PDFs revisados no portal privado.
**Architecture:** contratos Zod, Drizzle/PostgreSQL, PDFKit na API, Storage privado e UI React.
**Spec:** [design](../specs/2026-10-17-helena-delivery-design.md).

## Global Constraints

- HELENA; admin AAL2; clientes recebem somente documentos publicados.
- Revisão otimista, PDF imutável e publicação transacional idempotente.
- Nenhuma posição natal aceita do navegador; sem PII/URLs assinadas em logs.
- Nome120/título160/análise20.000; listas25; link de revisão300 segundos.
- Nova migration aditiva; sem merge/deploy. Continuação inline autorizada pelo usuário.

## Review Focus

- Editar enquanto salva/gera PDF não pode exibir aprovação de revisão antiga.
- Duas publicações simultâneas criam um documento, e não dois.
- Desativar cliente impede nova publicação; cliente B não baixa PDF de A.
- Falha de Storage/commit não publica documento nem remove PDF válido.
- Texto longo, acentos e nomes extensos precisam caber em páginas legíveis.

## Task 1: Contratos, persistência e versões

**Files:** contracts `helena-drafts.ts`, `db/schema.ts`, migration e functions `helena-drafts.ts`.
**Interfaces:** create/get/list/updateHelenaDraft; UUID de criação, entradas natais e metadados;
retorno HelenaDraft/HelenaDraftSummary com revisão e relatório atual.

- [x] RED contratos (conteúdo, revisões, corpo natal falsificado), implementar schemas, GREEN.
- [x] Migration Drizzle aditiva com unicidade mapa/revisão e FK de documento set null.
- [x] Testes de integração: criação repetida, reabrir, atualizar, conflito e snapshot server-side.
- [x] Implementar funções e rotas finas sob requireAdmin; conferir testes na CI PostgreSQL.

## Task 2: PDF privado e publicação

**Files:** `lib/helena-pdf.ts`, `functions/helena-reports.ts`, testes PDF e integração.
**Interfaces:** renderHelenaPdf(draft): Promise<Buffer>; previewHelenaReport retorna reportId,
revision,url,expiresIn; publishHelenaReport retorna documentId/revision.

- [x] RED PDF válido, conteúdo e análise longa; implementar PDFKit/fonte e renderizar para QA.
- [x] Testes de upload falho/reutilização de PDF; implementar geração privada por revisão.
- [x] Testes de publicar sem PDF/revisão antiga/cliente inativo/repetido/concorrente; implementar
      bloqueios e documento/aprovação/auditoria na mesma transação; validar isolamento A/B.

## Task 3: Interface e integração

**Files:** services/helena.ts, HelenaPage/Form e componentes `HelenaDraftPanel`/`HelenaLibrary`.
**Interfaces:** lista/reabertura, editor de cliente/título/análise, salvar, revisar PDF e liberar.

- [x] RED reabertura, salvar, revisão explícita e invalidação após edição/troca.
- [x] Implementar serviços sem fetch nos componentes, busca de cliente e paginação.
- [x] E2E admin salva/reabre/gera/revisa/publica, cliente vê material, erro/retry e Axe375/1440.

## Task 4: Verificação e PR

- [x] Documentar operação, migração, semântica de aprovação e rollback sem apagar dados.
- [x] Format/lint/tipos/testes/build/Drizzle/PDF/E2E e revisão independente.
- [x] PR dependente do #50, ligado à #51, CI verde, sem merge/deploy.

## Resultado da verificação

CI do commit `cf05a61e749a195093c09d50f2db91113d99719a`: cinco jobs aprovados. Contratos: 44 testes; API: 34; web: 31; E2E: 25. O job do motor valida Python e a ponte HTTP real separadamente. Migration, RLS, isolamento de clientes, concorrência e repetição foram exercitados no PostgreSQL da CI.

Revisão independente corrigiu igualdade de objetos JSONB. PDF sintético curto (3 páginas) e longo (8 páginas) renderizados e inspecionados, incluindo rodapés e continuidade da análise. Testes locais da nova tela: 2 aprovados. Sem merge ou deploy. PR #52 depende do #50.
