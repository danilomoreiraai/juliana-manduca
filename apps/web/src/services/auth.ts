import type { LoginInput } from '@juliana/contracts';
import { config } from '../config';
import { supabase } from '../lib/supabase';
import { recordApiFailure } from '../observability';

export const signIn = async (input: LoginInput) => {
  const { data, error } = await supabase.auth.signInWithPassword(input);
  if (error) {
    void recordApiFailure({ kind: 'authentication', path: '/auth/sign-in' });
    throw error;
  }
  return data.session;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const sendPasswordReset = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/redefinir-senha`,
  });
  if (error) throw error;
};

export const updatePassword = async (password: string) => {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
};

export const getAssuranceLevel = async () => {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  return data;
};

export const listMfaFactors = async () => {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return data.totp.filter((factor) => factor.status === 'verified');
};

export const enrollMfa = async () => {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'Juliana Manduca Admin',
  });
  if (error) throw error;
  return data;
};

export const verifyMfa = async (factorId: string, code: string) => {
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
