import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KeyRound, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/** Lets the signed-in admin replace their own password. */
const AdminSenha = () => {
  const [open, setOpen] = useState(false);
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [busy, setBusy] = useState(false);
  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (a.length < 12) { toast.error('Use pelo menos 12 caracteres.'); return; }
    if (a !== b) { toast.error('As senhas não conferem.'); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: a });
    setBusy(false);
    if (error) { toast.error('Não foi possível trocar: ' + error.message); return; }
    toast.success('Senha trocada.'); setOpen(false); setA(''); setB('');
  };
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-outline-gold flex items-center gap-2 text-sm min-h-[44px]"><KeyRound size={14} /> Trocar senha</button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Trocar senha</DialogTitle></DialogHeader>
          <form onSubmit={salvar} className="space-y-4">
            <div><label className="form-label" htmlFor="ns1">Nova senha (mínimo 12 caracteres)</label>
              <input id="ns1" type="password" autoComplete="new-password" className="form-field text-base" value={a} onChange={e => setA(e.target.value)} /></div>
            <div><label className="form-label" htmlFor="ns2">Repita a nova senha</label>
              <input id="ns2" type="password" autoComplete="new-password" className="form-field text-base" value={b} onChange={e => setB(e.target.value)} /></div>
            <button disabled={busy} className="btn-gold w-full flex items-center justify-center gap-2 min-h-[44px]">{busy && <Loader2 size={16} className="animate-spin" />} Salvar nova senha</button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
export default AdminSenha;
