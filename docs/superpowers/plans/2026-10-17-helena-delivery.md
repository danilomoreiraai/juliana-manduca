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

- [ ] RED contratos (conteúdo, revisões, corpo natal falsificado), implementar schemas, GREEN.
- [ ] Migration Drizzle aditiva com unicidade mapa/revisão e FK de documento set null.
- [ ] RED integração: criação repetida, reabrir, atualizar, conflito e snapshot server-side.
- [ ] Implementar funções e rotas finas sob requireAdmin; conferir testes na CI PostgreSQL.

## Task 2: PDF privado e publicação

**Files:** `lib/helena-pdf.ts`, `functions/helena-reports.ts`, testes PDF e integração.
**Interfaces:** renderHelenaPdf(draft): Promise<Buffer>; previewHelenaReport retorna reportId,
revision,url,expiresIn; publishHelenaReport retorna documentId/revision.

- [ ] RED PDF válido, conteúdo e análise longa; implementar PDFKit/fonte e renderizar para QA.
- [ ] RED upload falho/reutilização de PDF; implementar geração privada por revisão.
- [ ] RED publicar sem PDF/revisão antiga/cliente inativo/repetido/concorrente; implementar
      bloqueios e documento/aprovação/auditoria na mesma transação; validar isolamento A/B.

## Task 3: Interface e integração

**Files:** services/helena.ts, HelenaPage/Form e componentes `HelenaDraftPanel`/`HelenaLibrary`.
**Interfaces:** lista/reabertura, editor de cliente/título/análise, salvar, revisar PDF e liberar.

- [ ] RED reabertura, salvar, revisão explícita e invalidação após edição/troca.
- [ ] Implementar serviços sem fetch nos componentes, busca de cliente e paginação.
- [ ] E2E admin salva/reabre/gera/revisa/publica, cliente vê material, erro/retry e Axe375/1440.

## Task 4: Verificação e PR

- [ ] Documentar operação, migração, semântica de aprovação e rollback sem apagar dados.
- [ ] Format/lint/tipos/testes/build/Drizzle/PDF/E2E e revisão independente.
- [ ] PR dependente do #50, ligado à #51, CI verde, sem merge/deploy.
