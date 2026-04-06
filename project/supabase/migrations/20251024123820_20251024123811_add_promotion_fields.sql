/*
  # Adicionar Campos de Promoção aos Serviços

  1. Alterações
    - Adiciona coluna `promotion_active` (boolean) - indica se o serviço está em promoção
    - Adiciona coluna `promotion_price` (numeric) - preço promocional quando ativo
    
  2. Valores Padrão
    - `promotion_active` padrão: false
    - `promotion_price` padrão: null
    
  3. Segurança
    - Atualiza políticas RLS para permitir leitura dos novos campos
    - Mantém restrições de escrita apenas para donos do salão
*/

-- Adicionar campos de promoção à tabela services
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'promotion_active'
  ) THEN
    ALTER TABLE services ADD COLUMN promotion_active boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'promotion_price'
  ) THEN
    ALTER TABLE services ADD COLUMN promotion_price numeric(10,2) DEFAULT NULL;
  END IF;
END $$;

-- Adicionar comentários nas colunas
COMMENT ON COLUMN services.promotion_active IS 'Indica se o serviço está em promoção';
COMMENT ON COLUMN services.promotion_price IS 'Preço promocional quando a promoção está ativa';