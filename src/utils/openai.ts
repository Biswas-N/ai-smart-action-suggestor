import { OpenAIEmbeddings } from 'langchain/embeddings/openai'

interface IOpenAIConfig {
  apiKey: string;
}

export default class OpenAIUtil {
  private openAIConfig: IOpenAIConfig;

  constructor() {
    const openAIApiKey = process.env.OPENAI_API_KEY;
    if (!openAIApiKey) {
      throw new Error('OpenAI API key is missing.');
    }

    this.openAIConfig = {
      apiKey: openAIApiKey
    };
  }

  async getEmbeddings(data: Record<string, string[]>): Promise<any> {
    const embeddings = []
    const embeddingsModel = new OpenAIEmbeddings({
      openAIApiKey: this.openAIConfig.apiKey,
    });

    for (const [action, examples] of Object.entries(data)) {
      const actionEmbeddings = await embeddingsModel.embedDocuments(examples);
      for (const [example, embedding] of Object.entries(actionEmbeddings)) {
        embeddings.push({
          id: `${action}-${example}`,
          values: embedding,
          metadata: { action: action }
        });
      }
    }

    return embeddings;
  }

  async getSuggestedSmartActions(newMessage: string): Promise<any> {
    // Add a wanted delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return ["smart-action-1", "smart-action-2"];
  }
}
