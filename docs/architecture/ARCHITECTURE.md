# Arquitectura Evolucionada — BeautyFlash Colombia (Módulos 1 al 12)

## 1. Resumen de Fases e Implementación

### Fase 1: Base de Datos y Sincronización (`bd_limpia_y_sincronizada_supabase.sql` y `supabase/migrations/20261117_evolucion_integral_14_tablas.sql`)
- **14 Tablas Canónicas + Compatibilidad Retroactiva**:
  1. `public.users` y `public.usuarios` (identidad unificada vinculada a `auth.users`).
  2. `public.user_roles` (`CLIENT`, `PROFESSIONAL`, `ADMIN` con restricción única `UNIQUE(user_id, role)`).
  3. `public.client_profiles` y `public.clientes`.
  4. `public.professional_profiles` y `public.perfiles_profesionales` (`approval_status`: `INCOMPLETE`, `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`).
  5. `public.user_preferences` (modalidad seleccionada `selected_mode`: `CLIENT` o `PROFESSIONAL`).
  6. `public.notifications` y `public.notificaciones` (`recipient_user_id`, `actor_user_id`, `entity_type`, `entity_id`, `target_screen`, `dedup_key`).
  7. `public.device_tokens` (`user_id`, `token`, `platform`, `device_id`, `is_active`, `last_used_at`).
  8. `public.professional_wallets` y `public.billetera_profesional` (separación contable entre `prepaid_balance_cop` y `platform_earned_commissions_cop`).
  9. `public.payment_attempts` (intentos de recarga Wompi Sandbox con `reference` única y `integrity_signature`).
  10. `public.wallet_transactions` y `public.transacciones_billetera` (historial inalterable con `idempotency_key`).
  11. `public.bookings` y `public.solicitudes_uber` (`comision_etapa1_cop` 3%, `comision_etapa2_cop` 7%, `etapa1_cobrada`, `etapa2_cobrada`, `llegada_confirmada`, `arrived_at`).
  12. `public.booking_status_history`.
  13. `public.booking_locations` (seguimiento GPS en tiempo real durante desplazamientos activos).
  14. `public.audit_logs` y `public.password_recovery_otps` (códigos OTP de 6 dígitos hasheados con `SHA-256`).
- **Funciones Transaccionales PL/pgSQL**:
  - `public.fn_process_wompi_webhook_recharge`: concilia e impacta saldo únicamente cuando el webhook reporta `APPROVED` con idempotencia.
  - `public.fn_charge_booking_commission_stage`: descuenta atómicamente el **3%** al confirmar la contratación (Etapa 1) y el **7%** al iniciar el servicio (Etapa 2).

### Fase 2: Backend Modular (`backend/src/modules/` y `backend/src/app.js`)
- **Módulo 1 y 2 (`backend/src/modules/auth/unifiedAuth.service.js`)**:
  - `POST /api/v1/auth/login`: inicio de sesión único con protección contra fuerza bruta y mensaje genérico anti-enumeración (`"No fue posible iniciar sesión. Verifica tus datos e inténtalo nuevamente."`).
  - `POST /api/v1/auth/switch-mode`: cambio entre `CLIENT` y `PROFESSIONAL` sin cerrar sesión.
  - `POST /api/v1/auth/upgrade-to-professional`: alta de perfil profesional sobre una cuenta existente sin crear segunda cuenta.
  - `POST /api/v1/auth/logout`: desactivación selectiva del `device_token` del dispositivo actual sin eliminar otros dispositivos.
  - `POST /api/v1/auth/password-recovery/{request,verify-code,reset}`: flujo de recuperación en 3 etapas con OTP de 6 dígitos hasheado en servidor.
- **Módulo 3 (`backend/src/modules/notifications/notificationCenter.service.js`)**:
  - `GET /api/v1/notifications`, `POST /api/v1/notifications/dispatch`, `POST /api/v1/notifications/device-token`, `DELETE /api/v1/notifications/device-token`.
- **Módulo 4 y 5 (`backend/src/modules/wallet/wompiAndCommission.service.js`)**:
  - `POST /api/v1/wallet/:id/wompi/create-transaction`: crea referencia única y firma `SHA-256` en estado `PENDING` (sin acreditar saldo).
  - `POST /api/v1/webhooks/wompi`: verifica firma del evento, concilia estado (`APPROVED`, `DECLINED`, `PENDING`) con idempotencia y acredita saldo.
  - `POST /api/v1/bookings/:id/confirm-client` (Etapa 1: 3%) y `POST /api/v1/bookings/:id/start-service` (Etapa 2: 7%).
- **Módulo 6 (`backend/src/modules/tracking/realtimeTracking.service.js`)**:
  - `POST /api/v1/bookings/:id/tracking/location`, `POST /api/v1/bookings/:id/tracking/arrive`, `GET /api/v1/bookings/:id/tracking` (con control de autorización `403 Forbidden` para usuarios ajenos a la contratación).

### Fase 3 y 4: Frontend React Native + Expo Router (`src/` y `app/`)
- **Componentes Reutilizables**:
  - `src/components/ui/ValidationModal.js`: modal elegante unificado para validaciones, errores, éxito y saldo insuficiente.
  - `src/components/ui/ModeSwitcherBanner.js`: selector rápido entre Modo Cliente y Modo Profesional sin cerrar sesión.
  - `src/components/map/BeautyFlashMapView.js`: mapa nativo con interpolación suave del marcador del profesional, polilínea de ruta y ETA estimado.
- **Nuevas Pantallas Implementadas y Conectadas**:
  - Recuperación de contraseña (3 pantallas): `ForgotPasswordRequestScreen.js`, `ForgotPasswordVerifyScreen.js`, `ForgotPasswordResetScreen.js`.
  - Gestión de modalidad y alta profesional: `ModeSelectorScreen.js`.
  - Billetera y Wompi Sandbox: `BilleteraScreen.js`, `WalletRechargeScreen.js`, `WalletHistoryScreen.js`, `WalletTxDetailScreen.js`.
  - Notificaciones y Seguimiento: `NotificationsCenterScreen.js`, `BookingTrackingScreen.js`.

## 2. Variables de Entorno Requeridas (`backend/.env`)

```env
PORT=4000
NODE_ENV=development
SUPABASE_URL=https://tcyndqzzawwcqqvcsbvu.supabase.co
SUPABASE_ANON_KEY=sb_publishable_txO2mh73LE4sY8AqzTiujA_jniwTOrQ
SUPABASE_SERVICE_ROLE_KEY=<TU_SUPABASE_SECRET_KEY>
GOOGLE_MAPS_API_KEY=<TU_GOOGLE_MAPS_API_KEY>

# Credenciales de Wompi Sandbox (Exclusivamente en el Backend)
WOMPI_ENVIRONMENT=sandbox
WOMPI_PUBLIC_KEY=pub_test_BeautyFlashWompiSandbox2026
WOMPI_PRIVATE_KEY=prv_test_BeautyFlashWompiSandboxSecret2026
WOMPI_INTEGRITY_SECRET=test_integrity_BeautyFlashWompiSecret2026
WOMPI_EVENTS_SECRET=test_events_BeautyFlashWompiWebhook2026
```