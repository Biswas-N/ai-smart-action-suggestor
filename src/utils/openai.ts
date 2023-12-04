import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { PineconeRecord } from '@pinecone-database/pinecone/dist/data/types'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import { StructuredOutputParser } from 'langchain/output_parsers'
import { RunnableSequence } from 'langchain/schema/runnable'
import { z } from 'zod'

import { LlmSmartActionsResponseSchema } from '../schemas/openai'
import PineconeUtil, { MessageMetadata } from '../utils/pinecone'
import { chatPrompt, sampleExamples, availableActions } from '../utils/prompt'

type OpenAIConfig = {
  apiKey: string
  pineconeUtil: PineconeUtil
}

export type ExampleMessagesWithSmartAction = {
  [action: string]: string[]
}

export default class OpenAIUtil {
  private openAIConfig: OpenAIConfig
  private embeddingsModel: OpenAIEmbeddings
  private pineconeUtil: PineconeUtil

  constructor(openAIConfig: OpenAIConfig) {
    this.openAIConfig = openAIConfig
    this.embeddingsModel = new OpenAIEmbeddings({
      openAIApiKey: this.openAIConfig.apiKey,
    })
    this.pineconeUtil = this.openAIConfig.pineconeUtil
  }

  async pushMessagesToPinecone(
    messages: ExampleMessagesWithSmartAction,
  ): Promise<void> {
    const embeddings = await this.getEmbeddings(messages)
    await this.pineconeUtil.upsertVectors(embeddings)
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

    let examples = await Promise.all(
      availableActions.map(async (action) => {
        const example = await this.getExampleForActionFromPinecone(
          newMessage,
          action,
        )
        if (!example) {
          return
        }

        return { userMessage: example, smartAction: action }
      }),
    )
    console.log(examples)
    if (examples.length > 0) {
      examples = sampleExamples
    }

    const response = await chain.invoke({
      userMessage: newMessage,
      examples: JSON.stringify(examples),
      format_instructions: parser.getFormatInstructions(),
    })

    return response
  }

  async getEmbeddings(
    data: ExampleMessagesWithSmartAction,
  ): Promise<PineconeRecord<MessageMetadata>[]> {
    const embeddings = []

    const crypto = require('crypto')
    for (const [action, examples] of Object.entries(data)) {
      const actionEmbeddings =
        await this.embeddingsModel.embedDocuments(examples)
      for (const [exampleIdx, values] of Object.entries(actionEmbeddings)) {
        const exampleIdxNum = parseInt(exampleIdx)
        const originalMessage = examples[exampleIdxNum]
        const id = crypto
          .createHash('sha1')
          .update(originalMessage)
          .digest('hex')

        embeddings.push({
          id,
          values,
          metadata: {
            action: action,
            originalMessage,
          },
        })
      }
    }

    return embeddings
  }

  async getExampleForActionFromPinecone(
    message: string,
    action: string,
  ): Promise<string | void> {
    const embeddings = await this.embeddingsModel.embedDocuments([message])
    const result = await this.pineconeUtil.getClosesMatchForSmartAction(
      embeddings[0],
      action,
    )

    return result
  }

  async getMatchFromPinecone(
    message: string,
  ): Promise<[string, number] | void> {
    const embeddings = await this.embeddingsModel.embedDocuments([message])
    const result = await this.pineconeUtil.getClosestMatchs(embeddings[0])
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

    console.log(suggestedSmartAction)
    return suggestedSmartAction.smartAction
  }
}
