-- Migración: Agregar políticas RLS para que docentes puedan crear sesiones
-- Ejecutar en Supabase SQL Editor
-- 
-- Esta migración permite a los docentes autenticados crear, actualizar y eliminar
-- sus propias sesiones, mientras que los estudiantes pueden ver todas las sesiones
-- para poder unirse con un código.

-- 1. Permitir que docentes autenticados creen sesiones
-- (teacher_id debe coincidir con el usuario autenticado)
CREATE POLICY "Teachers can create sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);

-- 2. Permitir que docentes actualicen sus propias sesiones
CREATE POLICY "Teachers can update own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = teacher_id);

-- 3. Permitir que docentes eliminen sus propias sesiones
CREATE POLICY "Teachers can delete own sessions" ON sessions
  FOR DELETE USING (auth.uid() = teacher_id);

-- 4. Habilitar email/password auth en Supabase (si no está habilitado):
-- Ve a Authentication > Providers en el dashboard de Supabase y asegúrate
-- de que Email esté habilitado.

-- 5. (Opcional) Deshabilitar confirmación de email para desarrollo:
-- Ve a Authentication > Settings > Email Auth
-- y desactiva "Enable email confirmations" si quieres que los docentes
-- puedan iniciar sesión inmediatamente sin confirmar su email.
-- Para producción, déjalo habilitado.