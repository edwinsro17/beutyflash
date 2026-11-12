/**
 * Archivo: backend/src/controllers/professional.controller.js
 * Validación de DNI y Certificado Profesional (4 estados), catálogo de servicios y productos con fotos
 */

const crypto = require('crypto');
const { db, emitRealtimeEvent } = require('../config/supabaseClient');
const {
  VERIFICATION_STATES,
  formatCOP,
  calcularComisionCOP,
} = require('../config/constants');
const { enviarNotificacion } = require('../services/notification.service');
const { subirArchivoStorage } = require('../services/storage.service');

async function gestionarVerificacionProfesional(profesionalId, body) {
  const profesional = db.profesionales.find((p) => p.id === profesionalId);
  if (!profesional) {
    const err = new Error('Perfil profesional no encontrado.');
    err.statusCode = 404;
    throw err;
  }

  if (body.dni_numero) profesional.dni_numero = String(body.dni_numero).trim();
  if (body.entidad_certificadora) {
    profesional.entidad_certificadora = String(body.entidad_certificadora).trim();
  }

  if (body.dni_frente_url) {
    const archivo = await subirArchivoStorage({
      usuarioId: profesional.usuario_id,
      profesionalId: profesional.id,
      tipoArchivo: 'dni_frente',
      nombreArchivo: 'cedula_frente.jpg',
      urlExistente: body.dni_frente_url,
    });
    profesional.dni_frente_url = archivo.url_publica;
  }

  if (body.certificado_profesional_url) {
    const archivo = await subirArchivoStorage({
      usuarioId: profesional.usuario_id,
      profesionalId: profesional.id,
      tipoArchivo: 'certificado_profesional',
      nombreArchivo: 'certificado_profesional.pdf',
      mimeType: 'application/pdf',
      urlExistente: body.certificado_profesional_url,
    });
    profesional.certificado_profesional_url = archivo.url_publica;
  }

  const estadosValidos = Object.values(VERIFICATION_STATES);
  if (body.estado_verificacion && estadosValidos.includes(body.estado_verificacion)) {
    profesional.estado_verificacion = body.estado_verificacion;
    profesional.motivo_rechazo_verificacion =
      body.estado_verificacion === VERIFICATION_STATES.RECHAZADO
        ? body.motivo_rechazo || 'Foto del documento poco legible.'
        : null;
  } else {
    profesional.estado_verificacion = VERIFICATION_STATES.EN_REVISION;
  }

  await enviarNotificacion({
    usuarioId: profesional.usuario_id,
    titulo: `Verificación documental: ${profesional.estado_verificacion.toUpperCase()}`,
    mensaje: `El estado de tu DNI y Certificado Profesional ahora es: ${profesional.estado_verificacion}.`,
    tipo: 'verificacion',
  });

  emitRealtimeEvent('profesionales', 'UPDATE', profesional);

  return {
    exito: true,
    profesional,
  };
}

function crearServicioProfesional(profesionalId, body) {
  const profesional = db.profesionales.find((p) => p.id === profesionalId);
  if (!profesional) {
    const err = new Error('Profesional no encontrado.');
    err.statusCode = 404;
    throw err;
  }

  const precioCop = Math.round(Number(body.precio_cop) || 0);
  if (precioCop < 10000) {
    const err = new Error('El precio mínimo de un servicio debe ser de $10.000 COP.');
    err.statusCode = 400;
    throw err;
  }

  const categoria =
    db.categorias_servicio.find((c) => c.slug === body.categoria_slug) ||
    db.categorias_servicio[0];

  const nuevoServicio = {
    id: crypto.randomUUID(),
    profesional_id: profesional.id,
    categoria_id: categoria.id,
    categoria_slug: categoria.slug,
    nombre: String(body.nombre || 'Nuevo Tratamiento').trim(),
    descripcion: String(body.descripcion || 'Servicio profesional con insumos premium.').trim(),
    duracion_minutos: Number(body.duracion_minutos) || 60,
    precio_cop: precioCop,
    precio_formateado: formatCOP(precioCop),
    comision_plataforma_cop: calcularComisionCOP(precioCop),
    modalidad: body.modalidad || 'ambos',
    imagen_principal_url:
      body.imagen_principal_url ||
      'https://images.unsplash.com/photo-1560869713-7d0a29430803?q=80&w=600&auto=format&fit=crop',
    activo: true,
  };

  db.servicios.unshift(nuevoServicio);
  return {
    exito: true,
    servicio: nuevoServicio,
  };
}

function crearProductoProfesional(profesionalId, body) {
  const precioCop = Math.round(Number(body.precio_cop) || 25000);
  const nuevoProducto = {
    id: crypto.randomUUID(),
    profesional_id: profesionalId,
    nombre: String(body.nombre || 'Producto Profesional').trim(),
    marca: String(body.marca || 'Atelier Pro').trim(),
    descripcion: String(body.descripcion || 'Insumo profesional certificado.').trim(),
    precio_cop: precioCop,
    precio_formateado: formatCOP(precioCop),
    stock: Number(body.stock ?? 10),
    fotos_urls: [
      body.foto_url ||
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=300&auto=format&fit=crop',
    ],
    activo: true,
  };

  db.productos_profesional.unshift(nuevoProducto);
  return {
    exito: true,
    producto: nuevoProducto,
  };
}

function actualizarZonaYDisponibilidad(profesionalId, body) {
  const profesional = db.profesionales.find((p) => p.id === profesionalId);
  if (!profesional) {
    const err = new Error('Profesional no encontrado.');
    err.statusCode = 404;
    throw err;
  }

  if (body.radio_cobertura_km !== undefined) {
    profesional.radio_cobertura_km = Number(body.radio_cobertura_km);
  }
  if (body.tarifa_domicilio_cop !== undefined) {
    profesional.tarifa_domicilio_cop = Number(body.tarifa_domicilio_cop);
  }
  if (body.disponible !== undefined) {
    profesional.disponible = Boolean(body.disponible);
  }

  return {
    exito: true,
    profesional,
  };
}

module.exports = {
  gestionarVerificacionProfesional,
  crearServicioProfesional,
  crearProductoProfesional,
  actualizarZonaYDisponibilidad,
};
