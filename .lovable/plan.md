# Bloco 4. Painel do promotor

Substitui a aba "Dados" atual por uma tela "Promotor" que mostra o que fazer hoje. Todo número abre a lista filtrada de pessoas por trás dele.

## 1. Números (cada um clicável, abre a lista filtrada)
- Funil do registro: conta criada, cadastro completo, registro pago, apto, aplicou, convocado. Mostra também a perda entre uma etapa e a seguinte.
- Classe Fundadora: total de fundadores e dias até o fim da janela (ou "sem data definida").
- Receita por produto (Registro anual, Registro mensal, PPV, taxa de aplicação) e por mês, com filtro de período.
- Origem: registros e compras por origem (instagram, indicação, link de atleta etc.).
- Aplicações por categoria em cada evento.
- Compras de PPV por evento.
- Atletas e compradores por cidade.

## 2. Listas com ação
Cada lista tem busca, paginação, filtros guardados no endereço, ficha lateral da pessoa, botão de WhatsApp com mensagem pronta e exportação.
- Veteranos que ainda não entraram (atletas históricos sem conta).
- Cadastros que pararam no pagamento.
- Atletas com só uma meta pendente.
- Registros vencendo em 30 dias.
- Aplicações perto da data de resposta e ainda sem decisão.
- Convocados que não confirmaram presença.

## 3. Mensagens de WhatsApp editáveis
- Tela "Mensagens" no painel: um texto por lista, com variáveis como {nome}, {evento}, {vencimento}, {numero}.
- O botão abre o WhatsApp com a mensagem preenchida para aquela pessoa. Sem envio automático (não consome créditos nem serviço pago).

## 4. Gerador de link com origem
- Campos: canal, campanha ou atleta. Gera o link do site com ?origem=... pronto para copiar, e lista os links já criados com quantas contas e compras cada um trouxe.

## 5. Exportação
- Qualquer lista em CSV (acentos corretos, ponto e vírgula) e em Excel (.xlsx com cabeçalho em negrito, colunas ajustadas, valores em R$).

## 6. Permissões
- Admin vê tudo.
- Consultor não vê esta tela (ela contém receita e pagamentos).

## Riscos que resolvo junto
- Compras antigas de PPV feitas sem conta: aparecem ligadas pelo e-mail e marcadas como "sem conta", sem alterar nada nelas.
- Testo o painel entrando de verdade como admin, em 360 px e 1280 px, com dados de teste que apago no fim.

## Fora deste bloco
- Envio automático de WhatsApp ou e-mail.
- Termos novos e publicação (Bloco 5).

## Detalhes técnicos
- Números e listas calculados no banco por funções `security definer` que checam `has_role(auth.uid(),'admin')`; o navegador só recebe o resultado já agregado/paginado.
- Receita lida de `registros`, `assinaturas` e `aplicacoes` (valores gravados pelo webhook).
- Nova tabela `mensagens_whatsapp` (chave da lista, texto) e `links_origem` (slug, canal, campanha, atleta_id), ambas com RLS só admin; origem já gravada em contas, registros, assinaturas e aplicações.
- Exportação .xlsx no navegador com biblioteca de planilhas (instalação de um pacote).
- Novo módulo `src/components/admin/AdminPromotor.tsx` montado como aba em `Admin.tsx`; a aba "Dados" antiga é absorvida.
- AGENTS.md ganha a regra das funções de números do promotor.
