# Plano: Área Administrativa Polida (sem Google Sheets)

## 1. Desligar Google Sheets
- `src/components/AthleteForm.tsx`: remover bloco de envio para `GOOGLE_APPS_SCRIPT_URL` (iframe + form) e a constante. Manter apenas o `supabase.from('inscricoes_atletas').insert(...)`.
- `src/components/WaitlistForm.tsx`: idem para `lista_espera_ppv`.
- Apagar os arquivos `google-apps-script.js` e `google-apps-script-atletas.js` da raiz.
- Atualizar memória do projeto (`mem://integrations/google-sheets-backend`) marcando a integração como descontinuada — Lovable Cloud (Supabase) é a única fonte de dados.

## 2. Criar usuário admin pré-configurado
O Supabase Auth exige e-mail válido — "admin" puro não é aceito. Usarei:

- **E-mail:** `admin@kwf.local`
- **Senha:** `admin12345`

Passos (via migration + ferramenta de dados):
1. Habilitar `auto_confirm_email` (assim o login funciona sem caixa de entrada).
2. Inserir o usuário em `auth.users` (via `supabase.auth.admin` no painel Cloud) e, na mesma migration, inserir o papel `admin` em `public.user_roles` para o `user_id` correspondente.
3. Tela `/admin/login` passará a mostrar o e-mail correto como dica de acesso.

> Se você preferir outro e-mail (ex.: `admin@karateworldfederation.com`), me diga antes de eu implementar.

## 3. Refinar UI/UX do Painel `/admin`
Manter a estética dark + gold já existente, mas elevando a qualidade visual e a ergonomia:

**Cabeçalho / navegação**
- Sidebar fixa à esquerda (desktop) com as seções: Visão Geral, Atletas, Lista PPV, Sair. Em mobile vira top tabs.
- Header com saudação ("Olá, admin") + badge de ambiente.

**Visão Geral (nova aba — landing do painel)**
- Cards de métricas: total de inscritos, pendentes, pagos, aprovados, rejeitados, total da lista PPV, inscrições nos últimos 7 dias.
- Mini-gráfico de barras (inscrições por dia, últimos 14 dias) usando Recharts (já no projeto).
- Lista das 5 inscrições mais recentes com atalho para abrir o detalhe.

**Aba Atletas**
- Toolbar refinada: busca (nome/e-mail/cidade/país), filtro por status (chips clicáveis em vez de `<select>`), filtro "pagamento confirmado", filtro por estilo, ordenação (mais recentes / mais antigas / nome).
- Tabela com colunas redimensionáveis, badges coloridos por status, ícone indicando aceite de termos/privacidade, ação rápida de marcar como "pago" direto na linha.
- Botão **Exportar CSV** (todas as colunas, respeita filtros atuais) e **Exportar JSON**.
- Paginação (50 por página) para escalar.
- Drawer lateral (em vez de modal central) ao clicar em "Ver/Editar": melhor para ler links longos e editar status sem perder o contexto da lista. Drawer mostra:
  - Dados pessoais agrupados em seções (Identificação, Dojo, Mídias, Aceites).
  - Links de vídeo/certificado/documento como botões "Abrir em nova aba".
  - Edição: status (chips), checkbox pagamento, observações (textarea), histórico (`criado_em`, `respondido_em`).
  - Botões: Salvar, Excluir (com confirmação), Copiar e-mail, Copiar WhatsApp.

**Aba Lista PPV**
- Mesma toolbar simplificada (busca + exportar).
- Tabela limpa + ação de excluir individual.

**Polimento geral**
- Skeleton loaders em vez de spinner para a tabela.
- Toast (`sonner` / `use-toast` já no projeto) confirmando salvar/excluir/exportar.
- Empty states ilustrados ("Nenhum atleta inscrito ainda").
- Foco em acessibilidade: contraste AA, navegação por teclado nos filtros e drawer.

## 4. Detalhes técnicos
- Sem novas tabelas — as existentes (`inscricoes_atletas`, `lista_espera_ppv`, `user_roles`) já cobrem tudo.
- Stack reaproveitada: shadcn (`Sheet` para o drawer, `Tabs`, `Badge`, `Button`, `Input`, `Select`, `Skeleton`, `Sonner`), Recharts para o gráfico, Lucide para ícones.
- O `useAdminAuth` e o guard atual continuam válidos; apenas o layout muda.
- Nada de backend extra: tudo via cliente Supabase autenticado, respeitando as RLS policies já criadas (`has_role(auth.uid(), 'admin')`).

## 5. O que NÃO será feito
- Não removerei o conteúdo legal nem o formulário público — apenas a chamada de backup ao Google Sheets.
- Não trocarei a paleta nem fontes (dark + gold, Bebas Neue / DM Sans).
- Não criarei cadastro público de novos admins — somente login do admin pré-configurado.

---

**Confirma o e-mail `admin@kwf.local` para o login?** Se sim, sigo direto. Se preferir outro, me diga qual.
