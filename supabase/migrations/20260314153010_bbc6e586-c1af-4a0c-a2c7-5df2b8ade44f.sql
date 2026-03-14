
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS ncm text DEFAULT '00000000',
  ADD COLUMN IF NOT EXISTS cfop integer DEFAULT 5102,
  ADD COLUMN IF NOT EXISTS cest text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ean text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS unidade_comercial text DEFAULT 'UND',
  ADD COLUMN IF NOT EXISTS origem_produto integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cod_situacao_tributaria_icms text DEFAULT '102',
  ADD COLUMN IF NOT EXISTS cod_situacao_tributaria_pis text DEFAULT '07',
  ADD COLUMN IF NOT EXISTS cod_situacao_tributaria_cofins text DEFAULT '07';
