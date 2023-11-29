import { Pinecone } from '@pinecone-database/pinecone'
import { PineconeRecord } from '@pinecone-database/pinecone/dist/data/types'
import { ClosestMatchSchema } from '../schemas/pinecone'

type PineconeConfig = {
  apiKey: string
  environment: string
  indexName: string
}

export type MessageMetadata = {
  action: string
}

export default class PineconeUtil {
  private pinecone: Pinecone
  private pineconeConfig: PineconeConfig

  constructor(pinconeConfig: PineconeConfig) {
    this.pineconeConfig = pinconeConfig
    this.pinecone = new Pinecone({
      apiKey: this.pineconeConfig.apiKey,
      environment: this.pineconeConfig.environment,
    })
  }

  async isIndexReady(): Promise<boolean> {
    const indexes = await this.pinecone.listIndexes()
    if (indexes.length === 0) {
      return false
    }

    return indexes.find((index) => index.name === this.pineconeConfig.indexName)
      ? true
      : false
  }

  async refreshIndex(): Promise<void> {
    await this.deleteIndex()
    await this.createIndex()
  }

  async createIndex(): Promise<void> {
    await this.pinecone.createIndex({
      name: this.pineconeConfig.indexName,
      dimension: 1536,
      metric: 'cosine',
      waitUntilReady: true,
    })
  }

  async deleteIndex(): Promise<void> {
    let indexes = await this.pinecone.listIndexes()

    // Delete index if it exists
    if (indexes.length > 0) {
      try {
        await this.pinecone.deleteIndex(this.pineconeConfig.indexName)
      } catch (e) {
        console.error(e)
      }

      // Wait until the index is deleted
      while (indexes.length !== 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        indexes = await this.pinecone.listIndexes()
      }
    }
  }

  async upsertVectors(
    embeddings: PineconeRecord<MessageMetadata>[],
    waitTillReady = false,
  ): Promise<number> {
    const index = this.pinecone.index<MessageMetadata>(
      this.pineconeConfig.indexName,
    )

    try {
      // Pinecone's implementation of upsert is not instant, instead it is eventually consistent.
      // So it is really hard to test this function.
      await index.upsert(embeddings)
      while (waitTillReady) {
        const stats = await index.describeIndexStats()
        if (stats.totalRecordCount === embeddings.length) {
          break
        }
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      return embeddings.length
    } catch (e) {
      console.error(e)
      return 0
    }
  }

  async getClosestMatch(
    messageEmbedding: Array<number>,
  ): Promise<[string, number] | void> {
    const index = this.pinecone.index<MessageMetadata>(
      this.pineconeConfig.indexName,
    )

    const results = await index.query({
      vector: messageEmbedding,
      topK: 1,
      includeMetadata: true,
    })

    const matches = results.matches

    if (matches.length === 0) {
      console.log('No matches found.')
      return
    }

    const match = matches[0]
    const result = ClosestMatchSchema.safeParse(match)
    if (!result.success) {
      console.log('Bad match found.')
      return
    }

    return [result.data.metadata.action, result.data.score]
  }
}
