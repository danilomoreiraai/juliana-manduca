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
import { apiRequest } from './api';

export const getProfile = () => apiRequest<Profile>('/me');
export const updateProfile = (input: UpdateProfileInput) =>
  apiRequest<Profile>('/me', { method: 'PATCH', body: JSON.stringify(input) });
export const getConsultations = () => apiRequest<Consultation[]>('/consultations');
export const getDocuments = () => apiRequest<Document[]>('/documents');
export const requestDocumentDownload = (id: string) =>
  apiRequest<{ url: string; expiresIn: number }>(`/documents/${id}/download`, { method: 'POST' });

export const getAdminUsers = (search = '') =>
  apiRequest<{ items: Profile[]; total: number }>(
    `/admin/users?search=${encodeURIComponent(search)}`,
  );
export const inviteAdminUser = (input: InviteUserInput) =>
  apiRequest<Profile>('/admin/users/invite', { method: 'POST', body: JSON.stringify(input) });
export const setAdminUserStatus = (id: string, input: UpdateUserStatusInput) =>
  apiRequest<Profile>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
export const getAdminConsultations = () => apiRequest<Consultation[]>('/admin/consultations');
export const createAdminConsultation = (input: CreateConsultationInput) =>
  apiRequest<Consultation>('/admin/consultations', { method: 'POST', body: JSON.stringify(input) });
export const updateAdminConsultation = (id: string, input: UpdateConsultationInput) =>
  apiRequest<Consultation>(`/admin/consultations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
export const deleteAdminConsultation = (id: string) =>
  apiRequest<void>(`/admin/consultations/${id}`, { method: 'DELETE' });
export const getAdminDocuments = (userId: string) =>
  apiRequest<Document[]>(`/admin/documents?userId=${encodeURIComponent(userId)}`);
export const uploadAdminDocument = async (input: {
  userId: string;
  consultationId?: string;
  displayName: string;
  file: File;
}) => {
  const query = new URLSearchParams({ userId: input.userId, displayName: input.displayName });
  if (input.consultationId) query.set('consultationId', input.consultationId);
  const body = new FormData();
  body.set('file', input.file);
  return apiRequest<Document>(`/admin/documents?${query.toString()}`, { method: 'POST', body });
};
export const deleteAdminDocument = (id: string) =>
  apiRequest<void>(`/admin/documents/${id}`, { method: 'DELETE' });
