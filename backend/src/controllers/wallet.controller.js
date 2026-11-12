/**
 * Archivo: backend/src/controllers/wallet.controller.js
 * Billetera del Profesional en COP: recarga mínima $10.000 COP, comisión 10% y alertas de saldo bajo
 */

const crypto = require('crypto');
const {
  db,
  recargarBilleteraTransaccional,
} = require('../config/supabaseClient');
const {
  BUSINESS_RULES,
  formatCOP,
  verificarCoberturaComision,
} = require('../config/constants');
const { enviarNotificacion } = require('../services/notification.service');
const { enviarAvisoSMS } = require('../services/sms.service');

function obtenerDetalleBilletera(profesionalId) {
  const profesional = db.profesionales.find((p) => p.id === profesionalId);
  const billetera = db.billeteras_profesional.find((b) => b.profesional_id === profesionalId);
  if (!profesional || !billetera) {
    const err = new Error('Billetera o profesional no encontrado.');
    err.statusCode = 404;
    throw err;
  }

  const transacciones = db.transacciones_billetera
    .filter((t) => t.profesional_id === profesionalId)
    .map((t) => ({
      ...t,
      monto_formateado: `${t.signo > 0 ? '+' : '-'}${formatCOP(t.monto_cop)}`,
      saldo_posterior_formateado: formatCOP(t.saldo_posterior_cop),
    }));

  const comisiones = db.comisiones.filter((c) => c.profesional_id === profesionalId);
  const saldoBajo = billetera.saldo_disponible_cop < billetera.umbral_saldo_bajo_cop;

  return {
    exito: true,
    billetera: {
      ...billetera,
      moneda: 'COP',
      saldo_disponible_formateado: formatCOP(billetera.saldo_disponible_cop),
      recarga_minima_cop: BUSINESS_RULES.MIN_RECHARGE_COP,
      recarga_minima_formateada: formatCOP(BUSINESS_RULES.MIN_RECHARGE_COP),
      porcentaje_comision_plataforma: BUSINESS_RULES.COMMISSION_PERCENT,
      alerta_saldo_bajo: saldoBajo,
      activo_para_recibir_servicios:
        profesional.activo_por_saldo && profesional.disponible && !billetera.bloqueada,
    },
    transacciones,
    comisiones,
  };
}

async function procesarRecargaBilletera(profesionalId, body) {
  const profesional = db.profesionales.find((p) => p.id === profesionalId);
  if (!profesional) {
    const err = new Error('Profesional no encontrado.');
    err.statusCode = 404;
    throw err;
  }

  const montoCop = Math.round(Number(body.monto_cop) || 0);
  const metodoPago = body.metodo_pago || 'nequi';
  const referenciaIdempotencia =
    body.referencia_idempotencia || `RECARGA-${profesionalId}-${Date.now()}`;
  const pasarelaReferencia = `WOMPI-CO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  const resultado = await recargarBilleteraTransaccional({
    profesionalId,
    montoCop,
    metodoPago,
    referenciaIdempotencia,
    pasarelaReferencia,
  });

  if (!resultado.idempotente) {
    const usuario = db.usuarios.find((u) => u.id === profesional.usuario_id);
    await enviarNotificacion({
      usuarioId: profesional.usuario_id,
      titulo: '¡Recarga acreditada en tu Billetera!',
      mensaje: `Recargaste ${formatCOP(montoCop)} COP. Nuevo saldo: ${formatCOP(
        resultado.saldo_actual_cop
      )} COP.`,
      tipo: 'recarga_exitosa',
    });

    if (usuario?.telefono) {
      await enviarAvisoSMS(
        usuario.telefono,
        `BeautyFlash: Recarga exitosa por ${formatCOP(montoCop)} COP. Saldo actual: ${formatCOP(
          resultado.saldo_actual_cop
        )} COP.`
      );
    }
  }

  return resultado;
}

function verificarCapacidadServicio(profesionalId, valorServicioCop) {
  const billetera = db.billeteras_profesional.find((b) => b.profesional_id === profesionalId);
  if (!billetera) {
    const err = new Error('Billetera no encontrada.');
    err.statusCode = 404;
    throw err;
  }
  return verificarCoberturaComision(billetera.saldo_disponible_cop, valorServicioCop);
}

module.exports = {
  obtenerDetalleBilletera,
  procesarRecargaBilletera,
  verificarCapacidadServicio,
};
