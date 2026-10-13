# Resolver os riscos dos Blocos 4 e 5

## 1. Registro mensal contado uma vez só
- Cada cobrança mensal paga passa a virar um lançamento próprio de receita, registrado pelo aviso de pagamento da Stripe (fatura paga).
- O painel do promotor soma todas as cobranças, mês a mês. O vencimento do registro continua avançando a cada cobrança.

## 2. PPV antigo sem conta
- Quando a pessoa entra na conta com o mesmo e-mail (confirmado) da compra antiga, a compra é ligada à conta automaticamente, sem alterar valor, data ou status.
- No painel, a marca "sem conta" só fica para quem nunca entrou.

## 3. PPV fora do evento certo
- A compra passa a gravar o evento comprado no momento do pagamento, escolhido pelo servidor (o próximo evento à venda).
- O painel usa esse evento; compras antigas continuam pelo plano de PPV do evento.
- O painel de eventos avisa quando um evento à venda está sem plano de PPV.

## 4. Só a primeira origem gravada
- Passam a ser gravadas a primeira origem (como hoje) e a última origem antes de cada compra.
- O painel de links mostra as duas colunas: "trouxe a pessoa" e "fechou a compra".

## 5. Textos legais só em português
- Cada documento ganha versões em inglês e espanhol, editáveis no painel com versão própria.
- Escrevo as traduções eu mesmo, sem usar recurso pago. Elas precisam da mesma revisão do advogado.
- Se faltar a tradução, a página mostra o português com um aviso no idioma da pessoa.

## 6. Aceite sem versão
- Todo aceite (aplicação a evento, registro, compra) grava qual documento, versão e idioma a pessoa aceitou, com data.
- Na ficha da pessoa, no painel, aparece o histórico de aceites.

## 7. "[a preencher]" nos dados da empresa
- Isto só se resolve quando você preencher os dados. Enquanto faltar algum campo:
  - o painel mostra um alerta fixo no topo com o link para preencher;
  - a publicação fica travada por mim até os campos estarem completos.

## Detalhes técnicos
- Nova tabela `cobrancas` (stripe_ref único da fatura, conta_id, tipo, valor, pago_em, environment, origem), escrita só pelo webhook em `invoice.paid`; `_promotor_pagamentos` passa a ler mensais dela (anual e aplicação ficam como estão, sem duplicar).
- `assinaturas` ganha `evento_id` e `origem_ultima`; `create-checkout` resolve o evento no servidor; `minha_conta_iniciar` liga `assinaturas` com user_id nulo por e-mail confirmado do `auth.users`.
- `contas` ganha `origem_ultima`; `src/lib/origem.ts` passa a guardar também a última origem.
- Nova tabela `documentos_legais_traducoes` (slug, idioma, título, corpo, versão por trigger); `documentos_legais` segue como português.
- Nova tabela `aceites` (conta_id, slug, idioma, versão, contexto, aceito_em), escrita só por função do banco; leitura do dono e do admin.
- Tudo aditivo, com RLS e permissões; nenhum dado existente é alterado. Teste no navegador em 360 e 1280 px como admin e como atleta.
- AGENTS.md ganha as regras de cobranças, aceites e traduções legais.
