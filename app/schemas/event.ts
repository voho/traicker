import { z } from 'zod'

export const storeEventSchema = z.object({
  prompt: z
    .string({ required_error: 'Zadejte prosím text' })
    .trim()
    .min(1, 'Zadejte prosím text')
    .max(2000, 'Zpráva je příliš dlouhá'),
})

export const manualEventSchema = z.object({
  effective_at: z
    .string({ required_error: 'Datum je povinné' })
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Neplatné datum/čas'),
  description: z
    .string({ required_error: 'Popis je povinný' })
    .trim()
    .min(1, 'Popis je povinný')
    .max(500, 'Popis je příliš dlouhý'),
  type: z.enum(['income', 'expense'], { invalid_type_error: 'Neplatný typ' }),
  amount: z.coerce.number({ invalid_type_error: 'Částka musí být číslo' }).positive('Částka musí být kladná'),
  currency: z
    .string({ required_error: 'Měna je povinná' })
    .trim()
    .length(3, 'Měna musí mít 3 znaky')
    .transform((s) => s.toUpperCase())    
})

export type StoreEventInput = z.infer<typeof storeEventSchema>
export type ManualEventInput = z.infer<typeof manualEventSchema>

