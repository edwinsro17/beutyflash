/**
 * Archivo: src/components/ServiceBookingModal.js
 * - Panel de creación de solicitud (Paso 1 del flujo: envía la solicitud en estado
 *   `pendiente_aceptacion_profesional` y registra el evento en las notificaciones y en el chat,
 *   sin abrir ventanas modales invasivas de estado).
 * - Panel de Chat con diferenciación visual clara entre mensajes informativos del sistema
 *   (`autor === 'sistema'`) y mensajes normales entre cliente y profesional.
 * - Cero emojis; utiliza exclusivamente iconografía vectorial.
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  colors,
  formatCOP,
  BLOQUES_HORARIOS_ESTANDAR,
  crearUnicaSolicitudServicio,
  enviarMensajeChatServicio,
  sincronizarEstadoDesdeSupabase,
  useResponsiveLayout,
} from '../theme/colors';

export function ServiceBookingModal({
  visible,
  servicio,
  initialMode = 'domicilio',
  onClose,
  onSuccessDomicilio,
  onSuccessCita,
}) {
  const [modo, setModo] = useState(initialMode);
  const [fecha, setFecha] = useState('Hoy');
  const [hora, setHora] = useState('10:30 a.m.');
  const [errorDisponibilidad, setErrorDisponibilidad] = useState(null);
  const [horariosSugeridos, setHorariosSugeridos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const { isTablet, modalWidth } = useResponsiveLayout();

  useEffect(() => {
    setModo(initialMode);
    setErrorDisponibilidad(null);
    setHorariosSugeridos([]);
  }, [servicio, initialMode, visible]);

  if (!servicio) return null;

  const fotosGaleria =
    servicio.galeria_resultados && servicio.galeria_resultados.length > 0
      ? servicio.galeria_resultados
      : servicio.image
      ? [servicio.image]
      : [];

  const handleEnviarSolicitud = async () => {
    setErrorDisponibilidad(null);
    setEnviando(true);
    try {
      const resultado = await crearUnicaSolicitudServicio({
        servicio_id: servicio.id,
        servicio_nombre: servicio.title,
        precio_servicio_cop: servicio.priceCop,
        servicio_foto: servicio.image,
        profesional_id: servicio.profesional_id,
        profesional_nombre: servicio.proName,
        profesional_foto: servicio.proAvatar,
        latitud_profesional: servicio.latitud_profesional,
        longitud_profesional: servicio.longitud_profesional,
        modalidad: modo,
        fecha_programada: modo === 'domicilio' ? 'Hoy' : fecha,
        hora_programada: modo === 'domicilio' ? 'Inmediato' : hora,
      });

      if (resultado.bloqueado) {
        setErrorDisponibilidad(resultado.motivo || resultado.mensaje);
        setHorariosSugeridos(resultado.horariosRecomendados || []);
        setEnviando(false);
        return;
      }

      setEnviando(false);
      onClose && onClose();
      if (modo === 'domicilio' && onSuccessDomicilio) {
        onSuccessDomicilio(resultado.reserva);
      } else if (onSuccessCita) {
        onSuccessCita(resultado.reserva);
      }
    } catch (err) {
      setErrorDisponibilidad(err.message);
      setEnviando(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View
          style={[
            styles.modalSheet,
            isTablet && { width: modalWidth, alignSelf: 'center', borderRadius: 24, marginBottom: 24 },
          ]}
        >
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.catLabel}>{servicio.categoryLabel}</Text>
              <Text style={styles.sheetTitle}>{servicio.title}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Feather name="x" size={20} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {fotosGaleria.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>
                  FOTOGRAFÍAS DEL SERVICIO ({fotosGaleria.length})
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 14 }}
                >
                  {fotosGaleria.map((imgUrl, idx) => (
                    <Image key={idx} source={{ uri: imgUrl }} style={styles.galleryImg} />
                  ))}
                </ScrollView>
              </>
            )}

            <View style={styles.infoBox}>
              <Text style={styles.descText}>{servicio.desc}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaBadge}>
                  <Feather name="clock" size={12} color={colors.primary} />
                  <Text style={styles.metaChipText}>{servicio.duration}</Text>
                </View>
                {servicio.barrio ? (
                  <View style={styles.metaBadge}>
                    <Feather name="map-pin" size={12} color={colors.primary} />
                    <Text style={styles.metaChipText}>{servicio.barrio}</Text>
                  </View>
                ) : null}
                <View style={styles.metaBadge}>
                  <Feather name="star" size={12} color={colors.primary} />
                  <Text style={styles.metaChipText}>{servicio.proRating || '5.0'}</Text>
                </View>
              </View>
              <Text style={styles.proText}>Profesional: {servicio.proName}</Text>
            </View>

            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[styles.modePill, modo === 'domicilio' && styles.modePillActive]}
                onPress={() => {
                  setModo('domicilio');
                  setErrorDisponibilidad(null);
                }}
              >
                <Feather
                  name="navigation"
                  size={14}
                  color={modo === 'domicilio' ? '#FFFFFF' : colors.textDark}
                />
                <Text style={[styles.modePillText, modo === 'domicilio' && { color: '#FFFFFF' }]}>
                  A domicilio
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modePill, modo === 'local' && styles.modePillActive]}
                onPress={() => {
                  setModo('local');
                  setErrorDisponibilidad(null);
                }}
              >
                <Feather
                  name="calendar"
                  size={14}
                  color={modo === 'local' ? '#FFFFFF' : colors.textDark}
                />
                <Text style={[styles.modePillText, modo === 'local' && { color: '#FFFFFF' }]}>
                  En salón
                </Text>
              </TouchableOpacity>
            </View>

            {modo === 'local' && (
              <View style={styles.scheduleSection}>
                <Text style={styles.sectionLabel}>SELECCIONA DÍA Y HORARIO</Text>
                <View style={styles.chipsRow}>
                  {['Hoy', 'Mañana', 'Viernes', 'Sábado'].map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.chip, fecha === d && styles.chipActive]}
                      onPress={() => {
                        setFecha(d);
                        setErrorDisponibilidad(null);
                      }}
                    >
                      <Text style={[styles.chipText, fecha === d && { color: '#FFFFFF' }]}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={[styles.chipsRow, { marginTop: 8 }]}>
                  {BLOQUES_HORARIOS_ESTANDAR.map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[styles.chip, hora === h && styles.chipActive]}
                      onPress={() => {
                        setHora(h);
                        setErrorDisponibilidad(null);
                      }}
                    >
                      <Text style={[styles.chipText, hora === h && { color: '#FFFFFF' }]}>{h}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {errorDisponibilidad && (
              <View style={styles.unavailBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="alert-circle" size={16} color="#C0392B" />
                  <Text style={styles.unavailTitle}>Aviso de disponibilidad</Text>
                </View>
                <Text style={styles.unavailText}>{errorDisponibilidad}</Text>
                {horariosSugeridos.length > 0 && (
                  <View style={[styles.chipsRow, { marginTop: 8 }]}>
                    {horariosSugeridos.map((sug) => (
                      <TouchableOpacity
                        key={sug}
                        style={styles.sugChip}
                        onPress={() => {
                          setHora(sug);
                          setErrorDisponibilidad(null);
                        }}
                      >
                        <Text style={styles.sugChipText}>Seleccionar {sug}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            <View style={styles.priceFooter}>
              <View>
                <Text style={styles.totalLabel}>
                  {modo === 'domicilio' ? 'Total con domicilio:' : 'Total en salón:'}
                </Text>
                <Text style={styles.totalPrice}>
                  {formatCOP(servicio.priceCop + (modo === 'domicilio' ? 8000 : 0))} COP
                </Text>
              </View>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleEnviarSolicitud}
                disabled={enviando}
              >
                <Text style={styles.confirmBtnText}>
                  {enviando ? 'Enviando...' : 'Solicitar Servicio'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Componente de Chat con soporte para mensajes normales y mensajes informativos del sistema.
 */
