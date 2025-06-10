import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth/serverAuth";
import prisma from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";
import { logger } from "@/lib/logger";

// Validation schema for AI config updates
const UpdateAiConfigSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  apiProviderType: z
    .enum(["openai", "ollama", "azure_openai", "custom_openai_compatible"])
    .optional(),
  baseUrl: z.string().url().optional().nullable(),
  apiKey: z.string().optional(),
  modelsConfig: z.record(z.any()).optional().nullable(),
  isDefaultChat: z.boolean().optional(),
  isDefaultEmbedding: z.boolean().optional(),
  isDefaultTranscription: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ configId: string }> },
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { configId } = await params;
    const config = await prisma.userAiConfig.findFirst({
      where: {
        id: configId,
        userId: user.id,
      },
    });

    if (!config) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 },
      );
    }

    // Return safe config (without encrypted API key)
    const safeConfig = {
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
    };

    logger.info(
      { userId: user.id, configId: config.id },
      "Retrieved AI configuration",
    );
    return NextResponse.json({ config: safeConfig });
  } catch (error) {
    logger.error({ error }, "Error retrieving AI configuration");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ configId: string }> },
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = UpdateAiConfigSchema.parse(body);
    const { configId } = await params;

    // Check if config exists and belongs to user
    const existingConfig = await prisma.userAiConfig.findFirst({
      where: {
        id: configId,
        userId: user.id,
      },
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 },
      );
    }

    // Check if name conflict (if name is being changed)
    if (validatedData.name && validatedData.name !== existingConfig.name) {
      const nameConflict = await prisma.userAiConfig.findFirst({
        where: {
          userId: user.id,
          name: validatedData.name,
          id: { not: configId },
        },
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: "Configuration name already exists" },
          { status: 409 },
        );
      }
    }

    // Handle default settings
    if (validatedData.isDefaultChat === true) {
      await prisma.userAiConfig.updateMany({
        where: {
          userId: user.id,
          isDefaultChat: true,
          id: { not: configId },
        },
        data: { isDefaultChat: false },
      });
    }

    if (validatedData.isDefaultEmbedding === true) {
      await prisma.userAiConfig.updateMany({
        where: {
          userId: user.id,
          isDefaultEmbedding: true,
          id: { not: configId },
        },
        data: { isDefaultEmbedding: false },
      });
    }

    if (validatedData.isDefaultTranscription === true) {
      await prisma.userAiConfig.updateMany({
        where: {
          userId: user.id,
          isDefaultTranscription: true,
          id: { not: configId },
        },
        data: { isDefaultTranscription: false },
      });
    }

    // Encrypt new API key if provided
    let encryptedApiKey: Buffer | null | undefined = undefined;
    if ("apiKey" in validatedData) {
      if (validatedData.apiKey) {
        encryptedApiKey = await encrypt(validatedData.apiKey);
      } else {
        encryptedApiKey = null; // Explicitly remove API key
      }
    }

    // Update config
    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.apiProviderType !== undefined)
      updateData.apiProviderType = validatedData.apiProviderType;
    if ("baseUrl" in validatedData) updateData.baseUrl = validatedData.baseUrl;
    if (encryptedApiKey !== undefined)
      updateData.encryptedApiKey = encryptedApiKey;
    if ("modelsConfig" in validatedData)
      updateData.modelsConfig = validatedData.modelsConfig;
    if (validatedData.isDefaultChat !== undefined)
      updateData.isDefaultChat = validatedData.isDefaultChat;
    if (validatedData.isDefaultEmbedding !== undefined)
      updateData.isDefaultEmbedding = validatedData.isDefaultEmbedding;
    if (validatedData.isDefaultTranscription !== undefined)
      updateData.isDefaultTranscription = validatedData.isDefaultTranscription;

    const updatedConfig = await prisma.userAiConfig.update({
      where: { id: configId },
      data: updateData,
    });

    // Return safe config
    const safeConfig = {
      id: updatedConfig.id,
      name: updatedConfig.name,
      apiProviderType: updatedConfig.apiProviderType,
      baseUrl: updatedConfig.baseUrl,
      hasApiKey: !!updatedConfig.encryptedApiKey,
      modelsConfig: updatedConfig.modelsConfig,
      isDefaultChat: updatedConfig.isDefaultChat,
      isDefaultEmbedding: updatedConfig.isDefaultEmbedding,
      isDefaultTranscription: updatedConfig.isDefaultTranscription,
      createdAt: updatedConfig.createdAt,
      updatedAt: updatedConfig.updatedAt,
    };

    logger.info(
      { userId: user.id, configId: updatedConfig.id },
      "Updated AI configuration",
    );
    return NextResponse.json({ config: safeConfig });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }
    logger.error({ error }, "Error updating AI configuration");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ configId: string }> },
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { configId } = await params;
    // Check if config exists and belongs to user
    const existingConfig = await prisma.userAiConfig.findFirst({
      where: {
        id: configId,
        userId: user.id,
      },
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 },
      );
    }

    // Delete the configuration
    await prisma.userAiConfig.delete({
      where: { id: configId },
    });

    logger.info(
      { userId: user.id, configId },
      "Deleted AI configuration",
    );
    return NextResponse.json({ message: "Configuration deleted successfully" });
  } catch (error) {
    logger.error({ error }, "Error deleting AI configuration");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
