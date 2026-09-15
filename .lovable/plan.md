# Plano: Redesign “Elite Gold Prestige”

## Objetivo
Unificar o site público, a inscrição de atletas e a área administrativa em uma identidade premium de esporte de combate: preto ônix, dourado metálico convincente, títulos fortes em Bebas Neue e controles claros em DM Sans. Todo o conteúdo e as funções atuais serão preservados.

## 1. Identidade e sistema visual
- Consolidar cores, sombras, superfícies, estados e dourados em tokens semânticos únicos.
- Trocar o dourado plano/repetitivo por uma aplicação metálica controlada: sombras profundas, faixa especular estreita e brilho direcional apenas nos elementos principais.
- Reservar Bebas Neue para títulos curtos, números e navegação; usar DM Sans para textos, perguntas, campos e informações operacionais.
- Aumentar contraste de textos auxiliares e uniformizar bordas, focos, estados de erro e sucesso.
- Remover estilos antigos ou duplicados que contradizem a nova direção.

## 2. Marca e imagens
- Usar o símbolo e o logotipo atuais com regras consistentes de tamanho, respiro e aplicação.
- Criar com GPT Image 2 versões refinadas da marca atual para fundo escuro, preservando rigorosamente o desenho e a leitura “Karate Legends”.
- Produzir variações necessárias: símbolo, assinatura horizontal e tratamento metálico mais sóbrio, sem reinventar a marca.
- Otimizar os arquivos finais para uso rápido no site, mantendo transparência quando necessário após o tratamento.
- Substituir imagens externas frágeis por ativos locais e aplicar uma direção fotográfica coerente, cinematográfica e nítida.

## 3. Site público
- Refinar navegação e rodapé para que a marca tenha mais presença sem competir com o conteúdo.
- Reestruturar a página inicial com melhor leitura sobre a foto, hierarquia mais precisa e chamadas principais mais táteis.
- Harmonizar Eventos, Blog e PPV com o mesmo ritmo editorial, cartões mais limpos e tratamentos fotográficos consistentes.
- Manter a próxima seção parcialmente visível abaixo da abertura e garantir boa composição em celulares, tablets e desktops.
- Corrigir metadados para refletir “The World Stage for Karate” e a oferta atual.

## 4. Inscrição de atletas
- Organizar o formulário em etapas claras: perfil, credenciais, documentos e confirmação.
- Adicionar progresso visível, agrupamento lógico, validação por etapa e resumo antes do envio.
- Destacar os uploads de certificado e identidade como uma etapa segura, mostrando arquivo, redução de tamanho e estado de processamento.
- Preservar compressão, armazenamento privado, campos condicionais, aceites legais e pagamento.
- Redesenhar requisitos e FAQ para leitura rápida, sem aumentar o volume de texto.

## 5. PPV e lista de espera
- Dar ao PPV uma apresentação visual de produto, com maior clareza sobre transmissão, dispositivos e disponibilidade.
- Integrar a lista de espera à mesma linguagem premium, com foco evidente na ação principal.
- Não inventar preço, data ou promessa comercial ainda não fornecidos.

## 6. Área administrativa
- Transformar o painel em uma central de acompanhamento mais clara e densa, sem aparência genérica de painel pronto.
- Aplicar cabeçalho operacional, indicadores consistentes, filtros compactos, tabela legível e visão mobile por cartões.
- Unificar status em uma paleta sóbria, usando cores funcionais apenas quando realmente necessárias.
- Melhorar o painel lateral do atleta, visualização de documentos, cópia de contato, pagamento, observações e ações.
- Trocar confirmações nativas por diálogos próprios e acessíveis.
- Manter o acesso existente, mas remover a senha exposta visualmente na tela de login e a opção pública de criar conta.

## 7. Movimento, acessibilidade e qualidade
- Aplicar movimentos curtos e controlados: entrada editorial, realce metálico em ações principais e feedback de estado.
- Respeitar redução de movimento, navegação por teclado, foco visível e contraste adequado.
- Validar as páginas principais e o painel em desktop e celular, incluindo login, filtros, formulário, uploads e abertura de documentos.
- Corrigir avisos de interface encontrados durante a auditoria e confirmar ausência de erros no preview.

## Detalhes técnicos
- Alterações concentradas na apresentação React/Tailwind e nos ativos da marca; sem mudanças na estrutura dos dados ou nas regras de armazenamento.
- Cores e efeitos novos serão definidos no sistema global e consumidos por classes semânticas.
- Imagens geradas/editadas serão armazenadas no próprio projeto, sem links externos.
- A senha continua sendo a solicitada; apenas deixa de aparecer para qualquer visitante da página de login.

## Resultado esperado
Um produto visualmente coerente de ponta a ponta: impacto cinematográfico no site, inscrição simples e confiável para atletas, e uma área administrativa rápida para acompanhar pagamentos, documentos e decisões.