export function ChatServicioModal({ visible, solicitud, rolActual = 'cliente', onClose }) {
  const [texto, setTexto] = useState('');
  const [, setTick] = useState(0);
  const { isTablet, modalWidth } = useResponsiveLayout();

  useEffect(() => {
    if (!visible) return undefined;
    const interval = setInterval(async () => {
      await sincronizarEstadoDesdeSupabase(rolActual);
      setTick((t) => t + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, [visible, rolActual]);

  if (!solicitud) return null;

  const chatHabilitado = Boolean(solicitud.chat_activo);
  const mensajes = solicitud.mensajes_chat || [];

  const handleEnviar = async () => {
    if (!texto.trim()) return;
    const msgEnviar = texto;
    setTexto('');
    await enviarMensajeChatServicio(rolActual, msgEnviar);
    setTick((t) => t + 1);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View
          style={[
            styles.modalSheet,
            isTablet && { width: modalWidth, alignSelf: 'center', borderRadius: 24, marginBottom: 24 },
          ]}
        >
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.catLabel}>
                CONVERSACIÓN DE SERVICIO • #{solicitud.codigo_reserva}
              </Text>
              <Text style={styles.sheetTitle}>
                {rolActual === 'cliente'
                  ? solicitud.profesional_nombre
                  : solicitud.cliente_nombre}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Feather name="x" size={20} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.chatArea} contentContainerStyle={{ gap: 10, paddingVertical: 10 }}>
            {mensajes.length === 0 ? (
              <Text style={styles.emptyChatText}>
                Todavía no hay conversaciones en esta solicitud.
              </Text>
            ) : (
              mensajes.map((m) => {
                // Mensajes informativos del sistema diferenciados visualmente
                if (m.autor === 'sistema' || m.tipo_mensaje === 'sistema') {
                  return (
                    <View key={m.id} style={styles.systemBubble}>
                      <View style={styles.systemHeader}>
                        <Feather name="info" size={12} color={colors.primary} />
                        <Text style={styles.systemLabel}>ACTUALIZACIÓN DE ESTADO • {m.hora}</Text>
                      </View>
                      <Text style={styles.systemText}>{m.texto}</Text>
                    </View>
                  );
                }

                const esMio = m.autor === rolActual;
                return (
                  <View
                    key={m.id}
                    style={[
                      styles.bubble,
                      esMio ? styles.bubbleMine : styles.bubbleOther,
                    ]}
                  >
                    <Text style={[styles.bubbleAuthor, esMio && { color: '#FDECE7' }]}>
                      {m.nombre} • {m.hora}
                    </Text>
                    <Text style={[styles.bubbleText, esMio && { color: '#FFFFFF' }]}>
                      {m.texto}
                    </Text>
                  </View>
                );
              })
            )}
          </ScrollView>

          {chatHabilitado ? (
            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                value={texto}
                onChangeText={setTexto}
                placeholder="Escribe un mensaje..."
                placeholderTextColor={colors.textGray}
              />
              <TouchableOpacity style={styles.sendChatBtn} onPress={handleEnviar}>
                <Feather name="send" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.chatDisabledBanner}>
              <Feather name="lock" size={15} color="#C05A46" />
              <Text style={styles.chatDisabledText}>
                Conversación finalizada para esta solicitud.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,26,26,0.58)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '88%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  catLabel: { fontSize: 10.5, fontWeight: '800', color: colors.tertiary, letterSpacing: 0.6 },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: colors.textDark, marginTop: 2 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.textGray,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  galleryImg: {
    width: 200,
    height: 130,
    borderRadius: 14,
    marginRight: 10,
  },
  infoBox: {
    backgroundColor: '#F8F6F4',
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  descText: { fontSize: 13, color: colors.textDark, lineHeight: 19, marginBottom: 10 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FDECE7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaChipText: { fontSize: 11.5, fontWeight: '700', color: colors.primary },
  proText: { fontSize: 12, fontWeight: '700', color: colors.textGray },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  modePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#F3EFEA',
  },
  modePillActive: { backgroundColor: colors.secondary },
  modePillText: { fontSize: 12.5, fontWeight: '700', color: colors.textDark },
  scheduleSection: { marginBottom: 14 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8F6F4',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.textDark },
  unavailBox: {
    marginBottom: 12,
    backgroundColor: '#FDEDEC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F5B7B1',
  },
  unavailTitle: { fontSize: 12.5, fontWeight: '800', color: '#C0392B' },
  unavailText: { fontSize: 12, color: '#78281F', marginTop: 4, lineHeight: 17 },
  sugChip: {
    backgroundColor: '#1E824C',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sugChipText: { color: '#FFFFFF', fontSize: 11.5, fontWeight: '700' },
  priceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: 14,
  },
  totalLabel: { fontSize: 11, color: colors.textGray },
  totalPrice: { fontSize: 18, fontWeight: '800', color: colors.primary },
  confirmBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  chatArea: {
    maxHeight: 300,
    backgroundColor: '#F8F6F4',
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  emptyChatText: { fontSize: 12.5, color: colors.textGray, textAlign: 'center', padding: 20 },
  systemBubble: {
    alignSelf: 'center',
    width: '94%',
    backgroundColor: '#F3EFEA',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  systemHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  systemLabel: { fontSize: 9.5, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 },
  systemText: { fontSize: 12, color: colors.textDark, lineHeight: 17 },
  bubble: {
    maxWidth: '82%',
    padding: 11,
    borderRadius: 12,
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAE4DC',
  },
  bubbleAuthor: { fontSize: 10, fontWeight: '700', color: colors.textGray, marginBottom: 3 },
  bubbleText: { fontSize: 13, color: colors.textDark },
  chatInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  chatInput: {
    flex: 1,
    backgroundColor: '#F8F6F4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 13.5,
    color: colors.textDark,
  },
  sendChatBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatDisabledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDECE7',
    padding: 12,
    borderRadius: 12,
  },
  chatDisabledText: { flex: 1, fontSize: 12, fontWeight: '700', color: '#C05A46' },
});
