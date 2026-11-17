import { z } from 'zod'

export const sedeSchema = z.object({
  id: z.number().int().positive(),
  code: z.string().min(1),
  name: z.string().min(1),
  city: z.string(),
  address: z.string(),
  capacity: z.number().int().positive(),
  active: z.boolean(),
})

export const sedesSchema = z.array(sedeSchema)

export type Sede = z.infer<typeof sedeSchema>