-- Agregar bandera de tipo de pago a la tabla payments
-- Ejecutar este script en el editor SQL de Supabase

-- 1. Agregar columna payment_type a la tabla payments
ALTER TABLE public.payments 
ADD COLUMN payment_type VARCHAR(20) DEFAULT 'minimum' CHECK (payment_type IN ('minimum', 'extra'));

-- 2. Agregar comentario a la columna
COMMENT ON COLUMN public.payments.payment_type IS 'Tipo de pago: minimum (pago mínimo) o extra (pago extra)';

-- 3. Crear índice para mejorar consultas por tipo de pago
CREATE INDEX idx_payments_payment_type ON public.payments(payment_type);

-- 4. Actualizar registros existentes (todos serán 'minimum' por defecto)
UPDATE public.payments 
SET payment_type = 'minimum' 
WHERE payment_type IS NULL;

-- 5. Hacer la columna NOT NULL después de actualizar
ALTER TABLE public.payments 
ALTER COLUMN payment_type SET NOT NULL;

-- 6. Verificar la estructura de la tabla
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Mostrar algunos registros de ejemplo
SELECT 
  id,
  user_id,
  amount,
  payment_date,
  payment_type,
  notes,
  created_at
FROM public.payments 
ORDER BY created_at DESC 
LIMIT 5;
