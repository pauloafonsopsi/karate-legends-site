# Plano mestre: Karate Legends com painel autônomo

## Objetivo
Levar ao Legends a mesma filosofia do Show Box: tudo que é operacional (textos, preços exibidos, planos, benefícios, eventos, PPV, termos, contatos) fica no banco e é editado no painel. O código guarda só regras que nunca devem mudar pelo painel (pagamento, webhook, papéis, segurança). Entrega em blocos, cada um testado antes do próximo.

## Bloco 0. Fundação e especificação
- Criar AGENTS.md na raiz com as regras de arquitetura do Legends (fonte única de verdade).
- Registrar na memória do projeto: preços, planos, regras de membro, marca e preferências já definidas.
- Remover restos da área de atletas (aba do admin, termos de atleta) ou arquivá-los como somente leitura.
- Padronizar estados de tela (carregando, vazio, erro, preenchido) com componentes únicos.

## Bloco 1. Conteúdos e textos dinâmicos
- Textos do site (Home, Membros, PPV, rodapé, avisos) em PT, EN e ES guardados no banco, com o texto atual como valor inicial.
- Tela "Conteúdos" no painel: lista por página, edição lado a lado dos três idiomas, prévia e botão restaurar.
- Variáveis dinâmicas nos textos, por exemplo {preco_membro} e {data_evento}.
- Site lê do banco com cache e cai para o texto padrão se algo falhar.

## Bloco 2. Planos, preços e benefícios
- Tela "Planos": nome, descrição, benefícios, destaque, ordem, ativo/inativo.
- O preço cobrado continua vindo do Stripe (servidor); o painel mostra e altera preço criando novo valor no Stripe pelo servidor, nunca pelo navegador.
- Cards de Membros e PPV passam a ser montados a partir do banco.

## Bloco 3. Eventos e PPV
- Tela "Eventos": nome, data, local, imagem, status (em breve, ao vivo, encerrado), visível no site.
- Contagem regressiva da Home ligada ao próximo evento cadastrado.
- PPV ligado ao evento: status da transmissão, link de acesso, preço avulso.
- Reativar as abas Eventos e Blog quando houver conteúdo cadastrado (interruptor no painel).

## Bloco 4. Acesso do membro ao conteúdo pago
- Área "Minha conta" por e-mail com link mágico (sem senha) para membros e compradores de PPV.
- Liberação do PPV verificada no servidor: membro ativo ou compra do evento.
- Portal do Stripe para o membro trocar cartão e cancelar.
- Regras de troca de plano e cancelamento definidas e documentadas (acesso até o fim do período pago).

## Bloco 5. Central de dados e exportações
- Excel formatado (.xlsx com cabeçalho em negrito, colunas ajustadas, R$ #,##0.00) e CSV com acentos corretos e separador ponto e vírgula.
- Relatórios prontos: membros ativos, inadimplentes, cancelados, compradores de PPV por evento, lista de espera, receita por mês.
- Botão de WhatsApp com mensagem pronta editável no painel.
- Ficha lateral de cada pessoa com histórico de pagamentos, observações e ações.
- Filtros, busca e página atual guardados no endereço; listas paginadas.

## Bloco 6. Comunicação
- E-mails automáticos: boas-vindas, pagamento confirmado, falha de cobrança, cancelamento, acesso ao PPV.
- Modelos de e-mail editáveis no painel com variáveis.
- Envio de newsletter mensal para membros e assinantes ativos.

## Bloco 7. Configurações gerais
- Tela "Configurações": contatos oficiais, Instagram, WhatsApp de suporte, e-mail de resposta, textos legais (termos, privacidade, reembolso) com versão e data.
- Registro de quem aceitou qual versão dos termos.

## Bloco 8. Segurança, auditoria e equipe
- Trocar a senha provisória do admin e permitir convidar outros admins.
- Histórico de alterações críticas (quem mudou o quê e quando).
- Revisão de segurança completa e correção dos alertas.
- Proteção contra cadastros repetidos ou abusivos nos formulários públicos.

## Bloco 9. Qualidade e lançamento
- Testes automáticos das regras de negócio (acesso ao PPV, status do membro, cálculo de receita).
- Teste no navegador em 360 px e 1280 px de cada fluxo alterado.
- Desempenho: imagens locais otimizadas, páginas carregadas sob demanda.
- Ativar o Stripe em produção (você reivindica a conta) e publicar.

## Ordem sugerida
```text
0 Fundação -> 1 Conteúdos -> 2 Planos -> 5 Dados -> 3 Eventos/PPV
-> 4 Acesso do membro -> 6 Comunicação -> 7 Configurações -> 8 Segurança -> 9 Lançamento
```

## Pontos que dependem de você
- Domínio próprio para os e-mails.
- Plataforma da transmissão do PPV (YouTube privado, Vimeo ou outra).
- Datas reais dos próximos eventos.
- Se o membro precisa de login com senha ou basta o link por e-mail.

## Detalhes técnicos
- Novas tabelas: conteudos, planos, eventos, configuracoes, modelos_email, auditoria, aceites_termos; todas com RLS, leitura pública só do que é exibido no site, escrita só para admin via has_role.
- Alteração de preço e liberação de PPV por edge function; webhook do Stripe continua como única fonte do status de pagamento.
- Exportação .xlsx no navegador com biblioteca de planilhas; dados vêm já filtrados pelo servidor.
- Nunca editável pelo painel: webhook, cálculo de acesso, checagem de papéis, chaves e integrações.

## Riscos
- Mudar textos para o banco pode deixar a página sem texto se o cache falhar; por isso o texto padrão permanece como reserva.
- A senha atual do admin é fraca e já foi compartilhada no chat; trocar no Bloco 8 ou antes.
- O webhook marca o membro pelo e-mail; e-mails digitados diferentes no cadastro e no pagamento quebram o vínculo. Corrigir no Bloco 4 ligando pelo identificador da sessão.
