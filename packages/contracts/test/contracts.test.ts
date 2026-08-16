import { describe, expect, it } from 'vitest';
import {
  apiErrorSchema,
  consultationSchema,
  consultationStatusSchema,
  createConsultationSchema,
  documentMetadataSchema,
  documentSchema,
  forgotPasswordSchema,
  idParamsSchema,
  inviteUserSchema,
  loginSchema,
  paginationSchema,
  profileSchema,
  profileStatusSchema,
  resetPasswordSchema,
  signedDownloadSchema,
  updateConsultationSchema,
  updateProfileSchema,
  updateUserStatusSchema,
  userIdQuerySchema,
  userRoleSchema,
} from '../src/index.js';

const id = 'f9bf6625-cb1a-411d-b099-7dacb11a77ee';
const otherId = 'dd6d42e7-6e70-47f7-95e4-fd8b670eb2a0';

const expectRejected = (
  schema: { safeParse: (value: unknown) => { success: boolean } },
  value: unknown,
) => expect(schema.safeParse(value).success).toBe(false);

describe('shared contracts', () => {
  it('rejects weak passwords', () => {
    expect(loginSchema.safeParse({ email: 'cliente@example.com', password: '123' }).success).toBe(
      false,
    );
  });

  it('enforces every enum value', () => {
    expect(userRoleSchema.options).toEqual(['client', 'admin']);
    expect(profileStatusSchema.options).toEqual(['invited', 'active', 'disabled']);
    expect(consultationStatusSchema.options).toEqual(['scheduled', 'completed', 'cancelled']);
  });

  it('validates complete profiles and their name limits', () => {
    const profile = {
      id,
      email: 'cliente@example.com',
      fullName: 'Juliana Manduca',
      role: 'client',
      status: 'active',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-02',
    };
    expect(profileSchema.parse(profile)).toEqual(profile);
    expectRejected(profileSchema, { ...profile, fullName: 'J' });
    expectRejected(profileSchema, { ...profile, fullName: 'x'.repeat(121) });
    expect(updateProfileSchema.parse({ fullName: '  Ana  ' })).toEqual({ fullName: 'Ana' });
    expectRejected(updateProfileSchema, { fullName: ' A ' });
    expectRejected(updateProfileSchema, { fullName: 'x'.repeat(121) });
  });

  it('validates authentication and invitation fields', () => {
    expect(loginSchema.parse({ email: 'a@b.com', password: '12345678' }).email).toBe('a@b.com');
    expectRejected(loginSchema, { email: 'invalid', password: '12345678' });
    expectRejected(forgotPasswordSchema, { email: 'invalid' });
    expect(forgotPasswordSchema.parse({ email: 'a@b.com' })).toEqual({ email: 'a@b.com' });
    expect(
      resetPasswordSchema.parse({ password: '12345678', confirmPassword: '12345678' }),
    ).toBeTruthy();
    const resetFailure = resetPasswordSchema.safeParse({
      password: '12345678',
      confirmPassword: 'different',
    });
    expect(resetFailure.success).toBe(false);
    if (!resetFailure.success) {
      expect(resetFailure.error.issues[0]).toMatchObject({
        message: 'As senhas precisam ser iguais',
        path: ['confirmPassword'],
      });
    }
    expect(inviteUserSchema.parse({ email: 'a@b.com', fullName: '  Ana  ' }).fullName).toBe('Ana');
    expectRejected(inviteUserSchema, { email: 'invalid', fullName: 'A' });
    expectRejected(inviteUserSchema, { email: 'a@b.com', fullName: 'x'.repeat(121) });
    expect(updateUserStatusSchema.parse({ status: 'disabled' }).status).toBe('disabled');
  });

  it('accepts an ISO datetime with timezone', () => {
    const result = createConsultationSchema.safeParse({
      userId: id,
      title: 'Mapa natal',
      scheduledAt: '2026-09-10T14:30:00+01:00',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe('scheduled');
    expectRejected(createConsultationSchema, {
      userId: id,
      title: 'ab',
      scheduledAt: '2026-09-10T14:30:00',
    });
    expectRejected(createConsultationSchema, {
      userId: id,
      title: 'x'.repeat(161),
      scheduledAt: '2026-09-10T14:30:00+01:00',
    });
    expectRejected(createConsultationSchema, {
      userId: id,
      title: 'Mapa',
      scheduledAt: '2026-09-10T14:30:00+01:00',
      summary: 'x'.repeat(2_001),
    });
  });

  it('requires at least one consultation update field', () => {
    expect(updateConsultationSchema.safeParse({}).success).toBe(false);
    expect(updateConsultationSchema.parse({ title: '  Novo título  ' }).title).toBe('Novo título');
    expectRejected(updateConsultationSchema, { title: 'ab' });
    expectRejected(updateConsultationSchema, { title: 'x'.repeat(161) });
    expectRejected(updateConsultationSchema, { scheduledAt: '2026-01-01T10:00:00' });
    expectRejected(updateConsultationSchema, { summary: 'x'.repeat(2_001) });
  });

  it('validates consultation and document response shapes', () => {
    const consultation = {
      id,
      userId: otherId,
      title: 'Mapa natal',
      scheduledAt: '2026-01-01',
      status: 'completed',
      summary: null,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-02',
    };
    expect(consultationSchema.parse(consultation)).toEqual(consultation);
    expectRejected(consultationSchema, {});

    const document = {
      id,
      userId: otherId,
      consultationId: null,
      displayName: 'Mapa.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 0,
      createdAt: '2026-01-01',
    };
    expect(documentSchema.parse(document)).toEqual(document);
    expectRejected(documentSchema, { ...document, sizeBytes: -1 });
    expectRejected(documentSchema, { ...document, sizeBytes: 1.5 });
  });

  it('validates document metadata, identifiers and pagination boundaries', () => {
    expect(
      documentMetadataSchema.parse({ userId: id, displayName: '  Mapa.pdf  ' }).displayName,
    ).toBe('Mapa.pdf');
    expectRejected(documentMetadataSchema, { userId: id, displayName: '' });
    expectRejected(documentMetadataSchema, { userId: id, displayName: 'x'.repeat(181) });
    expect(idParamsSchema.parse({ id })).toEqual({ id });
    expect(userIdQuerySchema.parse({ userId: id })).toEqual({ userId: id });
    expectRejected(idParamsSchema, { id: 'invalid' });

    expect(paginationSchema.parse({})).toEqual({ limit: 25, offset: 0 });
    expect(paginationSchema.parse({ limit: '100', offset: '0' })).toMatchObject({
      limit: 100,
      offset: 0,
    });
    expectRejected(paginationSchema, { limit: 0 });
    expectRejected(paginationSchema, { limit: 101 });
    expectRejected(paginationSchema, { offset: -1 });
    expectRejected(paginationSchema, { search: 'x'.repeat(121) });
  });

  it('validates downloads and API error contracts', () => {
    expect(
      signedDownloadSchema.parse({ url: 'https://example.com/file', expiresIn: 60 }),
    ).toBeTruthy();
    expectRejected(signedDownloadSchema, { url: 'invalid', expiresIn: 0 });
    expect(apiErrorSchema.parse({ message: 'Falha', statusCode: 400 })).toEqual({
      message: 'Falha',
      statusCode: 400,
    });
    expectRejected(apiErrorSchema, { message: 'Falha', statusCode: 400.5 });
  });
});
