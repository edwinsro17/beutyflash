/**
 * PATRÓN DE DISEÑO: FACTORY METHOD
 * Construye objetos de notificación y mensajes informativos del sistema estandarizados
 * según el tipo de evento del flujo de 5 pasos.
 */
export class NotificationFactory {
  static create(type, { codigoReserva, clienteNombre, profesionalNombre, servicioNombre, extra = '' }) {
    const hora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    const base = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      codigo_reserva: codigoReserva || null,
      tipo: type,
      leida: false,
      hora,
    };

    switch (type) {
      case 'solicitud_recibida':
        return {
          ...base,
          rol_destino: 'profesional',
          titulo: 'Nueva solicitud de servicio recibida',
          mensaje: `${clienteNombre} solicita "${servicioNombre}" (${extra}). Revisa y acepta o rechaza.`,
        };
      case 'aceptada_profesional':
        return {
          ...base,
          rol_destino: 'cliente',
          titulo: 'Solicitud aceptada por el profesional',
          mensaje: `${profesionalNombre} aceptó #${codigoReserva}. Confirma definitivamente para activar el servicio.`,
        };
      case 'rechazada_profesional':
        return {
          ...base,
          rol_destino: 'cliente',
          titulo: 'Solicitud rechazada por el profesional',
          mensaje: `${profesionalNombre} no puede atender la solicitud #${codigoReserva} en este momento.`,
        };
      case 'confirmada_cliente':
        return {
          ...base,
          rol_destino: 'profesional',
          titulo: 'Servicio confirmado definitivamente por el cliente',
          mensaje: `${clienteNombre} confirmó #${codigoReserva} ("${servicioNombre}"). El servicio ya está activo.`,
        };
      case 'en_camino':
        return {
          ...base,
          rol_destino: 'cliente',
          titulo: 'Profesional en camino',
          mensaje: `${profesionalNombre} inició ruta hacia tu ubicación (${extra}).`,
        };
      case 'en_servicio':
        return {
          ...base,
          rol_destino: 'cliente',
          titulo: 'Servicio en curso',
          mensaje: `${profesionalNombre} ha iniciado el servicio "${servicioNombre}".`,
        };
      case 'finalizada':
        return {
          ...base,
          rol_destino: 'cliente',
          titulo: 'Servicio finalizado',
          mensaje: `El servicio #${codigoReserva} ("${servicioNombre}") ha finalizado correctamente.`,
        };
      default:
        return {
          ...base,
          rol_destino: 'cliente',
          titulo: 'Actualización de servicio',
          mensaje: extra || `Estado actualizado para #${codigoReserva}.`,
        };
    }
  }

  static createSystemChatMessage({ titulo, mensaje, codigoReserva }) {
    return {
      id: `sys-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      codigo_reserva: codigoReserva,
      autor: 'sistema',
      tipo_mensaje: 'sistema',
      nombre: 'Sistema BeautyFlash',
      texto: `${titulo}: ${mensaje}`,
      hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    };
  }
}
