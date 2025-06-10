import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { OllamaEmbeddings } from "@langchain/ollama";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MarkdownTextSplitter } from "@langchain/textsplitters";
import { randomUUID } from "crypto";
import { AIConfig, getUserAIConfig, getUserDefaultAIConfig } from "./config";

// Document chunk interface
export interface DocumentChunk {
  id?: string;
  noteId: string;
  chunkText: string;
  embedding: number[];
  createdAt?: Date;
}

/**
 * Split document content into chunks suitable for embedding
 */
export async function splitDocument(
  content: string,
  options?: {
    chunkSize?: number;
    chunkOverlap?: number;
  },
): Promise<string[]> {
  const { chunkSize = 1000, chunkOverlap = 200 } = options || {};

  const splitter = new MarkdownTextSplitter({
    chunkSize,
    chunkOverlap,
  });

  const chunks = await splitter.splitText(content);
  return chunks.filter((chunk) => chunk.trim().length > 0);
}

/**
 * Generate embeddings for text using user's configured embedding model
 */
export async function generateEmbeddings(
  userId: string,
  texts: string[],
  configId?: string,
): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  // Get AI config
  let aiConfig = configId
    ? await getUserAIConfig(userId, configId)
    : await getUserDefaultAIConfig(userId, "embedding");

  // If no default embedding config found, try to get any available config
  if (!aiConfig) {
    const { decrypt } = await import("../crypto");
    const allConfigs = await prisma.userAiConfig.findMany({
      where: { userId },
      take: 1,
    });

    if (allConfigs.length > 0) {
      const config = allConfigs[0];
      const apiKey = await decrypt(Buffer.from(config.encryptedApiKey!));
      aiConfig = {
        id: config.id,
        name: config.name,
        apiProviderType: config.apiProviderType as any,
        baseUrl: config.baseUrl,
        apiKey,
        modelsConfig: config.modelsConfig,
        isDefaultChat: config.isDefaultChat,
        isDefaultEmbedding: config.isDefaultEmbedding,
        isDefaultTranscription: config.isDefaultTranscription,
      };
    }
  }

  if (!aiConfig || !aiConfig.apiKey) {
    throw new Error("No embedding configuration found or API key missing");
  }

  try {
    switch (aiConfig.apiProviderType) {
      case "openai":
        return await generateOpenAIEmbeddings(aiConfig, texts);
      case "ollama":
        return await generateOllamaEmbeddings(aiConfig, texts);
      case "azure_openai":
        return await generateAzureOpenAIEmbeddings(aiConfig, texts);
      case "custom_openai_compatible":
        return await generateCustomOpenAIEmbeddings(aiConfig, texts);
      default:
        throw new Error(
          `Unsupported embedding provider: ${aiConfig.apiProviderType}`,
        );
    }
  } catch (error) {
    logger.error(
      { userId, configId: aiConfig.id, error },
      "Failed to generate embeddings",
    );
    throw error;
  }
}

async function generateOpenAIEmbeddings(
  config: AIConfig,
  texts: string[],
): Promise<number[][]> {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: config.apiKey!,
    modelName: config.modelsConfig?.embeddingModel || "text-embedding-3-small",
    batchSize: 512, // OpenAI's batch size limit
  });

  const result = await embeddings.embedDocuments(texts);
  return result;
}

async function generateOllamaEmbeddings(
  config: AIConfig,
  texts: string[],
): Promise<number[][]> {
  const embeddings = new OllamaEmbeddings({
    baseUrl: config.baseUrl || "http://localhost:11434",
    model: config.modelsConfig?.embeddingModel || "nomic-embed-text",
  });

  const result = await embeddings.embedDocuments(texts);
  return result;
}

async function generateAzureOpenAIEmbeddings(
  config: AIConfig,
  texts: string[],
): Promise<number[][]> {
  if (!config.baseUrl) {
    throw new Error("Azure OpenAI requires a base URL");
  }

  const url = new URL(config.baseUrl);
  url.searchParams.set("api-version", "2023-12-01-preview");

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: config.apiKey!,
    configuration: {
      baseURL: url.toString(),
    },
    modelName:
      config.modelsConfig?.embeddingDeployment || "text-embedding-ada-002",
  });

  const result = await embeddings.embedDocuments(texts);
  return result;
}

async function generateCustomOpenAIEmbeddings(
  config: AIConfig,
  texts: string[],
): Promise<number[][]> {
  if (!config.baseUrl) {
    throw new Error("Custom OpenAI provider requires a base URL");
  }

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: config.apiKey!,
    configuration: {
      baseURL: config.baseUrl,
    },
    modelName: config.modelsConfig?.embeddingModel || "text-embedding-ada-002",
  });

  const result = await embeddings.embedDocuments(texts);
  return result;
}

