import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/serverAuth";
import prisma from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { logger } from "@/lib/logger";
import axios from "axios";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ configId: string }> },
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { configId } = await params;
    // Get the AI config
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

    if (!config.encryptedApiKey) {
      return NextResponse.json(
        { error: "No API key configured" },
        { status: 400 },
      );
    }

    // Decrypt API key
    const apiKey = await decrypt(Buffer.from(config.encryptedApiKey));

    // Test connection based on provider type
    let testResult;
    try {
      switch (config.apiProviderType) {
        case "openai":
          testResult = await testOpenAIConnection(apiKey);
          break;
        case "ollama":
          testResult = await testOllamaConnection(
            config.baseUrl || "http://localhost:11434",
            apiKey,
          );
          break;
        case "azure_openai":
          testResult = await testAzureOpenAIConnection(config.baseUrl!, apiKey);
          break;
        case "custom_openai_compatible":
          testResult = await testCustomOpenAIConnection(
            config.baseUrl!,
            apiKey,
          );
          break;
        default:
          return NextResponse.json(
            { error: "Unsupported provider type" },
            { status: 400 },
          );
      }

      logger.info(
        {
          userId: user.id,
          configId: config.id,
          provider: config.apiProviderType,
        },
        "AI configuration test successful",
      );
      return NextResponse.json({
        success: true,
        message: "Connection successful",
        models: testResult.models || [],
      });
    } catch (error) {
      logger.warn(
        {
          userId: user.id,
          configId: config.id,
          provider: config.apiProviderType,
          error,
        },
        "AI configuration test failed",
      );
      return NextResponse.json(
        {
          success: false,
          message: "Connection failed",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 400 },
      );
    }
  } catch (error) {
    logger.error({ error }, "Error testing AI configuration");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function testOpenAIConnection(apiKey: string) {
  const response = await axios.get("https://api.openai.com/v1/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    timeout: 10000,
  });

  if (response.status !== 200) {
    throw new Error(`OpenAI API returned status ${response.status}`);
  }

  return {
    models:
      response.data.data?.map((model: any) => ({
        id: model.id,
        name: model.id,
        type: "chat", // OpenAI models can be used for chat
      })) || [],
  };
}

async function testOllamaConnection(baseUrl: string, apiKey?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const response = await axios.get(`${baseUrl}/api/tags`, {
    headers,
    timeout: 10000,
  });

  if (response.status !== 200) {
    throw new Error(`Ollama API returned status ${response.status}`);
  }

  return {
    models:
      response.data.models?.map((model: any) => ({
        id: model.name,
        name: model.name,
        type: "chat",
        size: model.size,
      })) || [],
  };
}

async function testAzureOpenAIConnection(baseUrl: string, apiKey: string) {
  // For Azure OpenAI, we need to make a simple request to verify the connection
  // The exact endpoint depends on the deployment, so we'll try a generic approach
  const response = await axios.get(
    `${baseUrl}/openai/deployments?api-version=2023-12-01-preview`,
    {
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    },
  );

  if (response.status !== 200) {
    throw new Error(`Azure OpenAI API returned status ${response.status}`);
  }

  return {
    models:
      response.data.data?.map((deployment: any) => ({
        id: deployment.id,
        name: deployment.id,
        type: "chat",
      })) || [],
  };
}

async function testCustomOpenAIConnection(baseUrl: string, apiKey: string) {
  // Remove trailing slash and avoid double /v1
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const modelsUrl = cleanBaseUrl.endsWith('/v1') ? `${cleanBaseUrl}/models` : `${cleanBaseUrl}/v1/models`;
  
  const response = await axios.get(modelsUrl, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    timeout: 10000,
  });

  if (response.status !== 200) {
    throw new Error(`Custom OpenAI API returned status ${response.status}`);
  }

  return {
    models:
      response.data.data?.map((model: any) => ({
        id: model.id,
        name: model.id,
        type: "chat",
      })) || [],
  };
}
