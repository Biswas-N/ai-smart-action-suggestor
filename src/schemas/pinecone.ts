import { z } from 'zod'

export const ClosestMatchSchema = z.object({
  score: z.number(),
  metadata: z.object({
    action: z.string(),
    originalMessage: z.string(),
  }),
})

const ClosestExampleSchema = z.object({
  id: z.string(),
  score: z.number(),
  values: z.array(z.number()),
  metadata: z.object({
    action: z.string(),
    originalMessage: z.string(),
  }),
})

export const ClosestExamplesSchema = z.object({
  matches: z.array(ClosestExampleSchema),
})
