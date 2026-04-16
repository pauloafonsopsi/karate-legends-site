# Plano: Armazenamento no Lovable Cloud + Tutorial de Google Drive

## Contexto

Atualmente os formulários enviam dados via Google Apps Script para planilhas. O plano é mudar o armazenamento para o Lovable Cloud (Supabase) com tabelas organizadas em Português BR, e incluir um tutorial visual no formulário de atletas explicando como compartilhar arquivos pelo Google Drive.

---

## 1. Habilitar Lovable Cloud e criar tabelas

Criar duas tabelas no banco de dados via migração SQL:

`**inscricoes_atletas**` (Inscrições de Atletas):

- `id`, `criado_em` (timestamp)
- `nome`, `email`, `whatsapp`, `estilo`, `graduacao`, `associacao`
- `cidade`, `pais`, `link_video`, `link_certificado`, `link_documento`, `redes_sociais`

`**lista_espera_ppv**` (Lista de Espera PPV):

- `id`, `criado_em` (timestamp)
- `nome`, `email`, `whatsapp`

Ambas com RLS habilitado e política de INSERT para qualquer pessoa (formulário público).

## 2. Atualizar formulários para salvar no Supabase

Modificar `AthleteForm.tsx` e `WaitlistForm.tsx` para, além do envio ao Google Apps Script (mantido como backup), também inserir os dados na tabela Supabase correspondente usando o cliente `supabase.from('tabela').insert()`.

## 3. Tutorial de Google Drive no formulário de atletas

Criar um componente `DriveTutorial.tsx` com um guia visual passo a passo (usando accordion/collapsible) que aparece acima dos campos de upload no formulário de atletas:

**Passos do tutorial:**

1. Abra o Google Drive ([drive.google.com](http://drive.google.com)) link clicável
2. Faça upload do arquivo (foto do certificado, video ou documento)
3. Clique com botão direito → "Compartilhar"
4. Altere o acesso para "Qualquer pessoa com o link"
5. Copie o link e cole no formulário

O tutorial terá ícones ilustrativos e será colapsável para não poluir o formulário. Também será traduzido nos 3 idiomas (PT, EN, ES).

## 4. Traduções

Adicionar novas chaves nos arquivos `pt.json`, `en.json`, `es.json` para:

- Labels do tutorial de Google Drive
- Mensagens de erro/sucesso relacionadas ao banco de dados

---

## Arquivos modificados

- Nova migração SQL (tabelas `inscricoes_atletas` e `lista_espera_ppv`)
- `src/components/AthleteForm.tsx` — inserção no Supabase + tutorial
- `src/components/WaitlistForm.tsx` — inserção no Supabase
- `src/components/DriveTutorial.tsx` — novo componente
- `src/messages/pt.json`, `en.json`, `es.json` — novas traduções
- `src/integrations/supabase/client.ts` (se ainda não existir)