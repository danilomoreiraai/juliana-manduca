import type {
  Consultation,
  CreateConsultationInput,
  Document,
  InviteUserInput,
  Profile,
  UpdateConsultationInput,
  UpdateProfileInput,
  UpdateUserStatusInput,
} from '@juliana/contracts';
import { config } from '../config';
import { apiRequest } from './api';
import {
  createDemoConsultation,
  deleteDemoConsultation,
  deleteDemoDocument,
  getDemoConsultations,
  getDemoDocuments,
  getDemoProfile,
  getDemoUsers,
  inviteDemoUser,
  setDemoUserStatus,
  updateDemoConsultation,
  updateDemoProfile,
  uploadDemoDocument,
} from './demo';

export const getProfile = () =>
  config.demoMode ? Promise.resolve(getDemoProfile()) : apiRequest<Profile>('/me');
export const updateProfile = (input: UpdateProfileInput) =>
  config.demoMode
    ? Promise.resolve(updateDemoProfile(input))
    : apiRequest<Profile>('/me', { method: 'PATCH', body: JSON.stringify(input) });
export const getConsultations = () =>
  config.demoMode
    ? Promise.resolve(getDemoConsultations())
    : apiRequest<Consultation[]>('/consultations');
export const getDocuments = () =>
  config.demoMode ? Promise.resolve(getDemoDocuments()) : apiRequest<Document[]>('/documents');
export const requestDocumentDownload = (id: string) =>
  config.demoMode
    ? Promise.resolve({ url: '/assets/celestial-atlas.webp', expiresIn: 300 })
    : apiRequest<{ url: string; expiresIn: number }>(`/documents/${id}/download`, {
        method: 'POST',
      });

export const getAdminUsers = (search = '') =>
  config.demoMode
    ? Promise.resolve(getDemoUsers(search))
    : apiRequest<{ items: Profile[]; total: number }>(
        `/admin/users?search=${encodeURIComponent(search)}`,
      );
export const inviteAdminUser = (input: InviteUserInput) =>
  config.demoMode
    ? Promise.resolve(inviteDemoUser(input))
    : apiRequest<Profile>('/admin/users/invite', {
        method: 'POST',
        body: JSON.stringify(input),
      });
export const setAdminUserStatus = (id: string, input: UpdateUserStatusInput) =>
  config.demoMode
    ? Promise.resolve(setDemoUserStatus(id, input))
    : apiRequest<Profile>(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
export const getAdminConsultations = () =>
  config.demoMode
    ? Promise.resolve(getDemoConsultations())
    : apiRequest<Consultation[]>('/admin/consultations');
export const createAdminConsultation = (input: CreateConsultationInput) =>
  config.demoMode
    ? Promise.resolve(createDemoConsultation(input))
    : apiRequest<Consultation>('/admin/consultations', {
        method: 'POST',
        body: JSON.stringify(input),
      });
export const updateAdminConsultation = (id: string, input: UpdateConsultationInput) =>
  config.demoMode
    ? Promise.resolve(updateDemoConsultation(id, input))
    : apiRequest<Consultation>(`/admin/consultations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
export const deleteAdminConsultation = (id: string) =>
  config.demoMode
    ? Promise.resolve(deleteDemoConsultation(id))
    : apiRequest<void>(`/admin/consultations/${id}`, { method: 'DELETE' });
export const getAdminDocuments = (userId: string) =>
  config.demoMode
    ? Promise.resolve(getDemoDocuments(userId))
    : apiRequest<Document[]>(`/admin/documents?userId=${encodeURIComponent(userId)}`);
export const uploadAdminDocument = async (input: {
  userId: string;
  consultationId?: string;
  displayName: string;
  file: File;
}) => {
  if (config.demoMode) return uploadDemoDocument(input);
  const query = new URLSearchParams({ userId: input.userId, displayName: input.displayName });
  if (input.consultationId) query.set('consultationId', input.consultationId);
  const body = new FormData();
  body.set('file', input.file);
  return apiRequest<Document>(`/admin/documents?${query.toString()}`, { method: 'POST', body });
};
export const deleteAdminDocument = (id: string) =>
  config.demoMode
    ? Promise.resolve(deleteDemoDocument(id))
    : apiRequest<void>(`/admin/documents/${id}`, { method: 'DELETE' });
