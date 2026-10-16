import type { LoginInput } from '@juliana/contracts';
import { config } from '../config';
import { supabase } from '../lib/supabase';
import { recordApiFailure } from '../observability';
import { getDemoAssuranceLevel, signInDemo, signOutDemo, verifyDemoMfa } from './demo';

const ADMIN_MFA_FACTOR_NAME = 'Juliana Manduca Admin';

export const signIn = async (input: LoginInput) => {
  if (config.demoMode) return signInDemo(input);
  const { data, error } = await supabase.auth.signInWithPassword(input);
  if (error) {
    void recordApiFailure({ kind: 'authentication', path: '/auth/sign-in' });
    throw error;
  }
  return data.session;
};

export const signOut = async () => {
  if (config.demoMode) {
    signOutDemo();
    return;
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const sendPasswordReset = async (email: string) => {
  if (config.demoMode) return;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/redefinir-senha`,
  });
  if (error) throw error;
};

export const updatePassword = async (password: string) => {
  if (config.demoMode) return;
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
};

export const getAssuranceLevel = async () => {
  if (config.demoMode) {
    const currentLevel = getDemoAssuranceLevel();
    return { currentLevel, nextLevel: currentLevel };
  }
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  return data;
};

export const listMfaFactors = async () => {
  if (config.demoMode) return [{ id: 'demo-factor', status: 'verified' as const }];
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return data.totp.filter((factor) => factor.status === 'verified');
};

export const enrollMfa = async () => {
  if (config.demoMode) return { id: 'demo-factor', totp: { qr_code: '', secret: 'DEMO-LOCAL' } };
  const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
  if (listError) throw listError;
  for (const factor of factors.all) {
    if (
      factor.factor_type !== 'totp' ||
      factor.status !== 'unverified' ||
      factor.friendly_name !== ADMIN_MFA_FACTOR_NAME
    )
      continue;
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    if (error) throw error;
  }
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: ADMIN_MFA_FACTOR_NAME,
  });
  if (error) throw error;
  return data;
};

export const verifyMfa = async (factorId: string, code: string) => {
  if (config.demoMode) {
    verifyDemoMfa(code);
    return;
  }
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId,
  });
  if (challengeError) throw challengeError;
  const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
  if (error) throw error;
};

export const whatsappUrl = () => {
  if (!config.whatsappNumber) return null;
  const text = encodeURIComponent('Olá, Juliana! Gostaria de saber mais sobre os atendimentos.');
  return `https://wa.me/${config.whatsappNumber}?text=${text}`;
};
