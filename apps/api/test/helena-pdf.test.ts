import { describe, expect, it } from 'vitest';
import fixture from '../../../packages/contracts/test/fixtures/helena-j2000.json' with { type: 'json' };
import { renderHelenaPdf } from '../src/lib/helena-pdf.js';

const draft = {
  id: '90000000-0000-4000-8000-000000000001',
  clientId: '10000000-0000-4000-8000-000000000001',
  subjectName: 'João · mapa sintético',
  title: 'Mapa natal e análise',
  analysis: 'Ação, revisão e consciência.',
  revision: 1,
  result: fixture,
  report: null,
  createdAt: '2026-01-01T12:00:00.000Z',
  updatedAt: '2026-01-01T12:00:00.000Z',
};

describe('HELENA PDF', () => {
  it('creates a genuine PDF with embedded font and numerical tables', async () => {
    const pdf = await renderHelenaPdf(draft as never);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    const raw = pdf.toString('latin1');
    expect(raw).toContain('%%EOF');
    expect(raw).toContain('/FontFile');
    expect((raw.match(/\/Type \/Page\b/g) ?? []).length).toBe(3);
  });
  it('paginates long prose and names without truncation', async () => {
    const pdf = await renderHelenaPdf({
      ...draft,
      subjectName: 'Nome sintético '.repeat(8),
      analysis: 'Interpretação e revisão do céu. '.repeat(600),
    } as never);
    const raw = pdf.toString('latin1');
    expect((raw.match(/\/Type \/Page\b/g) ?? []).length).toBeGreaterThan(4);
    expect(pdf.byteLength).toBeLessThan(3_000_000);
  });
});
