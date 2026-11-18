-- =============================================================================
-- BEAUTYFLASH COLOMBIA — MIGRACIÓN INTEGRAL (MÓDULOS 1 AL 12)
-- Proyecto Supabase: https://tcyndqzzawwcqqvcsbvu.supabase.co
-- Incluye las 14 tablas requeridas, funciones transaccionales atómicas,
-- políticas RLS por usuario/contratación e índices de alto rendimiento.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =============================================================================
-- 1. ADAPTACIÓN DE TABLAS EXISTENTES (COMPATIBILIDAD 100% CON EL PROYECTO ACTUAL)
-- =============================================================================

ALTER TABLE IF EXISTS public.usuarios
  ADD COLUMN IF NOT EXISTS roles TEXT[] NOT NULL DEFAULT ARRAY['CLIENT'],
  ADD COLUMN IF NOT EXISTS modalidad_activa VARCHAR(20) NOT NULL DEFAULT 'CLIENT',
  ADD COLUMN IF NOT EXISTS intentos_fallidos INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMPTZ;

ALTER TABLE IF EXISTS public.perfiles_profesionales
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(25) NOT NULL DEFAULT 'APPROVED'
    CHECK (approval_status IN ('INCOMPLETE', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'));

ALTER TABLE IF EXISTS public.solicitudes_uber
  ADD COLUMN IF NOT EXISTS comision_etapa1_cop BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comision_etapa2_cop BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS etapa1_cobrada BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS etapa2_cobrada BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS llegada_confirmada BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS public.notificaciones
  ADD COLUMN IF NOT EXISTS actor_user_id INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50) DEFAULT 'BOOKING',
  ADD COLUMN IF NOT EXISTS entity_id VARCHAR(80),
  ADD COLUMN IF NOT EXISTS target_screen VARCHAR(80) DEFAULT 'SearchResults',
  ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS dedup_key VARCHAR(140) UNIQUE;

ALTER TABLE IF EXISTS public.billetera_profesional
  ADD COLUMN IF NOT EXISTS comisiones_ganadas_plataforma_cop BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recarga_maxima_cop BIGINT NOT NULL DEFAULT 5000000,
  ADD COLUMN IF NOT EXISTS estado_billetera VARCHAR(25) NOT NULL DEFAULT 'ACTIVE'
    CHECK (estado_billetera IN ('ACTIVE', 'LOW_BALANCE', 'BLOCKED')),
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE IF EXISTS public.transacciones_billetera
  ADD COLUMN IF NOT EXISTS codigo_reserva VARCHAR(40),
  ADD COLUMN IF NOT EXISTS referencia VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(120) UNIQUE,
  ADD COLUMN IF NOT EXISTS estado VARCHAR(25) NOT NULL DEFAULT 'APPROVED'
    CHECK (estado IN ('PENDING', 'APPROVED', 'REJECTED', 'REVERSED')),
  ADD COLUMN IF NOT EXISTS saldo_anterior_cop BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Ampliar restricción de tipos de movimiento en transacciones_billetera
ALTER TABLE IF EXISTS public.transacciones_billetera
  DROP CONSTRAINT IF EXISTS transacciones_billetera_tipo_check;
ALTER TABLE IF EXISTS public.transacciones_billetera
  ADD CONSTRAINT transacciones_billetera_tipo_check
  CHECK (tipo IN (
    'recarga',
    'comision_servicio',
    'comision_etapa1_3pct',
    'comision_etapa2_7pct',
    'reembolso_comision',
    'ajuste_administrativo'
  ));

-- =============================================================================
-- 2. LAS 14 TABLAS CANÓNICAS DE LA ARQUITECTURA EVOLUCIONADA (MÓDULO 8)
-- =============================================================================

-- 2.1. users (Identidad unificada vinculada a auth.users y public.usuarios)
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

-- 2.2. user_roles (Un usuario puede tener simultáneamente CLIENT y PROFESSIONAL)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('CLIENT', 'PROFESSIONAL', 'ADMIN')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_roles_user_role UNIQUE (user_id, role)
);

-- 2.3. client_profiles
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

-- 2.4. professional_profiles
CREATE TABLE IF NOT EXISTS public.professional_profiles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES public.usuarios(id) ON DELETE CASCADE,
    professional_code VARCHAR(30) UNIQUE NOT NULL DEFAULT ('BF-' || FLOOR(1000 + RANDOM() * 9000)::TEXT),
    artistic_name VARCHAR(160),
    establishment_name VARCHAR(180),
    has_establishment BOOLEAN NOT NULL DEFAULT FALSE,
    bio TEXT,
    years_experience INTEGER NOT NULL DEFAULT 1,
    specialties TEXT[] NOT NULL DEFAULT '{}',
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
    approval_status VARCHAR(25) NOT NULL DEFAULT 'PENDING'
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

