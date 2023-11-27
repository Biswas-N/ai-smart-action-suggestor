import { useEffect, useState } from 'react'
import PineconeUtil from '@/utils/pinecone'
import OpenAIUtil from '@/utils/openai'

interface IDatasetRecord {
  [key: string]: string[]
}

export default function PopulateVectorDB() {
  const [status, setStatus] = useState(
    'Generating embeddings for Examples dataset...',
  )

  useEffect(() => {
    const populateVectorDB = async () => {
      try {
        const pineconeUtil = new PineconeUtil()
        const openAiUtil = new OpenAIUtil()

        // Read JSON file (replace 'your-data.json' with your actual JSON file path)
        const res = await fetch('/data/dataset.json')
        const jsonData: IDatasetRecord = await res.json()

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
        <a href="/data/dataset.json" target="_blank">
          JSON file
        </a>{' '}
        and push it to Pinecone
      </p>
    </div>
  )
}
