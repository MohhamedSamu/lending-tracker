-- Script para actualizar cuenta de Ingrid Calderon a Pablo Hernandez
-- Ejecutar en el editor SQL de Supabase

-- Actualizar email y nombre de la cuenta existente
UPDATE users
SET 
  email = 'paolomhf@gmail.com',
  name = 'Pablo Hernandez',
  updated_at = NOW()
WHERE email = 'abax07@gmail.com';

-- Verificar que el cambio se realizó correctamente
SELECT id, email, name, role, loan_amount, monthly_payment, loan_start_date, loan_duration_months
FROM users
WHERE email = 'paolomhf@gmail.com';

