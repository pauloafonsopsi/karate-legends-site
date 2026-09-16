const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full bg-destructive/15 border-b border-destructive/40 px-4 py-2 text-center text-sm text-destructive-foreground">
        Os pagamentos ainda não estão liberados para valer. Conclua a ativação na aba de Pagamentos.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full border-b border-gold/40 bg-gold/10 px-4 py-2 text-center text-xs uppercase tracking-widest text-gold">
        Ambiente de teste — nenhuma cobrança real é feita aqui
      </div>
    );
  }
  return null;
}
