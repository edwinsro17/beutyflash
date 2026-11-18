/**
 * Gestión de Estado Global con Zustand.
 * Centraliza sesión, rol activo, catálogo real, solicitud activa, notificaciones y billetera.
 */
import { create } from 'zustand';

export const useAppStore = create((set) => ({
  selectedRole: 'cliente',
  isAuthenticated: false,
  activeRoleSession: null,
  token: null,
  onboardingCompleted: false,
  clientUser: {
    id: null,
    nombre_completo: '',
    correo: '',
    telefono: '',
    barrio: '',
    direccion_principal: '',
    foto_perfil_url: null,
    latitud: null,
    longitud: null,
    gps_exacto_activo: false,
  },
  proUser: {
    id: null,
    usuario_id: null,
    nombre_completo: '',
    nombre_artistico: '',
    nombre_establecimiento: '',
    correo: '',
    telefono: '',
    foto_perfil_url: null,
    barrio: '',
    direccion_base: '',
    latitud_actual: null,
    longitud_actual: null,
    horario_atencion: {
      dias: 'Lunes a Sábado',
      apertura: '08:00 a.m.',
      cierre: '07:00 p.m.',
      bloques_disponibles: [
        '09:00 a.m.',
        '10:30 a.m.',
        '12:00 m.',
        '02:00 p.m.',
        '03:30 p.m.',
        '05:00 p.m.',
      ],
    },
  },
  estilistasMapa: [],
  catalogoServicios: [],
  bookings: [],
  citasAgendadas: [],
  notificacionesCliente: [],
  notificacionesProfesional: [],
  historialCompletadas: [],
  wallet: {
    saldo_disponible_cop: 0,
    total_recargado_cop: 0,
    total_comisiones_pagadas_cop: 0,
    recarga_minima_cop: 10000,
    transacciones: [],
  },
  setAuthState: (patch) => set((state) => ({ ...state, ...patch })),
  setClientUser: (patch) =>
    set((state) => ({ clientUser: { ...state.clientUser, ...patch } })),
  setProUser: (patch) =>
    set((state) => ({ proUser: { ...state.proUser, ...patch } })),
  setCatalogoServicios: (catalogoServicios) => set({ catalogoServicios }),
  setEstilistasMapa: (estilistasMapa) => set({ estilistasMapa }),
  setBookings: (bookings) => set({ bookings }),
  resetSessionData: () =>
    set({
      isAuthenticated: false,
      activeRoleSession: null,
      token: null,
      bookings: [],
      citasAgendadas: [],
      notificacionesCliente: [],
      notificacionesProfesional: [],
      historialCompletadas: [],
    }),
}));
