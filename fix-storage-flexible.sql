-- Políticas de Storage MUY flexibles
-- Ejecutar este script en el editor SQL de Supabase

-- 1. Eliminar todas las políticas existentes
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
    END LOOP;
END $$;

-- 2. Crear políticas MUY permisivas
-- Política para lectura (cualquiera puede leer)
CREATE POLICY "Anyone can read" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment-vouchers');

-- Política para inserción (cualquiera puede subir)
CREATE POLICY "Anyone can upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'payment-vouchers');

-- Política para actualización (cualquiera puede actualizar)
CREATE POLICY "Anyone can update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'payment-vouchers');

-- Política para eliminación (cualquiera puede eliminar)
CREATE POLICY "Anyone can delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'payment-vouchers');

-- 3. Verificar políticas creadas
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;
