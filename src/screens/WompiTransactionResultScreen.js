/**
 * Archivo: src/screens/WompiTransactionResultScreen.js
 * Módulo 4.3, Módulo 7 y Gestión Administrativa de Anulaciones (`VOIDED`):
 * - Muestra el resultado verificado por el Webhook (`APPROVED`, `DECLINED`, `ERROR`, `PENDING`, `VOIDED`).
 * - Permite verificar la idempotencia reenviando el mismo evento de Webhook.
 * - Incluye el Panel Administrativo para solicitar la anulación de una recarga aprobada con tarjeta (Paso 1 y 2:
 *   registra la solicitud sin descontar el saldo) y confirmar el Webhook `VOIDED` de Wompi (Paso 3, 4 y 5:
 *   revierte el saldo disponible, registra cualquier diferencia usada en `pendiente_conciliacion_cop` y envía
 *   la notificación push oficial al profesional).
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  colors,
  formatCOP,
  procesarConfirmacionWebhookWompiSandbox,
  solicitarAnulacionAdministrativaRecargaWompi,
  confirmarWebhookAnulacionVoidedWompi,
  useResponsiveLayout,
} from '../theme/colors';
import ValidationModal from '../components/ui/ValidationModal';

export default function WompiTransactionResultScreen({ navigation, route }) {
  const layout = useResponsiveLayout();
  const initialResult = route?.params?.result || {};
  const tx = route?.params?.transaction || {};
  const paymentMethodType = String(
    route?.params?.paymentMethodType ||
      initialResult.payment_method_type ||
      tx.payment_method_type ||
      'CARD'
  ).toUpperCase();

  const [resState, setResState] = useState(initialResult);
  const [solicitudAnulacionEnviada, setSolicitudAnulacionEnviada] = useState(false);
  const [probandoIdempotencia, setProbandoIdempotencia] = useState(false);
  const [procesandoAnulacion, setProcesandoAnulacion] = useState(false);
  const [modalAlert, setModalAlert] = useState({
    visible: false,
    variant: 'info',
    title: '',
    message: '',
  });

  const status = String(resState.status || 'PENDING').toUpperCase();
  const isApproved = status === 'APPROVED';
  const isVoided = status === 'VOIDED';
  const isPending = status === 'PENDING';

  const statusVisual = isApproved
    ? { icon: 'check-circle', color: '#1E824C', bg: '#E8F6EF', label: 'TRANSACCIÓN APROBADA (APPROVED)' }
    : isVoided
    ? { icon: 'rotate-ccw', color: '#8E44AD', bg: '#F4ECF7', label: 'RECARGA ANULADA (VOIDED)' }
    : isPending
    ? { icon: 'clock', color: '#D68910', bg: '#FEF5E7', label: 'TRANSACCIÓN PENDIENTE (PENDING)' }
    : { icon: 'x-circle', color: '#C0392B', bg: '#FDEDEC', label: `TRANSACCIÓN ${status}` };

  const handleProbarWebhookRepetido = async () => {
    setProbandoIdempotencia(true);
    try {
      if (isVoided) {
        const dupVoid = await confirmarWebhookAnulacionVoidedWompi({
          reference: resState.reference || tx.reference,
          montoOriginalCop: resState.amount_cop || tx.amount_cop,
          wompiTransactionId: resState.wompi_transaction_id,
        });
        setModalAlert({
          visible: true,
          variant: 'info',
          title: 'Idempotencia de Anulación Confirmada',
          message: dupVoid.mensaje,
        });
        return;
      }

      const duplicateCheck = await procesarConfirmacionWebhookWompiSandbox({
        reference: resState.reference || tx.reference,
        status: 'APPROVED',
        metodoDetalle: resState.method_label || 'Tarjeta •••• 4242',
        wompiTransactionId: resState.wompi_transaction_id,
      });

      setModalAlert({
        visible: true,
        variant: 'info',
        title: duplicateCheck.idempotente
          ? 'Idempotencia Confirmada'
          : 'Webhook Procesado',
        message: duplicateCheck.idempotente
          ? `Se reenvió el evento del Webhook para la referencia ${
              resState.reference || tx.reference
            } y el backend bloqueó la acreditación duplicada. Tu saldo permanece en ${formatCOP(
              duplicateCheck.saldo_disponible_cop
            )} COP.`
          : `Saldo actualizado a ${formatCOP(duplicateCheck.saldo_disponible_cop)} COP.`,
      });
    } finally {
      setProbandoIdempotencia(false);
    }
  };

  // Paso 1 y 2: Solicitud administrativa de anulación (NO modifica el saldo todavía)
  const handleSolicitarAnulacionAdmin = async () => {
    setProcesandoAnulacion(true);
    try {
      const reqRes = await solicitarAnulacionAdministrativaRecargaWompi({
        reference: resState.reference || tx.reference,
        motivo: 'Solicitud de anulación desde el panel administrativo',
        paymentMethodType,
      });
      setSolicitudAnulacionEnviada(true);
      setModalAlert({
        visible: true,
        variant: 'info',
        title: 'Paso 1 y 2: Solicitud de anulación registrada',
        message: `${reqRes.mensaje}\n\nSaldo actual intacto: ${formatCOP(
          reqRes.saldo_disponible_cop
        )} COP. Ahora pulsa "Confirmar Webhook VOIDED" para simular la confirmación de Wompi.`,
      });
    } catch (error) {
      setModalAlert({
        visible: true,
        variant: 'warning',
        title: 'Anulación no disponible para este medio',
        message: error.message,
      });
    } finally {
      setProcesandoAnulacion(false);
    }
  };

  // Paso 3, 4 y 5: Recepción del webhook VOIDED, actualización de billetera y notificación push
  const handleConfirmarWebhookVoided = async () => {
    setProcesandoAnulacion(true);
    try {
      const voidRes = await confirmarWebhookAnulacionVoidedWompi({
        reference: resState.reference || tx.reference,
        montoOriginalCop: resState.amount_cop || tx.amount_cop,
        wompiTransactionId: resState.wompi_transaction_id,
      });

      setResState((prev) => ({
        ...prev,
        status: 'VOIDED',
        acreditado: false,
        saldo_disponible_cop: voidRes.saldo_disponible_cop,
        monto_retirado_billetera_cop: voidRes.monto_retirado_billetera_cop,
        pendiente_conciliacion_cop: voidRes.pendiente_conciliacion_cop,
        status_message: voidRes.mensaje,
      }));

      setModalAlert({
        visible: true,
        variant: 'warning',
        title: 'Recarga Anulada (VOIDED) y Notificación Enviada',
        message: `${voidRes.mensaje}\n\n• Monto retirado de billetera: -${formatCOP(
          voidRes.monto_retirado_billetera_cop
        )} COP\n• Saldo disponible final: ${formatCOP(voidRes.saldo_disponible_cop)} COP${
          voidRes.pendiente_conciliacion_cop > 0
            ? `\n• Saldo ya utilizado registrado como pendiente de conciliación: ${formatCOP(
                voidRes.pendiente_conciliacion_cop
              )} COP`
            : ''
        }`,
      });
    } catch (error) {
      setModalAlert({
        visible: true,
        variant: 'error',
        title: 'No se pudo procesar la anulación',
        message: error.message,
      });
    } finally {
      setProcesandoAnulacion(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={[styles.scroll, layout.contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, layout.cardShadow]}>
          <View style={[styles.iconCircle, { backgroundColor: statusVisual.bg }]}>
            <Feather name={statusVisual.icon} size={32} color={statusVisual.color} />
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusVisual.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusVisual.color }]}>
              {statusVisual.label}
            </Text>
          </View>

          <Text style={[styles.amountText, { color: statusVisual.color }]}>
            {isVoided ? '-' : ''}
            {formatCOP(resState.amount_cop || tx.amount_cop || 0)} COP
          </Text>

          <Text style={styles.statusMessage}>
            {resState.status_message || 'Resultado conciliado mediante Webhook de Wompi Sandbox.'}
          </Text>

          <View style={styles.detailsBox}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Referencia Comercio</Text>
              <Text style={styles.rowValue}>{resState.reference || tx.reference}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>ID Transacción Wompi</Text>
              <Text style={styles.rowValue}>
                {resState.wompi_transaction_id || '11004-SANDBOX'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Medio de pago</Text>
              <Text style={styles.rowValue}>{resState.method_label || paymentMethodType}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Estado de acreditación</Text>
              <Text
                style={[
                  styles.rowValue,
                  {
                    color: isApproved
                      ? '#1E824C'
                      : isVoided
                      ? '#8E44AD'
                      : '#C0392B',
                  },
                ]}
              >
                {isApproved
                  ? 'Acreditado (Vía Webhook)'
                  : isVoided
                  ? `Revertido (-${formatCOP(resState.monto_retirado_billetera_cop || resState.amount_cop || 0)} COP)`
                  : 'No acreditado ($0 COP)'}
              </Text>
            </View>
            {resState.pendiente_conciliacion_cop > 0 ? (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Pendiente de conciliación</Text>
                <Text style={[styles.rowValue, { color: '#D68910' }]}>
                  {formatCOP(resState.pendiente_conciliacion_cop)} COP
                </Text>
              </View>
            ) : null}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Saldo disponible actual</Text>
              <Text style={styles.rowValue}>
                {formatCOP(resState.saldo_disponible_cop || 0)} COP
              </Text>
            </View>
          </View>

          {(isApproved || isVoided) && (
            <TouchableOpacity
              style={styles.idempBtn}
              onPress={handleProbarWebhookRepetido}
              disabled={probandoIdempotencia}
            >
              {probandoIdempotencia ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <>
                  <Feather name="repeat" size={15} color={colors.primary} />
                  <Text style={styles.idempBtnText}>
                    Simular Webhook Repetido (Verificar Idempotencia)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* PANEL ADMINISTRATIVO DE ANULACIÓN DE RECARGA WOMPI (PASOS 1 AL 5) */}
          {isApproved && (
            <View style={styles.adminVoidBox}>
              <View style={styles.adminHeaderRow}>
                <Feather name="shield" size={15} color="#8E44AD" />
                <Text style={styles.adminTitle}>
                  PANEL ADMINISTRATIVO • GESTIÓN DE ANULACIÓN (VOIDED)
                </Text>
              </View>
              <Text style={styles.adminDesc}>
                1. Solicitar la anulación registra la petición sin descontar el saldo inmediatamente.{'\n'}
                2. Cuando el Webhook de Wompi confirma el estado VOIDED, se revierte el saldo y se envía la notificación push al profesional.
              </Text>

              <TouchableOpacity
                style={[
                  styles.adminReqBtn,
                  solicitudAnulacionEnviada && { backgroundColor: '#6C3483' },
                ]}
                onPress={handleSolicitarAnulacionAdmin}
                disabled={procesandoAnulacion}
              >
                <Feather name="file-text" size={15} color="#FFFFFF" />
                <Text style={styles.adminBtnText}>
                  {solicitudAnulacionEnviada
                    ? 'Paso 1 Completado: Solicitud Registrada (Sin cambio de saldo)'
                    : 'Paso 1: Solicitar Anulación desde Panel Administrativo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminConfirmVoidBtn}
                onPress={handleConfirmarWebhookVoided}
                disabled={procesandoAnulacion}
              >
                <Feather name="rotate-ccw" size={15} color="#FFFFFF" />
                <Text style={styles.adminBtnText}>
                  Paso 2: Recibir Webhook VOIDED de Wompi y Revertir Billetera
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {!isApproved && !isVoided && (
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => navigation.replace('WalletRecharge')}
            >
              <Feather name="refresh-cw" size={15} color="#FFFFFF" />
              <Text style={styles.retryBtnText}>Intentar con otro parámetro de prueba</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.walletBtn}
            onPress={() => navigation.navigate('Billetera')}
          >
            <Feather name="credit-card" size={16} color="#FFFFFF" />
            <Text style={styles.walletBtnText}>Volver a mi Billetera Profesional</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ValidationModal
        visible={modalAlert.visible}
        variant={modalAlert.variant}
        title={modalAlert.title}
        message={modalAlert.message}
        onClose={() => setModalAlert((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingTop: 16, paddingBottom: 36 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 8,
  },
  statusBadgeText: { fontSize: 10.5, fontWeight: '900', letterSpacing: 0.4, flexShrink: 1 },
  amountText: { fontSize: 28, fontWeight: '900', marginBottom: 8, flexShrink: 1 },
  statusMessage: {
    fontSize: 12.5,
    color: colors.textGray,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  detailsBox: {
    width: '100%',
    backgroundColor: '#F8F6F4',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  rowLabel: { fontSize: 12, color: colors.textGray, fontWeight: '600', flexShrink: 1 },
  rowValue: {
    flexShrink: 1,
    fontSize: 12,
    color: colors.textDark,
    fontWeight: '800',
    textAlign: 'right',
  },
  idempBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FBF8F5',
    borderWidth: 1.5,
    borderColor: colors.primary,
    minHeight: 46,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  idempBtnText: {
    flexShrink: 1,
    color: colors.primary,
    fontSize: 12.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  adminVoidBox: {
    width: '100%',
    backgroundColor: '#FAF5FC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D7BDE2',
    marginBottom: 14,
  },
  adminHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  adminTitle: {
    flexShrink: 1,
    fontSize: 10.5,
    fontWeight: '900',
    color: '#8E44AD',
  },
  adminDesc: {
    fontSize: 11.5,
    color: colors.textDark,
    lineHeight: 16,
    marginBottom: 10,
  },
  adminReqBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8E44AD',
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  adminConfirmVoidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C0392B',
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  adminBtnText: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  retryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.secondary,
    minHeight: 46,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  retryBtnText: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  walletBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    minHeight: 50,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  walletBtnText: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
});
