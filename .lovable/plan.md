## Objetivo
Substituir os campos de link (certificado e documento) por upload de arquivos com compressão automática client-side (WebP) antes de enviar para o storage, e exibir as imagens no painel admin.

## Mudanças

### 1. Storage (Lovable Cloud)
- Criar bucket privado `atletas-docs` (acesso somente via admin).
- Políticas RLS em `storage.objects`:
  - INSERT público (anon) restrito ao bucket — atletas anônimos precisam subir antes de existir conta.
  - SELECT/DELETE apenas para `has_role(auth.uid(),'admin')`.
- Organização de pastas: `{uuid-da-inscricao-temp}/certificado.webp`, `identidade-frente.webp`, `identidade-verso.webp`.

### 2. Schema
- Renomear semanticamente em `inscricoes_atletas`:
  - `link_certificado` → continua usado, mas guardará o **path** no storage (ex: `abc123/certificado.webp`).
  - `link_documento` → `link_documento_frente` (path).
  - Adicionar `link_documento_verso` (path).
- Migration: adicionar nova coluna `link_documento_verso text`; manter as outras (sem renomear para não quebrar) — `link_documento` passa a representar a frente.

### 3. Formulário público (`AthleteForm.tsx`)
- Substituir 3 inputs URL por 3 inputs `type="file"` com `accept="image/*,application/pdf"`.
- Pipeline client-side antes do upload:
  1. Se PDF → enviar como está (certificado pode ser PDF).
  2. Se imagem → carregar em `<canvas>`, redimensionar para máx 1600px no maior lado, exportar como WebP qualidade 0.82.
  3. Limite final ~500KB; se exceder, recomprimir com qualidade menor.
- Upload via `supabase.storage.from('atletas-docs').upload(path, blob)` usando UUID temporário gerado no submit.
- Salvar os 3 paths nas colunas correspondentes do insert.
- Remover componente `DriveTutorial` da página (não mais necessário) — manter arquivo, só não importar.
- Estados: progresso por arquivo, mensagens de erro, validação de tipo/tamanho máximo de origem (ex: 15MB).

### 4. Painel Admin (`Admin.tsx`)
- No drawer de detalhes do atleta, substituir links externos por:
  - Thumbnail clicável (signed URL gerada sob demanda, expiração 1h) para certificado, doc frente, doc verso.
  - Botão "Baixar" que abre a signed URL.
- Helper `getSignedUrl(path)` usando `supabase.storage.from('atletas-docs').createSignedUrl(path, 3600)`.

### 5. i18n
- Novas chaves em `pt/en/es`:
  - `form.certificate_upload`, `form.id_front_upload`, `form.id_back_upload`
  - `form.upload_hint` (formatos aceitos, tamanho)
  - `form.compressing`, `form.uploading`, `form.upload_error`
- Remover/ajustar chaves antigas `*_placeholder` que sugeriam URL.

## Detalhes técnicos
- Compressão pura no browser, sem libs externas (Canvas API + `canvas.toBlob('image/webp', 0.82)`).
- Fallback: se navegador não suportar WebP no encode, cai para JPEG 0.85.
- Nome do arquivo no storage sempre normalizado (sem acentos, lowercase).
- `inscricoes_atletas` continua aceitando INSERT público (sem mudanças de RLS na tabela).
- Bucket privado garante que nenhuma URL pública seja exposta; admin sempre passa por signed URL.

## Arquivos afetados
- `supabase/migrations/<novo>.sql` — bucket + policies + coluna `link_documento_verso`.
- `src/components/AthleteForm.tsx` — UI + lógica de upload/compressão.
- `src/lib/imageCompress.ts` (novo) — helper de compressão.
- `src/pages/Admin.tsx` — exibição de thumbnails e signed URLs.
- `src/messages/{pt,en,es}.json` — novas chaves.

## Fora de escopo
- Reprocessar inscrições antigas (continuarão com links antigos vazios/quebrados).
- Upload no formulário PPV (sem arquivos).
