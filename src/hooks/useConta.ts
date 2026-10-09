import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { lerOrigem } from '@/lib/origem';
import type { Tables } from '@/integrations/supabase/types';

export type Conta = Tables<'contas'>;

/** Sessão + conta única (PPV e atleta). Cria a conta e aplica cortesias na primeira entrada. */
export function useConta() {
  const [session, setSession] = useState<Session | null>(null);
  const [conta, setConta] = useState<Conta | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async (s: Session | null) => {
    if (!s) { setConta(null); setLoading(false); return; }
    setErro(null);
    const { origem, indicacao } = lerOrigem();
    const { error } = await supabase.rpc('minha_conta_iniciar', { _origem: origem, _indicacao: indicacao ?? undefined });
    if (error) { setErro(error.message); setLoading(false); return; }
    const { data } = await supabase.from('contas').select('*').eq('user_id', s.user.id).maybeSingle();
    setConta(data); setLoading(false);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setTimeout(() => carregar(s), 0);
    });
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); if (!data.session) setLoading(false); });
    return () => sub.subscription.unsubscribe();
  }, [carregar]);

  return { session, conta, loading, erro, recarregar: () => carregar(session) };
}
