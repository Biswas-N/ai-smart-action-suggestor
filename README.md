# Smart Actions suggestor based on User’s message

This project is a [Next.js](https://nextjs.org/) application that uses TypeScript, React, and Tailwind, along with Langchain, OpenAI and Pincone to generate Smart Action suggestions to users based on their messages.

## Getting Started

First, install the dependencies:

```sh
npm install
```

Then, run the development server:

```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/utils/openai.ts`: Contains the OpenAIUtil class for interacting with the OpenAI API.
- `src/utils/pinecone.ts`: Contains the PineconeUtil class for interacting with the Pinecone database.
- `src/app/vectordb/populate/page.tsx`: A React component that reads a dataset from a JSON file and pushes it to Pinecone.
- `src/components/Message.tsx and src/containers/ChatInterface.tsx`: React components for the chat interface.

## Environment Variables

You need to set the following environment variables in a .env.local file:

- `OPENAI_API_KEY`: Your OpenAI API key.
- `PINECONE_API_KEY`: Your Pinecone API key.
- `PINECONE_ENVIRONMENT`: Your Pinecone environment.
- `PINECONE_INDEX`: Your Pinecone index.

## Project Flow

The `Smart Action Suggestion flow` is as follows:
![Smart Action Suggestion flow](./public/static/SmartActionSuggestionFlow.png)

- This application stores sample messages for each smart action within the Pinecone vector database.
- Upon receiving a user message, the application attempts to locate matches within the existing Pinecone database. If a message similarity score exceeds 90%, the corresponding smart action is recommended to the user.
- If the similarity score of the provided message falls below 90%, the application communicates with OpenAI’s LLM chat model (currently utilizing GPT3). The application constructs prompt and closely matching examples (using vector similarity search) for the known smart actions that should be detected from the given message.
- The OpenAI’s LLM model proposes a smart action, which is then suggested on the user interface.
- It is presumed that, when a user clicks on the suggested smart action they approve the suggestion. With this assumption, to enhance the application and decrease suggestion time, the message and clicked smart-action are added to the Pinecone database.
- While inserting the message and user-clicked smart-action into the Pinecone database, the application calculates a unique hash for the message to avoid any collisions or redundencies. Pinecone internally uses a `get_or_create` approach based on the Vector Ids (generated hash in this case).
- As the organization expands, the collection of these messages aids in providing effective suggestions to the users, enabling scalability.

## Assumptions/Bugs

- The application currently supports the suggestion of only one smart action per message. Multiple smart actions are not supported at this time.
- False positives are not accounted for when storing messages that were clicked by the user when the incorrect smart-action was suggested.
