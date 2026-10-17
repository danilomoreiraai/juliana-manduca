import {
  type HelenaCreateDraft,
  type HelenaPublish,
  type HelenaUpdateDraft,
  helenaDraftListSchema,
  helenaDraftSchema,
  helenaPreviewSchema,
  helenaPublishedSchema,
} from '@juliana/contracts';
import { apiRequest } from './api';
import { getAdminUsers } from './portal';

export const searchHelenaClients = getAdminUsers;
export const listHelenaDrafts = async (offset: number) =>
  helenaDraftListSchema.parse(await apiRequest(`/admin/helena/charts?offset=${offset}`));
export const getHelenaDraft = async (id: string) =>
  helenaDraftSchema.parse(await apiRequest(`/admin/helena/charts/${id}`));
export const createHelenaDraft = async (input: HelenaCreateDraft) =>
  helenaDraftSchema.parse(
    await apiRequest('/admin/helena/charts', { method: 'POST', body: JSON.stringify(input) }),
  );
export const updateHelenaDraft = async (id: string, input: HelenaUpdateDraft) =>
  helenaDraftSchema.parse(
    await apiRequest(`/admin/helena/charts/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  );
export const previewHelenaReport = async (id: string, revision: number) =>
  helenaPreviewSchema.parse(
    await apiRequest(`/admin/helena/charts/${id}/preview`, {
      method: 'POST',
      body: JSON.stringify({ revision }),
    }),
  );
export const publishHelenaReport = async (id: string, input: HelenaPublish) =>
  helenaPublishedSchema.parse(
    await apiRequest(`/admin/helena/charts/${id}/publish`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  );
