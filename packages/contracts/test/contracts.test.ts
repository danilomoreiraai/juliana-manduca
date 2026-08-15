import { describe, expect, it } from 'vitest';
import { createConsultationSchema, loginSchema, updateConsultationSchema } from '../src/index.js';

describe('shared contracts', () => {
  it('rejects weak passwords', () => {
    expect(loginSchema.safeParse({ email: 'cliente@example.com', password: '123' }).success).toBe(
      false,
    );
  });

  it('accepts an ISO datetime with timezone', () => {
    const result = createConsultationSchema.safeParse({
      userId: 'f9bf6625-cb1a-411d-b099-7dacb11a77ee',
      title: 'Mapa natal',
      scheduledAt: '2026-09-10T14:30:00+01:00',
    });
    expect(result.success).toBe(true);
  });

  it('requires at least one consultation update field', () => {
    expect(updateConsultationSchema.safeParse({}).success).toBe(false);
  });
});
