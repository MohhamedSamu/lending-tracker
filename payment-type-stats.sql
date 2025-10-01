-- Estadísticas de tipos de pagos
-- Ejecutar este script en el editor SQL de Supabase

-- 1. Verificar estructura de la tabla payments
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Estadísticas por tipo de pago
SELECT 
  payment_type,
  COUNT(*) as total_payments,
  SUM(amount) as total_amount,
  AVG(amount) as average_amount,
  MIN(amount) as min_amount,
  MAX(amount) as max_amount
FROM public.payments 
GROUP BY payment_type
ORDER BY payment_type;

-- 3. Estadísticas por usuario y tipo de pago
SELECT 
  u.name,
  u.email,
  p.payment_type,
  COUNT(*) as payment_count,
  SUM(p.amount) as total_amount
FROM public.payments p
JOIN public.users u ON p.user_id = u.id
GROUP BY u.id, u.name, u.email, p.payment_type
ORDER BY u.name, p.payment_type;

-- 4. Pagos recientes con tipo
SELECT 
  u.name,
  p.amount,
  p.payment_type,
  p.payment_date,
  p.notes
FROM public.payments p
JOIN public.users u ON p.user_id = u.id
ORDER BY p.created_at DESC 
LIMIT 10;
