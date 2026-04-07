

## Plano: Tornar o site Karate Legends funcional

### O que será feito

1. **Página de Atletas — Formulário de inscrição completo**
   - Criar formulário no site com campos: nome, email, WhatsApp, faixa, associação, cidade/país, upload de vídeo (link do YouTube/Drive)
   - Os dados serão enviados para uma planilha do Google Sheets automaticamente
   - Método: Google Apps Script como "API gratuita" — você cria um script no Google Sheets que recebe os dados. Sem custo, sem API key complexa

2. **Página PPV — Formulário de captura de interessados**
   - Substituir os botões "Buy Now" por um formulário de "Lista de Espera" com campos: nome, email, WhatsApp
   - Mensagem clara: "Em breve! Cadastre-se para ser avisado quando os ingressos estiverem disponíveis"
   - Dados salvos na mesma planilha (aba separada) via Google Apps Script

3. **Footer — Redes sociais**
   - Instagram: `www.instagram.com/karatelegendsleague`
   - Remover Facebook, Twitter e YouTube (ou deixar ocultos até ter perfis)

### Como funciona a integração com Google Sheets

Você precisará fazer **um passo manual** no Google:

1. Criar uma planilha no Google Sheets com 2 abas: "Atletas" e "Interessados PPV"
2. Ir em Extensões → Apps Script, colar um código que eu vou gerar para você
3. Publicar como "Web App" (acesso: qualquer pessoa)
4. Me enviar a URL gerada — eu coloco no código do site

Depois disso, toda submissão do site vai direto para sua planilha.

### Etapas técnicas

| # | Tarefa | Arquivos |
|---|--------|----------|
| 1 | Criar componente de formulário de atletas com validação | `src/components/AthleteForm.tsx` |
| 2 | Reescrever página Athletes com formulário integrado | `src/pages/Athletes.tsx` |
| 3 | Reescrever página PPV com formulário de lista de espera | `src/pages/PPV.tsx` |
| 4 | Atualizar Footer com link real do Instagram e remover redes inexistentes | `src/components/layout/Footer.tsx` |
| 5 | Gerar o código do Google Apps Script para você colar na planilha | Arquivo auxiliar para você copiar |
| 6 | Adicionar chaves de tradução faltantes nos 3 idiomas | `src/messages/*.json` |

### Sobre upload de vídeos

Como o Google Sheets não aceita upload direto de arquivos grandes, o formulário pedirá um **link** (YouTube, Google Drive ou similar) em vez de upload direto. Isso é mais prático para atletas e evita custos de armazenamento.