/**
 * Index a note's content by chunking and embedding it
 */
export async function indexNote(
  userId: string,
  noteId: string,
  content: string,
): Promise<void> {
  try {
    // First, remove existing chunks for this note
    await prisma.noteChunk.deleteMany({
      where: { noteId },
    });

    // If content is empty, nothing to index
    if (!content || content.trim().length === 0) {
      logger.info(
        { userId, noteId },
        "Note content is empty, skipped indexing",
      );
      return;
    }

    // Split content into chunks
    const chunks = await splitDocument(content);

    if (chunks.length === 0) {
      logger.info({ userId, noteId }, "No chunks generated from note content");
      return;
    }

    // Generate embeddings
    const embeddings = await generateEmbeddings(userId, chunks);

    // Store chunks and embeddings in database using raw SQL due to vector type
    const insertQueries = chunks.map((chunk, index) => {
      const embedding = `[${embeddings[index].join(",")}]`;
      return prisma.$executeRaw`INSERT INTO "note_chunks" ("id", "note_id", "chunk_text", "embedding") VALUES (${randomUUID()}, ${noteId}, ${chunk}, ${embedding}::vector)`;
    });

    await prisma.$transaction(insertQueries);

    logger.info(
      {
        userId,
        noteId,
        chunkCount: chunks.length,
      },
      "Successfully indexed note",
    );

    // Log AI usage
    await logAIUsage(userId, "embedding", chunks);
  } catch (error) {
    logger.error({ userId, noteId, error }, "Failed to index note");
    throw error;
  }
}

/**
 * Search for relevant chunks using vector similarity
 */
export async function searchSimilarChunks(
  userId: string,
  query: string,
  options?: {
    limit?: number;
    similarity_threshold?: number;
    noteIds?: string[];
  },
): Promise<DocumentChunk[]> {
  const { limit = 10, similarity_threshold = 0.7, noteIds } = options || {};

  try {
    // Generate embedding for the query
    const queryEmbeddings = await generateEmbeddings(userId, [query]);
    const queryVector = queryEmbeddings[0];

    // Build the SQL query with permission filtering
    const whereClause = `
      nc.note_id IN (
        SELECT n.id FROM notes n
        WHERE n.owner_id = $1
        ${noteIds ? `AND n.id = ANY($${noteIds ? 3 : 2})` : ""}
      )
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    if (noteIds) {
      params.push(noteIds);
      paramIndex++;
    }

    params.push(limit);

    const queryVectorString = `[${queryVector.join(",")}]`;
    const query_sql = `
      SELECT
        nc.id,
        nc.note_id,
        nc.chunk_text,
        nc.created_at,
        (nc.embedding <=> '${queryVectorString}'::vector) as distance
      FROM note_chunks nc
      WHERE ${whereClause}
      ORDER BY nc.embedding <=> '${queryVectorString}'::vector
      LIMIT $${paramIndex}
    `;

    const result = await prisma.$queryRawUnsafe<any[]>(query_sql, ...params);

    // Filter by similarity threshold and transform results
    const chunks: DocumentChunk[] = result
      .filter(
        (row: { distance: number }) => 1 - row.distance >= similarity_threshold,
      )
      .map((row: any) => ({
        id: row.id,
        noteId: row.note_id,
        chunkText: row.chunk_text,
        embedding: [], // We don't need the embedding in the result
        createdAt: row.created_at,
      }));

    logger.info(
      {
        userId,
        queryLength: query.length,
        resultCount: chunks.length,
        threshold: similarity_threshold,
      },
      "Vector search completed",
    );

    return chunks;
  } catch (error) {
    logger.error(
      { userId, query: query.substring(0, 100), error },
      "Vector search failed",
    );
    throw error;
  }
}

/**
 * Log AI usage for billing/tracking purposes
 */
async function logAIUsage(
  userId: string,
  requestType: string,
  texts: string[],
): Promise<void> {
  try {
    const aiConfig = await getUserDefaultAIConfig(userId, "embedding");
    if (!aiConfig) return;

    // Estimate token usage (rough approximation: 1 token ≈ 4 characters)
    const totalChars = texts.join("").length;
    const estimatedTokens = Math.ceil(totalChars / 4);

    await prisma.aiUsageLog.create({
      data: {
        userId,
        aiConfigId: aiConfig.id,
        modelId: aiConfig.modelsConfig?.embeddingModel || "unknown",
        requestType,
        inputTokens: estimatedTokens,
        outputTokens: null, // Embeddings don't have output tokens
        costEstimateUsd: null, // Could be calculated based on model pricing
      },
    });
  } catch (error) {
    logger.error({ userId, requestType, error }, "Failed to log AI usage");
    // Don't throw - usage logging shouldn't break the main operation
  }
}
