/**
 * Esquemas de validación con Zod para Login y Registros (React Hook Form + Zod).
 */
import { z } from 'zod';

export const loginSchema = z.object({
  identificador: z
    .string()
    .trim()
    .min(4, 'Ingresa tu correo electrónico o número de teléfono.'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

export const clientRegisterSchema = z.object({
  nombre_completo: z.string().trim().min(3, 'Ingresa tu nombre completo.'),
  correo: z.string().trim().email('Ingresa un correo electrónico válido.'),
  telefono: z.string().trim().min(7, 'Ingresa un número de teléfono válido.'),
  barrio: z.string().trim().min(2, 'Selecciona tu barrio o zona.'),
  direccion_principal: z.string().trim().min(5, 'Ingresa tu dirección principal.'),
  password: z.string().min(6, 'La contraseña debe tener mínimo 6 caracteres.'),
});

export const professionalRegisterSchema = clientRegisterSchema.extend({
  nombre_establecimiento: z.string().optional(),
  modalidad: z.enum(['domicilio', 'local', 'ambos']),
});
