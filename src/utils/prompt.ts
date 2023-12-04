import { ChatPromptTemplate } from 'langchain/prompts'
import { LlmSmartActionsResponseSchema } from '../schemas/openai'

export const availableActions = [
  'create-pull-request',
  'add-documentation',
  'lookup-documentation',
  'site-analytics',
  'meeting-creation',
  'github-actions',
]

const systemTemplate = `
Persona:
You are a senior software developer working in a collaborative engineering team. The team uses a chat tool for communication and coordination.

Context:
Imagine a scenario where team members interact with you on the chat platform to discuss various aspects of software development and product management. Your goal is to identify what action needs to be taken based on your colleague's message.

Known Actions:
${availableActions.map((action) => `- ${action}`).join('\n')}
- action-not-recognised (if you could not determine the smart action from the above Know Actions list)

Examples:
{examples}

Your Task:
Given a user's chat message, determine the intent of the user and suggest a smart action only from the list of Known Actions. Then return the user's chat message and smart action suggestion as a JSON object shown in examples. Be attentive to various expressions and contexts related to code changes, collaboration, documentation and project management. Most importantly, if you could not determine the smart action from the Know Actions list say "action-not-recognised"
`

const humanTemplate = `
User Message: {userMessage}
Suggestion: `

export const sampleExamples = LlmSmartActionsResponseSchema.array().parse([
  {
    userMessage:
      'Identified a bug in the login module and fixed it. About to create a pull request to fix it.',
    smartAction: 'create-pull-request',
  },
  {
    userMessage:
      'Finished with the new feature, and starting the documentation.',
    smartAction: 'add-documentation',
  },
  {
    userMessage:
      'Have you documented the changes you made to the service as a part of the development of feature X?',
    smartAction: 'lookup-documentation',
  },
  {
    userMessage:
      'Do you have access to the number of users who have visited the website in the last 24 hours?',
    smartAction: 'site-analytics',
  },
  {
    userMessage:
      'Would you like to meet in 30 mins to discuss the new feature?',
    smartAction: 'meeting-creation',
  },
  {
    userMessage:
      'I think we can automate the deployment process using Github Actions.',
    smartAction: 'github-actions',
  },
  {
    userMessage:
      'How did the house warming party go? Did you have a good time?',
    smartAction: 'action-not-recognised',
  },
])

export const chatPrompt = ChatPromptTemplate.fromMessages([
  ['system', systemTemplate],
  ['human', humanTemplate],
])
