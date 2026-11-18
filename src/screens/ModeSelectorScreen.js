/**
 * Archivo: src/screens/ModeSelectorScreen.js
 * Módulo 1.3 y 1.4: Selector de Modalidad (Cliente <-> Profesional) y Alta de Nuevos Profesionales
 * - Permite cambiar entre Modo Cliente y Modo Profesional sin cerrar sesión.
 * - Si el usuario solo tiene perfil de Cliente y desea ofrecer servicios, permite crear su
 *   perfil profesional y asignar el rol PROFESSIONAL sobre su misma cuenta sin crear otra cuenta.
 * - Muestra y gestiona el estado de aprobación profesional (INCOMPLETE, PENDING, APPROVED, REJECTED, SUSPENDED).
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
  sessionStore,
  cambiarModalidadSinCerrarSesion,
  activarPerfilProfesionalEnCuentaActual,
  useResponsiveLayout,
} from '../theme/colors';
import CustomInput from '../components/CustomInput';
import ValidationModal from '../components/ui/ValidationModal';

export default function ModeSelectorScreen({ navigation, route }) {
  const layout = useResponsiveLayout();
  const rolesActuales = sessionStore.roles || ['CLIENT'];
  const tieneRolPro =
    rolesActuales.includes('PROFESSIONAL') ||
    Boolean(sessionStore.proUser?.id || sessionStore.proUser?.usuario_id);

  const [mostrarFormularioAlta, setMostrarFormularioAlta] = useState(
    Boolean(route?.params?.openUpgradeForm && !tieneRolPro)
  );
  const [nombreArtistico, setNombreArtistico] = useState(
    sessionStore.proUser?.nombre_artistico || sessionStore.clientUser?.nombre_completo || ''
  );
  const [dniNumero, setDniNumero] = useState(sessionStore.proUser?.dni_numero || '');
  const [especialidadPrincipal, setEspecialidadPrincipal] = useState('Peluquería y Colorimetría');
  const [entidadCertificadora, setEntidadCertificadora] = useState(
    sessionStore.proUser?.entidad_certificadora || 'Academia SENA / Certificación Profesional'
  );
  const [direccionBase, setDireccionBase] = useState(
    sessionStore.proUser?.direccion_base || sessionStore.clientUser?.direccion_principal || ''
  );
  const [guardando, setGuardando] = useState(false);
  const [modalState, setModalState] = useState({
    visible: false,
    variant: 'info',
    title: '',
    message: '',
    onConfirm: null,
  });

  const modoActual = sessionStore.activeRoleSession || 'cliente';
  const estadoAprobacion =
    sessionStore.proUser?.approval_status ||
    (tieneRolPro ? 'APPROVED' : 'INCOMPLETE');

  const handleSeleccionarModo = async (modo) => {
    if (modo === 'profesional' && !tieneRolPro) {
      setMostrarFormularioAlta(true);
      return;
    }
    await cambiarModalidadSinCerrarSesion(modo, navigation);
  };

  const handleActivarPerfilProfesional = async () => {
    if (!nombreArtistico.trim() || !dniNumero.trim()) {
      setModalState({
        visible: true,
        variant: 'warning',
        title: 'Datos profesionales requeridos',
        message:
          'Ingresa tu nombre artístico/profesional y tu número de documento de identidad para activar el rol Profesional en tu cuenta.',
        onConfirm: null,
      });
      return;
    }

    setGuardando(true);
    try {
      const res = await activarPerfilProfesionalEnCuentaActual({
        nombre_artistico: nombreArtistico.trim(),
        dni_numero: dniNumero.trim(),
        especialidades: [especialidadPrincipal.trim() || 'Estilismo'],
        entidad_certificadora: entidadCertificadora.trim(),
        direccion_base: direccionBase.trim(),
      });

      setModalState({
        visible: true,
        variant: 'success',
        title: 'Rol Profesional Activado',
        message: `Tu cuenta ahora cuenta con los roles CLIENT y PROFESSIONAL simultáneamente (Estado: ${res.approval_status}). Puedes alternar entre ambos modos sin cerrar sesión.`,
        onConfirm: async () => {
          setModalState((prev) => ({ ...prev, visible: false }));
          await cambiarModalidadSinCerrarSesion('profesional', navigation);
        },
      });
    } catch (error) {
      setModalState({
        visible: true,
        variant: 'error',
        title: 'No se pudo completar el alta',
        message: error.message || 'Verifica los datos e inténtalo nuevamente.',
        onConfirm: null,
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={[styles.scroll, layout.contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={20} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modalidad de la Cuenta</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.identityCard}>
          <View style={styles.identityAvatar}>
            <Feather name="user-check" size={22} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.identityName}>
              {sessionStore.clientUser?.nombre_completo ||
                sessionStore.proUser?.nombre_completo ||
                'Cuenta BeautyFlash'}
            </Text>
            <Text style={styles.identityEmail}>
              {sessionStore.clientUser?.correo || sessionStore.proUser?.correo || ''}
            </Text>
            <View style={styles.rolesChipsRow}>
              <View style={styles.roleChip}>
                <Text style={styles.roleChipText}>ROL: CLIENT</Text>
              </View>
              {tieneRolPro ? (
                <View style={[styles.roleChip, { backgroundColor: '#E8F6EF' }]}>
                  <Text style={[styles.roleChipText, { color: '#1E824C' }]}>
                    ROL: PROFESSIONAL ({estadoAprobacion})
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>SELECCIONA LA MODALIDAD ACTIVA (SIN CERRAR SESIÓN)</Text>

        <TouchableOpacity
          style={[styles.modeOptionCard, modoActual === 'cliente' && styles.modeOptionActive]}
          onPress={() => handleSeleccionarModo('cliente')}
        >
          <View style={styles.modeIconBox}>
            <Feather name="search" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.modeTitle}>Modo Cliente</Text>
            <Text style={styles.modeDesc}>
              Busca especialistas cercanos, solicita servicios a domicilio o en salón, sigue el recorrido en el mapa y califica la atención.
            </Text>
          </View>
          <Feather
            name={modoActual === 'cliente' ? 'check-circle' : 'chevron-right'}
            size={20}
            color={modoActual === 'cliente' ? '#1E824C' : colors.textGray}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeOptionCard, modoActual === 'profesional' && styles.modeOptionActive]}
          onPress={() => handleSeleccionarModo('profesional')}
        >
          <View style={styles.modeIconBox}>
            <Feather name="briefcase" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.modeTitle}>
              {tieneRolPro ? 'Modo Profesional' : 'Ofrecer Servicios como Profesional'}
            </Text>
            <Text style={styles.modeDesc}>
              {tieneRolPro
                ? 'Publica tus servicios, recibe solicitudes, gestiona tu agenda y administra tu billetera con Wompi Sandbox.'
                : 'Activa tu perfil profesional en esta misma cuenta sin necesidad de registrarte de nuevo.'}
            </Text>
          </View>
          <Feather
            name={modoActual === 'profesional' ? 'check-circle' : 'chevron-right'}
            size={20}
            color={modoActual === 'profesional' ? '#1E824C' : colors.textGray}
          />
        </TouchableOpacity>

        {!tieneRolPro && !mostrarFormularioAlta ? (
          <TouchableOpacity
            style={styles.upgradeBannerBtn}
            onPress={() => setMostrarFormularioAlta(true)}
          >
            <Feather name="plus-circle" size={17} color="#FFFFFF" />
            <Text style={styles.upgradeBannerText}>
              Quiero ofrecer servicios profesionales con mi cuenta actual
            </Text>
          </TouchableOpacity>
        ) : null}

        {mostrarFormularioAlta ? (
          <View style={styles.upgradeCard}>
            <Text style={styles.upgradeTitle}>
              Completar Perfil Profesional (Misma Cuenta)
            </Text>
            <Text style={styles.upgradeSub}>
              Se asignará el rol PROFESSIONAL a tu usuario actual y se vinculará tu billetera prepago.
            </Text>

            <CustomInput
              label="Nombre artístico o marca profesional *"
              iconName="award"
              value={nombreArtistico}
              onChangeText={setNombreArtistico}
              placeholder="Ej. Estudio Camila / Sofía Stylist"
            />

            <CustomInput
              label="Número de documento de identidad (Cédula / DNI) *"
              iconName="credit-card"
              value={dniNumero}
              onChangeText={setDniNumero}
              keyboardType="number-pad"
              placeholder="Ej. 1144098231"
            />

            <CustomInput
              label="Especialidad principal *"
              iconName="scissors"
              value={especialidadPrincipal}
              onChangeText={setEspecialidadPrincipal}
              placeholder="Peluquería, Uñas, Maquillaje, Barbería"
            />

            <CustomInput
              label="Entidad certificadora / Academia"
              iconName="book-open"
              value={entidadCertificadora}
              onChangeText={setEntidadCertificadora}
              placeholder="SENA / Academia de Belleza"
            />

            <CustomInput
              label="Dirección base de despacho o salón"
              iconName="map-pin"
              value={direccionBase}
              onChangeText={setDireccionBase}
              placeholder="Barrio y dirección en Cali"
            />

            <TouchableOpacity
              style={styles.submitUpgradeBtn}
              onPress={handleActivarPerfilProfesional}
              disabled={guardando}
            >
              {guardando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="check-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.submitUpgradeText}>
                    Activar Rol Profesional y Entrar al Panel
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      <ValidationModal
        visible={modalState.visible}
        variant={modalState.variant}
        title={modalState.title}
        message={modalState.message}
        onPrimaryPress={
          modalState.onConfirm ||
          (() => setModalState((prev) => ({ ...prev, visible: false })))
        }
        onClose={() => setModalState((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark , flexShrink: 1 },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  identityAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityName: { fontSize: 15.5, fontWeight: '800', color: colors.textDark },
  identityEmail: { fontSize: 12, color: colors.textGray, marginTop: 2 },
  rolesChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  roleChip: {
    backgroundColor: '#F3EFEA',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleChipText: { fontSize: 10, fontWeight: '800', color: colors.primary , flexShrink: 1 },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.textGray,
    letterSpacing: 0.6,
    marginBottom: 10,
  flexShrink: 1 },
  modeOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 12,
  },
  modeOptionActive: {
    borderColor: colors.primary,
    backgroundColor: '#FBF8F5',
  },
  modeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTitle: { fontSize: 15, fontWeight: '800', color: colors.textDark , flexShrink: 1 },
  modeDesc: { fontSize: 12, color: colors.textGray, marginTop: 3, lineHeight: 17 , flexShrink: 1 },
  upgradeBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.secondary,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 6,
  },
  upgradeBannerText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' , flexShrink: 1 },
  upgradeCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 12,
  },
  upgradeTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark, marginBottom: 4 , flexShrink: 1 },
  upgradeSub: { fontSize: 12, color: colors.textGray, marginBottom: 14, lineHeight: 17 , flexShrink: 1 },
  submitUpgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E824C',
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 8,
  },
  submitUpgradeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' , flexShrink: 1 },
});
