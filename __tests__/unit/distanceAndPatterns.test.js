import {
  normalizarYValidarCoordenadas,
  calcularDistanciaMetros,
  calcularRutaYDistanciaReal,
} from '../../src/patterns/DistanceStrategy';
import {
  ESTADOS_SOLICITUD_OFICIALES,
  RequestStateFactory,
} from '../../src/patterns/RequestStateFactory';
import { formatCOP, calcularComisionCOP } from '../../src/utils/formatters';

describe('DistanceStrategy y Patrones de Diseño', () => {
  test('Caso 1: Misma ubicación devuelve 0 km y 0 min', async () => {
    const res = await calcularRutaYDistanciaReal({
      latProfesional: 3.3712,
      lngProfesional: -76.5320,
      latCliente: 3.37121,
      lngCliente: -76.53201,
    });
    expect(res.misma_ubicacion).toBe(true);
    expect(res.eta_minutos).toBe(0);
    expect(res.distancia_km).toBe(0);
  });

  test('Normaliza coordenadas intercambiadas y calcula metros exactos', () => {
    const c = normalizarYValidarCoordenadas(-76.532, 3.3712);
    expect(c.valida).toBe(true);
    expect(c.latitud).toBeCloseTo(3.3712, 3);
    expect(calcularDistanciaMetros(3.3712, -76.532, 3.3712, -76.532)).toBe(0);
  });

  test('State Machine impide confirmar unilateralmente sin pasar por aceptación y confirmación', () => {
    expect(
      RequestStateFactory.canTransition(
        ESTADOS_SOLICITUD_OFICIALES.PENDIENTE_ACEPTACION_PRO,
        ESTADOS_SOLICITUD_OFICIALES.EN_CAMINO
      )
    ).toBe(false);
    expect(
      RequestStateFactory.canTransition(
        ESTADOS_SOLICITUD_OFICIALES.ACEPTADA_POR_PRO,
        ESTADOS_SOLICITUD_OFICIALES.CONFIRMADA_POR_CLIENTE
      )
    ).toBe(true);
  });

  test('Formateo COP y comisión 10%', () => {
    expect(formatCOP(10000)).toBe('$10.000');
    expect(calcularComisionCOP(55000)).toBe(5500);
  });
});
