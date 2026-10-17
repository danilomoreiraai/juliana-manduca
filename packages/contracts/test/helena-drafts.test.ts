import { describe, expect, it } from 'vitest';
import {
  helenaCreateDraftSchema,
  helenaUpdateDraftSchema,
  helenaPublishSchema,
} from '../src/index.js';
import fixture from './fixtures/helena-j2000.json';

const draft = {
  id: '90000000-0000-4000-8000-000000000001',
  clientId: '10000000-0000-4000-8000-000000000001',
  subjectName: 'Mapa sintético',
  title: 'Mapa natal',
  analysis: 'Análise escrita pelo admin.',
  natal: fixture.input,
};

describe('HELENA saved draft contracts', () => {
  it('accepts a creation operation ID and the inputs, never trusted planetary positions', () => {
    expect(helenaCreateDraftSchema.parse(draft)).toEqual(draft);
    expect(helenaCreateDraftSchema.safeParse({ ...draft, result: fixture }).success).toBe(false);
  });
  it.each([
    { subjectName: ' ' },
    { title: 'ab' },
    { analysis: 'a'.repeat(20001) },
    { clientId: 'bad' },
    { natal: { ...fixture.input, latitude: 90 } },
  ])('rejects invalid draft metadata %#', (patch) => {
    expect(helenaCreateDraftSchema.safeParse({ ...draft, ...patch }).success).toBe(false);
  });
  it('requires a positive integral revision for edits and reviewed report publication', () => {
    const content = {
      clientId: draft.clientId,
      subjectName: draft.subjectName,
      title: draft.title,
      analysis: draft.analysis,
      natal: draft.natal,
    };
    expect(helenaUpdateDraftSchema.safeParse({ ...content, revision: 1 }).success).toBe(true);
    for (const revision of [0, -1, 1.5, undefined]) {
      expect(helenaUpdateDraftSchema.safeParse({ ...content, revision }).success).toBe(false);
      expect(helenaPublishSchema.safeParse({ revision, reportId: draft.id }).success).toBe(false);
    }
    expect(helenaPublishSchema.safeParse({ revision: 1, reportId: draft.id }).success).toBe(true);
  });
});
