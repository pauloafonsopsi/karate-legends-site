
-- Tabela: Inscrições de Atletas
CREATE TABLE public.inscricoes_atletas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  estilo TEXT NOT NULL,
  graduacao TEXT NOT NULL,
  associacao TEXT,
  cidade TEXT,
  pais TEXT,
  link_video TEXT,
  link_certificado TEXT,
  link_documento TEXT,
  redes_sociais TEXT
);

-- Tabela: Lista de Espera PPV
CREATE TABLE public.lista_espera_ppv (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.inscricoes_atletas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lista_espera_ppv ENABLE ROW LEVEL SECURITY;

-- Política: qualquer pessoa pode inserir (formulário público, sem autenticação)
CREATE POLICY "Qualquer pessoa pode se inscrever como atleta"
ON public.inscricoes_atletas
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Qualquer pessoa pode entrar na lista de espera"
ON public.lista_espera_ppv
FOR INSERT
WITH CHECK (true);

-- Política: ninguém pode ler os dados diretamente (apenas via admin/dashboard)
-- Sem política SELECT = nenhum acesso de leitura via API
