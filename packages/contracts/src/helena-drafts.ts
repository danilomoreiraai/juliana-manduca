import { z } from 'zod';
import { helenaNatalInputSchema, helenaNatalResultSchema } from './helena.js';

const revision = z.number().int().positive();
const content = {
  clientId: z.uuid(),
  subjectName: z.string().trim().min(1).max(120),
  title: z.string().trim().min(3).max(160),
  analysis: z.string().trim().max(20000),
  natal: helenaNatalInputSchema,
};
export const helenaCreateDraftSchema = z.strictObject({ id: z.uuid(), ...content });
export const helenaUpdateDraftSchema = z.strictObject({ ...content, revision });
export const helenaRevisionSchema = z.strictObject({ revision });
export const helenaPublishSchema = z.strictObject({ revision, reportId: z.uuid() });
export const helenaReportSchema = z.strictObject({
  id: z.uuid(),
  revision,
  documentId: z.uuid().nullable(),
  publishedAt: z.string().nullable(),
});
export const helenaDraftSummarySchema = z.strictObject({
  id: z.uuid(),
  clientId: z.uuid(),
  subjectName: z.string(),
  title: z.string(),
  revision,
  createdAt: z.string(),
  updatedAt: z.string(),
  report: helenaReportSchema.nullable(),
});
export const helenaDraftSchema = helenaDraftSummarySchema.extend({
  analysis: z.string(),
  result: helenaNatalResultSchema,
});
export const helenaDraftListSchema = z.strictObject({
  items: z.array(helenaDraftSummarySchema),
  total: z.number().int().nonnegative(),
});
export const helenaPreviewSchema = z.strictObject({
  reportId: z.uuid(),
  revision,
  url: z.url(),
  expiresIn: z.literal(300),
});
export const helenaPublishedSchema = z.strictObject({ documentId: z.uuid(), revision });
export type HelenaCreateDraft = z.infer<typeof helenaCreateDraftSchema>;
export type HelenaUpdateDraft = z.infer<typeof helenaUpdateDraftSchema>;
export type HelenaDraft = z.infer<typeof helenaDraftSchema>;
export type HelenaDraftSummary = z.infer<typeof helenaDraftSummarySchema>;
export type HelenaPreview = z.infer<typeof helenaPreviewSchema>;
export type HelenaPublish = z.infer<typeof helenaPublishSchema>;
