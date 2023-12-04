// Get config from env
export const getOpenAIConfig = () => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not set')
  }

  return {
    apiKey,
  }
}

export const getPineconeConfig = () => {
  const apiKey = process.env.PINECONE_API_KEY
  const indexName = process.env.PINECONE_INDEX
  const environment = process.env.PINECONE_ENVIRONMENT
  if (!apiKey || !indexName || !environment) {
    throw new Error(
      'PINECONE_API_KEY, PINECONE_INDEX, or PINECONE_ENVIRONMENT not set',
    )
  }

  return {
    apiKey,
    indexName,
    environment,
  }
}