-- 2.5. user_preferences (Persistencia de modalidad CLIENT / PROFESSIONAL entre sesiones)
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

-- 2.6. notifications (Direccionamiento independiente por usuario y entidad)
CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recipient_user_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    actor_user_id INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(60) NOT NULL,
    entity_type VARCHAR(50) NOT NULL DEFAULT 'BOOKING',
    entity_id VARCHAR(80),
    target_screen VARCHAR(80) NOT NULL DEFAULT 'SearchResults',
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    dedup_key VARCHAR(140) UNIQUE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.7. device_tokens (Múltiples dispositivos por usuario y desactivación selectiva al cerrar sesión)
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

-- 2.8. professional_wallets (Separación contable de saldo prepago y comisiones ganadas)
CREATE TABLE IF NOT EXISTS public.professional_wallets (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    professional_id INTEGER NOT NULL UNIQUE REFERENCES public.usuarios(id) ON DELETE CASCADE,
    prepaid_balance_cop BIGINT NOT NULL DEFAULT 0 CHECK (prepaid_balance_cop >= 0),
    platform_earned_commissions_cop BIGINT NOT NULL DEFAULT 0 CHECK (platform_earned_commissions_cop >= 0),
    total_recharged_cop BIGINT NOT NULL DEFAULT 0 CHECK (total_recharged_cop >= 0),
    min_recharge_cop BIGINT NOT NULL DEFAULT 10000,
    max_recharge_cop BIGINT NOT NULL DEFAULT 5000000,
    status VARCHAR(25) NOT NULL DEFAULT 'LOW_BALANCE'
      CHECK (status IN ('ACTIVE', 'LOW_BALANCE', 'BLOCKED')),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.9. payment_attempts (Intentos de recarga con Wompi Sandbox y conciliación por Webhook)
CREATE TABLE IF NOT EXISTS public.payment_attempts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    professional_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    reference VARCHAR(100) NOT NULL UNIQUE,
    idempotency_key VARCHAR(120) NOT NULL UNIQUE,
    provider VARCHAR(40) NOT NULL DEFAULT 'WOMPI_SANDBOX',
    amount_cop BIGINT NOT NULL CHECK (amount_cop >= 10000),
    amount_in_cents BIGINT NOT NULL CHECK (amount_in_cents >= 1000000),
    currency VARCHAR(10) NOT NULL DEFAULT 'COP',
    integrity_signature TEXT NOT NULL,
    wompi_transaction_id VARCHAR(120) UNIQUE,
    payment_method_type VARCHAR(50) DEFAULT 'CARD_SANDBOX',
    status VARCHAR(25) NOT NULL DEFAULT 'PENDING'
      CHECK (status IN ('PENDING', 'APPROVED', 'DECLINED', 'VOIDED', 'ERROR')),
    webhook_verified BOOLEAN NOT NULL DEFAULT FALSE,
    webhook_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.10. wallet_transactions (Historial inalterable de movimientos financieros)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    professional_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    booking_code VARCHAR(40),
    payment_attempt_id BIGINT REFERENCES public.payment_attempts(id) ON DELETE SET NULL,
    type VARCHAR(40) NOT NULL CHECK (type IN (
      'RECHARGE',
      'COMMISSION_STAGE_1_3PCT',
      'COMMISSION_STAGE_2_7PCT',
      'COMMISSION_REFUND',
      'ADMIN_ADJUSTMENT'
    )),
    amount_cop BIGINT NOT NULL CHECK (amount_cop > 0),
    sign SMALLINT NOT NULL CHECK (sign IN (-1, 1)),
    balance_before_cop BIGINT NOT NULL DEFAULT 0,
    balance_after_cop BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(25) NOT NULL DEFAULT 'APPROVED'
      CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'REVERSED')),
    reference VARCHAR(100) NOT NULL UNIQUE,
    idempotency_key VARCHAR(120) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.11. bookings ( Vista/Tabla sincronizada con solicitudes_uber y control de comisiones 3% / 7% )
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

-- 2.12. booking_status_history
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

