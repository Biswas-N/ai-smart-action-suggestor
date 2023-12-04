'use client'

import { useEffect, useState } from 'react'
import PineconeUtil from '@/utils/pinecone'
import OpenAIUtil, { ExampleMessagesWithSmartAction } from '@/utils/openai'
import { getOpenAIConfig, getPineconeConfig } from '@/utils/config'

export default function PopulateVectorDB() {
  const [status, setStatus] = useState(
    'Generating embeddings for Examples dataset...',
  )

  useEffect(() => {
    const populateVectorDB = async () => {
      try {
        const pineconeUtil = new PineconeUtil(getPineconeConfig())

        const openAiUtil = new OpenAIUtil({
          apiKey: getOpenAIConfig().apiKey,
          pineconeUtil,
        })

        const res = await fetch('/static/data/dataset.json')
        const jsonData: ExampleMessagesWithSmartAction = await res.json()

        // Generate embeddings
        const embeddings = await openAiUtil.getEmbeddings(jsonData)

        // Refresh index in pinecone
        setStatus('Refreshing index...')
        await pineconeUtil.refreshIndex()

        setStatus('Pushing embeddings to Pinecone...')
        await pineconeUtil.upsertVectors(embeddings)

        setStatus('Embeddings pushed to Pinecone successfully.')
      } catch (error) {
        console.error('Error:', error)
        setStatus('Unable to push embeddings to Pinecone.')
      }
    }

    // Call the function when the component mounts
    populateVectorDB()
  }, [])
  return (
    <div>
      <h1>{status}</h1>
      <p>
        This page reads <strong>smart-action and message</strong> dataset from a{' '}
        <a href="/static/data/dataset.json" target="_blank">
          JSON file
        </a>{' '}
        and push it to Pinecone
      </p>
    </div>
  )
}
