import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { useEffect, useState } from 'react';
import PineconeUtil from '@/utils/pinecone';


const openaiApiKey = process.env.OPENAI_API_KEY;

export default function PopulateVectorDB() {
  const [status, setStatus] = useState("Checking for existing Pinecone Index...");
  const pineconeUtil = new PineconeUtil()

  useEffect(() => {
    const populateVectorDB = async () => {
      try {
        // Read JSON file (replace 'your-data.json' with your actual JSON file path)
        const res = await fetch('/data/dataset.json');
        const jsonData = await res.json();

        // Generate embeddings
        const embeddings = []
        const embeddingsModel = new OpenAIEmbeddings({
          openAIApiKey: openaiApiKey,
        });
        for (const [action, examples] of Object.entries(jsonData)) {
          const actionEmbeddings = await embeddingsModel.embedDocuments(examples);
          for (const [example, embedding] of Object.entries(actionEmbeddings)) {
            embeddings.push({
              id: `${action}-${example}`,
              values: embedding,
              metadata: { action: action }
            });
          }
        }

        // Refresh index in pinecone
        await pineconeUtil.refreshIndex()
        await pineconeUtil.upsertVectors(embeddings)

        setStatus("Embeddings pushed to Pinecone successfully.");
      } catch (error) {
        console.error('Error:', error);
        setStatus("Unable to push embeddings to Pinecone.");
      }
    };

    // Call the function when the component mounts
    populateVectorDB();
  }, []);
  return (
    <div>
      <h1>{status}</h1>
      <p>This page reads <strong>smart-action and message</strong> dataset from a JSON file and push it to Pinecone</p>
    </div>
  )
}
