import { PineconeRecord } from '@pinecone-database/pinecone/dist/data/types'
import PineconeUtil, { MessageMetadata } from './pinecone'
import { PineconeBadRequestError } from '@pinecone-database/pinecone/dist/errors/http'
import { getPineconeConfig } from './config'
import exp from 'constants'

describe('PineconeUtil', () => {
  let pineconeUtil: PineconeUtil

  beforeAll(async () => {
    pineconeUtil = new PineconeUtil(getPineconeConfig())

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

  describe('refreshIndex', () => {
    it('should refresh the index', async () => {
      // Act
      await pineconeUtil.refreshIndex()

      // Assert
      pineconeUtil.isIndexReady().then((isReady) => {
        expect(isReady).toBe(true)
      })
    }, 100000)
  })

  describe('upsertVectors', () => {
    it('should upsert vectors', async () => {
      // Arrange
      const embeddings: PineconeRecord<MessageMetadata>[] = [
        {
          id: 'create-documentation-1',
          values: Array.from({ length: 1536 }, () => Math.random()),
          metadata: {
            action: 'create-documentation',
            originalMessage: 'test',
          },
        },
        {
          id: 'create-documentation-2',
          values: Array.from({ length: 1536 }, () => Math.random()),
          metadata: {
            action: 'create-documentation',
            originalMessage: 'test',
          },
        },
      ]

      // Act
      const insertCount = await pineconeUtil.upsertVectors(embeddings)

      // Assert
      expect(insertCount).toBe(embeddings.length)
    })
  })

  describe('getClosestMatch', () => {
    it('should return closest match with score', async () => {
      // Arrange
      const embeddings: PineconeRecord<MessageMetadata>[] = [
        {
          id: 'create-documentation-1',
          values: Array.from({ length: 1536 }, () => Math.random()),
          metadata: {
            action: 'create-documentation',
            originalMessage: 'test',
          },
        },
        {
          id: 'create-documentation-2',
          values: Array.from({ length: 1536 }, () => Math.random()),
          metadata: {
            action: 'create-documentation',
            originalMessage: 'test',
          },
        },
      ]
      await pineconeUtil.upsertVectors(embeddings, true)

      // Act
      // Sample user message embedding to find a match for
      const userMessageEmbedding = Array.from({ length: 1536 }, () =>
        Math.random(),
      )
      const result = await pineconeUtil.getClosestMatchs(userMessageEmbedding)

      // Assert
      expect(result).toBeDefined()

      // Destructure the result
      const [action, score] = result!
      expect(typeof action).toBe('string')
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(1)
    }, 1000000)
  })

  describe('getClosestMatchForSmartAction', () => {
    it('should return closest match embeddings for given message and smart action', async () => {
      // Arrange
      const embeddings: PineconeRecord<MessageMetadata>[] = [
        {
          id: 'create-documentation-1',
          values: Array.from({ length: 1536 }, () => Math.random()),
          metadata: {
            action: 'create-documentation',
            originalMessage: 'test',
          },
        },
        {
          id: 'create-documentation-2',
          values: Array.from({ length: 1536 }, () => Math.random()),
          metadata: {
            action: 'create-documentation',
            originalMessage: 'test',
          },
        },
      ]
      await pineconeUtil.upsertVectors(embeddings, true)

      // Act
      // Sample user message embedding to find a match for
      const userMessageEmbedding = Array.from({ length: 1536 }, () =>
        Math.random(),
      )
      const result = await pineconeUtil.getClosesMatchForSmartAction(
        userMessageEmbedding,
        'create-documentation',
      )

      // Assert
      expect(result).toBeDefined()
      expect(result).toBe('test')
    }, 1000000)
  })
})
