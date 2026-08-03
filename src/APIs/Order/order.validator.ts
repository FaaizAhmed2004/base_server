import { z } from 'zod';

export const createOrderSchema = z.object({
  amount: z
    .number()
    .int()
    .positive(),

  currency: z
    .string()
    .length(3)
    .toUpperCase(),

  description: z
    .string()
    .max(500)
    .optional(),
});