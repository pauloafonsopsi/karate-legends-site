import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';

type Modo = 'entrar' | 'criar' | 'esqueci';

/** Só aceita caminhos internos como destino depois do login. */
const destinoSeguro = (v: string | null) => (v && v.startsWith('/') && !v.startsWith('//') ? v : '/atleta');

const Entrar = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const volta = destinoSeguro(params.get('volta'));
  const modo = (params.get('modo') as Modo) || 'entrar';
  const setModo = (m: Modo) => { params.set('modo', m); setParams(params, { replace: true }); setMsg(''); };
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { if (s) navigate(volta, { replace: true }); });
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate(volta, { replace: true }); });
    return () => sub.subscription.unsubscribe();
  }, [navigate, volta]);

  const google = async () => {
    setBusy(true); setMsg('');
    const r = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin + '/entrar?volta=' + encodeURIComponent(volta) });
    if (r.error) { setMsg('Não foi possível entrar com o Google. Tente de novo.'); setBusy(false); }
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg('');
    if (modo === 'entrar') {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) setMsg(error.message.includes('confirm') ? 'Confirme seu e-mail pelo link que enviamos.' : 'E-mail ou senha incorretos.');
    } else if (modo === 'criar') {
      if (senha.length < 8) { setMsg('Use pelo menos 8 caracteres.'); setBusy(false); return; }
      const { error } = await supabase.auth.signUp({ email, password: senha, options: { emailRedirectTo: window.location.origin + volta } });
      setMsg(error ? 'Não foi possível criar a conta: ' + error.message : 'Enviamos um link para o seu e-mail. Abra-o para confirmar a conta.');
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/redefinir-senha' });
      setMsg(error ? 'Não foi possível enviar agora.' : 'Se houver conta com esse e-mail, você receberá um link para criar nova senha.');
    }
    setBusy(false);
  };

  const titulo = { entrar: 'Entrar', criar: 'Criar conta', esqueci: 'Nova senha' }[modo];

  return (
    <div className="pt-32 pb-20 min-h-screen">
      <div className="max-w-md mx-auto px-6">
        <p className="eyebrow mb-3">Conta Legends</p>
        <h1 className="text-5xl mb-2">{titulo}</h1>
        <p className="text-muted-foreground text-sm mb-8">Uma conta só para assistir ao PPV e para o Registro Legends.</p>

        <div className="surface-elevated rounded-sm p-6 md:p-8 space-y-5">
          {modo !== 'esqueci' && (
            <>
              <button type="button" onClick={google} disabled={busy} className="btn-outline-gold w-full min-h-[44px] flex items-center justify-center gap-2">
                Continuar com Google
              </button>
              <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">ou com e-mail</p>
            </>
          )}
          <form onSubmit={enviar} className="space-y-4">
            <div>
              <label className="form-label" htmlFor="em">E-mail</label>
              <input id="em" type="email" required autoComplete="email" className="form-field text-base" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            {modo !== 'esqueci' && (
              <div>
                <label className="form-label" htmlFor="pw">Senha</label>
                <input id="pw" type="password" required autoComplete={modo === 'criar' ? 'new-password' : 'current-password'} className="form-field text-base" value={senha} onChange={e => setSenha(e.target.value)} />
              </div>
            )}
            {msg && <p role="status" className="text-sm text-foreground/80">{msg}</p>}
            <button disabled={busy} className="btn-gold w-full min-h-[44px] flex items-center justify-center gap-2">
              {busy && <Loader2 size={16} className="animate-spin" />}
              {modo === 'entrar' ? 'Entrar' : modo === 'criar' ? 'Criar conta' : 'Enviar link'}
            </button>
          </form>
          <div className="flex flex-wrap justify-between gap-3 text-sm">
            {modo !== 'entrar' && <button onClick={() => setModo('entrar')} className="text-gold min-h-[44px]">Já tenho conta</button>}
            {modo !== 'criar' && <button onClick={() => setModo('criar')} className="text-gold min-h-[44px]">Criar conta</button>}
            {modo === 'entrar' && <button onClick={() => setModo('esqueci')} className="text-muted-foreground min-h-[44px]">Esqueci a senha</button>}
          </div>
        </div>
        <Link to="/atletas" className="inline-block mt-6 text-sm text-muted-foreground min-h-[44px]">Voltar para Atletas</Link>
      </div>
    </div>
  );
};
export default Entrar;
