-- Gestor de Pagos de Préstamos - Setup SQL
-- Ejecutar estas consultas en el editor SQL de Supabase

-- 1. Crear tabla de usuarios
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) CHECK (role IN ('borrower', 'lender')) NOT NULL,
  password_hash TEXT NOT NULL,
  loan_amount DECIMAL(12,2),
  monthly_payment DECIMAL(12,2),
  loan_start_date DATE,
  loan_duration_months INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla de pagos
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  voucher_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear índices para mejor rendimiento
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 4. Insertar usuarios de ejemplo
-- Contraseña para todos: password123
-- Hash generado con bcrypt (rounds: 12)
INSERT INTO users (email, name, role, password_hash, loan_amount, monthly_payment, loan_start_date, loan_duration_months) VALUES
('prestamista@email.com', 'Prestamista Principal', 'lender', '$2a$12$IRwE2xSFcdhOJJNW0kSHUefiP7YCsmEfSFlWmD5gtTrJlfh5NbZXu', NULL, NULL, NULL, NULL),
('prestatario1@email.com', 'Prestatario Uno', 'borrower', '$2a$12$IRwE2xSFcdhOJJNW0kSHUefiP7YCsmEfSFlWmD5gtTrJlfh5NbZXu', 50000.00, 500.00, '2024-01-01', 180),
('prestatario2@email.com', 'Prestatario Dos', 'borrower', '$2a$12$IRwE2xSFcdhOJJNW0kSHUefiP7YCsmEfSFlWmD5gtTrJlfh5NbZXu', 30000.00, 400.00, '2024-06-01', 120);

-- 5. Insertar algunos pagos de ejemplo (opcional)
INSERT INTO payments (user_id, amount, payment_date, notes) 
SELECT 
  u.id,
  CASE u.email 
    WHEN 'prestatario1@email.com' THEN 500.00
    WHEN 'prestatario2@email.com' THEN 400.00
  END,
  CURRENT_DATE - INTERVAL '1 month',
  'Pago mensual de ' || TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'Month YYYY')
FROM users u 
WHERE u.role = 'borrower';

-- 6. Configurar Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de seguridad para usuarios
-- Los usuarios solo pueden ver y modificar su propia información
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Los prestamistas pueden ver todos los usuarios
CREATE POLICY "Lenders can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'lender'
    )
  );

-- 8. Políticas de seguridad para pagos
-- Los usuarios pueden ver sus propios pagos
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    user_id::text = auth.uid()::text
  );

-- Los prestatarios pueden insertar y actualizar sus propios pagos
CREATE POLICY "Borrowers can insert own payments" ON payments
  FOR INSERT WITH CHECK (
    user_id::text = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'borrower'
    )
  );

CREATE POLICY "Borrowers can update own payments" ON payments
  FOR UPDATE USING (
    user_id::text = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'borrower'
    )
  );

-- Los prestamistas pueden ver todos los pagos
CREATE POLICY "Lenders can view all payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'lender'
    )
  );

-- 9. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Triggers para actualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Configurar Storage Bucket (ejecutar en la sección Storage de Supabase)
-- Crear bucket: payment-vouchers
-- Configurar como público: false
-- Permitir tipos de archivo: image/*, application/pdf

-- 12. Políticas para Storage (ejecutar después de crear el bucket)
-- INSERT policy para payment-vouchers bucket
-- CREATE POLICY "Users can upload vouchers" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'payment-vouchers' AND
--     auth.uid()::text IS NOT NULL
--   );

-- SELECT policy para payment-vouchers bucket  
-- CREATE POLICY "Users can view vouchers" ON storage.objects
--   FOR SELECT USING (
--     bucket_id = 'payment-vouchers'
--   );
