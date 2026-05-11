import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Loader2 } from 'lucide-react';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAdminAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!loading && session && isAdmin) navigate('/admin');
  }, [loading, session, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/admin` }
        });
        if (error) throw error;
        setMsg('Conta criada. Peça ao administrador principal para conceder acesso de admin.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro';
      setMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-32 pb-20 min-h-screen flex items-center">
      <div className="max-w-md w-full mx-auto px-6">
        <h1 className="text-4xl mb-2 text-gold">Painel Admin</h1>
        <p className="text-white/50 text-sm mb-8 uppercase tracking-widest">Acesso restrito</p>

        <form onSubmit={handleSubmit} className="space-y-5 bg-black-card p-8 border border-white/10">
          <div>
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">E-mail</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white-warm focus:border-gold/50 focus-visible:outline-none" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Senha</label>
            <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm text-white-warm focus:border-gold/50 focus-visible:outline-none" />
          </div>

          {msg && <p className="text-sm text-white/70">{msg}</p>}

          <button type="submit" disabled={submitting} className="btn-gold w-full flex items-center justify-center gap-2">
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {mode === 'login' ? 'Entrar' : 'Criar Conta'}
          </button>

          <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMsg(''); }}
            className="w-full text-xs uppercase tracking-widest text-white/50 hover:text-gold transition-colors">
            {mode === 'login' ? 'Criar nova conta' : 'Já tenho conta'}
          </button>
        </form>
      </div>
    </div>
  );
};
export default AdminLogin;