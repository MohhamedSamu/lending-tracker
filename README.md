# Gestor de Pagos de Préstamos

Una aplicación web moderna para gestionar pagos de préstamos familiares, construida con Next.js, TypeScript, Tailwind CSS y Supabase.

## 🚀 Características

- **Dashboard personalizado** para prestatarios y prestamistas
- **Gestión de pagos** con fechas, montos y vouchers de transferencia
- **Almacenamiento seguro** de imágenes de vouchers
- **Cálculos automáticos** de progreso, tiempo restante y estadísticas
- **Autenticación segura** con contraseñas encriptadas
- **Interfaz responsive** y moderna
- **Gráficos interactivos** para visualizar el progreso

## 🏗️ Arquitectura

- **Frontend**: Next.js 14 con TypeScript
- **Estilos**: Tailwind CSS
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Sistema personalizado con bcrypt
- **Almacenamiento**: Supabase Storage para vouchers
- **Deployment**: Vercel

## 🛠️ Configuración del Proyecto

### 1. Clonar e instalar dependencias

\`\`\`bash
git clone [url-del-repositorio]
cd lending_payment_manager
npm install
\`\`\`

### 2. Configurar Supabase

1. Crea un nuevo proyecto en [Supabase](https://supabase.com)
2. Ve a Settings > API y copia las credenciales
3. Crea un archivo \`.env.local\` basado en \`env.example\`:
ZfJKIIEIjYWaDV0N

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
SUPABASE_SERVICE_ROLE_KEY=tu_clave_de_servicio
\`\`\`

### 3. Configurar la base de datos

Ejecuta las siguientes consultas SQL en el editor de Supabase:

\`\`\`sql
-- Crear tabla de usuarios
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

-- Crear tabla de pagos
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

-- Crear índices para mejor rendimiento
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- Insertar usuarios de ejemplo (contraseñas: password123)
INSERT INTO users (email, name, role, password_hash, loan_amount, monthly_payment, loan_start_date, loan_duration_months) VALUES
('prestamista@email.com', 'Prestamista Principal', 'lender', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqyqdvMB6JqX9LjLF5B8.1G', NULL, NULL, NULL, NULL),
('prestatario1@email.com', 'Prestatario Uno', 'borrower', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqyqdvMB6JqX9LjLF5B8.1G', 50000.00, 500.00, '2024-01-01', 180),
('prestatario2@email.com', 'Prestatario Dos', 'borrower', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqyqdvMB6JqX9LjLF5B8.1G', 30000.00, 400.00, '2024-06-01', 120);
\`\`\`

### 4. Configurar Storage

1. Ve a Storage en tu dashboard de Supabase
2. Crea un bucket llamado \`payment-vouchers\`
3. Configura las políticas de acceso:

\`\`\`sql
-- Política para permitir que los usuarios suban archivos
CREATE POLICY "Users can upload vouchers" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'payment-vouchers');

-- Política para permitir que todos vean los vouchers
CREATE POLICY "Anyone can view vouchers" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment-vouchers');
\`\`\`

### 5. Ejecutar en desarrollo

\`\`\`bash
npm run dev
\`\`\`

La aplicación estará disponible en \`http://localhost:3000\`

## 👥 Usuarios de Demostración

- **Prestamista**: prestamista@gmail.com (Samuel Calderon)
- **Prestatario 1**: sfernandocalderon@gmail.com (Samuel Calderon - $40,500 / 15 años)
- **Prestatario 2**: abax07@gmail.com (Ingrid Calderon - $37,500 / 10.5 años)

**Contraseña inicial para todos**: \`password123\`

## 🚀 Deployment en Vercel

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en Vercel:
   - \`NEXT_PUBLIC_SUPABASE_URL\`
   - \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
   - \`SUPABASE_SERVICE_ROLE_KEY\`
3. Deploy automático con cada push a main

## 📱 Funcionalidades por Rol

### Prestatario
- Ver dashboard personal con estadísticas
- Agregar nuevos pagos con vouchers
- Ver historial completo de pagos
- Cambiar contraseña
- Ver progreso y tiempo restante

### Prestamista
- Ver dashboard consolidado de todos los préstamos
- Monitorear progreso de cada prestatario
- Ver estadísticas generales
- Acceder a todos los vouchers de pago

## 🔧 Tecnologías Utilizadas

- **Next.js 14** - Framework React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utilitarios
- **Supabase** - Backend como servicio
- **bcryptjs** - Encriptación de contraseñas
- **Recharts** - Gráficos y visualizaciones
- **date-fns** - Manipulación de fechas
- **react-hook-form** - Manejo de formularios
- **react-hot-toast** - Notificaciones

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
