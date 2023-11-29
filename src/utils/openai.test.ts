import { PineconeBadRequestError } from '@pinecone-database/pinecone/dist/errors/http'

import OpenAIUtil from './openai'
import PineconeUtil from './pinecone'

const createOpenAIUtil = (pineconeUtil: PineconeUtil) => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key is missing.')
  }

  return new OpenAIUtil({
    apiKey,
    pineconeUtil,
  })
}

const createPineconeUtil = () => {
  const apiKey = process.env.PINECONE_API_KEY
  const environment = process.env.PINECONE_ENVIRONMENT
  const indexName = process.env.PINECONE_INDEX + '-test'
  if (!apiKey || !environment || !indexName) {
    throw new Error('Missing environment variables')
  }

  return new PineconeUtil({
    apiKey,
    environment,
    indexName,
  })
}

describe('PineconeUtil class', () => {
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
