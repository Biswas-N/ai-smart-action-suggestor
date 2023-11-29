import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { PineconeRecord } from '@pinecone-database/pinecone/dist/data/types'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { StructuredOutputParser } from 'langchain/output_parsers'
import { RunnableSequence } from 'langchain/schema/runnable'
import { z } from 'zod'

import { LlmSmartActionsResponseSchema } from '../schemas/openai'
import PineconeUtil, { MessageMetadata } from '../utils/pinecone'
import { chatPrompt, sampleExamples } from '../utils/prompt'

type IOpenAIConfig = {
  apiKey: string
  pineconeUtil: PineconeUtil
}

export default class OpenAIUtil {
  private openAIConfig: IOpenAIConfig
  private embeddingsModel: OpenAIEmbeddings
  private pineconeUtil: PineconeUtil

  constructor(openAIConfig: IOpenAIConfig) {
    this.openAIConfig = openAIConfig
    this.embeddingsModel = new OpenAIEmbeddings({
      openAIApiKey: this.openAIConfig.apiKey,
    })
    this.pineconeUtil = this.openAIConfig.pineconeUtil
  }

  // Private method to hit the OpenAI Chat API endpoint using langchain
  private async getChatResponse<T extends z.ZodTypeAny>(
    newMessage: string,
    responseSchema: T,
  ): Promise<ReturnType<T['parse']>> {
    const parser = StructuredOutputParser.fromZodSchema(responseSchema)

    const chain = RunnableSequence.from([
      chatPrompt,
      new ChatOpenAI({
        openAIApiKey: this.openAIConfig.apiKey,
        temperature: 0.1,
      }),
      parser,
    ])

    const response = await chain.invoke({
      userMessage: newMessage,
      examples: JSON.stringify(sampleExamples),
      format_instructions: parser.getFormatInstructions(),
    })

    return response
  }

  async getEmbeddings(
    data: Record<string, string[]>,
  ): Promise<PineconeRecord<MessageMetadata>[]> {
    const embeddings = []

    for (const [action, examples] of Object.entries(data)) {
      const actionEmbeddings =
        await this.embeddingsModel.embedDocuments(examples)
      for (const [example, embedding] of Object.entries(actionEmbeddings)) {
        embeddings.push({
          id: `${action}-${example}`,
          values: embedding,
          metadata: { action: action },
        })
      }
    }

    return embeddings
  }

  async getMatchFromPinecone(
    message: string,
  ): Promise<[string, number] | void> {
    const embeddings = await this.embeddingsModel.embedDocuments([message])
    const result = await this.pineconeUtil.getClosestMatch(embeddings[0])
    // If result is not null, then extract action and score from result
    if (result) {
      const [action, score] = result
      return [action, score]
    }
  }

  async getSuggestedSmartActions(newMessage: string): Promise<string> {
    const matchFromPinecone = await this.getMatchFromPinecone(newMessage)
    if (matchFromPinecone) {
      const [action, score] = matchFromPinecone
      // If score is greater than 0.9, then return action
      if (score > 0.9) {
        return action
      }
    }

    const suggestedSmartAction = await this.getChatResponse(
      newMessage,
      LlmSmartActionsResponseSchema,
    )

    return suggestedSmartAction.smartAction
  }
}
