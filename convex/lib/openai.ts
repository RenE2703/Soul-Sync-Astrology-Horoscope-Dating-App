import OpenAI from "openai";

// Initialize the OpenAI client
// The API key is read from the OPENAI_API_KEY environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Default models
const EMBEDDING_MODEL = "text-embedding-3-small";
const CHAT_MODEL = "gpt-4o-mini";

/**
 * Generate an embedding vector for the given text
 * Uses the text-embedding-3-small model (1536 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Generate a chat completion for the given prompt
 * Uses gpt-4o-mini model by default
 */
export async function generateChatCompletion(
  prompt: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
  },
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: options?.maxTokens ?? 150,
    temperature: options?.temperature ?? 0.7,
  });

  return response.choices[0].message.content ?? "";
}
