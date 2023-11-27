import { Pinecone } from '@pinecone-database/pinecone'
import {
  PineconeRecord,
  RecordMetadata,
} from '@pinecone-database/pinecone/dist/data/types'

interface IPineconeConfig {
  apiKey: string
  environment: string
  indexName: string
}

export default class PineconeUtil {
  private pinecone: Pinecone
  private pineconeConfig: IPineconeConfig

  constructor() {
    const pineconeApiKey = process.env.PINECONE_API_KEY
    const pineconeEnvironment = process.env.PINECONE_ENVIRONMENT
    const pineconeIndexName = process.env.PINECONE_INDEX
    if (!pineconeApiKey || !pineconeEnvironment || !pineconeIndexName) {
      throw new Error('Pinecone environment variables are missing.')
    }

    this.pineconeConfig = {
      apiKey: pineconeApiKey,
      environment: pineconeEnvironment,
      indexName: pineconeIndexName,
    }
    this.pinecone = new Pinecone({
      apiKey: this.pineconeConfig.apiKey,
      environment: this.pineconeConfig.environment,
    })
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

    // Delete index if it  exists
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
    embeddings: PineconeRecord<RecordMetadata>[],
  ): Promise<void> {
    const index = this.pinecone.index(this.pineconeConfig.indexName)
    await index.upsert(embeddings)
  }
}
