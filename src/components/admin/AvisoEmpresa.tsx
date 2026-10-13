import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const CAMPOS = ['razao_social', 'cnpj', 'endereco', 'email_contato', 'foro'] as const;

/** Alerta fixo enquanto faltar algum dado da empresa usado nos textos legais. */
const AvisoEmpresa = ({ onAbrir, versao }: { onAbrir: () => void; versao: unknown }) => {
  const [faltam, setFaltam] = useState(0);
  useEffect(() => {
    supabase.from('dados_empresa').select('*').maybeSingle().then(({ data }) => {
      setFaltam(CAMPOS.filter(k => !(data as Record<string, unknown> | null)?.[k]).length);
    });
  }, [versao]);
  if (!faltam) return null;
  return (
    <div role="alert" className="surface-elevated border border-gold/40 p-4 mb-6 flex flex-wrap items-center gap-3">
      <AlertTriangle size={18} className="text-gold shrink-0" />
      <p className="flex-1 min-w-[220px] text-sm">Faltam {faltam} dado(s) da empresa. Os textos legais do site mostram "[a preencher]" e a publicação fica travada até completar.</p>
      <button onClick={onAbrir} className="btn-gold text-sm min-h-[44px]">Preencher agora</button>
    </div>
  );
};

export default AvisoEmpresa;
