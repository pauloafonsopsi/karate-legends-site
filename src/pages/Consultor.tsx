import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MetasVerificar from '@/components/registro/MetasVerificar';

/** Área do consultor técnico: verifica metas, sem dados financeiros. */
const Consultor = () => {
  const [estado, setEstado] = useState<'carregando' | 'fora' | 'negado' | 'ok'>('carregando');
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setEstado('fora'); return; }
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).in('role', ['consultor', 'admin']);
      setEstado(data?.length ? 'ok' : 'negado');
    })();
  }, []);
  if (estado === 'fora') return <Navigate to="/entrar?volta=/consultor" replace />;
  return (
    <div className="pt-32 pb-20 max-w-4xl mx-auto px-6">
      <p className="eyebrow mb-2">Equipe técnica</p>
      <h1 className="text-5xl mb-8">Metas para verificar</h1>
      {estado === 'carregando' && <div className="h-40 surface-elevated animate-pulse rounded-sm" aria-label="Carregando" />}
      {estado === 'negado' && <p role="alert" className="surface-elevated p-6">Sua conta não tem acesso de consultor técnico.</p>}
      {estado === 'ok' && <MetasVerificar />}
    </div>
  );
};
export default Consultor;
