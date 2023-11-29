import { z } from 'zod'

export const LlmSmartActionsResponse = z.object({
  users_message: z.string({ description: 'The input user message' }),
  smart_action: z.string({
    description: 'The smart action identified by the AI',
  }),
})