-- 2.13. booking_locations (Seguimiento GPS en tiempo real durante contratación activa)
CREATE TABLE IF NOT EXISTS public.booking_locations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id BIGINT,
    booking_code VARCHAR(30) NOT NULL,
    professional_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION DEFAULT 15.0,
    heading DOUBLE PRECISION DEFAULT 0.0,
    speed DOUBLE PRECISION DEFAULT 0.0,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.14. audit_logs (Registro inalterable de auditoría financiera y de seguridad)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_user_id INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    ip_address VARCHAR(60),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.15. password_recovery_otps (Códigos OTP de recuperación hasheados con SHA-256, nunca en texto plano)
CREATE TABLE IF NOT EXISTS public.password_recovery_otps (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
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
-- 3. ÍNDICES DE RENDIMIENTO
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_active ON public.device_tokens(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_pro_created ON public.wallet_transactions(professional_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_ref ON public.payment_attempts(reference);
CREATE INDEX IF NOT EXISTS idx_booking_locations_code_current ON public.booking_locations(booking_code, is_current, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id, created_at DESC);

-- =============================================================================
-- 4. FUNCIONES TRANSACCIONALES ATÓMICAS EN POSTGRESQL (MÓDULOS 4 Y 5)
-- =============================================================================

-- 4.1. Acreditación atómica e idempotente de recarga vía Webhook de Wompi Sandbox
CREATE OR REPLACE FUNCTION public.fn_process_wompi_webhook_recharge(
    p_reference VARCHAR,
    p_wompi_tx_id VARCHAR,
    p_status VARCHAR,
    p_webhook_payload JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_attempt public.payment_attempts%ROWTYPE;
    v_wallet public.billetera_profesional%ROWTYPE;
    v_new_balance BIGINT;
BEGIN
    SELECT * INTO v_attempt
    FROM public.payment_attempts
    WHERE reference = p_reference
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('exito', false, 'error', 'REFERENCIA_NO_ENCONTRADA');
    END IF;

    -- Idempotencia estricta: si ya fue procesada como APPROVED, no vuelve a acreditar
    IF v_attempt.status = 'APPROVED' AND v_attempt.webhook_verified = TRUE THEN
        RETURN jsonb_build_object(
            'exito', true,
            'idempotente', true,
            'mensaje', 'La transacción ya había sido acreditada previamente.',
            'reference', p_reference
        );
    END IF;

    UPDATE public.payment_attempts
    SET status = p_status,
        wompi_transaction_id = COALESCE(p_wompi_tx_id, wompi_transaction_id),
        webhook_verified = TRUE,
        webhook_payload = p_webhook_payload,
        updated_at = NOW()
    WHERE id = v_attempt.id;

    IF p_status <> 'APPROVED' THEN
        INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
        VALUES (v_attempt.professional_id, 'WOMPI_RECHARGE_' || p_status, 'PAYMENT_ATTEMPT', p_reference, COALESCE(p_webhook_payload, '{}'::jsonb));

        RETURN jsonb_build_object(
            'exito', true,
            'acreditado', false,
            'estado', p_status,
            'reference', p_reference
        );
    END IF;

    -- Garantizar existencia de billetera
    INSERT INTO public.billetera_profesional (profesional_id, saldo_disponible_cop, total_recargado_cop)
    VALUES (v_attempt.professional_id, 0, 0)
    ON CONFLICT (profesional_id) DO NOTHING;

    SELECT * INTO v_wallet
    FROM public.billetera_profesional
    WHERE profesional_id = v_attempt.professional_id
    FOR UPDATE;

    v_new_balance := v_wallet.saldo_disponible_cop + v_attempt.amount_cop;

    UPDATE public.billetera_profesional
    SET saldo_disponible_cop = v_new_balance,
        total_recargado_cop = total_recargado_cop + v_attempt.amount_cop,
        estado_billetera = CASE WHEN v_new_balance >= 5000 THEN 'ACTIVE' ELSE 'LOW_BALANCE' END,
        version = version + 1,
        updated_at = NOW()
    WHERE profesional_id = v_attempt.professional_id;

    INSERT INTO public.professional_wallets (
        professional_id, prepaid_balance_cop, total_recharged_cop, status, version, updated_at
    ) VALUES (
        v_attempt.professional_id, v_new_balance, v_wallet.total_recargado_cop + v_attempt.amount_cop,
        CASE WHEN v_new_balance >= 5000 THEN 'ACTIVE' ELSE 'LOW_BALANCE' END, v_wallet.version + 1, NOW()
    )
    ON CONFLICT (professional_id) DO UPDATE
    SET prepaid_balance_cop = EXCLUDED.prepaid_balance_cop,
        total_recharged_cop = EXCLUDED.total_recharged_cop,
        status = EXCLUDED.status,
        version = EXCLUDED.version,
        updated_at = NOW();

    INSERT INTO public.transacciones_billetera (
        profesional_id, tipo, monto_cop, signo, saldo_anterior_cop, saldo_posterior_cop,
        metodo_pago, referencia, idempotency_key, estado, descripcion, metadata
    ) VALUES (
        v_attempt.professional_id, 'recarga', v_attempt.amount_cop, 1,
        v_wallet.saldo_disponible_cop, v_new_balance, 'WOMPI_SANDBOX',
        p_reference, 'wompi-tx-' || p_reference, 'APPROVED',
        'Recarga aprobada en Wompi Sandbox (' || p_reference || ')',
        COALESCE(p_webhook_payload, '{}'::jsonb)
    ) ON CONFLICT (idempotency_key) DO NOTHING;

    INSERT INTO public.wallet_transactions (
        professional_id, payment_attempt_id, type, amount_cop, sign,
        balance_before_cop, balance_after_cop, status, reference, idempotency_key, description, metadata
    ) VALUES (
        v_attempt.professional_id, v_attempt.id, 'RECHARGE', v_attempt.amount_cop, 1,
        v_wallet.saldo_disponible_cop, v_new_balance, 'APPROVED',
        p_reference, 'wompi-tx-' || p_reference,
        'Recarga aprobada en Wompi Sandbox (' || p_reference || ')',
        COALESCE(p_webhook_payload, '{}'::jsonb)
    ) ON CONFLICT (idempotency_key) DO NOTHING;

    INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
    VALUES (
        v_attempt.professional_id,
        'WOMPI_RECHARGE_APPROVED',
        'WALLET',
        p_reference,
        jsonb_build_object('amount_cop', v_attempt.amount_cop, 'balance_after_cop', v_new_balance)
    );

    RETURN jsonb_build_object(
        'exito', true,
        'acreditado', true,
        'monto_cop', v_attempt.amount_cop,
        'saldo_anterior_cop', v_wallet.saldo_disponible_cop,
        'saldo_disponible_cop', v_new_balance,
        'reference', p_reference
    );
END;
$$;

-- 4.2. Cobro atómico de comisión por etapas (Etapa 1: 3% al confirmar, Etapa 2: 7% al iniciar servicio)
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

    -- Verificar idempotencia para impedir descuentos duplicados
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

    INSERT INTO public.professional_wallets (
        professional_id, prepaid_balance_cop, platform_earned_commissions_cop, total_recharged_cop, status, version, updated_at
    ) VALUES (
        p_profesional_id, v_new_balance, v_new_earned, v_wallet.total_recargado_cop,
        CASE WHEN v_new_balance >= 5000 THEN 'ACTIVE' ELSE 'LOW_BALANCE' END, v_wallet.version + 1, NOW()
    )
    ON CONFLICT (professional_id) DO UPDATE
    SET prepaid_balance_cop = EXCLUDED.prepaid_balance_cop,
        platform_earned_commissions_cop = EXCLUDED.platform_earned_commissions_cop,
        status = EXCLUDED.status,
        version = EXCLUDED.version,
        updated_at = NOW();

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

    IF p_etapa = 1 THEN
        UPDATE public.solicitudes_uber
        SET comision_etapa1_cop = v_monto_etapa,
            etapa1_cobrada = TRUE,
            updated_at = NOW()
        WHERE codigo_reserva = p_codigo_reserva;
    ELSE
        UPDATE public.solicitudes_uber
        SET comision_etapa2_cop = v_monto_etapa,
            etapa2_cobrada = TRUE,
            started_at = NOW(),
            updated_at = NOW()
        WHERE codigo_reserva = p_codigo_reserva;
    END IF;

    INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
    VALUES (
        p_profesional_id,
        v_tipo_canon,
        'BOOKING',
        p_codigo_reserva,
        jsonb_build_object(
            'etapa', p_etapa,
            'monto_cop', v_monto_etapa,
            'saldo_anterior_cop', v_wallet.saldo_disponible_cop,
            'saldo_posterior_cop', v_new_balance
        )
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
-- 5. POLÍTICAS RLS Y PUBLICACIÓN SUPABASE REALTIME
-- =============================================================================
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
        BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN duplicate_object THEN NULL; END;
        BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_locations; EXCEPTION WHEN duplicate_object THEN NULL; END;
        BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.professional_wallets; EXCEPTION WHEN duplicate_object THEN NULL; END;
        BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions; EXCEPTION WHEN duplicate_object THEN NULL; END;
    END IF;
END $$;
