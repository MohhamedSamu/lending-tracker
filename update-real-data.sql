-- Actualizar con datos reales de los usuarios
-- Ejecutar este script en el editor SQL de Supabase

-- 1. Eliminar datos existentes
DELETE FROM payments;
DELETE FROM users;

-- 2. Insertar usuarios con datos reales
-- Contraseña para todos: password123
-- Hash generado con bcrypt (rounds: 12)
INSERT INTO users (email, name, role, password_hash, loan_amount, monthly_payment, loan_start_date, loan_duration_months) VALUES
('prestamista@gmail.com', 'Samuel Calderon', 'lender', '$2a$12$IRwE2xSFcdhOJJNW0kSHUefiP7YCsmEfSFlWmD5gtTrJlfh5NbZXu', NULL, NULL, NULL, NULL),
('sfernandocalderon@gmail.com', 'Samuel Calderon', 'borrower', '$2a$12$IRwE2xSFcdhOJJNW0kSHUefiP7YCsmEfSFlWmD5gtTrJlfh5NbZXu', 40500.00, 225.00, '2024-01-01', 180),
('abax07@gmail.com', 'Ingrid Calderon', 'borrower', '$2a$12$IRwE2xSFcdhOJJNW0kSHUefiP7YCsmEfSFlWmD5gtTrJlfh5NbZXu', 37500.00, 300.00, '2024-06-01', 125);

-- 3. Insertar algunos pagos de ejemplo para Samuel (Prestatario 1)
INSERT INTO payments (user_id, amount, payment_date, notes) 
SELECT 
  u.id,
  225.00,
  '2024-01-25',
  'Pago mensual de enero 2024'
FROM users u 
WHERE u.email = 'sfernandocalderon@gmail.com';

INSERT INTO payments (user_id, amount, payment_date, notes) 
SELECT 
  u.id,
  225.00,
  '2024-02-28',
  'Pago mensual de febrero 2024'
FROM users u 
WHERE u.email = 'sfernandocalderon@gmail.com';

INSERT INTO payments (user_id, amount, payment_date, notes) 
SELECT 
  u.id,
  225.00,
  '2024-03-26',
  'Pago mensual de marzo 2024'
FROM users u 
WHERE u.email = 'sfernandocalderon@gmail.com';

-- 4. Insertar algunos pagos de ejemplo para Ingrid (Prestatario 2)
INSERT INTO payments (user_id, amount, payment_date, notes) 
SELECT 
  u.id,
  300.00,
  '2024-06-25',
  'Pago mensual de junio 2024'
FROM users u 
WHERE u.email = 'abax07@gmail.com';

INSERT INTO payments (user_id, amount, payment_date, notes) 
SELECT 
  u.id,
  300.00,
  '2024-07-29',
  'Pago mensual de julio 2024'
FROM users u 
WHERE u.email = 'abax07@gmail.com';

-- 5. Verificar datos insertados
SELECT 
  u.name,
  u.email,
  u.role,
  u.loan_amount,
  u.monthly_payment,
  u.loan_duration_months,
  COUNT(p.id) as total_payments,
  COALESCE(SUM(p.amount), 0) as total_paid
FROM users u
LEFT JOIN payments p ON u.id = p.user_id
GROUP BY u.id, u.name, u.email, u.role, u.loan_amount, u.monthly_payment, u.loan_duration_months
ORDER BY u.role, u.name;
