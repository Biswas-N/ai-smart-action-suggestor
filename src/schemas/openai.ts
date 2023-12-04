import { z } from 'zod'

export const LlmSmartActionsResponseSchema = z.object({
  userMessage: z.string({ description: 'The input user message' }),
  smartAction: z.string({
    description: 'The smart action identified by the AI',
  }),
})
