## Plano: Termos, Dono do Dojo, FAQ e Painel Admin

### 1. Banco de dados (migração)
Adicionar colunas em `inscricoes_atletas`:
- `dono_dojo` (boolean, default false)
- `sensei_nome` (text, nullable)
- `sensei_telefone` (text, nullable)
- `aceite_termos` (boolean, default false)
- `aceite_privacidade` (boolean, default false)
- `status` (text, default 'pendente') — valores: pendente, pago, aprovado, rejeitado
- `pagamento_confirmado` (boolean, default false)
- `observacoes` (text, nullable)
- `respondido_em` (timestamptz, nullable)

Criar enum `app_role` ('admin', 'user') e tabela `user_roles` com função `has_role()` (security definer).

Adicionar policies em `inscricoes_atletas`:
- SELECT, UPDATE: apenas admins (`has_role(auth.uid(), 'admin')`)

Adicionar policies em `lista_espera_ppv`:
- SELECT: apenas admins

### 2. Autenticação
- Página `/admin/login` com email + senha
- Configurar auto-confirm de email (admin único)
- Primeiro admin precisa ser atribuído manualmente após signup (instrução para o usuário)

### 3. Página `/admin` (protegida)
- Lista de inscrições de atletas em tabela com colunas: Nome, Email, WhatsApp, Estilo, Graduação, Status, Pagamento, Data
- Botões de ação por linha: Ver detalhes (modal com todos os campos + links clicáveis para vídeo/certificado/documento), Editar status, Marcar pagamento, Adicionar observação
- Botão "Exportar CSV"
- Filtros por status e busca por nome/email
- Aba secundária para `lista_espera_ppv` (também exportável)

### 4. Formulário de atletas (`AthleteForm.tsx`)
- Adicionar checkbox "Sou dono do meu dojo" próximo ao campo Associação/Dojo
- Se desmarcado, mostrar campos: "Nome do sensei responsável" + "Telefone do sensei"
- Adicionar 2 checkboxes obrigatórios no fim:
  - "Li e aceito os Termos e Condições" (link para `/termos-atleta`)
  - "Li e aceito a Política de Dados" (link para `/politica-dados`)
- Bloquear submit se não aceitos
- Persistir todos os novos campos no Supabase

### 5. Documentos legais
Criar duas novas páginas:
- `/termos-atleta` — Termos específicos da inscrição contendo:
  - Pagamento da taxa de R$ 99,00 é voluntário e não reembolsável
  - Karate Legends não se responsabiliza pela veracidade das informações enviadas
  - Em caso de irregularidade nos documentos, não há obrigação de notificação ao atleta
  - Resposta apenas em casos positivos, em até 10 dias corridos
  - Ausência de resposta em 10 dias = não aprovação (resposta negativa tácita)
  - Aprovação não garante participação no próximo evento
- `/politica-dados` — Tratamento de dados (LGPD):
  - Dados coletados, finalidade, base legal, retenção, direitos do titular

Adicionar links no rodapé.

### 6. FAQ
Em `athletes.a3` (Como funciona a taxa) — remover menção a R$ 99,00, substituir por texto genérico sobre o trabalho do consultor técnico.

### Arquivos modificados
- Nova migração SQL
- `src/components/AthleteForm.tsx`
- `src/components/AdminDashboard.tsx` (novo)
- `src/components/AdminLogin.tsx` (novo)
- `src/components/ProtectedAdminRoute.tsx` (novo)
- `src/pages/Admin.tsx` (nova)
- `src/pages/AdminLogin.tsx` (nova)
- `src/pages/TermosAtleta.tsx` (nova)
- `src/pages/PoliticaDados.tsx` (nova)
- `src/App.tsx` — novas rotas
- `src/components/layout/Footer.tsx` — links
- `src/messages/pt.json`, `en.json`, `es.json` — novas chaves + FAQ atualizado
