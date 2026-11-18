-- =============================================================================
-- EJECUTA ESTE SCRIPT EN SUPABASE -> SQL EDITOR -> NEW QUERY -> RUN
-- Proyecto: https://tcyndqzzawwcqqvcsbvu.supabase.co
-- 1. Otorga permisos y políticas RLS a `usuarios` y `perfiles_profesionales`
--    para que Registro e Inicio de Sesión guarden y consulten con tu llave
--    `sb_publishable_txO2mh73LE4sY8AqzTiujA_jniwTOrQ`.
-- 2. Crea la tabla `solicitudes_uber` para sincronizar la solicitud única
--    y el avance de la ruta estilo Uber entre Cliente y Profesional.
-- =============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

ALTER TABLE IF EXISTS public.usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "permitir_registro_y_lectura_usuarios" ON public.usuarios;
CREATE POLICY "permitir_registro_y_lectura_usuarios"
    ON public.usuarios
    FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

ALTER TABLE IF EXISTS public.perfiles_profesionales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "permitir_registro_y_lectura_profesionales" ON public.perfiles_profesionales;
CREATE POLICY "permitir_registro_y_lectura_profesionales"
    ON public.perfiles_profesionales
    FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.solicitudes_uber (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_reserva VARCHAR(30) UNIQUE NOT NULL,
    cliente_nombre VARCHAR(150) NOT NULL,
    profesional_nombre VARCHAR(150) NOT NULL,
    servicio_nombre VARCHAR(200) NOT NULL,
    modalidad VARCHAR(30) NOT NULL DEFAULT 'domicilio',
    estado VARCHAR(40) NOT NULL DEFAULT 'buscando_profesional',
    direccion_servicio TEXT,
    latitud_servicio DOUBLE PRECISION DEFAULT 3.3712,
    longitud_servicio DOUBLE PRECISION DEFAULT -76.5320,
    latitud_profesional DOUBLE PRECISION DEFAULT 3.3792,
    longitud_profesional DOUBLE PRECISION DEFAULT -76.5395,
    precio_total_cop BIGINT NOT NULL DEFAULT 55000,
    valor_comision_cop BIGINT NOT NULL DEFAULT 5500,
    progreso_ruta INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT ALL ON TABLE public.solicitudes_uber TO anon, authenticated, service_role;
ALTER TABLE public.solicitudes_uber ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "permitir_todo_solicitudes_uber" ON public.solicitudes_uber;
CREATE POLICY "permitir_todo_solicitudes_uber"
    ON public.solicitudes_uber
    FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);
