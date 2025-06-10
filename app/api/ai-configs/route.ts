import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth/serverAuth";
import prisma from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";
import { logger } from "@/lib/logger";

// Validation schema for AI config creation/update
const CreateAiConfigSchema = z.object({
  name: z.string().min(1).max(100),
  apiProviderType: z.enum([
    "openai",
    "ollama",
    "azure_openai",
    "custom_openai_compatible",
  ]),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().optional(),
  modelsConfig: z.record(z.any()).optional(),
  isDefaultChat: z.boolean().optional().default(false),
  isDefaultEmbedding: z.boolean().optional().default(false),
  isDefaultTranscription: z.boolean().optional().default(false),
});

// Response type for AI configs (without sensitive data)
const SafeAiConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  apiProviderType: z.string(),
  baseUrl: z.string().nullable(),
  hasApiKey: z.boolean(),
  modelsConfig: z.record(z.any()).nullable(),
  isDefaultChat: z.boolean(),
  isDefaultEmbedding: z.boolean(),
  isDefaultTranscription: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const configs = await prisma.userAiConfig.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    // Transform configs to safe format (without encrypted API keys)
    const safeConfigs = configs.map((config) => ({
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
    }));

    logger.info(
      { userId: user.id, configCount: safeConfigs.length },
      "Retrieved AI configurations",
    );
    return NextResponse.json({ configs: safeConfigs });
  } catch (error) {
    logger.error({ error }, "Error retrieving AI configurations");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    logger.info({ body }, "Creating AI config with body");
    const validatedData = CreateAiConfigSchema.parse(body);
    logger.info({ validatedData }, "Validated AI config data");

    // Check if name already exists for this user
    const existingConfig = await prisma.userAiConfig.findFirst({
      where: {
        userId: user.id,
        name: validatedData.name,
      },
    });

    if (existingConfig) {
      return NextResponse.json(
        { error: "Configuration name already exists" },
        { status: 409 },
      );
    }

    // If setting as default, unset existing defaults of the same type
    if (validatedData.isDefaultChat) {
      await prisma.userAiConfig.updateMany({
        where: { userId: user.id, isDefaultChat: true },
        data: { isDefaultChat: false },
      });
    }

    if (validatedData.isDefaultEmbedding) {
      await prisma.userAiConfig.updateMany({
        where: { userId: user.id, isDefaultEmbedding: true },
        data: { isDefaultEmbedding: false },
      });
    }

    if (validatedData.isDefaultTranscription) {
      await prisma.userAiConfig.updateMany({
        where: { userId: user.id, isDefaultTranscription: true },
        data: { isDefaultTranscription: false },
      });
    }

    // Encrypt API key if provided
    let encryptedApiKey: Buffer | null = null;
    if (validatedData.apiKey) {
      encryptedApiKey = await encrypt(validatedData.apiKey);
    }

    const newConfig = await prisma.userAiConfig.create({
      data: {
        userId: user.id,
        name: validatedData.name,
        apiProviderType: validatedData.apiProviderType,
        baseUrl: validatedData.baseUrl || null,
        encryptedApiKey,
        modelsConfig: validatedData.modelsConfig || undefined,
        isDefaultChat: validatedData.isDefaultChat,
        isDefaultEmbedding: validatedData.isDefaultEmbedding,
        isDefaultTranscription: validatedData.isDefaultTranscription,
      },
    });

    // Return safe config (without encrypted API key)
    const safeConfig = {
      id: newConfig.id,
      name: newConfig.name,
      apiProviderType: newConfig.apiProviderType,
      baseUrl: newConfig.baseUrl,
      hasApiKey: !!newConfig.encryptedApiKey,
      modelsConfig: newConfig.modelsConfig,
      isDefaultChat: newConfig.isDefaultChat,
      isDefaultEmbedding: newConfig.isDefaultEmbedding,
      isDefaultTranscription: newConfig.isDefaultTranscription,
      createdAt: newConfig.createdAt,
      updatedAt: newConfig.updatedAt,
    };

    logger.info(
      { userId: user.id, configId: newConfig.id, configName: newConfig.name },
      "Created AI configuration",
    );
    return NextResponse.json({ config: safeConfig }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error({ error: error.errors }, "Validation error creating AI configuration");
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }
    logger.error({ error: error instanceof Error ? { message: error.message, stack: error.stack } : error }, "Error creating AI configuration");
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
