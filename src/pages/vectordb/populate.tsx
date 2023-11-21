import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { useEffect, useState } from 'react';


const pineconeApiKey = process.env.PINECONE_API_KEY;
const pineconeEnvironment = process.env.PINECONE_ENVIRONMENT;
const pineconeIndexName = process.env.PINECONE_INDEX;
const openaiApiKey = process.env.OPENAI_API_KEY;

export default function PopulateVectorDB() {
  const [status, setStatus] = useState("Checking for existing Pinecone Index...");

  useEffect(() => {
    const populateVectorDB = async () => {
      try {
        if (!pineconeApiKey || !pineconeEnvironment || !pineconeIndexName) {
          throw new Error('Pinecone environment variables are missing.');
        }

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

        // Connect to Pinecone
        const pinecone = new Pinecone({
          apiKey: pineconeApiKey,
          environment: pineconeEnvironment,
        });
        let indexes = await pinecone.listIndexes();

        // Delete old Pinecone index if it already exist
        if (indexes.length > 0) {
          setStatus("Deleting old Pinecone index...");
          await pinecone.deleteIndex(pineconeIndexName);

          // Wait until the index is deleted
          while (indexes.length !== 0) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            indexes = await pinecone.listIndexes();
          }
        }

        // Create a new Pinecone index
        setStatus("Creating new Pinecone index...");
        await pinecone.createIndex({
          name: pineconeIndexName,
          dimension: 1536,
          metric: "cosine",
          waitUntilReady: true,
        });
        // Prune the index
        const index = pinecone.index(pineconeIndexName);

        // Push embeddings to Pinecone
        setStatus("Pushing embeddings to Pinecone...");
        await index.upsert(embeddings);
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
