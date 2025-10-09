import OpenAI from 'openai';

/**
 * OpenAI client service for generating embeddings
 * 
 * This service provides a wrapper around the OpenAI API for generating
 * text embeddings used in semantic search.
 */

/**
 * Model to use for embeddings
 * text-embedding-3-small is cost-effective and produces 1536-dimensional vectors
 */
const EMBEDDING_MODEL = 'text-embedding-3-small';

/**
 * Maximum number of texts to process in a single batch
 */
const MAX_BATCH_SIZE = 100;

/**
 * Lazy initialization of OpenAI client
 * Only creates the client when needed, avoiding build-time errors
 */
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

/**
 * Generate embeddings for a single text
 * 
 * @param text - The text to generate an embedding for
 * @returns Array of numbers representing the embedding vector (1536 dimensions)
 * @throws Error if the API request fails
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  try {
    const openai = getOpenAIClient();
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      encoding_format: 'float',
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No embedding returned from OpenAI');
    }

    return response.data[0].embedding;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
    throw new Error('Failed to generate embedding: Unknown error');
  }
}

/**
 * Generate embeddings for multiple texts in a single batch
 * 
 * @param texts - Array of texts to generate embeddings for
 * @returns Array of embedding vectors, same order as input texts
 * @throws Error if the API request fails or if batch size exceeds limit
 */
export async function generateEmbeddingBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  if (texts.length > MAX_BATCH_SIZE) {
    throw new Error(`Batch size ${texts.length} exceeds maximum of ${MAX_BATCH_SIZE}`);
  }

  // Filter out empty texts
  const validTexts = texts.filter(text => text && text.trim().length > 0);
  
  if (validTexts.length === 0) {
    throw new Error('All texts in batch are empty');
  }

  try {
    const openai = getOpenAIClient();
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: validTexts,
      encoding_format: 'float',
    });

    if (!response.data || response.data.length !== validTexts.length) {
      throw new Error('Invalid response from OpenAI: embedding count mismatch');
    }

    // Sort by index to ensure correct order (API doesn't guarantee order)
    const sortedEmbeddings = response.data
      .sort((a, b) => a.index - b.index)
      .map(item => item.embedding);

    return sortedEmbeddings;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate embeddings batch: ${error.message}`);
    }
    throw new Error('Failed to generate embeddings batch: Unknown error');
  }
}

/**
 * Calculate cosine similarity between two vectors
 * 
 * @param a - First embedding vector
 * @param b - Second embedding vector
 * @returns Similarity score between 0 and 1 (1 = identical, 0 = orthogonal)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  
  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

