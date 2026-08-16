import { zodResolver } from '@hookform/resolvers/zod';
import { type LoginInput, loginSchema } from '@juliana/contracts';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Brand } from '../components/Brand';
import { Button } from '../components/Button';
import { Spinner } from '../components/Spinner';
import { config } from '../config';
import { useAuth } from '../context/AuthContext';
import { getAssuranceLevel, signIn } from '../services/auth';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const submit = handleSubmit(async (input) => {
    setError('');
    try {
      await signIn(input);
      const profile = await refreshProfile();
      if (!profile)
        throw new Error('Perfil não encontrado. Confirme se seu convite ainda é válido.');
      if (profile.role === 'admin') {
        const assurance = await getAssuranceLevel();
        navigate(assurance.currentLevel === 'aal2' ? '/admin' : '/mfa');
        return;
      }
      navigate('/dashboard');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível entrar');
    }
  });
  return (
    <div className="cosmic-bg grid min-h-screen lg:grid-cols-2">
      <aside
        aria-label="Apresentação"
        className="relative hidden overflow-hidden border-r border-ivory-100/15 p-12 lg:flex lg:flex-col lg:justify-between"
      >
        <img
          src="/assets/celestial-atlas.webp"
          alt=""
          className="pointer-events-none absolute -bottom-52 -right-52 w-[42rem] opacity-25"
          loading="lazy"
          decoding="async"
        />
        <Brand />
        <div className="relative z-10">
          <p className="eyebrow">Área reservada</p>
          <blockquote className="display mt-5 max-w-lg text-5xl">
            “O mapa não limita o caminho. Ele ilumina possibilidades.”
          </blockquote>
        </div>
        <p className="relative z-10 muted text-sm">Juliana Manduca · Astrologia consciente</p>
      </aside>
      <main className="grid place-items-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <Brand />
          </div>
          <Link to="/" className="muted inline-flex items-center gap-2 text-sm hover:text-gold-300">
            <ArrowLeft size={16} /> Voltar ao site
          </Link>
          <h1 className="display mt-8 text-5xl">Boas-vindas.</h1>
          <p className="muted mt-3">Acesse suas consultas e materiais privados.</p>
          {config.demoMode && (
            <aside className="mt-6 rounded-2xl border border-gold-300/30 bg-plum-900/50 p-4 text-sm">
              <p className="font-semibold text-gold-200">Ambiente de demonstração</p>
              <p className="muted mt-2">Admin: {config.demoAdminEmail}</p>
              <p className="muted">Cliente: {config.demoClientEmail}</p>
              <p className="muted">Senha temporária: {config.demoPassword}</p>
              <p className="muted">MFA do admin: {config.demoMfaCode}</p>
            </aside>
          )}
          <form onSubmit={submit} className="mt-9 space-y-5" noValidate>
            <div>
              <label className="label" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input"
                {...register('email')}
              />
              {errors.email && <p className="field-error">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="input"
                {...register('password')}
              />
              {errors.password && <p className="field-error">{errors.password.message}</p>}
            </div>
            {error && (
              <p role="alert" className="rounded-xl bg-red-950/50 p-3 text-sm text-red-100">
                {error}
              </p>
            )}
            <Button className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Spinner label="Entrando" /> : 'Entrar'}
            </Button>
          </form>
          <Link
            to="/esqueci-a-senha"
            className="mt-5 block text-center text-sm text-gold-300 hover:underline"
          >
            Esqueci minha senha
          </Link>
          <p className="muted mt-10 text-center text-xs">
            O acesso é criado por convite após o atendimento ser confirmado.
          </p>
        </div>
      </main>
    </div>
  );
};
