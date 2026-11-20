import { z } from 'zod'

export const artistaSchema = z.object({
  id: z.number().int().positive(),
  stageName: z.string().min(1),
  country: z.string().nullable(),
  genre: z.string().nullable(),
  active: z.boolean(),
})

export const artistasSchema = z.array(artistaSchema)

export type Artista = z.infer<typeof artistaSchema>
