import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, StatusBar, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const colors = { background: '#FAFAFA', surface: '#FFFFFF', primary: '#8B503E', textDark: '#1E1E1E', textGray: '#707070', border: '#EAEAEA', accent: '#D89C8F' };

export default function CredentialsAndInsuranceScreen({ navigation }) {
  const [frecuencia, setFrecuencia] = useState('inmediato');
  const [facturacionAuto, setFacturacionAuto] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 5}}><Feather name="arrow-left" size={24} color={colors.textDark} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Credentials And Insurance</Text>
        <TouchableOpacity><View style={styles.headerProfileIcon}><Feather name="user" size={16} color="#FFF" /></View></TouchableOpacity>
      </View>
      <View style={styles.progressHeader}>
        <Text style={styles.progressText}>PASO 4 DE 4 • COBROS Y VERIFICACIÓN</Text>
        <Text style={styles.progressText}>100%</Text>
      </View>
      <View style={styles.progressBar}><View style={[styles.progressFill, {width: '100%'}]} /></View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Verificación Legal y Datos de Cobro</Text>
        <Text style={styles.description}>Configura tu cuenta bancaria y acredita tu experiencia para activar tu perfil profesional y empezar a recibir reservas.</Text>

        <View style={styles.alertBox}>
          <View style={styles.alertIcon}><Feather name="shield" size={16} color={colors.primary} /></View>
          <View style={{flex: 1}}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4}}>
              <Feather name="zap" size={12} color={colors.primary} />
              <Text style={styles.alertTitle}> Cobros 100% Garantizados + Pago Flash</Text>
            </View>
            <Text style={styles.alertText}>Pagos protegidos antes del inicio de la cita. 0% comisiones sobre propinas. Liquidaciones automáticas sin esperas.</Text>
          </View>
        </View>

        {/* Depósito Bancario */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Depósito Bancario Directo</Text>
          <Text style={styles.sectionSub}><Feather name="lock" size={10}/> Cifrado SEPA</Text>
        </View>
        
        <Text style={styles.label}>Titular fiscal de la cuenta</Text>
        <View style={styles.inputBoxDisabled}>
          <Feather name="briefcase" size={16} color={colors.textGray} style={{marginRight: 8}}/>
          <Text style={styles.inputText}>Sofía Alarcón Morales</Text>
        </View>

        <Text style={styles.label}>Documento fiscal (NIF / CIF)</Text>
        <View style={styles.inputBoxDisabled}>
          <MaterialCommunityIcons name="text-recognition" size={16} color={colors.textGray} style={{marginRight: 8}}/>
          <Text style={styles.inputText}>47291845B</Text>
          <View style={styles.validBadge}><Text style={styles.validBadgeText}>Validado con AEAT ✓</Text></View>
        </View>

        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <Text style={styles.label}>IBAN España</Text>
          <Text style={[styles.label, {color: '#A0A0A0'}]}>CaixaBank S.A.</Text>
        </View>
        <View style={styles.inputBoxDisabled}>
          <MaterialCommunityIcons name="bank-outline" size={16} color={colors.textGray} style={{marginRight: 8}}/>
          <Text style={styles.inputText}>ES84 2100 4502 0001 9842</Text>
          <Feather name="lock" size={14} color={colors.textGray} />
        </View>
        <View style={{flexDirection: 'row', gap: 8, marginBottom: 20}}>
          <View style={styles.statusPill}><Text style={styles.statusPillText}>Stripe Connect Conectado ✓</Text></View>
          <View style={styles.statusPill}><Text style={styles.statusPillText}>Bizum Pro Activado ✓</Text></View>
        </View>

        {/* Frecuencia de liquidación */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Frecuencia de Liquidación</Text>
          <Text style={styles.sectionSub}>Selecciona tu preferencia</Text>
        </View>

        <TouchableOpacity style={[styles.radioCard, frecuencia === 'inmediato' && styles.radioCardActive]} onPress={() => setFrecuencia('inmediato')}>
          <View style={[styles.radio, frecuencia === 'inmediato' && styles.radioActive]}>{frecuencia === 'inmediato' && <Feather name="check" size={12} color="#FFF"/>}</View>
          <View style={{flex: 1}}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text style={styles.radioTitle}>Pago Flash Inmediato </Text>
              <View style={styles.badgeOrange}><Text style={styles.badgeOrangeText}>Más Elegido</Text></View>
            </View>
            <Text style={styles.radioSub}>Transferencia automática a tu cuenta en máx. 30 min tras terminar cada cita verificada.</Text>
            <Text style={styles.radioMini}><Feather name="clock" size={10}/> Liquidación en tiempo real + Sin comisiones extra</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.radioCard} onPress={() => setFrecuencia('semanal')}>
          <View style={styles.radio} />
          <View style={{flex: 1}}>
            <Text style={styles.radioTitle}>Liquidación Semanal Consolidada</Text>
            <Text style={styles.radioSub}>Ingreso agrupado cada lunes por la mañana con resumen financiero semanal en PDF.</Text>
          </View>
        </TouchableOpacity>

        {/* Verificación */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Verificación de Identidad y Título</Text>
          <Text style={styles.sectionSub}>Requisito KYS</Text>
        </View>

        <View style={styles.docCard}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Feather name="file-text" size={16} color={colors.primary} />
              <Text style={styles.docTitle}> DNI / NIE / Pasaporte en vigor</Text>
            </View>
            <Feather name="check-circle" size={16} color={colors.primary} />
          </View>
          <View style={styles.fileRow}>
            <Feather name="file" size={14} color={colors.textGray} />
            <Text style={styles.fileName}> DNI_anverso_reverso.pdf</Text>
            <Text style={styles.validText}>Validado ✓</Text>
          </View>
        </View>

        <View style={styles.docCard}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Feather name="award" size={16} color={colors.textDark} />
              <Text style={styles.docTitle}> Título, Certificación o Seguro RC</Text>
            </View>
            <View style={styles.reqBadge}><Text style={styles.reqBadgeText}>Obligatorio</Text></View>
          </View>
          <Text style={styles.docSub}>Acredita tu especialidad en estética, estilismo o cuidado personal para obtener la insignia Pro Verificada.</Text>
          <TouchableOpacity style={styles.uploadBtn}>
            <Feather name="plus-circle" size={16} color={colors.primary} />
            <Text style={styles.uploadBtnText}> Subir certificado profesional (PDF o JPG)</Text>
          </TouchableOpacity>
        </View>

        {/* Facturación */}
        <View style={styles.factCard}>
          <Feather name="file-text" size={20} color={colors.primary} />
          <View style={{flex: 1, paddingHorizontal: 12}}>
            <Text style={styles.factTitle}>Facturación Automática</Text>
            <Text style={styles.factSub}>Generar factura digital con retención IRPF (15%) para cada cliente de forma automática.</Text>
          </View>
          <Switch value={facturacionAuto} onValueChange={setFacturacionAuto} trackColor={{ false: '#EAEAEA', true: colors.primary }} thumbColor="#FFF" />
        </View>

        <TouchableOpacity style={styles.mainButton} onPress={() => navigation.navigate('ProProfileActivated')}>
          <Text style={styles.mainButtonText}>Finalizar y Activar mi Perfil Pro</Text>
          <Feather name="chevron-left" size={16} color="#FFF" style={{position: 'absolute', right: 20}} /> 
          {/* El diseño original tiene el icono apuntando a la izquierda en este botón */}
        </TouchableOpacity>

        <View style={styles.secureFooter}>
          <Feather name="shield" size={12} color={colors.textGray} />
          <Text style={styles.secureFooterText}>Conexión bancaria cifrada AES-256 bits y custodia segura bajo normativa PSD2</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: colors.textDark },
  headerProfileIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 },
  progressText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  progressBar: { height: 2, backgroundColor: colors.border, marginBottom: 20 },
  progressFill: { height: 2, backgroundColor: colors.primary },
  scrollContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: colors.textDark, marginBottom: 6 },
  description: { fontSize: 13, color: colors.textGray, lineHeight: 20, marginBottom: 20 },
  alertBox: { flexDirection: 'row', backgroundColor: '#FFF0ED', padding: 16, borderRadius: 12, marginBottom: 24 },
  alertIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  alertTitle: { fontSize: 11, fontWeight: '700', color: colors.primary },
  alertText: { fontSize: 11, color: colors.textGray, lineHeight: 16 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12, marginTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark },
  sectionSub: { fontSize: 10, color: colors.textGray },
  label: { fontSize: 11, color: colors.textGray, marginBottom: 6 },
  inputBoxDisabled: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 8, paddingHorizontal: 12, height: 44, marginBottom: 12 },
  inputText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textDark },
  validBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  validBadgeText: { fontSize: 9, color: '#2E7D32', fontWeight: '600' },
  statusPill: { backgroundColor: '#F5F5F5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  statusPillText: { fontSize: 10, fontWeight: '600', color: colors.textGray },
  radioCard: { flexDirection: 'row', backgroundColor: '#F9F9F9', padding: 16, borderRadius: 12, marginBottom: 10 },
  radioCardActive: { backgroundColor: '#FFF', borderWidth: 1, borderColor: colors.primary },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: '#A0A0A0', alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2 },
  radioActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  radioTitle: { fontSize: 13, fontWeight: '700', color: colors.textDark },
  radioSub: { fontSize: 11, color: colors.textGray, marginTop: 4, lineHeight: 16 },
  badgeOrange: { backgroundColor: colors.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6 },
  badgeOrangeText: { fontSize: 9, color: '#FFF', fontWeight: '700' },
  radioMini: { fontSize: 10, color: colors.primary, marginTop: 8, fontWeight: '600' },
  docCard: { backgroundColor: '#FFF', borderWidth: 1, borderColor: colors.border, padding: 16, borderRadius: 12, marginBottom: 12 },
  docTitle: { fontSize: 13, fontWeight: '600', color: colors.textDark },
  fileRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', padding: 10, borderRadius: 8 },
  fileName: { flex: 1, fontSize: 11, color: colors.textDark },
  validText: { fontSize: 10, color: '#2E7D32', fontWeight: '600' },
  reqBadge: { backgroundColor: '#F0F0F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  reqBadgeText: { fontSize: 10, color: colors.textGray, fontWeight: '600' },
  docSub: { fontSize: 11, color: colors.textGray, marginBottom: 12, lineHeight: 16 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9F1EF', paddingVertical: 12, borderRadius: 8 },
  uploadBtnText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  factCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', paddingVertical: 16, borderTopWidth: 1, borderColor: colors.border, marginTop: 10 },
  factTitle: { fontSize: 13, fontWeight: '600', color: colors.textDark },
  factSub: { fontSize: 10, color: colors.textGray, marginTop: 2, lineHeight: 14 },
  mainButton: { backgroundColor: colors.primary, flexDirection: 'row', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 20, marginBottom: 16 },
  mainButtonText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  secureFooter: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 20 },
  secureFooterText: { fontSize: 9, color: colors.textGray, textAlign: 'center', marginLeft: 6, lineHeight: 14 }
});