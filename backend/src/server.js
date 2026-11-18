/**
 * Archivo: backend/src/server.js
 * Punto de entrada del Servidor Backend Node.js - BeautyFlash Colombia
 */

const http = require('http');
const { env } = require('./config/env');
const { handleApiRequest } = require('./app');

function createBeautyFlashServer() {
  return http.createServer((req, res) => {
    handleApiRequest(req, res);
  });
}

if (require.main === module) {
  const server = createBeautyFlashServer();
  server.listen(env.PORT, () => {
    console.log(
      `[BeautyFlash Backend] Servidor activo en http://localhost:${env.PORT}/api/v1 (Moneda: COP | Comisión: 10% | Recarga mínima: $10.000 COP)`
    );
  });
}

module.exports = { createBeautyFlashServer };
