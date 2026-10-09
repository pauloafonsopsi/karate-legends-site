# Bloco 2. Conta e Registro Legends

## Entrada (sua pergunta)
Sim: Google e e-mail com senha, na mesma tela, com "esqueci a senha". O código por e-mail fica para quando houver domínio próprio.

## O que você vai ver
1. **Uma conta só** para quem compra PPV e para quem luta. Página "Entrar" com Google ou e-mail e senha.
2. **Aba Atletas**: "Sou atleta registrado" e "Quero ser Legends" levam ao mesmo caminho: entrar, completar cadastro, ver critérios, pagar se não houver registro ativo, abrir a área do atleta.
3. **Barreiras antes do pagamento**: idade mínima e estilos aceitos, editáveis no painel (hoje 18 anos; Shotokan e Shito-Ryu). Quem não passa não chega ao pagamento.
4. **Metas**: lista editável (nome, descrição, se exige arquivo). Cada meta fica pendente, enviada ou verificada; verificar é um clique no painel. Antes de pagar, a pessoa vê o que vai ficar pendente.
5. **Classe Fundadora**: até a data definida no painel, só o anual de R$ 99,90 à vista. Fundador ganha número, selo permanente e renova pelo preço que pagou enquanto não deixar vencer. Depois da data, entra também o mensal de R$ 9,90. Preços alterados no painel pelo mecanismo de planos atual.
6. **Cortesias automáticas**: atleta histórico com e-mail informado por você (ou vínculo manual); campeão ativo enquanto tiver o cinturão; quem pagou nas inscrições antigas ganha o ano fundador; quem foi aprovado naquela análise começa com metas verificadas.
7. **Área do atleta**: número de registro, Caminho da Lenda (Registrado, Apto, Convocado, Lutou, Ranqueado, Desafiante, Campeão), lutas feitas, próximas lutas. Registro vencido trava a aplicação e preserva o histórico.
8. **Origem**: cada conta e compra grava a origem do link (?origem=instagram) ou indicação; cada mudança de status fica registrada com data.
9. **Consultor técnico**: você convida pelo painel; ele verifica metas e vê atletas, sem acesso a valores.
10. **Painel**: nova aba "Registro Legends" com contas, metas a verificar, cortesias, barreiras, data fundadora e equipe.

## Fora deste bloco
Aplicação por evento (Bloco 3), listas de ação e WhatsApp (Bloco 4), e-mails automáticos.

## Detalhes técnicos
- Tabelas: `contas` (perfil ligado ao usuário, origem, estilo, nascimento, atleta_id), `registros` (tipo anual/mensal/cortesia, fundador, preço travado, início/vencimento, origem), `metas` e `metas_atleta` (status + arquivo no bucket privado), `cortesias_email`, `config_registro` (idade mínima, estilos, data fundadora). Tudo com RLS; dono lê o próprio, admin tudo, consultor só metas e contas sem financeiro.
- Papel `consultor` no enum `app_role`; checagem por `has_role` no banco e nas funções.
- Planos novos `registro_anual`, `registro_fundador`, `registro_mensal` na tabela `planos`; preço do fundador travado guardado no registro, renovação cobra o price travado.
- `create-checkout` passa a exigir conta logada para registro, revalida barreiras no servidor e grava origem; webhook cria/renova `registros` e status_historico.
- Função de banco aplica cortesias no primeiro login (por e-mail confirmado) e calcula o Caminho da Lenda a partir de lutas, cinturões e ranking.
- Google gerenciado pelo Cloud e e-mail/senha ativados; página /redefinir-senha.
- Teste no navegador em 360 e 1280 px: cadastro, barreira, checkout sandbox, cortesia, verificação de meta.

## Riscos
- PIX depende da conta Stripe habilitar; até lá só cartão.
- Cortesia por e-mail só vale se o atleta usar o mesmo e-mail; o vínculo manual cobre o resto.
