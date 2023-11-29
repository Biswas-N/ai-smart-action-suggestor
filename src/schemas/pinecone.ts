import { z } from 'zod'

export const ClosestMatchSchema = z.object({
  score: z.number(),
  metadata: z.object({
    action: z.string(),
  }),
})
