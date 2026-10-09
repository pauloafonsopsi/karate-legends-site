import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const RedefinirSenha = () => {
  const navigate = useNavigate();
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const recuperacao = window.location.hash.includes('type=recovery');

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (a.length < 8) { setMsg('Use pelo menos 8 caracteres.'); return; }
    if (a !== b) { setMsg('As senhas não conferem.'); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: a });
    setBusy(false);
    if (error) { setMsg('O link expirou. Peça um novo em Entrar.'); return; }
    navigate('/atleta', { replace: true });
  };

  return (
    <div className="pt-32 pb-20 min-h-screen">
      <div className="max-w-md mx-auto px-6">
        <p className="eyebrow mb-3">Conta Legends</p>
        <h1 className="text-5xl mb-8">Criar nova senha</h1>
        {!recuperacao && <p className="text-sm text-muted-foreground mb-4">Abra esta página pelo link enviado ao seu e-mail.</p>}
        <form onSubmit={salvar} className="surface-elevated rounded-sm p-6 space-y-4">
          <div><label className="form-label" htmlFor="s1">Nova senha</label>
            <input id="s1" type="password" autoComplete="new-password" className="form-field text-base" value={a} onChange={e => setA(e.target.value)} /></div>
          <div><label className="form-label" htmlFor="s2">Repita a nova senha</label>
            <input id="s2" type="password" autoComplete="new-password" className="form-field text-base" value={b} onChange={e => setB(e.target.value)} /></div>
          {msg && <p role="status" className="text-sm">{msg}</p>}
          <button disabled={busy} className="btn-gold w-full min-h-[44px] flex items-center justify-center gap-2">{busy && <Loader2 size={16} className="animate-spin" />} Salvar</button>
        </form>
      </div>
    </div>
  );
};
export default RedefinirSenha;
