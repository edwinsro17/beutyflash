/**
 * Archivo: src/screens/ServiciosScreen.js
 * Catálogo del Profesional conectado a Supabase (`catalogo_servicios_app`) y Supabase Storage:
 * - Si el profesional no tiene saldo disponible en su billetera, todos sus servicios quedan
 *   desactivados automáticamente, no se muestran a los clientes y no pueden activarse hasta recargar.
 * - Selección de fotografías del servicio directamente desde el dispositivo (`seleccionarYSubirFotografiaDispositivo`).
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  StatusBar,
  Switch,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import {
  colors,
  sessionStore,
  formatCOP,
  seleccionarYSubirFotografiaDispositivo,
  guardarServicioCatalogoEnSupabase,
  sincronizarEstadoDesdeSupabase,
  sincronizarBilleteraDesdeSupabase,
  obtenerSaldoRealProfesionalDesdeSupabase,
  useResponsiveLayout,
} from '../theme/colors';
import ValidationModal from '../components/ui/ValidationModal';
import { ProBottomNav } from './BilleteraScreen';

const CATEGORIAS_OPCIONES = [
  { id: 'cabello', label: 'Peluquería • Color' },
  { id: 'unas', label: 'Uñas • Manicura' },
  { id: 'maquillaje', label: 'Maquillaje • Social' },
  { id: 'facial', label: 'Facial • Skincare' },
  { id: 'barberia', label: 'Barbería • Corte' },
];

export default function ServiciosScreen({ navigation }) {
  const layout = useResponsiveLayout();
  const [servicios, setServicios] = useState([...sessionStore.catalogoServicios]);
  const [saldoDisponible, setSaldoDisponible] = useState(
    Number(sessionStore.wallet?.saldo_disponible_cop) || 0
  );
  const [busqueda, setBusqueda] = useState('');
  const [catFiltro, setCatFiltro] = useState('todos');

  const [modalVisible, setModalVisible] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [catSeleccionada, setCatSeleccionada] = useState(CATEGORIAS_OPCIONES[0]);
  const [descripcion, setDescripcion] = useState('');
  const [precioCop, setPrecioCop] = useState('50000');
  const [duracion, setDuracion] = useState('60 min');
  const [modalidadLabel, setModalidadLabel] = useState('Salón y Domicilio');
  const [galeriaFotos, setGaleriaFotos] = useState([]);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [progresoFoto, setProgresoFoto] = useState(0);
  const [errorForm, setErrorForm] = useState('');
  const [modalAlert, setModalAlert] = useState({
    visible: false,
    variant: 'insufficient_balance',
    title: '',
    message: '',
    showRechargeBtn: false,
  });

  const cargarCatalogoYSaldo = useCallback(async () => {
    await sincronizarBilleteraDesdeSupabase();
    await sincronizarEstadoDesdeSupabase('profesional');
    setSaldoDisponible(Number(sessionStore.wallet?.saldo_disponible_cop) || 0);
    setServicios([...sessionStore.catalogoServicios]);
  }, []);

  useEffect(() => {
    cargarCatalogoYSaldo();
    const unsub = navigation?.addListener
      ? navigation.addListener('focus', cargarCatalogoYSaldo)
      : null;
    return () => {
      if (unsub) unsub();
    };
  }, [navigation, cargarCatalogoYSaldo]);

  const sincronizarStore = (nuevaLista) => {
    sessionStore.catalogoServicios = nuevaLista;
    setServicios([...nuevaLista]);
  };

  const toggleService = async (id) => {
    const targetSrv = servicios.find((s) => s.id === id);
    if (!targetSrv) return;

    const proId =
      targetSrv.profesional_id ||
      sessionStore.proUser?.usuario_id ||
      sessionStore.proUser?.id ||
      2;

    // Si intenta ACTIVAR el servicio, verificar en tiempo real si tiene saldo suficiente en su billetera
    if (!targetSrv.active) {
      const { saldoDisponibleCop: saldoReal } =
        await obtenerSaldoRealProfesionalDesdeSupabase(proId);
      setSaldoDisponible(saldoReal);
      const comisionMinima = Math.max(
        300,
        Math.round((Number(targetSrv.priceCop) || 10000) * 0.03)
      );

      if (saldoReal <= 0 || saldoReal < comisionMinima) {
        setModalAlert({
          visible: true,
          variant: 'insufficient_balance',
          title: 'No puedes activar servicios sin saldo',
          message: `Tu saldo disponible en billetera es ${formatCOP(
            saldoReal
          )} COP (se requieren al menos ${formatCOP(
            comisionMinima
          )} COP para cubrir la comisión de este servicio). Mientras no tengas saldo, tus servicios permanecerán desactivados y no se mostrarán a los clientes.`,
          showRechargeBtn: true,
        });
        return;
      }
    }

    const actualizada = servicios.map((s) => {
      if (s.id === id) {
        const mod = { ...s, active: !s.active, bloqueadoPorSinSaldo: false };
        guardarServicioCatalogoEnSupabase(mod).catch(() => {});
        return mod;
      }
      return s;
    });
    sincronizarStore(actualizada);
  };

  const abrirModalNuevo = () => {
    setEditandoId(null);
    setNombre('');
    setCatSeleccionada(CATEGORIAS_OPCIONES[0]);
    setDescripcion('');
    setPrecioCop('50000');
    setDuracion('60 min');
    setModalidadLabel('Salón y Domicilio');
    setGaleriaFotos([]);
    setErrorForm('');
    setModalVisible(true);
  };

  const abrirModalEditar = (srv) => {
    setEditandoId(srv.id);
    setNombre(srv.title);
    const catObj =
      CATEGORIAS_OPCIONES.find((c) => c.id === srv.categoryId) || CATEGORIAS_OPCIONES[0];
    setCatSeleccionada(catObj);
    setDescripcion(srv.desc || '');
    setPrecioCop(String(srv.priceCop));
    setDuracion(srv.duration || '60 min');
    setModalidadLabel(srv.modalityLabel || 'Salón y Domicilio');
    setGaleriaFotos(
      srv.galeria_resultados && srv.galeria_resultados.length > 0
        ? [...srv.galeria_resultados]
        : srv.image
        ? [srv.image]
        : []
    );
    setErrorForm('');
    setModalVisible(true);
  };

  const handleAgregarFotoDispositivo = async () => {
    setErrorForm('');
    setSubiendoFoto(true);
    setProgresoFoto(15);
    try {
      const res = await seleccionarYSubirFotografiaDispositivo({
        carpeta: 'servicios',
        usuarioId: sessionStore.proUser.usuario_id || sessionStore.proUser.id,
        onProgress: (p) => setProgresoFoto(p),
      });
      if (res && res.urlPublica) {
        setGaleriaFotos([...galeriaFotos, res.urlPublica]);
      }
    } catch (err) {
      setErrorForm(err.message || 'No se pudo cargar la fotografía.');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const quitarFotoGaleria = (url) => {
    setGaleriaFotos(galeriaFotos.filter((f) => f !== url));
  };

  const guardarServicio = async () => {
    if (!nombre.trim() || !descripcion.trim()) {
      setErrorForm('Ingresa el nombre y la descripción del servicio.');
      return;
    }
    if (galeriaFotos.length === 0) {
      setErrorForm('Selecciona al menos una fotografía desde tu dispositivo.');
      return;
    }

    const valorNum = Math.max(10000, Number(String(precioCop).replace(/\D/g, '')) || 10000);
    const fotoPrincipal = galeriaFotos[0];
    const proId = sessionStore.proUser.usuario_id || sessionStore.proUser.id || 2;
    const { saldoDisponibleCop: saldoReal } =
      await obtenerSaldoRealProfesionalDesdeSupabase(proId);
    setSaldoDisponible(saldoReal);

    const comisionMinima = Math.max(300, Math.round(valorNum * 0.03));
    const tieneSaldo = saldoReal > 0 && saldoReal >= comisionMinima;

    try {
      if (editandoId) {
        let editadoObj = null;
        const actualizada = servicios.map((s) => {
          if (s.id === editandoId) {
            editadoObj = {
              ...s,
              title: nombre.trim(),
              categoryId: catSeleccionada.id,
              categoryLabel: catSeleccionada.label,
              desc: descripcion.trim(),
              priceCop: valorNum,
              duration: duracion,
              modalityLabel: modalidadLabel,
              active: tieneSaldo ? Boolean(s.active) : false,
              bloqueadoPorSinSaldo: !tieneSaldo,
              image: fotoPrincipal,
              galeria_resultados: [...galeriaFotos],
            };
            return editadoObj;
          }
          return s;
        });
        if (editadoObj) await guardarServicioCatalogoEnSupabase(editadoObj);
        sincronizarStore(actualizada);
        setModalVisible(false);
      } else {
        const nuevoSrv = {
          id: `srv-${Date.now()}`,
          profesional_id: proId,
          proName: sessionStore.proUser.nombre_completo || 'Profesional',
          proAvatar: sessionStore.proUser.foto_perfil_url || null,
          proRating: String(sessionStore.proUser.calificacion_promedio || '5.0'),
          barrio: sessionStore.proUser.barrio || '',
          nombre_establecimiento: sessionStore.proUser.nombre_establecimiento || '',
          categoryId: catSeleccionada.id,
          categoryLabel: catSeleccionada.label,
          badge: 'Destacado',
          title: nombre.trim(),
          desc: descripcion.trim(),
          duration: duracion,
          modalityLabel: modalidadLabel,
          modalidad: 'ambos',
          priceCop: valorNum,
          active: tieneSaldo,
          bloqueadoPorSinSaldo: !tieneSaldo,
          image: fotoPrincipal,
          galeria_resultados: [...galeriaFotos],
        };
        await guardarServicioCatalogoEnSupabase(nuevoSrv);
        sincronizarStore([nuevoSrv, ...servicios]);
        setModalVisible(false);
      }

      if (!tieneSaldo) {
        setModalAlert({
          visible: true,
          variant: 'insufficient_balance',
          title: 'Servicio guardado como desactivado',
          message: `Tu servicio fue guardado pero quedó DESACTIVADO y oculto para los clientes porque tu saldo disponible es ${formatCOP(
            saldoReal
          )} COP. Recarga tu billetera para poder activarlo.`,
          showRechargeBtn: true,
        });
      }
    } catch (err) {
      setErrorForm(err.message);
    }
  };

  const serviciosFiltrados = servicios.filter((s) => {
    const matchCat = catFiltro === 'todos' || s.categoryId === catFiltro;
    const q = busqueda.trim().toLowerCase();
    const matchTexto =
      !q ||
      (s.title || '').toLowerCase().includes(q) ||
      (s.categoryLabel || '').toLowerCase().includes(q) ||
      (s.desc || '').toLowerCase().includes(q);
    return matchCat && matchTexto;
  });

  const cantidadActivos = servicios.filter((s) => s.active && saldoDisponible > 0).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.headerTitle}>Catálogo de Servicios</Text>
          <Text style={styles.headerSub}>
            Activos visibles a clientes: {cantidadActivos} • Saldo: {formatCOP(saldoDisponible)} COP
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={abrirModalNuevo}>
          <Feather name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Nuevo Servicio</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, layout.contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        {saldoDisponible <= 0 && (
          <View style={styles.noBalanceBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Feather name="alert-triangle" size={18} color="#C0392B" />
              <Text style={styles.noBalanceTitle}>
                Servicios desactivados por falta de saldo ({formatCOP(saldoDisponible)} COP)
              </Text>
            </View>
            <Text style={styles.noBalanceDesc}>
              Cuando tu billetera no tiene saldo disponible, todos tus servicios quedan desactivados automáticamente, no puedes activarlos y no se muestran a los clientes.
            </Text>
            <TouchableOpacity
              style={styles.noBalanceBtn}
              onPress={() => navigation.navigate('WalletRecharge')}
            >
              <Feather name="plus-circle" size={15} color="#FFFFFF" />
              <Text style={styles.noBalanceBtnText}>Recargar Billetera con Wompi</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.searchBar}>
          <Feather name="search" size={18} color={colors.textGray} />
          <TextInput
            style={styles.searchInput}
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar por nombre del servicio o categoría..."
            placeholderTextColor={colors.textGray}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          <TouchableOpacity
            style={[styles.catChip, catFiltro === 'todos' && styles.catChipActive]}
            onPress={() => setCatFiltro('todos')}
          >
            <Text style={[styles.catChipText, catFiltro === 'todos' && { color: '#FFFFFF' }]}>
              Todos ({servicios.length})
            </Text>
          </TouchableOpacity>
          {CATEGORIAS_OPCIONES.map((c) => {
            const active = catFiltro === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.catChip, active && styles.catChipActive]}
                onPress={() => setCatFiltro(c.id)}
              >
                <Text style={[styles.catChipText, active && { color: '#FFFFFF' }]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {serviciosFiltrados.length === 0 ? (
          <View style={styles.emptyCard}>
            <Feather name="layers" size={28} color={colors.textGray} />
            <Text style={styles.emptyTitle}>No tienes servicios registrados.</Text>
            <Text style={styles.emptySub}>
              Usa el botón &quot;Nuevo Servicio&quot; para publicar tus servicios reales en el catálogo.
            </Text>
          </View>
        ) : (
          serviciosFiltrados.map((s) => {
            const comisionMin = Math.max(300, Math.round((Number(s.priceCop) || 10000) * 0.03));
            const bloqueadoSinSaldo = saldoDisponible <= 0 || saldoDisponible < comisionMin;
            const estaActivoReal = Boolean(s.active) && !bloqueadoSinSaldo;

            return (
              <View
                key={s.id}
                style={[styles.serviceCard, !estaActivoReal && { opacity: 0.72 }]}
              >
                <View style={styles.topSection}>
                  <View>
                    {s.image ? (
                      <Image source={{ uri: s.image }} style={styles.thumbImg} />
                    ) : (
                      <View style={styles.thumbImg} />
                    )}
                    <View style={styles.photoCountBadge}>
                      <Ionicons name="images-outline" size={10} color="#FFFFFF" />
                      <Text style={styles.photoCountText}>
                        {(s.galeria_resultados || []).length}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoColumn}>
                    <View style={styles.badgeCategoryRow}>
                      <View
                        style={[
                          styles.hotBadge,
                          !estaActivoReal && { backgroundColor: '#FDEDEC' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.hotBadgeText,
                            !estaActivoReal && { color: '#C0392B' },
                          ]}
                        >
                          {estaActivoReal
                            ? 'Visible a clientes'
                            : bloqueadoSinSaldo
                            ? 'Oculto (Sin saldo)'
                            : 'Desactivado'}
                        </Text>
                      </View>
                      <Text style={styles.categoryText}>{s.categoryLabel}</Text>
                    </View>

                    <Text style={styles.serviceTitle}>{s.title}</Text>

                    <View style={styles.metaLine}>
                      <Feather name="clock" size={13} color={colors.textGray} />
                      <Text style={styles.metaText}>{s.duration}</Text>
                      <Text style={styles.dotSep}>•</Text>
                      <Feather name="map-pin" size={13} color={colors.textGray} />
                      <Text style={styles.metaText}>{s.modalityLabel}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.bottomBar}>
                  <Text style={styles.bigPrice}>{formatCOP(s.priceCop)} COP</Text>

                  <View style={styles.actionsRight}>
                    <Switch
                      value={estaActivoReal}
                      onValueChange={() => toggleService(s.id)}
                      trackColor={{ false: '#E0DAD3', true: '#C87D65' }}
                      thumbColor="#FFFFFF"
                    />
                    <TouchableOpacity
                      style={styles.iconActionBtn}
                      onPress={() => abrirModalEditar(s)}
                    >
                      <Feather name="edit-2" size={17} color="#3F3A37" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editandoId ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={22} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {errorForm ? (
                <View style={styles.errorBox}>
                  <Feather name="alert-circle" size={15} color="#C0392B" />
                  <Text style={styles.errorText}>{errorForm}</Text>
                </View>
              ) : null}

              <Text style={styles.label}>Nombre del Servicio *</Text>
              <TextInput
                style={styles.input}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Nombre del servicio"
                placeholderTextColor={colors.textGray}
              />

              <Text style={styles.label}>Categoría *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {CATEGORIAS_OPCIONES.map((c) => {
                  const sel = catSeleccionada.id === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.catChip, sel && styles.catChipActive]}
                      onPress={() => setCatSeleccionada(c)}
                    >
                      <Text style={[styles.catChipText, sel && { color: '#FFFFFF' }]}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.label}>Descripción *</Text>
              <TextInput
                style={[styles.input, { height: 74, textAlignVertical: 'top' }]}
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                placeholder="Describe el procedimiento..."
                placeholderTextColor={colors.textGray}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Precio (COP) *</Text>
                  <TextInput
                    style={styles.input}
                    value={precioCop}
                    onChangeText={setPrecioCop}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Duración *</Text>
                  <TextInput
                    style={styles.input}
                    value={duracion}
                    onChangeText={setDuracion}
                  />
                </View>
              </View>

              <Text style={styles.label}>
                Fotografías de Resultados desde tu Dispositivo ({galeriaFotos.length}) *
              </Text>

              {galeriaFotos.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  {galeriaFotos.map((url, i) => (
                    <View key={i} style={styles.galleryEditItem}>
                      <Image source={{ uri: url }} style={styles.galleryEditImg} />
                      <TouchableOpacity
                        style={styles.removePhotoBtn}
                        onPress={() => quitarFotoGaleria(url)}
                      >
                        <Feather name="trash-2" size={12} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              <TouchableOpacity
                style={styles.uploadDeviceBtn}
                onPress={handleAgregarFotoDispositivo}
                disabled={subiendoFoto}
              >
                <Feather name="upload" size={15} color={colors.primary} />
                <Text style={styles.uploadDeviceBtnText}>
                  {subiendoFoto
                    ? `Subiendo fotografía (${progresoFoto}%)...`
                    : 'Seleccionar Fotografía desde el Dispositivo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveServiceBtn} onPress={guardarServicio}>
                <Text style={styles.saveServiceBtnText}>
                  {editandoId ? 'Guardar Cambios' : 'Publicar Servicio'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ValidationModal
        visible={modalAlert.visible}
        variant={modalAlert.variant}
        title={modalAlert.title}
        message={modalAlert.message}
        primaryText={modalAlert.showRechargeBtn ? 'Ir a Recargar Billetera' : 'Entendido'}
        onPrimaryPress={() => {
          setModalAlert((prev) => ({ ...prev, visible: false }));
          if (modalAlert.showRechargeBtn) {
            navigation.navigate('WalletRecharge');
          }
        }}
        secondaryText={modalAlert.showRechargeBtn ? 'Cerrar' : null}
        onClose={() => setModalAlert((prev) => ({ ...prev, visible: false }))}
      />

      <ProBottomNav navigation={navigation} active="Servicios" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.textDark , flexShrink: 1 },
  headerSub: { fontSize: 11, color: colors.textGray, marginTop: 2 , flexShrink: 1 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addBtnText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' , flexShrink: 1 },
  scroll: { paddingTop: 14, paddingBottom: 36 },
  noBalanceBanner: {
    backgroundColor: '#FDEDEC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F5B7B1',
    marginBottom: 14,
  },
  noBalanceTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#C0392B',
    flexShrink: 1,
  },
  noBalanceDesc: {
    fontSize: 12,
    color: '#78281F',
    lineHeight: 17,
    marginBottom: 10,
  },
  noBalanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C0392B',
    paddingVertical: 10,
    borderRadius: 10,
  },
  noBalanceBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 13.5, color: colors.textDark },
  catChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  catChipActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  catChipText: { fontSize: 12, fontWeight: '700', color: colors.textDark , flexShrink: 1 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: colors.textDark, marginTop: 10 , flexShrink: 1 },
  emptySub: { fontSize: 12.5, color: colors.textGray, textAlign: 'center', marginTop: 4 , flexShrink: 1 },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFEAE4',
    marginBottom: 14,
  },
  topSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  thumbImg: { width: 76, height: 76, borderRadius: 16, backgroundColor: '#F3EFEA' },
  photoCountBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(26,26,26,0.78)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  photoCountText: { color: '#FFFFFF', fontSize: 9.5, fontWeight: '800' , flexShrink: 1 },
  infoColumn: { flex: 1, marginLeft: 14 },
  badgeCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 5,
  },
  hotBadge: {
    backgroundColor: '#E8F6EF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  hotBadgeText: { fontSize: 10.5, fontWeight: '800', color: '#1E824C' , flexShrink: 1 },
  categoryText: { fontSize: 12, fontWeight: '600', color: '#5A5552' , flexShrink: 1 },
  serviceTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginBottom: 5 , flexShrink: 1 },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: '#66615E', fontWeight: '500' , flexShrink: 1 },
  dotSep: { fontSize: 12, color: '#9E9894', marginHorizontal: 3 },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F6F3EF',
  },
  bigPrice: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  actionsRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconActionBtn: { padding: 6 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,26,26,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: colors.textDark , flexShrink: 1 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDEDEC',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  errorText: { flex: 1, fontSize: 12, color: '#C0392B', fontWeight: '600' , flexShrink: 1 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textDark, marginBottom: 6 },
  input: {
    backgroundColor: '#F8F6F4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: colors.textDark,
    marginBottom: 12,
  },
  galleryEditItem: { position: 'relative', marginRight: 10 },
  galleryEditImg: { width: 92, height: 74, borderRadius: 12 },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(192,57,43,0.9)',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadDeviceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F6EFEB',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  uploadDeviceBtnText: { fontSize: 12.5, fontWeight: '700', color: colors.primary , flexShrink: 1 },
  saveServiceBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveServiceBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' , flexShrink: 1 },
});
