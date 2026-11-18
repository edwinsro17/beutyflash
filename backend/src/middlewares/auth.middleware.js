/**
 * Archivo: backend/src/middlewares/auth.middleware.js
 * Verificación de Token JWT / Supabase Auth y autorización por rol
 */

const crypto = require('crypto');
const { db, supabaseSdkClient } = require('../config/supabaseClient');

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'beautyflash-colombia-secret-key-2026';

function generarTokenSesion(usuario) {
  const payload = {
    sub: usuario.id,
    rol: usuario.rol,
    correo: usuario.correo || usuario.email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  };
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const firma = crypto.createHmac('sha256', JWT_SECRET).update(base64Payload).digest('base64url');
  return `bf.${base64Payload}.${firma}`;
}

function verificarTokenSesion(token) {
  if (!token || typeof token !== 'string') return null;
  const limpio = token.replace(/^Bearer\s+/i, '').trim();
  if (limpio.startsWith('bf.')) {
    const partes = limpio.split('.');
    if (partes.length !== 3) return null;
    const [, base64Payload, firma] = partes;
    const esperada = crypto.createHmac('sha256', JWT_SECRET).update(base64Payload).digest('base64url');
    if (firma !== esperada) return null;
    try {
      const payload = JSON.parse(Buffer.from(base64Payload, 'base64url').toString('utf8'));
      return db.usuarios.find((u) => u.id === payload.sub) || payload;
    } catch (_e) {
      return null;
    }
  }
  return null;
}

async function autenticarRequest(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  if (authHeader) {
    const verificado = verificarTokenSesion(authHeader);
    if (verificado) return verificado;

    if (supabaseSdkClient) {
      try {
        const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();
        const { data } = await supabaseSdkClient.auth.getUser(jwt);
        if (data?.user) {
          return { id: data.user.id, correo: data.user.email, rol: data.user.user_metadata?.rol };
        }
      } catch (_err) {
        return null;
      }
    }
  }
  return null;
}

module.exports = {
  generarTokenSesion,
  verificarTokenSesion,
  autenticarRequest,
};
