/**
 * Utilidades de formateo monetario (COP) y comisiones (10%).
 */
export function formatCOP(valor) {
  const num = Math.round(Number(valor) || 0);
  const signo = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  return `${signo}$${abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

export function calcularComisionCOP(valorServicio) {
  return Math.round((Number(valorServicio) || 0) * 0.10);
}
