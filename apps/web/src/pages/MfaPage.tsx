import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brand } from '../components/Brand';
import { Button } from '../components/Button';
import { enrollMfa, listMfaFactors, verifyMfa } from '../services/auth';

export const MfaPage = () => {
  const navigate = useNavigate();
  const [factorId, setFactorId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const initialized = useRef(false);

  const prepare = useCallback(async () => {
    setLoading(true);
    setError('');
    setFactorId('');
    setQrCode('');
    setSecret('');
    setCode('');
    try {
      const factors = await listMfaFactors();
      if (factors[0]) {
        setFactorId(factors[0].id);
        return;
      }

      const enrollment = await enrollMfa();
      setFactorId(enrollment.id);
      setQrCode(enrollment.totp.qr_code);
      setSecret(enrollment.totp.secret);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Falha ao configurar MFA');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void prepare();
  }, [prepare]);

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!factorId || code.length !== 6 || verifying) return;
    setError('');
    setVerifying(true);
    try {
      await verifyMfa(factorId, code);
      navigate('/admin');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Código inválido');
    } finally {
      setVerifying(false);
    }
  };
  return (
    <div className="cosmic-bg grid min-h-screen place-items-center px-5">
      <main className="panel w-full max-w-md rounded-3xl p-8">
        <Brand />
        <p className="eyebrow mt-9">Segurança administrativa</p>
        <h1 className="display mt-3 text-4xl">Verificação em duas etapas</h1>
        {loading ? (
          <p className="muted mt-6">Preparando autenticação…</p>
        ) : (
          <>
            {qrCode && (
              <div className="mt-7">
                <p className="muted text-sm">Escaneie o QR code no seu aplicativo autenticador.</p>
                <img
                  src={qrCode}
                  alt="QR code para configurar autenticação"
                  className="mx-auto mt-4 rounded-xl bg-white p-3"
                />
                <p className="muted mt-3 break-all text-xs">Chave manual: {secret}</p>
              </div>
            )}
            <form onSubmit={(event) => void verify(event)} className="mt-7">
              <label className="label" htmlFor="code">
                Código de 6 dígitos
              </label>
              <input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="input tracking-[.4em]"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              />
              {error && (
                <p role="alert" className="field-error">
                  {error}
                </p>
              )}
              <Button
                className="mt-5 w-full"
                disabled={!factorId || code.length !== 6 || verifying}
              >
                {verifying ? 'Verificando…' : 'Verificar e continuar'}
              </Button>
            </form>
            {error && !factorId && (
              <Button type="button" className="mt-3 w-full" onClick={() => void prepare()}>
                Tentar novamente
              </Button>
            )}
          </>
        )}
      </main>
    </div>
  );
};
