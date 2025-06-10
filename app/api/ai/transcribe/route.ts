import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth/serverAuth";
import {
  getUserDefaultAIConfig,
  getUserAIConfig,
  AIConfig,
} from "@/lib/ai/config";
import { indexNote } from "@/lib/ai/rag";
import { logger } from "@/lib/logger";
import prisma from "@/lib/db";
import formidable, { File } from "formidable";
import { promises as fs } from "fs";
import axios from "axios";
import FormData from "form-data";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }
    const configId = (formData.get("configId") as string) || undefined;
    const title = (formData.get("title") as string) || undefined;
    const folderId = (formData.get("folderId") as string) || undefined;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    // Get AI config for transcription
    const aiConfig = configId
      ? await getUserAIConfig(user.id, configId)
      : await getUserDefaultAIConfig(user.id, "transcription");

    if (!aiConfig || !aiConfig.apiKey) {
      return NextResponse.json(
        {
          error:
            "No transcription configuration found or API key missing. Please configure an AI provider first.",
        },
        { status: 400 },
      );
    }

    // Transcribe the audio
    const transcription = await transcribeAudio(aiConfig, audioFile);

    if (!transcription.trim()) {
      return NextResponse.json(
        { error: "No transcription generated" },
        { status: 400 },
      );
    }

    // Create a new note with the transcribed content
    const noteTitle =
      title || `Voice Note - ${new Date().toLocaleDateString()}`;

    // Validate folder if provided
    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          ownerId: user.id,
        },
      });

      if (!folder) {
        return NextResponse.json(
          { error: "Folder not found or access denied" },
          { status: 404 },
        );
      }
    }

    // Check for duplicate note titles
    const existingNote = await prisma.note.findFirst({
      where: {
        title: noteTitle,
        folderId: folderId || null,
        ownerId: user.id,
      },
    });

    const finalTitle = existingNote
      ? `${noteTitle} (${Date.now()})`
      : noteTitle;

    // Create the note
    const note = await prisma.note.create({
      data: {
        title: finalTitle,
        contentMarkdown: transcription,
        folderId: folderId || null,
        ownerId: user.id,
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Index the note for RAG search (async, don't wait for completion)
    indexNote(user.id, note.id, transcription).catch((error) => {
      logger.warn(
        { noteId: note.id, error },
        "Failed to index transcribed note for RAG",
      );
    });

    // Log AI usage
    await logTranscriptionUsage(user.id, aiConfig.id, audioFile, transcription);

    logger.info(
      {
        userId: user.id,
        configId: aiConfig.id,
        noteId: note.id,
        transcriptionLength: transcription.length,
        audioFileName: "voice-note.webm",
      },
      "Audio transcribed and note created",
    );

    return NextResponse.json(
      {
        note: {
          id: note.id,
          title: note.title,
          content: note.contentMarkdown,
          folderId: note.folderId,
          folder: note.folder,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        },
        transcription,
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error({ error }, "Error in audio transcription");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function transcribeAudio(
  config: AIConfig,
  audioFile: File,
): Promise<string> {
  try {
    switch (config.apiProviderType) {
      case "openai":
        return await transcribeWithOpenAI(config, audioFile);
      case "azure_openai":
        return await transcribeWithAzureOpenAI(config, audioFile);
      case "custom_openai_compatible":
        return await transcribeWithCustomOpenAI(config, audioFile);
      default:
        throw new Error(
          `Transcription not supported for provider: ${config.apiProviderType}`,
        );
    }
  } catch (error) {
    logger.error({ configId: config.id, error }, "Failed to transcribe audio");
    throw error;
  }
}

async function transcribeWithOpenAI(
  config: AIConfig,
  audioFile: File,
): Promise<string> {
  const formData = new FormData();

  // Convert File to Buffer
  const webFile = audioFile as unknown as globalThis.File;
  const arrayBuffer = await webFile.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  formData.append("file", buffer, {
    filename: webFile.name || "audio.webm",
    contentType: webFile.type || "audio/webm",
  });
  formData.append(
    "model",
    config.modelsConfig?.transcriptionModel || "whisper-1",
  );

  const response = await axios.post(
    "https://api.openai.com/v1/audio/transcriptions",
    formData,
    {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        ...formData.getHeaders(),
      },
      maxContentLength: 50 * 1024 * 1024, // 50MB
      timeout: 60000, // 60 seconds
    },
  );

  return response.data.text || "";
}

async function transcribeWithAzureOpenAI(
  config: AIConfig,
  audioFile: File,
): Promise<string> {
  if (!config.baseUrl) {
    throw new Error("Azure OpenAI requires a base URL");
  }

  const formData = new FormData();

  // Convert File to Buffer
  const webFile = audioFile as unknown as globalThis.File;
  const arrayBuffer = await webFile.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  formData.append("file", buffer, {
    filename: webFile.name || "audio.webm",
    contentType: webFile.type || "audio/webm",
  });

  const deploymentName =
    config.modelsConfig?.transcriptionDeployment || "whisper";
  const url = `${config.baseUrl}/openai/deployments/${deploymentName}/audio/transcriptions?api-version=2023-12-01-preview`;

  const response = await axios.post(url, formData, {
    headers: {
      "api-key": config.apiKey,
      ...formData.getHeaders(),
    },
    maxContentLength: 50 * 1024 * 1024, // 50MB
    timeout: 60000, // 60 seconds
  });

  return response.data.text || "";
}

async function transcribeWithCustomOpenAI(
  config: AIConfig,
  audioFile: File,
): Promise<string> {
  if (!config.baseUrl) {
    throw new Error("Custom OpenAI provider requires a base URL");
  }

  const formData = new FormData();

  // Convert File to Buffer
  const webFile = audioFile as unknown as globalThis.File;
  const arrayBuffer = await webFile.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  formData.append("file", buffer, {
    filename: webFile.name || "audio.webm",
    contentType: webFile.type || "audio/webm",
  });
  formData.append(
    "model",
    config.modelsConfig?.transcriptionModel || "whisper-1",
  );

  const url = `${config.baseUrl}/v1/audio/transcriptions`;

  const response = await axios.post(url, formData, {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      ...formData.getHeaders(),
    },
    maxContentLength: 50 * 1024 * 1024, // 50MB
    timeout: 60000, // 60 seconds
  });

  return response.data.text || "";
}

async function logTranscriptionUsage(
  userId: string,
  aiConfigId: string,
  audioFile: File,
  transcription: string,
): Promise<void> {
  try {
    const audioSizeKB = audioFile.size / 1024;
    const transcriptionChars = transcription.length;

    await prisma.aiUsageLog.create({
      data: {
        userId,
        aiConfigId,
        modelId: "whisper", // Could be more specific based on config
        requestType: "transcription",
        inputTokens: Math.ceil(audioSizeKB), // Use file size as input "tokens"
        outputTokens: Math.ceil(transcriptionChars / 4), // Estimate output tokens
        costEstimateUsd: null, // Could be calculated based on audio duration and pricing
      },
    });
  } catch (error) {
    logger.error(
      { userId, aiConfigId, error },
      "Failed to log transcription usage",
    );
    // Don't throw - usage logging shouldn't break the main operation
  }
}
