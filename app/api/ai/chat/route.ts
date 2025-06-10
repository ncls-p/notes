import {
  AIConfig,
  getUserAIConfig,
  getUserDefaultAIConfig,
} from "@/lib/ai/config";
import { searchSimilarChunks } from "@/lib/ai/rag";
import { getAuthenticatedUser } from "@/lib/auth/serverAuth";
import { decrypt } from "@/lib/crypto";
import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { Ollama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for chat request
const ChatRequestSchema = z.object({
  message: z.string().min(1).max(10000),
  configId: z.string().optional(),
  noteIds: z.array(z.string()).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .optional()
    .default([]),
  includeContext: z.boolean().optional().default(true),
  maxContextChunks: z.number().min(1).max(20).optional().default(5),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = ChatRequestSchema.parse(body);

    // Get AI config for chat
    let aiConfig = validatedData.configId
      ? await getUserAIConfig(user.id, validatedData.configId)
      : await getUserDefaultAIConfig(user.id, "chat");

    // If no default config found, try to get any available config
    if (!aiConfig) {
      const allConfigs = await prisma.userAiConfig.findMany({
        where: { userId: user.id },
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
      return NextResponse.json(
        {
          error:
            "No chat configuration found or API key missing. Please configure an AI provider first.",
        },
        { status: 400 },
      );
    }

    let contextChunks: any[] = [];
    let retrievedContext = "";

    // Retrieve relevant context if requested
    if (validatedData.includeContext) {
      try {
        contextChunks = await searchSimilarChunks(
          user.id,
          validatedData.message,
          {
            limit: validatedData.maxContextChunks,
            similarity_threshold: 0.7,
            noteIds: validatedData.noteIds,
          },
        );

        if (contextChunks.length > 0) {
          // Get note titles for context
          const noteIds = [
            ...new Set(contextChunks.map((chunk) => chunk.noteId)),
          ];
          const notes = await prisma.note.findMany({
            where: {
              id: { in: noteIds },
              ownerId: user.id,
            },
            select: {
              id: true,
              title: true,
            },
          });

          const noteMap = new Map(notes.map((note) => [note.id, note.title]));

          retrievedContext = contextChunks
            .map((chunk, index) => {
              const noteTitle = noteMap.get(chunk.noteId) || "Unknown Note";
              return `[Context ${index + 1} from "${noteTitle}"]\n${
                chunk.chunkText
              }`;
            })
            .join("\n\n");
        }
      } catch (contextError) {
        logger.warn(
          { userId: user.id, error: contextError },
          "Failed to retrieve context",
        );
        // Continue without context rather than failing the whole request
      }
    }

    // Generate AI response
    const aiResponse = await generateAIResponse(
      aiConfig,
      validatedData.message,
      retrievedContext,
      validatedData.history,
    );

    // Log AI usage
    await logAIUsage(
      user.id,
      aiConfig.id,
      "chat",
      validatedData.message,
      aiResponse.content,
      aiResponse.usage,
    );

    logger.info(
      {
        userId: user.id,
        configId: aiConfig.id,
        messageLength: validatedData.message.length,
        contextChunks: contextChunks.length,
        responseLength: aiResponse.content.length,
      },
      "AI chat response generated",
    );

    return NextResponse.json({
      response: aiResponse.content,
      usage: aiResponse.usage,
      contextChunks: contextChunks.length,
      sources: contextChunks.map((chunk) => ({
        noteId: chunk.noteId,
        chunkText: chunk.chunkText.substring(0, 200) + "...",
      })),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }
    logger.error({ error }, "Error in AI chat");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

interface AIResponse {
  content: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}

async function generateAIResponse(
  config: AIConfig,
  userMessage: string,
  context: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<AIResponse> {
  const contextSection = context
    ? `
RELEVANT CONTEXT FROM YOUR NOTES:
${context}

---`
    : "";

  const historySection =
    history.length > 0
      ? history
          .map(
            (msg) =>
              `${msg.role === "user" ? "Human" : "Assistant"}: ${msg.content}`,
          )
          .join("\n") + "\n---\n"
      : "";

  const systemPrompt = `You are a helpful AI assistant that helps users understand and work with their personal notes. ${
    context
      ? "Use the provided context from their notes to give more relevant and specific answers."
      : "Answer their questions to the best of your ability."
  }

Guidelines:
- Be helpful, accurate, and concise
- When referencing information from the context, mention that it's from their notes
- If the context doesn't contain relevant information for the question, say so
- Don't make up information that isn't in the context
- Be conversational and friendly

${contextSection}

${historySection}`;

  try {
    switch (config.apiProviderType) {
      case "openai":
        return await generateOpenAIResponse(config, systemPrompt, userMessage);
      case "ollama":
        return await generateOllamaResponse(config, systemPrompt, userMessage);
      case "azure_openai":
        return await generateAzureOpenAIResponse(
          config,
          systemPrompt,
          userMessage,
        );
      case "custom_openai_compatible":
        return await generateCustomOpenAIResponse(
          config,
          systemPrompt,
          userMessage,
        );
      default:
        throw new Error(`Unsupported chat provider: ${config.apiProviderType}`);
    }
  } catch (error) {
    logger.error(
      { configId: config.id, error },
      "Failed to generate AI response",
    );
    throw error;
  }
}

async function generateOpenAIResponse(
  config: AIConfig,
  systemPrompt: string,
  userMessage: string,
): Promise<AIResponse> {
  const model = new ChatOpenAI({
    openAIApiKey: config.apiKey!,
    modelName: config.modelsConfig?.chatModel || "gpt-3.5-turbo",
    temperature: 0.7,
  });

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  const response = await model.invoke(messages);

  return {
    content: response.content as string,
    usage: {
      inputTokens: response.usage_metadata?.input_tokens,
      outputTokens: response.usage_metadata?.output_tokens,
    },
  };
}

async function generateOllamaResponse(
  config: AIConfig,
  systemPrompt: string,
  userMessage: string,
): Promise<AIResponse> {
  const model = new Ollama({
    baseUrl: config.baseUrl || "http://localhost:11434",
    model: config.modelsConfig?.chatModel || "llama2",
  });

  const fullPrompt = `${systemPrompt}\n\nHuman: ${userMessage}\n\nAssistant:`;
  const response = await model.invoke(fullPrompt);

  return {
    content: response,
    // Ollama typically doesn't return token usage
  };
}

async function generateAzureOpenAIResponse(
  config: AIConfig,
  systemPrompt: string,
  userMessage: string,
): Promise<AIResponse> {
  if (!config.baseUrl) {
    throw new Error("Azure OpenAI requires a base URL");
  }

  const model = new ChatOpenAI({
    openAIApiKey: config.apiKey!,
    configuration: {
      baseURL: config.baseUrl,
      defaultQuery: { "api-version": "2023-12-01-preview" },
    },
    modelName: config.modelsConfig?.chatDeployment || "gpt-35-turbo",
    temperature: 0.7,
  });

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  const response = await model.invoke(messages);

  return {
    content: response.content as string,
    usage: {
      inputTokens: response.usage_metadata?.input_tokens,
      outputTokens: response.usage_metadata?.output_tokens,
    },
  };
}

async function generateCustomOpenAIResponse(
  config: AIConfig,
  systemPrompt: string,
  userMessage: string,
): Promise<AIResponse> {
  if (!config.baseUrl) {
    throw new Error("Custom OpenAI provider requires a base URL");
  }

  const model = new ChatOpenAI({
    openAIApiKey: config.apiKey!,
    configuration: {
      baseURL: config.baseUrl,
    },
    modelName: config.modelsConfig?.chatModel || "gpt-3.5-turbo",
    temperature: 0.7,
  });

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  const response = await model.invoke(messages);

  return {
    content: response.content as string,
    usage: {
      inputTokens: response.usage_metadata?.input_tokens,
      outputTokens: response.usage_metadata?.output_tokens,
    },
  };
}

async function logAIUsage(
  userId: string,
  aiConfigId: string,
  requestType: string,
  inputText: string,
  outputText: string,
  usage?: { inputTokens?: number; outputTokens?: number },
): Promise<void> {
  try {
    // Estimate tokens if not provided (rough approximation: 1 token ≈ 4 characters)
    const estimatedInputTokens =
      usage?.inputTokens || Math.ceil(inputText.length / 4);
    const estimatedOutputTokens =
      usage?.outputTokens || Math.ceil(outputText.length / 4);

    await prisma.aiUsageLog.create({
      data: {
        userId,
        aiConfigId,
        modelId: "chat-model", // Could be more specific based on config
        requestType,
        inputTokens: estimatedInputTokens,
        outputTokens: estimatedOutputTokens,
        costEstimateUsd: null, // Could be calculated based on model pricing
      },
    });
  } catch (error) {
    logger.error(
      { userId, aiConfigId, requestType, error },
      "Failed to log AI usage",
    );
    // Don't throw - usage logging shouldn't break the main operation
  }
}

// Helper function to extract Azure instance name from URL
function extractInstanceName(baseUrl: string): string {
  try {
    const url = new URL(baseUrl);
    const hostname = url.hostname;
    // Extract instance name from hostname like "instance.openai.azure.com"
    return hostname.split(".")[0];
  } catch {
    throw new Error("Invalid Azure OpenAI base URL format");
  }
}
