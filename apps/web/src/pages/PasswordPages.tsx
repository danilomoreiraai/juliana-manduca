import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, resetPasswordSchema } from '@juliana/contracts';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import type { z } from 'zod';
import { Brand } from '../components/Brand';
import { Button } from '../components/Button';
import { sendPasswordReset, updatePassword } from '../services/auth';

const AuthCard = ({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="cosmic-bg grid min-h-screen place-items-center px-5">
    <main className="panel w-full max-w-md rounded-3xl p-7 sm:p-9">
      <Brand />
      <h1 className="display mt-9 text-4xl">{title}</h1>
      <p className="muted mt-2 text-sm">{description}</p>
      {children}
    </main>
  </div>
);

export const ForgotPasswordPage = () => {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
  });
  const submit = handleSubmit(async ({ email }) => {
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Falha ao enviar e-mail');
    }
  });
  return (
    <AuthCard
      title="Recuperar acesso"
      description="Enviaremos um link seguro para criar uma nova senha."
    >
      {sent ? (
        <div className="mt-8 rounded-xl bg-green-100 p-4 text-sm text-green-950">
          Se o e-mail estiver cadastrado, você receberá as instruções em instantes.
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-5">
          <div>
            <label className="label" htmlFor="email">
              E-mail
            </label>
            <input id="email" type="email" className="input" {...register('email')} />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>
          {error && <p className="field-error">{error}</p>}
          <Button className="w-full" disabled={isSubmitting}>
            Enviar link
          </Button>
        </form>
      )}
      <Link to="/login" className="mt-6 block text-center text-sm text-gold-300">
        Voltar ao login
      </Link>
    </AuthCard>
  );
};

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof resetPasswordSchema>>({ resolver: zodResolver(resetPasswordSchema) });
  const submit = handleSubmit(async ({ password }) => {
    try {
      await updatePassword(password);
      navigate('/dashboard');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Falha ao atualizar senha');
    }
  });
  return (
    <AuthCard title="Nova senha" description="Escolha uma senha com pelo menos oito caracteres.">
      <form onSubmit={submit} className="mt-8 space-y-5">
        <div>
          <label className="label" htmlFor="password">
            Nova senha
          </label>
          <input id="password" type="password" className="input" {...register('password')} />
          {errors.password && <p className="field-error">{errors.password.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="confirmPassword">
            Confirmar senha
          </label>
          <input
            id="confirmPassword"
            type="password"
            className="input"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="field-error">{errors.confirmPassword.message}</p>
          )}
        </div>
        {error && <p className="field-error">{error}</p>}
        <Button className="w-full" disabled={isSubmitting}>
          Salvar nova senha
        </Button>
      </form>
    </AuthCard>
  );
};
