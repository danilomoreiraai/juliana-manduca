import type {
  Consultation,
  CreateConsultationInput,
  Document,
  InviteUserInput,
  LoginInput,
  Profile,
  UpdateConsultationInput,
  UpdateProfileInput,
  UpdateUserStatusInput,
} from '@juliana/contracts';
import type { Session } from '@supabase/supabase-js';
import { config } from '../config';

export const DEMO_AUTH_EVENT = 'juliana-demo-auth';
const authKey = 'juliana-demo-session';
const mfaKey = 'juliana-demo-aal2';
const adminId = '10000000-0000-4000-8000-000000000001';
const clientId = '10000000-0000-4000-8000-000000000002';
const now = '2026-08-16T12:00:00.000Z';

const profiles: Profile[] = [
  {
    id: adminId,
    email: config.demoAdminEmail ?? '',
    fullName: 'Admin Validação',
    role: 'admin',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: clientId,
    email: config.demoClientEmail ?? '',
    fullName: 'Cliente Validação',
    role: 'client',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
];

let consultations: Consultation[] = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    userId: clientId,
    clientName: 'Cliente Validação',
    title: 'Leitura do mapa natal',
    scheduledAt: '2026-09-12T14:00:00.000Z',
    status: 'scheduled',
    summary: 'Encontro inicial para reconhecer ciclos, potenciais e movimentos do momento.',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    userId: clientId,
    clientName: 'Cliente Validação',
    title: 'Revolução solar',
    scheduledAt: '2026-03-20T14:00:00.000Z',
    status: 'completed',
    summary: 'Síntese dos temas do novo ciclo e práticas de integração.',
    createdAt: now,
    updatedAt: now,
  },
];

let documents: Document[] = [
  {
    id: '30000000-0000-4000-8000-000000000001',
    userId: clientId,
    consultationId: '20000000-0000-4000-8000-000000000002',
    displayName: 'Síntese da revolução solar.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 842_000,
    createdAt: now,
  },
];

const requireDemoConfig = () => {
  if (!config.demoMode || !config.demoAdminEmail || !config.demoClientEmail || !config.demoPassword)
    throw new Error('Modo de demonstração não configurado');
};

const dispatchAuthChange = () => window.dispatchEvent(new Event(DEMO_AUTH_EVENT));

const createSession = (profile: Profile): Session =>
  ({
    access_token: `demo-${profile.role}-access-token`,
    refresh_token: 'demo-refresh-token',
    expires_in: 3_600,
    expires_at: Math.floor(Date.now() / 1_000) + 3_600,
    token_type: 'bearer',
    user: {
      id: profile.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: profile.email,
      app_metadata: {},
      user_metadata: {},
      identities: [],
      created_at: profile.createdAt,
    },
  }) as Session;

export const readDemoSession = (): Session | null => {
  const email = localStorage.getItem(authKey);
  const profile = profiles.find((candidate) => candidate.email === email);
  return profile ? createSession(profile) : null;
};

export const getDemoProfile = (): Profile => {
  const email = localStorage.getItem(authKey);
  const profile = profiles.find((candidate) => candidate.email === email);
  if (!profile) throw new Error('Sessão de demonstração inválida');
  return profile;
};

export const signInDemo = (input: LoginInput) => {
  requireDemoConfig();
  const email = input.email.trim().toLowerCase();
  const allowed = [config.demoAdminEmail, config.demoClientEmail];
  if (input.password !== config.demoPassword || !allowed.includes(email))
    throw new Error('E-mail ou senha de demonstração inválidos');
  localStorage.setItem(authKey, email);
  localStorage.removeItem(mfaKey);
  dispatchAuthChange();
  return readDemoSession();
};

export const signOutDemo = () => {
  localStorage.removeItem(authKey);
  localStorage.removeItem(mfaKey);
  dispatchAuthChange();
};

export const getDemoAssuranceLevel = () =>
  localStorage.getItem(mfaKey) === 'true' ? 'aal2' : 'aal1';

export const verifyDemoMfa = (code: string) => {
  if (code !== config.demoMfaCode) throw new Error('Código de demonstração inválido');
  localStorage.setItem(mfaKey, 'true');
};

export const updateDemoProfile = (input: UpdateProfileInput) => {
  const current = getDemoProfile();
  const profile = profiles.find((candidate) => candidate.id === current.id);
  if (!profile) throw new Error('Perfil não encontrado');
  profile.fullName = input.fullName;
  profile.updatedAt = new Date().toISOString();
  return profile;
};

export const getDemoConsultations = () => {
  const profile = getDemoProfile();
  return profile.role === 'admin'
    ? [...consultations]
    : consultations.filter((item) => item.userId === profile.id);
};

export const getDemoDocuments = (userId?: string) => {
  const profile = getDemoProfile();
  const ownerId = profile.role === 'admin' ? userId : profile.id;
  return documents.filter((item) => !ownerId || item.userId === ownerId);
};

export const getDemoUsers = (search = '') => {
  const normalized = search.trim().toLowerCase();
  const items = profiles.filter(
    (profile) =>
      !normalized ||
      profile.email.toLowerCase().includes(normalized) ||
      profile.fullName.toLowerCase().includes(normalized),
  );
  return { items, total: items.length };
};

export const inviteDemoUser = (input: InviteUserInput): Profile => {
  const profile: Profile = {
    id: crypto.randomUUID(),
    email: input.email.toLowerCase(),
    fullName: input.fullName,
    role: 'client',
    status: 'invited',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  profiles.push(profile);
  return profile;
};

export const setDemoUserStatus = (id: string, input: UpdateUserStatusInput) => {
  const profile = profiles.find((candidate) => candidate.id === id);
  if (!profile) throw new Error('Cliente não encontrado');
  profile.status = input.status;
  profile.updatedAt = new Date().toISOString();
  return profile;
};

export const createDemoConsultation = (input: CreateConsultationInput): Consultation => {
  const consultation: Consultation = {
    id: crypto.randomUUID(),
    userId: input.userId,
    clientName: profiles.find((profile) => profile.id === input.userId)?.fullName,
    title: input.title,
    scheduledAt: input.scheduledAt,
    status: input.status,
    summary: input.summary ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  consultations = [consultation, ...consultations];
  return consultation;
};

export const updateDemoConsultation = (id: string, input: UpdateConsultationInput) => {
  const consultation = consultations.find((candidate) => candidate.id === id);
  if (!consultation) throw new Error('Consulta não encontrada');
  Object.assign(consultation, input, { updatedAt: new Date().toISOString() });
  return consultation;
};

export const deleteDemoConsultation = (id: string) => {
  consultations = consultations.filter((candidate) => candidate.id !== id);
};

export const uploadDemoDocument = (input: {
  userId: string;
  consultationId?: string;
  displayName: string;
  file: File;
}): Document => {
  const document: Document = {
    id: crypto.randomUUID(),
    userId: input.userId,
    consultationId: input.consultationId ?? null,
    displayName: input.displayName,
    mimeType: input.file.type || 'application/octet-stream',
    sizeBytes: input.file.size,
    createdAt: new Date().toISOString(),
  };
  documents = [document, ...documents];
  return document;
};

export const deleteDemoDocument = (id: string) => {
  documents = documents.filter((candidate) => candidate.id !== id);
};
