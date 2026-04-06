

## Plano: Montar o site Karate Legends no Lovable

### Resumo
Recriar o site Karate Legends com todas as 6 páginas, navegação, footer, sistema de internacionalização (PT/EN/ES), e o design system escuro com dourado.

### Dependências a instalar
- `i18next`, `react-i18next`, `i18next-browser-languagedetector` — internacionalização
- `motion` (Framer Motion v11+) — animações na Home
- `lucide-react` — ícones (já disponível no projeto)

### Estrutura de arquivos

```text
src/
├── lib/
│   ├── i18n.ts              (config i18next)
│   └── utils.ts             (existente)
├── messages/
│   ├── pt.json
│   ├── en.json
│   └── es.json
├── components/
│   └── layout/
│       ├── Navbar.tsx
│       └── Footer.tsx
├── pages/
│   ├── Home.tsx
│   ├── Events.tsx
│   ├── EventDetail.tsx
│   ├── Athletes.tsx
│   ├── Blog.tsx
│   └── PPV.tsx
├── App.tsx                   (reescrever rotas)
├── index.css                 (reescrever design system)
└── main.tsx                  (adicionar i18n)
public/
└── logo.png                  (aguardando upload)
```

### Etapas

1. **Instalar dependências**: `i18next`, `react-i18next`, `i18next-browser-languagedetector`, `motion`

2. **Reescrever `src/index.css`**: Substituir o design system atual pelo tema escuro com cores gold, fontes Bebas Neue + DM Sans, e utilitários CSS customizados (gold-gradient, btn-gold, card-premium, glass-morphism)

3. **Criar arquivos de tradução**: `src/messages/pt.json`, `en.json`, `es.json` com todas as chaves

4. **Criar `src/lib/i18n.ts`**: Configuração do i18next com detecção de idioma e fallback para PT

5. **Criar componentes de layout**: Navbar (com scroll effect, mobile menu, language switcher) e Footer

6. **Criar as 6 páginas**: Home (hero + countdown + stats), Events, EventDetail, Athletes, Blog, PPV — portando o código dos arquivos enviados com ajustes de import paths

7. **Reescrever `src/App.tsx`**: Remover providers antigos desnecessários, adicionar I18nextProvider, configurar rotas (`/`, `/eventos`, `/eventos/:slug`, `/atletas`, `/blog`, `/ppv`)

8. **Atualizar `src/main.tsx`**: Importar i18n para inicialização

### Adaptações necessárias
- O CSS original usa Tailwind v4 (`@import "tailwindcss"`, `@theme`). Nosso projeto usa Tailwind v3 com `tailwind.config.ts` — adaptarei as cores e fontes customizadas para o formato v3 (`extend` no config + variáveis CSS)
- Import paths serão ajustados de `@/*` (root) para `@/*` (src)
- O `utils.ts` do projeto original é diferente — manterei o existente com `cn()`

### Nota sobre logo
O site referencia `/logo.png` em vários componentes. Preciso que você envie este arquivo para que ele apareça corretamente. Caso não tenha, posso usar um placeholder textual.

