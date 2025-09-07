import { z } from 'zod'

export const categoryInputSchema = z.object({
  title: z
    .string({ required_error: 'Název je povinný' })
    .trim()
    .min(1, 'Název je povinný')
    .max(120, 'Název je příliš dlouhý'),
  parentCategoryId: z.string().trim().min(1).optional(),
  emoji: z.string().trim().max(8).optional(),
  color: z.string().trim().max(32).optional(),
  description: z.string().trim().max(500).optional(),
})

export type CategoryInput = z.infer<typeof categoryInputSchema>

