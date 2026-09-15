import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Loader2 } from 'lucide-react';
import prestigeLogo from '@/assets/karate-legends-prestige-lockup.png';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAdminAuth();
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro';
      setMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-28 pb-16 min-h-screen flex items-center relative overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-1/2 border-r border-border hidden lg:block" aria-hidden="true" />
      <div className="max-w-6xl w-full mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        <div className="hidden lg:block pr-12">
          <img src={prestigeLogo} alt="Karate Legends" className="w-full max-w-md mb-12" />
          <p className="eyebrow mb-4">Controle da operação</p>
          <h1 className="text-6xl leading-none mb-6">Gestão com visão de campeonato.</h1>
          <p className="text-muted-foreground max-w-md leading-relaxed">Acompanhe inscrições, pagamentos, documentos e decisões em um ambiente privado.</p>
        </div>
        <div className="max-w-md w-full mx-auto">
        <img src={prestigeLogo} alt="Karate Legends" className="w-52 mb-10 lg:hidden" />
        <p className="eyebrow mb-3">Área privada</p>
        <h2 className="text-4xl mb-2">Painel Admin</h2>
        <p className="text-muted-foreground text-sm mb-8">Entre com sua conta administrativa.</p>

        <form onSubmit={handleSubmit} className="space-y-5 surface-elevated p-7 md:p-9 rounded-sm">
          <div>
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">E-mail</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              autoComplete="email" className="form-field" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">Senha</label>
            <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
              autoComplete="current-password" className="form-field" />
          </div>

          {msg && <p className="text-sm text-white/70">{msg}</p>}

          <button type="submit" disabled={submitting} className="btn-gold w-full flex items-center justify-center gap-2">
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Entrar com segurança
          </button>
        </form>
        <p className="text-xs text-muted-foreground mt-5">Acesso exclusivo para usuários autorizados.</p>
        </div>
      </div>
    </div>
  );
};
export default AdminLogin;