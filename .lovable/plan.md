# Plano: Ajustes no Formulário de Atletas e Página de Seleção

## Mudanças solicitadas

### 1. Tutorial do Google Drive com mais destaque

- Transformar o `DriveTutorial` de um accordion discreto para um **botão gold chamativo** que abre um **Dialog/Modal** com o tutorial completo
- O botão ficará visível acima dos campos de link, com ícone e texto claro

### 2. Preço da análise: R$ 99,00

- Atualizar `athletes.fee_notice` nos 3 arquivos de tradução (pt, en, es) de R$ 29,90 para R$ 99,00
- Atualizar também o FAQ (q3/a3) que menciona o valor

### 3. Graduação: Faixa Marrom ou Preta

- Atualizar o select de graduação (`belt`) para incluir opção "Faixa Marrom" / "Brown Belt"
- Atualizar `athletes.req_1` nos 3 idiomas para refletir "Faixa Marrom ou Preta"

### 4. Mensagem de sucesso e processo seletivo

- Atualizar `form.success_athlete` e `athletes.process_desc` nos 3 idiomas:
  - Ao aplicar, o atleta recebe acesso à **plataforma de treinamentos exclusivos do padrão Legends com R$ 900 de desconto. Desconto deve estar aparente no preço como: de "X" por "Y".**
  - Se selecionado como apto, receberá confirmação por email (não significa que lutará no próximo evento)

### 5. Textos de requisitos e FAQ

- Atualizar requisitos e FAQ para consistência com as novas regras (marrom/preta, R$ 99, benefício da plataforma, confirmação apenas se for aprovado)

## Arquivos modificados

- `src/components/DriveTutorial.tsx` — refatorar para botão + modal
- `src/components/AthleteForm.tsx` — adicionar opção faixa marrom no select
- `src/pages/Athletes.tsx` — sem mudanças estruturais
- `src/messages/pt.json`, `en.json`, `es.json` — atualizar traduções (preço, graduação, processo, benefício)