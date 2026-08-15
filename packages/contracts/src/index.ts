import { z } from 'zod';

export const userRoleSchema = z.enum(['client', 'admin']);
export const profileStatusSchema = z.enum(['invited', 'active', 'disabled']);
export const consultationStatusSchema = z.enum(['scheduled', 'completed', 'cancelled']);

export const profileSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  fullName: z.string().min(2).max(120),
  role: userRoleSchema,
  status: profileStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2, 'Informe seu nome').max(120),
});

export const loginSchema = z.object({
  email: z.email('Informe um e-mail válido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
});

export const forgotPasswordSchema = z.object({
  email: z.email('Informe um e-mail válido'),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'As senhas precisam ser iguais',
    path: ['confirmPassword'],
  });

export const inviteUserSchema = z.object({
  email: z.email('Informe um e-mail válido'),
  fullName: z.string().trim().min(2).max(120),
});

export const updateUserStatusSchema = z.object({
  status: profileStatusSchema,
});

export const consultationSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  clientName: z.string().optional(),
  title: z.string(),
  scheduledAt: z.string(),
  status: consultationStatusSchema,
  summary: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createConsultationSchema = z.object({
  userId: z.uuid(),
  title: z.string().trim().min(3).max(160),
  scheduledAt: z.iso.datetime({ offset: true }),
  status: consultationStatusSchema.default('scheduled'),
  summary: z.string().trim().max(2_000).nullable().optional(),
});

export const updateConsultationSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    scheduledAt: z.iso.datetime({ offset: true }),
    status: consultationStatusSchema,
    summary: z.string().trim().max(2_000).nullable(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Informe ao menos um campo');

export const documentSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  consultationId: z.uuid().nullable(),
  displayName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  createdAt: z.string(),
});

export const documentMetadataSchema = z.object({
  userId: z.uuid(),
  consultationId: z.uuid().optional(),
  displayName: z.string().trim().min(1).max(180),
});

export const idParamsSchema = z.object({ id: z.uuid() });
export const userIdQuerySchema = z.object({ userId: z.uuid() });
export const paginationSchema = z.object({
  search: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export const signedDownloadSchema = z.object({
  url: z.url(),
  expiresIn: z.number().int().positive(),
});

export const apiErrorSchema = z.object({
  message: z.string(),
  statusCode: z.number().int(),
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type ProfileStatus = z.infer<typeof profileStatusSchema>;
export type ConsultationStatus = z.infer<typeof consultationStatusSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type Consultation = z.infer<typeof consultationSchema>;
export type CreateConsultationInput = z.infer<typeof createConsultationSchema>;
export type UpdateConsultationInput = z.infer<typeof updateConsultationSchema>;
export type Document = z.infer<typeof documentSchema>;
export type DocumentMetadataInput = z.infer<typeof documentMetadataSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
