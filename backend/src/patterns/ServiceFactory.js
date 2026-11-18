/**
 * PATRÓN DE DISEÑO: FACTORY METHOD (Backend)
 * Crea respuestas estandarizadas de dominio para solicitudes y comisiones en COP.
 */
class ServiceFactory {
  static createBookingSummary({ codigoReserva, precioTotalCop, modalidad }) {
    const comision = Math.round((Number(precioTotalCop) || 0) * 0.10);
    return {
      codigo_reserva: codigoReserva,
      modalidad,
      moneda: 'COP',
      precio_total_cop: Number(precioTotalCop),
      comision_10_cop: comision,
      estado_inicial: 'pendiente_aceptacion_profesional',
    };
  }
}

module.exports = { ServiceFactory };
