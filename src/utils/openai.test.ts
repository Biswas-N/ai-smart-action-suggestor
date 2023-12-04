import { PineconeBadRequestError } from '@pinecone-database/pinecone/dist/errors/http'

import OpenAIUtil from './openai'
import PineconeUtil from './pinecone'
import { getOpenAIConfig, getPineconeConfig } from './config'

const createOpenAIUtil = (pineconeUtil: PineconeUtil) => {
  return new OpenAIUtil({
    apiKey: getOpenAIConfig().apiKey,
    pineconeUtil,
  })
}

const createPineconeUtil = () => {
  return new PineconeUtil(getPineconeConfig())
}

describe('PineconeUtil', () => {
  let openaiUtil: OpenAIUtil
  let pineconeUtil: PineconeUtil

  beforeAll(async () => {
    // Setup: create an instance of PineconeUtil for testing
    pineconeUtil = createPineconeUtil()
    openaiUtil = createOpenAIUtil(pineconeUtil)

    try {
      await pineconeUtil.createIndex()
    } catch (e) {
      if (e instanceof PineconeBadRequestError) {
        console.log('Index already exists.')
        return
      }
      throw e
    }
  }, 100000)

  afterAll(async () => {
    if (pineconeUtil) {
      await pineconeUtil.deleteIndex()
    }
  }, 100000)

  describe('getEmbeddings', () => {
    it('should generate embeddings for records', async () => {
      // Act
      const sampleData = {
        'test-action1': ['test-example1', 'test-example2'],
        'test-action2': ['test-example3', 'test-example4'],
      }
      const embeddings = await openaiUtil.getEmbeddings(sampleData)

      // Assert
      expect(embeddings.length).toBe(4)

      // Calculate the number of unique actions
      const uniqueActions = new Set()
      for (const embedding of embeddings) {
        uniqueActions.add(embedding.metadata?.action)
      }
      expect(uniqueActions.size).toBe(2)
    })
  })

  describe('getSuggestedSmartActions', () => {
    it('should return lookup-documentation smart action suggestion', async () => {
      // Act
      const newMessage =
        'Do you have any documentation on how to use the Pinecone CLI?'
      const suggestedSmartAction =
        await openaiUtil.getSuggestedSmartActions(newMessage)

      // Assert
      expect(suggestedSmartAction).toBe('lookup-documentation')
    })
  })
})
