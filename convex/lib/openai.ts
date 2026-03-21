// convex/lib/openai.ts (Now powered by Google Gemini AI)

/**
 * Generate an embedding vector for the given text
 * Uses the gemini-embedding-001 model (3072 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing from Convex environment variables.");

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: { parts: [{ text }] }
    })
  });

  const data = await response.json();
  if (!response.ok || !data.embedding) throw new Error(data.error?.message || "Failed to generate embedding");

  return data.embedding.values;
}

/**
 * Generate a chat completion for the given prompt
 * Uses gemini-2.5-flash model
 */
export async function generateChatCompletion(
  prompt: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
  },
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing from Convex environment variables.");

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: options?.maxTokens ?? 150,
        temperature: options?.temperature ?? 0.7,
      }
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Failed to generate chat completion");

  const candidate = data.candidates?.[0];
  return candidate?.content?.parts?.[0]?.text ?? "";
}
