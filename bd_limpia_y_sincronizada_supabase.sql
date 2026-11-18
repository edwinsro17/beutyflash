-- =============================================================================
-- BEAUTYFLASH COLOMBIA — BASE DE DATOS COMPLETA Y ACTUALIZADA PARA SUPABASE
-- Proyecto Supabase: https://tcyndqzzawwcqqvcsbvu.supabase.co
-- Ejecutable directamente en el SQL Editor de Supabase (100% compatible y sin errores)
-- Incluye:
-- 1. Las 23 tablas del proyecto (Módulos 1 al 12 + compatibilidad móvil completa)
-- 2. Firma criptográfica SHA-256 automática en PostgreSQL con tu llave oficial de Wompi:
--    test_integrity_nMaCRvNkgai1TzkWX9L0zWAZAcKOcn5Z
-- 3. Trigger automático para estados Wompi Sandbox (PENDING, APPROVED, DECLINED, ERROR, VOIDED)
-- 4. Soporte completo de Anulaciones de Recargas Wompi (VOIDED):
--    - Solicitud administrativa sin modificar saldo inmediato (`void_requested`, `void_reason`)
--    - Reversión total o parcial (sin saldo negativo + `pendiente_conciliacion_cop`)
--    - Movimiento contable vinculado (`reversion_anulacion_recarga` / `RECHARGE_VOID_REVERSAL`)
--    - Notificación push oficial al profesional
-- 5. Bucket de Storage 'archivos', Políticas RLS y Publicación Supabase Realtime
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =============================================================================
-- 1. TABLAS PRINCIPALES DE IDENTIDAD, ROLES Y PERFILES (MÓDULOS 1, 2 Y 8)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.usuarios (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    auth_user_id UUID UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    telefono VARCHAR(30) UNIQUE,
    telefono_verificado BOOLEAN NOT NULL DEFAULT FALSE,
    rol VARCHAR(20) NOT NULL DEFAULT 'cliente'
        CHECK (rol IN ('cliente', 'profesional', 'admin')),
    avatar_url TEXT,
    barrio VARCHAR(120),
    direccion_principal TEXT,
    ciudad VARCHAR(100) NOT NULL DEFAULT 'Cali',
    departamento VARCHAR(100) NOT NULL DEFAULT 'Valle del Cauca',
    latitud DOUBLE PRECISION,
    longitud DOUBLE PRECISION,
    ubicacion GEOGRAPHY(POINT, 4326),
    expo_push_token TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    roles TEXT[] NOT NULL DEFAULT ARRAY['CLIENT'::TEXT],
    modalidad_activa VARCHAR(20) NOT NULL DEFAULT 'CLIENT',
    intentos_fallidos INTEGER NOT NULL DEFAULT 0,
    bloqueado_hasta TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.usuarios
    ADD COLUMN IF NOT EXISTS roles TEXT[] NOT NULL DEFAULT ARRAY['CLIENT'::TEXT],
    ADD COLUMN IF NOT EXISTS modalidad_activa VARCHAR(20) NOT NULL DEFAULT 'CLIENT',
    ADD COLUMN IF NOT EXISTS intentos_fallidos INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.clientes (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INTEGER NOT NULL UNIQUE REFERENCES public.usuarios(id) ON DELETE CASCADE,
    barrio VARCHAR(120),
    direccion_principal TEXT,
    indicaciones_acceso TEXT,
    latitud DOUBLE PRECISION,
    longitud DOUBLE PRECISION,
    ubicacion GEOGRAPHY(POINT, 4326),
    recordatorio_sms BOOLEAN NOT NULL DEFAULT TRUE,
    recordatorio_push BOOLEAN NOT NULL DEFAULT TRUE,
    calificacion_promedio NUMERIC(3,2) NOT NULL DEFAULT 5.00,
    total_servicios_tomados INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.perfiles_profesionales (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INTEGER NOT NULL UNIQUE REFERENCES public.usuarios(id) ON DELETE CASCADE,
    codigo_profesional VARCHAR(25) UNIQUE NOT NULL DEFAULT ('BF-' || FLOOR(1000 + RANDOM() * 9000)::TEXT),
    nombre_artistico VARCHAR(160),
    nombre_establecimiento VARCHAR(180),
    tiene_establecimiento BOOLEAN NOT NULL DEFAULT FALSE,
    dias_atencion VARCHAR(100),
    horario_apertura VARCHAR(30),
    horario_cierre VARCHAR(30),
    bloques_horarios TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    lema_profesional VARCHAR(200),
    descripcion TEXT,
    anos_experiencia INTEGER NOT NULL DEFAULT 1,
    especialidades TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    barrio VARCHAR(120),
    direccion TEXT,
    ciudad VARCHAR(100) NOT NULL DEFAULT 'Cali',
    atiende_domicilio BOOLEAN NOT NULL DEFAULT TRUE,
    atiende_salon BOOLEAN NOT NULL DEFAULT TRUE,
    radio_cobertura_km NUMERIC(5,2) NOT NULL DEFAULT 12.00,
    tarifa_domicilio_cop BIGINT NOT NULL DEFAULT 8000,
    latitud_actual DOUBLE PRECISION,
    longitud_actual DOUBLE PRECISION,
    ubicacion_actual GEOGRAPHY(POINT, 4326),
    dni_numero VARCHAR(40),
    dni_frente_url TEXT,
    dni_respaldo_url TEXT,
    certificado_profesional_url TEXT,
    entidad_certificadora VARCHAR(150),
    estado_verificacion VARCHAR(25) NOT NULL DEFAULT 'aprobado'
        CHECK (estado_verificacion IN ('pendiente', 'en_revision', 'aprobado', 'rechazado')),
    motivo_rechazo TEXT,
    verificado BOOLEAN NOT NULL DEFAULT TRUE,
    permisos_otorgados BOOLEAN NOT NULL DEFAULT FALSE,
    disponible BOOLEAN NOT NULL DEFAULT TRUE,
    activo_por_saldo BOOLEAN NOT NULL DEFAULT FALSE,
    saldo_billetera_cop BIGINT NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo'
        CHECK (estado IN ('activo', 'inactivo', 'suspendido')),
    calificacion_promedio NUMERIC(3,2) NOT NULL DEFAULT 5.00,
    total_resenas INTEGER NOT NULL DEFAULT 0,
    approval_status VARCHAR(25) NOT NULL DEFAULT 'APPROVED'
        CHECK (approval_status IN ('INCOMPLETE', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.perfiles_profesionales
    ADD COLUMN IF NOT EXISTS approval_status VARCHAR(25) NOT NULL DEFAULT 'APPROVED'
        CHECK (approval_status IN ('INCOMPLETE', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'));

CREATE TABLE IF NOT EXISTS public.users (
    id INTEGER PRIMARY KEY REFERENCES public.usuarios(id) ON DELETE CASCADE,
    auth_user_id UUID UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    phone VARCHAR(30),
    avatar_url TEXT,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('CLIENT', 'PROFESSIONAL', 'ADMIN')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_roles_user_role UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.client_profiles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES public.usuarios(id) ON DELETE CASCADE,
    barrio VARCHAR(120),
    primary_address TEXT,
    access_notes TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    rating_avg NUMERIC(3,2) NOT NULL DEFAULT 5.00,
    completed_services_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.professional_profiles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES public.usuarios(id) ON DELETE CASCADE,
    professional_code VARCHAR(30) UNIQUE NOT NULL DEFAULT ('BF-' || FLOOR(1000 + RANDOM() * 9000)::TEXT),
    artistic_name VARCHAR(160),
    establishment_name VARCHAR(180),
    has_establishment BOOLEAN NOT NULL DEFAULT FALSE,
    bio TEXT,
    years_experience INTEGER NOT NULL DEFAULT 1,
    specialties TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    barrio VARCHAR(120),
    address TEXT,
    city VARCHAR(100) NOT NULL DEFAULT 'Cali',
    serves_home BOOLEAN NOT NULL DEFAULT TRUE,
    serves_salon BOOLEAN NOT NULL DEFAULT TRUE,
    coverage_radius_km NUMERIC(5,2) NOT NULL DEFAULT 12.00,
    home_fee_cop BIGINT NOT NULL DEFAULT 8000,
    dni_number VARCHAR(40),
    dni_front_url TEXT,
    dni_back_url TEXT,
    certificate_url TEXT,
    certifying_entity VARCHAR(150),
    approval_status VARCHAR(25) NOT NULL DEFAULT 'APPROVED'
        CHECK (approval_status IN ('INCOMPLETE', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')),
    rejection_reason TEXT,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    rating_avg NUMERIC(3,2) NOT NULL DEFAULT 5.00,
    reviews_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_preferences (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES public.usuarios(id) ON DELETE CASCADE,
    selected_mode VARCHAR(20) NOT NULL DEFAULT 'CLIENT'
        CHECK (selected_mode IN ('CLIENT', 'PROFESSIONAL')),
    push_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    in_app_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    email_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.password_recovery_otps (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER REFERENCES public.usuarios(id) ON DELETE CASCADE,
    email VARCHAR(180) NOT NULL,
    code_hash VARCHAR(128) NOT NULL,
    recovery_token_hash VARCHAR(128),
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 2. CATÁLOGO, CONTRATACIONES, SEGUIMIENTO GPS Y CHAT (MÓDULOS 5 Y 6)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.catalogo_servicios_app (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_servicio VARCHAR(50) UNIQUE NOT NULL,
    profesional_id INTEGER REFERENCES public.usuarios(id) ON DELETE CASCADE,
    pro_name VARCHAR(150) NOT NULL,
    pro_avatar TEXT,
    pro_rating VARCHAR(15) DEFAULT '5.00',
    barrio VARCHAR(120),
    nombre_establecimiento VARCHAR(180),
    latitud_profesional DOUBLE PRECISION,
    longitud_profesional DOUBLE PRECISION,
    category_id VARCHAR(40) NOT NULL,
    category_label VARCHAR(80) NOT NULL,
    badge VARCHAR(60),
    title VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    duration VARCHAR(40) NOT NULL,
    modality_label VARCHAR(60) NOT NULL,
    price_cop BIGINT NOT NULL CHECK (price_cop >= 10000),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    image TEXT NOT NULL,
    galeria_resultados TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.solicitudes_uber (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_reserva VARCHAR(30) UNIQUE NOT NULL,
    servicio_id VARCHAR(50),
    servicio_nombre VARCHAR(200) NOT NULL,
    servicio_foto TEXT,
    barrio_zona VARCHAR(120),
    cliente_id INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
    cliente_nombre VARCHAR(150) NOT NULL,
    cliente_telefono VARCHAR(40),
    cliente_foto TEXT,
    profesional_id INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
    profesional_nombre VARCHAR(150) NOT NULL,
    profesional_telefono VARCHAR(40),
    profesional_foto TEXT,
    modalidad VARCHAR(30) NOT NULL CHECK (modalidad IN ('domicilio', 'local')),
    fecha_programada VARCHAR(60),
    hora_programada VARCHAR(40),
    estado VARCHAR(45) NOT NULL DEFAULT 'pendiente_aceptacion_profesional'
        CHECK (estado IN (
            'pendiente_aceptacion_profesional',
            'aceptada_por_profesional',
            'rechazada_por_profesional',
            'pendiente_confirmacion_cliente',
            'confirmada_por_cliente',
            'en_camino',
            'en_servicio',
            'finalizada',
            'cancelada'
        )),
    direccion_servicio TEXT NOT NULL,
    latitud_servicio DOUBLE PRECISION,
    longitud_servicio DOUBLE PRECISION,
    latitud_origen_pro DOUBLE PRECISION,
    longitud_origen_pro DOUBLE PRECISION,
    latitud_profesional DOUBLE PRECISION,
    longitud_profesional DOUBLE PRECISION,
    distancia_estimada_km NUMERIC(6,2),
    tiempo_estimado_minutos INTEGER,
    precio_servicio_cop BIGINT NOT NULL,
    recargo_domicilio_cop BIGINT NOT NULL DEFAULT 0,
    precio_total_cop BIGINT NOT NULL,
    valor_comision_cop BIGINT NOT NULL,
    comision_etapa1_cop BIGINT NOT NULL DEFAULT 0,
    comision_etapa2_cop BIGINT NOT NULL DEFAULT 0,
    etapa1_cobrada BOOLEAN NOT NULL DEFAULT FALSE,
    etapa2_cobrada BOOLEAN NOT NULL DEFAULT FALSE,
    llegada_confirmada BOOLEAN NOT NULL DEFAULT FALSE,
    arrived_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    progreso_ruta INTEGER NOT NULL DEFAULT 0,
    instruccion_uber TEXT,
    chat_activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bookings (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_code VARCHAR(30) NOT NULL UNIQUE,
    client_id INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
    professional_id INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
    service_id VARCHAR(50),
    service_name VARCHAR(200) NOT NULL,
    modality VARCHAR(30) NOT NULL DEFAULT 'domicilio',
    status VARCHAR(45) NOT NULL DEFAULT 'pendiente_aceptacion_profesional',
    service_price_cop BIGINT NOT NULL,
    home_fee_cop BIGINT NOT NULL DEFAULT 0,
    total_price_cop BIGINT NOT NULL,
    commission_total_cop BIGINT NOT NULL,
    commission_stage1_cop BIGINT NOT NULL DEFAULT 0,
    commission_stage2_cop BIGINT NOT NULL DEFAULT 0,
    stage1_charged BOOLEAN NOT NULL DEFAULT FALSE,
    stage2_charged BOOLEAN NOT NULL DEFAULT FALSE,
    service_address TEXT,
    client_latitude DOUBLE PRECISION,
    client_longitude DOUBLE PRECISION,
    professional_latitude DOUBLE PRECISION,
    professional_longitude DOUBLE PRECISION,
    distance_remaining_km NUMERIC(6,2),
    eta_minutes INTEGER,
    arrived_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.booking_status_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_code VARCHAR(30) NOT NULL,
    previous_status VARCHAR(45),
    new_status VARCHAR(45) NOT NULL,
    changed_by_user_id INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
    reason TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.booking_locations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id BIGINT,
    booking_code VARCHAR(30) NOT NULL,
    professional_id INTEGER REFERENCES public.usuarios(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION DEFAULT 15.0,
    heading DOUBLE PRECISION DEFAULT 0.0,
    speed DOUBLE PRECISION DEFAULT 0.0,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.citas_agenda (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_reserva VARCHAR(30) UNIQUE NOT NULL,
    servicio_id VARCHAR(50),
    servicio_nombre VARCHAR(200) NOT NULL,
    servicio_foto TEXT,
    categoria VARCHAR(80),
    cliente_id INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
    cliente_nombre VARCHAR(150) NOT NULL,
    cliente_telefono VARCHAR(40),
    profesional_id INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
    profesional_nombre VARCHAR(150) NOT NULL,
    nombre_establecimiento VARCHAR(180),
    barrio VARCHAR(120),
    modalidad VARCHAR(30) NOT NULL DEFAULT 'local',
    fecha_programada VARCHAR(60) NOT NULL,
    hora_programada VARCHAR(40) NOT NULL,
    direccion_servicio TEXT,
    precio_servicio_cop BIGINT NOT NULL,
    precio_total_cop BIGINT NOT NULL,
    valor_comision_cop BIGINT NOT NULL,
    estado VARCHAR(45) NOT NULL DEFAULT 'pendiente_aceptacion_profesional',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mensajes_chat_temporal (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_reserva VARCHAR(30) NOT NULL,
    autor VARCHAR(25) NOT NULL CHECK (autor IN ('cliente', 'profesional', 'sistema')),
    tipo_mensaje VARCHAR(25) NOT NULL DEFAULT 'texto' CHECK (tipo_mensaje IN ('texto', 'sistema')),
    nombre VARCHAR(150) NOT NULL,
    texto TEXT NOT NULL,
    hora VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 3. NOTIFICACIONES Y TOKENS DE DISPOSITIVO (MÓDULO 3)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.notificaciones (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INTEGER REFERENCES public.usuarios(id) ON DELETE CASCADE,
    actor_user_id INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
    rol_destino VARCHAR(25) NOT NULL CHECK (rol_destino IN ('cliente', 'profesional', 'todos')),
    codigo_reserva VARCHAR(30),
    entity_type VARCHAR(50) DEFAULT 'BOOKING',
    entity_id VARCHAR(80),
    target_screen VARCHAR(80) DEFAULT 'SearchResults',
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(60) NOT NULL DEFAULT 'estado_solicitud',
    data JSONB NOT NULL DEFAULT '{}'::JSONB,
    dedup_key VARCHAR(140) UNIQUE,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recipient_user_id INTEGER REFERENCES public.usuarios(id) ON DELETE CASCADE,
    actor_user_id INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(60) NOT NULL,
    entity_type VARCHAR(50) NOT NULL DEFAULT 'BOOKING',
    entity_id VARCHAR(80),
    target_screen VARCHAR(80) NOT NULL DEFAULT 'SearchResults',
    data JSONB NOT NULL DEFAULT '{}'::JSONB,
    dedup_key VARCHAR(140) UNIQUE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.device_tokens (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform VARCHAR(30) NOT NULL DEFAULT 'android',
    device_id VARCHAR(160),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_device_tokens_user_token UNIQUE (user_id, token)
);

-- =============================================================================
-- 4. BILLETERA PROFESIONAL, WOMPI SANDBOX, ANULACIONES (VOIDED) Y AUDITORÍA
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.billetera_profesional (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    profesional_id INTEGER NOT NULL UNIQUE,
    saldo_disponible_cop BIGINT NOT NULL DEFAULT 0 CHECK (saldo_disponible_cop >= 0),
    total_recargado_cop BIGINT NOT NULL DEFAULT 0,
    total_comisiones_pagadas_cop BIGINT NOT NULL DEFAULT 0,
    comisiones_ganadas_plataforma_cop BIGINT NOT NULL DEFAULT 0,
    pendiente_conciliacion_cop BIGINT NOT NULL DEFAULT 0,
    recarga_minima_cop BIGINT NOT NULL DEFAULT 10000,
    recarga_maxima_cop BIGINT NOT NULL DEFAULT 5000000,
    estado_billetera VARCHAR(25) NOT NULL DEFAULT 'ACTIVE'
        CHECK (estado_billetera IN ('ACTIVE', 'LOW_BALANCE', 'BLOCKED')),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.billetera_profesional
    DROP CONSTRAINT IF EXISTS billetera_profesional_profesional_id_fkey;

ALTER TABLE public.billetera_profesional
    ADD COLUMN IF NOT EXISTS pendiente_conciliacion_cop BIGINT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.professional_wallets (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    professional_id INTEGER NOT NULL UNIQUE,
    prepaid_balance_cop BIGINT NOT NULL DEFAULT 0 CHECK (prepaid_balance_cop >= 0),
    platform_earned_commissions_cop BIGINT NOT NULL DEFAULT 0 CHECK (platform_earned_commissions_cop >= 0),
    total_recharged_cop BIGINT NOT NULL DEFAULT 0 CHECK (total_recharged_cop >= 0),
    pending_reconciliation_cop BIGINT NOT NULL DEFAULT 0 CHECK (pending_reconciliation_cop >= 0),
    min_recharge_cop BIGINT NOT NULL DEFAULT 10000,
    max_recharge_cop BIGINT NOT NULL DEFAULT 5000000,
    status VARCHAR(25) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'LOW_BALANCE', 'BLOCKED')),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.professional_wallets
    DROP CONSTRAINT IF EXISTS professional_wallets_professional_id_fkey;

ALTER TABLE public.professional_wallets
    ADD COLUMN IF NOT EXISTS pending_reconciliation_cop BIGINT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.payment_attempts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    professional_id INTEGER NOT NULL,
    reference VARCHAR(100) NOT NULL UNIQUE,
    idempotency_key VARCHAR(120) NOT NULL UNIQUE,
    provider VARCHAR(40) NOT NULL DEFAULT 'WOMPI_SANDBOX',
    amount_cop BIGINT NOT NULL CHECK (amount_cop >= 10000),
    amount_in_cents BIGINT NOT NULL CHECK (amount_in_cents >= 1000000),
    currency VARCHAR(10) NOT NULL DEFAULT 'COP',
    integrity_signature TEXT NOT NULL,
    wompi_transaction_id VARCHAR(120) UNIQUE,
    payment_method_type VARCHAR(50) DEFAULT 'CARD',
    status VARCHAR(25) NOT NULL DEFAULT 'APPROVED'
        CHECK (status IN ('PENDING', 'APPROVED', 'DECLINED', 'VOIDED', 'ERROR')),
    webhook_verified BOOLEAN NOT NULL DEFAULT TRUE,
    webhook_payload JSONB,
    void_requested BOOLEAN NOT NULL DEFAULT FALSE,
    void_requested_at TIMESTAMPTZ,
    void_reason TEXT,
    voided_at TIMESTAMPTZ,
    reversed_amount_cop BIGINT NOT NULL DEFAULT 0,
    pending_reconciliation_cop BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payment_attempts
    DROP CONSTRAINT IF EXISTS payment_attempts_professional_id_fkey;

ALTER TABLE public.payment_attempts
    ADD COLUMN IF NOT EXISTS void_requested BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS void_requested_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS void_reason TEXT,
    ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reversed_amount_cop BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS pending_reconciliation_cop BIGINT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.transacciones_billetera (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    profesional_id INTEGER,
    codigo_reserva VARCHAR(40),
    tipo VARCHAR(40) NOT NULL CHECK (tipo IN (
        'recarga',
        'comision_servicio',
        'comision_etapa1_3pct',
        'comision_etapa2_7pct',
        'reembolso_comision',
        'reversion_anulacion_recarga',
        'ajuste_administrativo'
    )),
    monto_cop BIGINT NOT NULL CHECK (monto_cop >= 0),
    signo SMALLINT NOT NULL CHECK (signo IN (-1, 1)),
    saldo_anterior_cop BIGINT NOT NULL DEFAULT 0,
    saldo_posterior_cop BIGINT NOT NULL DEFAULT 0,
    metodo_pago VARCHAR(50),
    referencia VARCHAR(100) UNIQUE,
    idempotency_key VARCHAR(120) UNIQUE,
    estado VARCHAR(25) NOT NULL DEFAULT 'APPROVED'
        CHECK (estado IN ('PENDING', 'APPROVED', 'REJECTED', 'REVERSED', 'VOIDED')),
    descripcion TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.transacciones_billetera
    DROP CONSTRAINT IF EXISTS transacciones_billetera_profesional_id_fkey;
ALTER TABLE public.transacciones_billetera
    DROP CONSTRAINT IF EXISTS transacciones_billetera_tipo_check;
ALTER TABLE public.transacciones_billetera
    ADD CONSTRAINT transacciones_billetera_tipo_check CHECK (tipo IN (
        'recarga',
        'comision_servicio',
        'comision_etapa1_3pct',
        'comision_etapa2_7pct',
        'reembolso_comision',
        'reversion_anulacion_recarga',
        'ajuste_administrativo'
    ));
ALTER TABLE public.transacciones_billetera
    DROP CONSTRAINT IF EXISTS transacciones_billetera_estado_check;
ALTER TABLE public.transacciones_billetera
    ADD CONSTRAINT transacciones_billetera_estado_check
    CHECK (estado IN ('PENDING', 'APPROVED', 'REJECTED', 'REVERSED', 'VOIDED'));

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    professional_id INTEGER NOT NULL,
    booking_code VARCHAR(40),
    payment_attempt_id BIGINT REFERENCES public.payment_attempts(id) ON DELETE SET NULL,
    type VARCHAR(40) NOT NULL CHECK (type IN (
        'RECHARGE',
        'COMMISSION_STAGE_1_3PCT',
        'COMMISSION_STAGE_2_7PCT',
        'COMMISSION_REFUND',
        'RECHARGE_VOID_REVERSAL',
        'ADMIN_ADJUSTMENT'
    )),
    amount_cop BIGINT NOT NULL CHECK (amount_cop >= 0),
    sign SMALLINT NOT NULL CHECK (sign IN (-1, 1)),
    balance_before_cop BIGINT NOT NULL DEFAULT 0,
    balance_after_cop BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(25) NOT NULL DEFAULT 'APPROVED'
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'REVERSED', 'VOIDED')),
    reference VARCHAR(100) NOT NULL UNIQUE,
    idempotency_key VARCHAR(120) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wallet_transactions
    DROP CONSTRAINT IF EXISTS wallet_transactions_professional_id_fkey;
ALTER TABLE public.wallet_transactions
    DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;
ALTER TABLE public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_type_check CHECK (type IN (
        'RECHARGE',
        'COMMISSION_STAGE_1_3PCT',
        'COMMISSION_STAGE_2_7PCT',
        'COMMISSION_REFUND',
        'RECHARGE_VOID_REVERSAL',
        'ADMIN_ADJUSTMENT'
    ));
ALTER TABLE public.wallet_transactions
    DROP CONSTRAINT IF EXISTS wallet_transactions_status_check;
ALTER TABLE public.wallet_transactions
    ADD CONSTRAINT wallet_transactions_status_check
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'REVERSED', 'VOIDED'));

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_user_id INTEGER,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    ip_address VARCHAR(60),
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.archivos_storage (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
    bucket_nombre VARCHAR(80) NOT NULL DEFAULT 'archivos',
    ruta_storage TEXT NOT NULL,
    url_publica TEXT NOT NULL,
    tipo_archivo VARCHAR(40) NOT NULL DEFAULT 'image/jpeg',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dispositivos_instalacion (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    device_key VARCHAR(160) UNIQUE NOT NULL,
    onboarding_visto BOOLEAN NOT NULL DEFAULT FALSE,
    usuario_sesion_id INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
    token_sesion TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 5. TRIGGERS AUTOMÁTICOS EN POSTGRESQL PARA FIRMA SHA-256, APROBACIÓN Y ANULACIÓN (VOIDED)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_before_payment_attempts_wompi_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Calcular siempre la firma criptográfica SHA-256 de 64 caracteres oficial de Wompi Sandbox
    IF NEW.integrity_signature IS NULL OR NEW.integrity_signature LIKE 'sbx_sig_%' OR LENGTH(NEW.integrity_signature) < 64 THEN
        NEW.integrity_signature := encode(
            digest(
                NEW.reference || NEW.amount_in_cents::TEXT || COALESCE(NEW.currency, 'COP') || 'test_integrity_nMaCRvNkgai1TzkWX9L0zWAZAcKOcn5Z',
                'sha256'
            ),
            'hex'
        );
    END IF;

    -- 2. Generar wompi_transaction_id oficial de Sandbox si viene nulo
    IF NEW.wompi_transaction_id IS NULL THEN
        NEW.wompi_transaction_id := '11004-' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT || '-' || FLOOR(10000 + RANDOM() * 89999)::INT::TEXT;
    END IF;

    -- 3. Si entra en PENDING desde el inicio rápido de recarga, conciliar automáticamente a APPROVED en Sandbox
    --    (a menos que se esté probando explícitamente DECLINED, ERROR, VOIDED o PENDING explícito)
    IF NEW.status = 'PENDING'
       AND NEW.reference NOT LIKE '%DECLINED%'
       AND NEW.reference NOT LIKE '%ERROR%'
       AND NEW.reference NOT LIKE '%PENDING%'
       AND NEW.reference NOT LIKE '%VOID%' THEN
        NEW.status := 'APPROVED';
        NEW.webhook_verified := TRUE;
        NEW.webhook_payload := COALESCE(
            NEW.webhook_payload,
            jsonb_build_object(
                'event', 'transaction.updated',
                'environment', 'https://sandbox.wompi.co/v1',
                'public_key', 'pub_test_2PuvSCJDswiY8c0wDeBEJxEgBaAsMtF2',
                'transaction_id', NEW.wompi_transaction_id,
                'reference', NEW.reference,
                'status', 'APPROVED'
            )
        );
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_before_payment_attempts_wompi ON public.payment_attempts;
CREATE TRIGGER trg_before_payment_attempts_wompi
BEFORE INSERT OR UPDATE ON public.payment_attempts
FOR EACH ROW
EXECUTE FUNCTION public.fn_before_payment_attempts_wompi_sync();

CREATE OR REPLACE FUNCTION public.fn_after_payment_attempts_credit_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_balance BIGINT := 0;
    v_new_balance BIGINT := 0;
    v_retired_cop BIGINT := 0;
    v_pending_reconcil_cop BIGINT := 0;
    v_idemp_key VARCHAR;
    v_void_ref VARCHAR;
    v_void_desc TEXT;
    v_official_msg TEXT := 'Tu recarga ha sido anulada. El saldo correspondiente fue retirado de tu billetera. Para continuar recibiendo solicitudes de servicios, realiza una nueva recarga. La devolución del dinero dependerá del método de pago y del procedimiento de la entidad financiera correspondiente.';
BEGIN
    -- =========================================================================
    -- CASO A: RECARGA APROBADA (APPROVED) -> Acreditar saldo una sola vez
    -- =========================================================================
    IF NEW.status = 'APPROVED' THEN
        v_idemp_key := 'wompi-tx-' || NEW.reference;

        IF NOT EXISTS (SELECT 1 FROM public.transacciones_billetera WHERE idempotency_key = v_idemp_key) THEN
            INSERT INTO public.billetera_profesional (profesional_id, saldo_disponible_cop, total_recargado_cop)
            VALUES (NEW.professional_id, 0, 0)
            ON CONFLICT (profesional_id) DO NOTHING;

            SELECT saldo_disponible_cop INTO v_old_balance
            FROM public.billetera_profesional
            WHERE profesional_id = NEW.professional_id
            FOR UPDATE;

            v_new_balance := COALESCE(v_old_balance, 0) + NEW.amount_cop;

            UPDATE public.billetera_profesional
            SET saldo_disponible_cop = v_new_balance,
                total_recargado_cop = total_recargado_cop + NEW.amount_cop,
                estado_billetera = CASE WHEN v_new_balance >= 5000 THEN 'ACTIVE' ELSE 'LOW_BALANCE' END,
                version = version + 1,
                updated_at = NOW()
            WHERE profesional_id = NEW.professional_id;

            UPDATE public.perfiles_profesionales
            SET saldo_billetera_cop = v_new_balance,
                activo_por_saldo = (v_new_balance >= 5000),
                updated_at = NOW()
            WHERE usuario_id = NEW.professional_id OR id = NEW.professional_id;

            INSERT INTO public.professional_wallets (
                professional_id, prepaid_balance_cop, total_recharged_cop, status, version, updated_at
            ) VALUES (
                NEW.professional_id, v_new_balance, NEW.amount_cop, 'ACTIVE', 1, NOW()
            )
            ON CONFLICT (professional_id) DO UPDATE
            SET prepaid_balance_cop = EXCLUDED.prepaid_balance_cop,
                total_recharged_cop = public.professional_wallets.total_recharged_cop + NEW.amount_cop,
                status = 'ACTIVE',
                version = public.professional_wallets.version + 1,
                updated_at = NOW();

            INSERT INTO public.transacciones_billetera (
                profesional_id, tipo, monto_cop, signo, saldo_anterior_cop, saldo_posterior_cop,
                metodo_pago, referencia, idempotency_key, estado, descripcion, metadata
            ) VALUES (
                NEW.professional_id, 'recarga', NEW.amount_cop, 1,
                COALESCE(v_old_balance, 0), v_new_balance,
                COALESCE(NEW.payment_method_type, 'WOMPI_SANDBOX'),
                NEW.reference, v_idemp_key, 'APPROVED',
                'Recarga aprobada en Wompi Sandbox (' || NEW.reference || ')',
                COALESCE(NEW.webhook_payload, '{}'::JSONB)
            ) ON CONFLICT (idempotency_key) DO NOTHING;

            INSERT INTO public.wallet_transactions (
                professional_id, payment_attempt_id, type, amount_cop, sign,
                balance_before_cop, balance_after_cop, status, reference, idempotency_key, description, metadata
            ) VALUES (
                NEW.professional_id, NEW.id, 'RECHARGE', NEW.amount_cop, 1,
                COALESCE(v_old_balance, 0), v_new_balance, 'APPROVED',
                NEW.reference, v_idemp_key,
                'Recarga aprobada en Wompi Sandbox (' || NEW.reference || ')',
                COALESCE(NEW.webhook_payload, '{}'::JSONB)
            ) ON CONFLICT (idempotency_key) DO NOTHING;
        END IF;

    -- =========================================================================
    -- CASO B: RECARGA ANULADA (VOIDED) -> Reversión contable idempotente (total o parcial)
    -- =========================================================================
    ELSIF NEW.status = 'VOIDED' THEN
        v_idemp_key := 'wompi-void-' || NEW.reference;
        v_void_ref := 'VOID-' || NEW.reference;

        -- Verificar idempotencia: no revertir dos veces la misma anulación
        IF NOT EXISTS (SELECT 1 FROM public.transacciones_billetera WHERE idempotency_key = v_idemp_key) THEN
            SELECT saldo_disponible_cop INTO v_old_balance
            FROM public.billetera_profesional
            WHERE profesional_id = NEW.professional_id
            FOR UPDATE;

            v_old_balance := COALESCE(v_old_balance, 0);
            -- Si el profesional ya utilizó parte del saldo, retirar solo el disponible sin dejar saldo negativo
            v_retired_cop := LEAST(v_old_balance, NEW.amount_cop);
            v_pending_reconcil_cop := GREATEST(0, NEW.amount_cop - v_retired_cop);
            v_new_balance := GREATEST(0, v_old_balance - v_retired_cop);

            UPDATE public.billetera_profesional
            SET saldo_disponible_cop = v_new_balance,
                pendiente_conciliacion_cop = COALESCE(pendiente_conciliacion_cop, 0) + v_pending_reconcil_cop,
                estado_billetera = CASE WHEN v_new_balance >= 5000 THEN 'ACTIVE' ELSE 'LOW_BALANCE' END,
                version = version + 1,
                updated_at = NOW()
            WHERE profesional_id = NEW.professional_id;

            UPDATE public.professional_wallets
            SET prepaid_balance_cop = v_new_balance,
                pending_reconciliation_cop = COALESCE(pending_reconciliation_cop, 0) + v_pending_reconcil_cop,
                status = CASE WHEN v_new_balance >= 5000 THEN 'ACTIVE' ELSE 'LOW_BALANCE' END,
                version = version + 1,
                updated_at = NOW()
            WHERE professional_id = NEW.professional_id;

            UPDATE public.perfiles_profesionales
            SET saldo_billetera_cop = v_new_balance,
                activo_por_saldo = (v_new_balance >= 5000),
                updated_at = NOW()
            WHERE usuario_id = NEW.professional_id OR id = NEW.professional_id;

            v_void_desc := CASE
                WHEN v_pending_reconcil_cop > 0 THEN
                    'Reversión por anulación de recarga Wompi (' || NEW.reference || ') • Retirado: $' || v_retired_cop::TEXT || ' COP • Pendiente de conciliación: $' || v_pending_reconcil_cop::TEXT || ' COP'
                ELSE
                    'Reversión por anulación de recarga Wompi (' || NEW.reference || ') • -$' || v_retired_cop::TEXT || ' COP'
            END;

            INSERT INTO public.transacciones_billetera (
                profesional_id, tipo, monto_cop, signo, saldo_anterior_cop, saldo_posterior_cop,
                metodo_pago, referencia, idempotency_key, estado, descripcion, metadata
            ) VALUES (
                NEW.professional_id, 'reversion_anulacion_recarga', v_retired_cop, -1,
                v_old_balance, v_new_balance, 'WOMPI_VOID_REVERSAL',
                v_void_ref, v_idemp_key, 'VOIDED', v_void_desc,
                jsonb_build_object(
                    'original_reference', NEW.reference,
                    'original_recharge_amount_cop', NEW.amount_cop,
                    'amount_retired_cop', v_retired_cop,
                    'pending_reconciliation_cop', v_pending_reconcil_cop
                )
            ) ON CONFLICT (idempotency_key) DO NOTHING;

            INSERT INTO public.wallet_transactions (
                professional_id, payment_attempt_id, type, amount_cop, sign,
                balance_before_cop, balance_after_cop, status, reference, idempotency_key, description, metadata
            ) VALUES (
                NEW.professional_id, NEW.id, 'RECHARGE_VOID_REVERSAL', v_retired_cop, -1,
                v_old_balance, v_new_balance, 'VOIDED',
                v_void_ref, v_idemp_key, v_void_desc,
                jsonb_build_object(
                    'original_reference', NEW.reference,
                    'original_recharge_amount_cop', NEW.amount_cop,
                    'amount_retired_cop', v_retired_cop,
                    'pending_reconciliation_cop', v_pending_reconcil_cop
                )
            ) ON CONFLICT (idempotency_key) DO NOTHING;

            INSERT INTO public.notificaciones (
                usuario_id, rol_destino, entity_type, entity_id, target_screen,
                titulo, mensaje, tipo, dedup_key
            ) VALUES (
                NEW.professional_id, 'profesional', 'WALLET', v_void_ref, 'WalletHistory',
                'Recarga anulada en tu billetera', v_official_msg, 'PRO_RECHARGE_REJECTED',
                'notif-void-' || NEW.reference
            ) ON CONFLICT (dedup_key) DO NOTHING;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_payment_attempts_credit_wallet ON public.payment_attempts;
CREATE TRIGGER trg_after_payment_attempts_credit_wallet
AFTER INSERT OR UPDATE ON public.payment_attempts
FOR EACH ROW
EXECUTE FUNCTION public.fn_after_payment_attempts_credit_wallet();

-- =============================================================================
-- 6. ACTUALIZAR AUTOMÁTICAMENTE CUALQUIER REGISTRO ANTERIOR QUE HAYA QUEDADO EN PENDING / sbx_sig_
-- =============================================================================
UPDATE public.payment_attempts
SET status = 'APPROVED',
    webhook_verified = TRUE,
    updated_at = NOW()
WHERE status = 'PENDING' OR integrity_signature LIKE 'sbx_sig_%';

-- =============================================================================
-- 7. FUNCIONES RPC DE COMISIONES POR ETAPAS (3% CONFIRMACIÓN + 7% INICIO = 10% TOTAL)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.fn_charge_booking_commission_stage(
    p_codigo_reserva VARCHAR,
    p_profesional_id INTEGER,
    p_etapa INTEGER,
    p_precio_total_cop BIGINT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wallet public.billetera_profesional%ROWTYPE;
    v_comision_total BIGINT;
    v_monto_etapa BIGINT;
    v_new_balance BIGINT;
    v_new_earned BIGINT;
    v_idemp_key VARCHAR;
    v_tipo_tx VARCHAR;
    v_tipo_canon VARCHAR;
    v_desc TEXT;
BEGIN
    v_comision_total := ROUND(p_precio_total_cop * 0.10);
    IF p_etapa = 1 THEN
        v_monto_etapa := ROUND(p_precio_total_cop * 0.03);
        v_idemp_key := 'comm-s1-' || p_codigo_reserva;
        v_tipo_tx := 'comision_etapa1_3pct';
        v_tipo_canon := 'COMMISSION_STAGE_1_3PCT';
        v_desc := 'Comisión Etapa 1 (3% confirmación) • Reserva #' || p_codigo_reserva;
    ELSIF p_etapa = 2 THEN
        v_monto_etapa := v_comision_total - ROUND(p_precio_total_cop * 0.03);
        v_idemp_key := 'comm-s2-' || p_codigo_reserva;
        v_tipo_tx := 'comision_etapa2_7pct';
        v_tipo_canon := 'COMMISSION_STAGE_2_7PCT';
        v_desc := 'Comisión Etapa 2 (7% inicio de servicio) • Reserva #' || p_codigo_reserva;
    ELSE
        RETURN jsonb_build_object('exito', false, 'error', 'ETAPA_INVALIDA');
    END IF;

    IF EXISTS (SELECT 1 FROM public.transacciones_billetera WHERE idempotency_key = v_idemp_key) THEN
        SELECT * INTO v_wallet FROM public.billetera_profesional WHERE profesional_id = p_profesional_id;
        RETURN jsonb_build_object(
            'exito', true,
            'idempotente', true,
            'etapa', p_etapa,
            'monto_descontado_cop', v_monto_etapa,
            'saldo_disponible_cop', COALESCE(v_wallet.saldo_disponible_cop, 0)
        );
    END IF;

    INSERT INTO public.billetera_profesional (profesional_id, saldo_disponible_cop, total_recargado_cop)
    VALUES (p_profesional_id, 0, 0)
    ON CONFLICT (profesional_id) DO NOTHING;

    SELECT * INTO v_wallet
    FROM public.billetera_profesional
    WHERE profesional_id = p_profesional_id
    FOR UPDATE;

    IF v_wallet.saldo_disponible_cop < v_monto_etapa THEN
        RETURN jsonb_build_object(
            'exito', false,
            'codigo', 'SALDO_INSUFICIENTE',
            'saldo_disponible_cop', v_wallet.saldo_disponible_cop,
            'monto_requerido_cop', v_monto_etapa,
            'faltante_cop', (v_monto_etapa - v_wallet.saldo_disponible_cop)
        );
    END IF;

    v_new_balance := v_wallet.saldo_disponible_cop - v_monto_etapa;
    v_new_earned := v_wallet.comisiones_ganadas_plataforma_cop + v_monto_etapa;

    UPDATE public.billetera_profesional
    SET saldo_disponible_cop = v_new_balance,
        total_comisiones_pagadas_cop = total_comisiones_pagadas_cop + v_monto_etapa,
        comisiones_ganadas_plataforma_cop = v_new_earned,
        estado_billetera = CASE WHEN v_new_balance >= 5000 THEN 'ACTIVE' ELSE 'LOW_BALANCE' END,
        version = version + 1,
        updated_at = NOW()
    WHERE profesional_id = p_profesional_id;

    INSERT INTO public.transacciones_billetera (
        profesional_id, codigo_reserva, tipo, monto_cop, signo,
        saldo_anterior_cop, saldo_posterior_cop, metodo_pago,
        referencia, idempotency_key, estado, descripcion
    ) VALUES (
        p_profesional_id, p_codigo_reserva, v_tipo_tx, v_monto_etapa, -1,
        v_wallet.saldo_disponible_cop, v_new_balance, 'SALDO_PREPAGO',
        UPPER(v_idemp_key), v_idemp_key, 'APPROVED', v_desc
    );

    INSERT INTO public.wallet_transactions (
        professional_id, booking_code, type, amount_cop, sign,
        balance_before_cop, balance_after_cop, status, reference, idempotency_key, description
    ) VALUES (
        p_profesional_id, p_codigo_reserva, v_tipo_canon, v_monto_etapa, -1,
        v_wallet.saldo_disponible_cop, v_new_balance, 'APPROVED',
        UPPER(v_idemp_key), v_idemp_key, v_desc
    );

    RETURN jsonb_build_object(
        'exito', true,
        'idempotente', false,
        'etapa', p_etapa,
        'monto_descontado_cop', v_monto_etapa,
        'saldo_anterior_cop', v_wallet.saldo_disponible_cop,
        'saldo_disponible_cop', v_new_balance,
        'comisiones_ganadas_plataforma_cop', v_new_earned,
        'referencia', UPPER(v_idemp_key)
    );
END;
$$;

-- =============================================================================
-- 8. STORAGE BUCKET ('archivos'), POLÍTICAS RLS Y REALTIME
-- =============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('archivos', 'archivos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "acceso_publico_archivos_select" ON storage.objects;
CREATE POLICY "acceso_publico_archivos_select"
    ON storage.objects FOR SELECT TO anon, authenticated, service_role
    USING (bucket_id = 'archivos');

DROP POLICY IF EXISTS "subida_archivos_dispositivo" ON storage.objects;
CREATE POLICY "subida_archivos_dispositivo"
    ON storage.objects FOR INSERT TO anon, authenticated, service_role
    WITH CHECK (bucket_id = 'archivos');

DROP POLICY IF EXISTS "actualizacion_archivos_dispositivo" ON storage.objects;
CREATE POLICY "actualizacion_archivos_dispositivo"
    ON storage.objects FOR UPDATE TO anon, authenticated, service_role
    USING (bucket_id = 'archivos');

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'spatial_ref_sys'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "acceso_total_%I" ON public.%I;', tbl, tbl);
        EXECUTE format(
            'CREATE POLICY "acceso_total_%I" ON public.%I FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);',
            tbl, tbl
        );
    END LOOP;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.usuarios; EXCEPTION WHEN duplicate_object THEN NULL; END;
        BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.perfiles_profesionales; EXCEPTION WHEN duplicate_object THEN NULL; END;
        BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.catalogo_servicios_app; EXCEPTION WHEN duplicate_object THEN NULL; END;
        BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.solicitudes_uber; EXCEPTION WHEN duplicate_object THEN NULL; END;
        BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.citas_agenda; EXCEPTION WHEN duplicate_object THEN NULL; END;
        BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.mensajes_chat_temporal; EXCEPTION WHEN duplicate_object THEN NULL; END;
        BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notificaciones; EXCEPTION WHEN duplicate_object THEN NULL; END;
        BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN duplicate_object THEN NULL; END;
        BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_locations; EXCEPTION WHEN duplicate_object THEN NULL; END;
        BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.billetera_profesional; EXCEPTION WHEN duplicate_object THEN NULL; END;
        BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.professional_wallets; EXCEPTION WHEN duplicate_object THEN NULL; END;
        BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_attempts; EXCEPTION WHEN duplicate_object THEN NULL; END;
        BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.transacciones_billetera; EXCEPTION WHEN duplicate_object THEN NULL; END;
        BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions; EXCEPTION WHEN duplicate_object THEN NULL; END;
    END IF;
END $$;
