/**
 * Archivo: src/screens/WalletTxDetailScreen.js
 * Módulo 4.5 y Gestión Administrativa de Anulación desde el Detalle del Movimiento
 * - Muestra todos los detalles del movimiento (incluyendo la referencia de la recarga original cuando es una reversión VOIDED
 *   y el saldo pendiente de conciliación si se había utilizado parte del saldo).
 * - Permite al administrador solicitar y confirmar la anulación de una recarga aprobada.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  colors,
  formatCOP,
  solicitarAnulacionAdministrativaRecargaWompi,
  confirmarWebhookAnulacionVoidedWompi,
  useResponsiveLayout,
} from '../theme/colors';
import ValidationModal from '../components/ui/ValidationModal';

export default function WalletTxDetailScreen({ navigation, route }) {
  const layout = useResponsiveLayout();
  const [tx, setTx] = useState(route?.params?.transaction || {});
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [modalAlert, setModalAlert] = useState({
    visible: false,
    variant: 'info',
    title: '',
    message: '',
  });

  const positivo = Number(tx.signo) > 0;
  const esRecargaAprobada =
    (tx.tipo === 'recarga' || tx.type === 'RECHARGE') &&
    String(tx.estado || tx.status || 'APPROVED').toUpperCase() === 'APPROVED';

  const handleSolicitarAnulacion = async () => {
    try {
      const res = await solicitarAnulacionAdministrativaRecargaWompi({
        reference: tx.referencia || tx.id,
        motivo: 'Solicitud administrativa desde detalle de movimiento',
        paymentMethodType: tx.payment_method_type || 'CARD',
      });
      setSolicitudEnviada(true);
      setModalAlert({
        visible: true,
        variant: 'info',
        title: 'Solicitud de anulación registrada',
        message: res.mensaje,
      });
    } catch (err) {
      setModalAlert({
        visible: true,
        variant: 'warning',
        title: 'No se pudo solicitar la anulación',
        message: err.message,
      });
    }
  };

  const handleConfirmarVoided = async () => {
    try {
      const voidRes = await confirmarWebhookAnulacionVoidedWompi({
        reference: tx.referencia || tx.id,
        montoOriginalCop: tx.monto_cop,
        wompiTransactionId: tx.wompi_transaction_id,
      });
      setTx(voidRes.movimiento_reversion);
      setModalAlert({
        visible: true,
        variant: 'warning',
        title: 'Anulación confirmada (VOIDED)',
        message: voidRes.mensaje,
      });
    } catch (err) {
      setModalAlert({
        visible: true,
        variant: 'error',
        title: 'Error al procesar VOIDED',
        message: err.message,
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comprobante de Movimiento</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, layout.contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.receiptCard}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: positivo ? '#E8F6EF' : '#FDEDEC' },
            ]}
          >
            <Feather
              name={positivo ? 'check-circle' : 'rotate-ccw'}
              size={28}
              color={positivo ? '#1E824C' : '#C0392B'}
            />
          </View>

          <Text style={styles.typeLabel}>
            {String(tx.tipo || tx.type || 'MOVIMIENTO').toUpperCase()}
          </Text>
          <Text
            style={[
              styles.amountText,
              { color: positivo ? '#1E824C' : '#C0392B' },
            ]}
          >
            {positivo ? '+' : '-'}
            {formatCOP(tx.monto_cop || 0)} COP
          </Text>
          <Text style={styles.descText}>{tx.descripcion || 'Movimiento registrado'}</Text>

          <View style={styles.detailRowsBox}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Estado</Text>
              <Text style={styles.rowValue}>{tx.estado || tx.status || 'APPROVED'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Referencia única</Text>
              <Text style={styles.rowValue}>{tx.referencia || tx.id || 'N/A'}</Text>
            </View>
            {tx.referencia_original || tx.original_reference ? (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Recarga original asociada</Text>
                <Text style={[styles.rowValue, { color: '#8E44AD' }]}>
                  {tx.referencia_original || tx.original_reference}
                </Text>
              </View>
            ) : null}
            {tx.pendiente_conciliacion_cop > 0 ? (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Pendiente de conciliación</Text>
                <Text style={[styles.rowValue, { color: '#D68910' }]}>
                  {formatCOP(tx.pendiente_conciliacion_cop)} COP
                </Text>
              </View>
            ) : null}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Fecha y hora</Text>
              <Text style={styles.rowValue}>{tx.creado_en || 'Registrado'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Método / Origen</Text>
              <Text style={styles.rowValue}>{tx.metodo_pago || 'Billetera Prepago'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Saldo anterior</Text>
              <Text style={styles.rowValue}>
                {formatCOP(tx.saldo_anterior_cop || 0)} COP
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Saldo posterior</Text>
              <Text style={styles.rowValue}>
                {formatCOP(tx.saldo_posterior_cop || 0)} COP
              </Text>
            </View>
            {tx.codigo_reserva ? (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Contratación asociada</Text>
                <Text style={[styles.rowValue, { color: colors.primary }]}>
                  #{tx.codigo_reserva}
                </Text>
              </View>
            ) : null}
          </View>

          {esRecargaAprobada ? (
            <View style={styles.adminActionsBox}>
              <Text style={styles.adminBoxTitle}>
                GESTIÓN ADMINISTRATIVA DE ANULACIÓN (WOMPI VOIDED)
              </Text>
              <TouchableOpacity
                style={styles.adminReqBtn}
                onPress={handleSolicitarAnulacion}
              >
                <Feather name="file-text" size={14} color="#FFFFFF" />
                <Text style={styles.adminBtnText}>
                  {solicitudEnviada
                    ? '1. Solicitud Registrada (Sin cambio de saldo)'
                    : '1. Solicitar Anulación Administrativa'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.adminVoidBtn}
                onPress={handleConfirmarVoided}
              >
                <Feather name="rotate-ccw" size={14} color="#FFFFFF" />
                <Text style={styles.adminBtnText}>
                  2. Confirmar Webhook VOIDED y Revertir Saldo
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark, flexShrink: 1 },
  scroll: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 34 },
  receiptCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  typeLabel: { fontSize: 10.5, fontWeight: '800', color: colors.textGray, letterSpacing: 0.8, flexShrink: 1 },
  amountText: { fontSize: 28, fontWeight: '900', marginVertical: 6, flexShrink: 1 },
  descText: { fontSize: 13, color: colors.textDark, textAlign: 'center', marginBottom: 18, flexShrink: 1 },
  detailRowsBox: {
    width: '100%',
    backgroundColor: '#F8F6F4',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  rowLabel: { fontSize: 12, color: colors.textGray, fontWeight: '600', flexShrink: 1 },
  rowValue: { fontSize: 12.5, color: colors.textDark, fontWeight: '800', flexShrink: 1, textAlign: 'right' },
  adminActionsBox: {
    width: '100%',
    backgroundColor: '#FAF5FC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D7BDE2',
    marginTop: 16,
    gap: 8,
  },
  adminBoxTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#8E44AD',
    marginBottom: 4,
  },
  adminReqBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#8E44AD',
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  adminVoidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#C0392B',
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  adminBtnText: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
});
