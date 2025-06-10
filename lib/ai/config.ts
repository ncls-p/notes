import { decrypt } from "@/lib/crypto";
import prisma from "@/lib/db";
import { logger } from "@/lib/logger";

export interface AIConfig {
  id: string;
  name: string;
  apiProviderType: string;
  baseUrl: string | null;
  apiKey: string | null;
  modelsConfig: any;
  isDefaultChat: boolean;
  isDefaultEmbedding: boolean;
  isDefaultTranscription: boolean;
}

/**
 * Get user's default AI config for a specific type
 */
export async function getUserDefaultAIConfig(
  userId: string,
  type: "chat" | "embedding" | "transcription",
): Promise<AIConfig | null> {
  try {
    const fieldMap = {
      chat: "isDefaultChat",
      embedding: "isDefaultEmbedding",
      transcription: "isDefaultTranscription",
    };

    const config = await prisma.userAiConfig.findFirst({
      where: {
        userId,
        [fieldMap[type]]: true,
      },
    });

    if (!config) {
      return null;
    }

    // Decrypt API key if present
    let apiKey: string | null = null;
    if (config.encryptedApiKey) {
      try {
        apiKey = await decrypt(Buffer.from(config.encryptedApiKey));
      } catch (error) {
        logger.error(
          { userId, configId: config.id, error },
          "Failed to decrypt API key",
        );
        return null;
      }
    }

    return {
      id: config.id,
      name: config.name,
      apiProviderType: config.apiProviderType,
      baseUrl: config.baseUrl,
      apiKey,
      modelsConfig: config.modelsConfig,
      isDefaultChat: config.isDefaultChat,
      isDefaultEmbedding: config.isDefaultEmbedding,
      isDefaultTranscription: config.isDefaultTranscription,
    };
  } catch (error) {
    logger.error({ userId, type, error }, "Error getting default AI config");
    return null;
  }
}

/**
 * Get a specific AI config by ID (if it belongs to the user)
 */
export async function getUserAIConfig(
  userId: string,
  configId: string,
): Promise<AIConfig | null> {
  try {
    const config = await prisma.userAiConfig.findFirst({
      where: {
        id: configId,
        userId,
      },
    });

    if (!config) {
      return null;
    }

    // Decrypt API key if present
    let apiKey: string | null = null;
    if (config.encryptedApiKey) {
      try {
        apiKey = await decrypt(Buffer.from(config.encryptedApiKey));
      } catch (error) {
        logger.error(
          { userId, configId: config.id, error },
          "Failed to decrypt API key",
        );
        return null;
      }
    }

    return {
      id: config.id,
      name: config.name,
      apiProviderType: config.apiProviderType,
      baseUrl: config.baseUrl,
      apiKey,
      modelsConfig: config.modelsConfig,
      isDefaultChat: config.isDefaultChat,
      isDefaultEmbedding: config.isDefaultEmbedding,
      isDefaultTranscription: config.isDefaultTranscription,
    };
  } catch (error) {
    logger.error({ userId, configId, error }, "Error getting AI config");
    return null;
  }
}

/**
 * Get all AI configs for a user (without decrypted API keys)
 */
export async function getUserAIConfigs(userId: string) {
  try {
    const configs = await prisma.userAiConfig.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        apiProviderType: true,
        baseUrl: true,
        encryptedApiKey: true,
        modelsConfig: true,
        isDefaultChat: true,
        isDefaultEmbedding: true,
        isDefaultTranscription: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return configs.map(
      (config: {
        id: string;
        name: string;
        apiProviderType: string;
        baseUrl: string | null;
        encryptedApiKey: Uint8Array | null;
        modelsConfig: any;
        isDefaultChat: boolean;
        isDefaultEmbedding: boolean;
        isDefaultTranscription: boolean;
        createdAt: Date;
        updatedAt: Date;
      }) => ({
        id: config.id,
        name: config.name,
        apiProviderType: config.apiProviderType,
        baseUrl: config.baseUrl,
        hasApiKey: !!config.encryptedApiKey,
        modelsConfig: config.modelsConfig,
        isDefaultChat: config.isDefaultChat,
        isDefaultEmbedding: config.isDefaultEmbedding,
        isDefaultTranscription: config.isDefaultTranscription,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      }),
    );
  } catch (error) {
    logger.error({ userId, error }, "Error getting user AI configs");
    return [];
  }
}
