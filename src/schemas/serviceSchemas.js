/**
 * Esquemas de validación con Zod para creación de servicios y recarga de billetera.
 */
import { z } from 'zod';

export const createServiceSchema = z.object({
  title: z.string().trim().min(3, 'El nombre del servicio debe tener al menos 3 caracteres.'),
  categoryId: z.string().min(1, 'Selecciona una categoría.'),
  desc: z.string().trim().min(10, 'Describe el servicio con al menos 10 caracteres.'),
  priceCop: z.number().min(10000, 'El precio mínimo es $10.000 COP.'),
  duration: z.string().trim().min(2, 'Especifica la duración estimada.'),
});

export const walletRechargeSchema = z.object({
  monto_cop: z.number().min(10000, 'La recarga mínima es $10.000 COP.'),
  numeroTarjeta: z.string().min(15, 'Ingresa los 16 dígitos de tu tarjeta.'),
  titular: z.string().trim().min(3, 'Ingresa el nombre del titular.'),
  cvc: z.string().min(3, 'Ingresa el código CVC.'),
});
