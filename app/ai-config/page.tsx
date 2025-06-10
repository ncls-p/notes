"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Plus,
  Settings,
  Trash2,
  TestTube,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import apiClient from "@/lib/apiClient";

// Form schema for AI configuration
const aiConfigSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  apiProviderType: z.enum([
    "openai",
    "ollama",
    "azure_openai",
    "custom_openai_compatible",
  ]),
  baseUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  apiKey: z.string().optional(),
  chatModel: z.string().optional(),
  embeddingModel: z.string().optional(),
  transcriptionModel: z.string().optional(),
  isDefaultChat: z.boolean().optional(),
  isDefaultEmbedding: z.boolean().optional(),
  isDefaultTranscription: z.boolean().optional(),
});

type AIConfigForm = z.infer<typeof aiConfigSchema>;

interface AIConfig {
  id: string;
  name: string;
  apiProviderType: string;
  baseUrl: string | null;
  hasApiKey: boolean;
  modelsConfig: any;
  isDefaultChat: boolean;
  isDefaultEmbedding: boolean;
  isDefaultTranscription: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AIConfigPage() {
  const [configs, setConfigs] = useState<AIConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AIConfig | null>(null);
  const [testingConfig, setTestingConfig] = useState<string | null>(null);

  const form = useForm<AIConfigForm>({
    resolver: zodResolver(aiConfigSchema),
    defaultValues: {
      name: "",
      apiProviderType: "openai",
      baseUrl: "",
      apiKey: "",
      chatModel: "",
      embeddingModel: "",
      transcriptionModel: "",
      isDefaultChat: false,
      isDefaultEmbedding: false,
      isDefaultTranscription: false,
    },
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const data = await apiClient<{ configs: AIConfig[] }>("/api/ai-configs");
      setConfigs(data.configs);
    } catch (error) {
      toast.error("Error loading AI configurations");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: AIConfigForm) => {
    try {
      const payload = {
        name: data.name,
        apiProviderType: data.apiProviderType,
        baseUrl: data.baseUrl || null,
        apiKey: data.apiKey || undefined,
        modelsConfig: {
          chatModel: data.chatModel || undefined,
          embeddingModel: data.embeddingModel || undefined,
          transcriptionModel: data.transcriptionModel || undefined,
        },
        isDefaultChat: data.isDefaultChat,
        isDefaultEmbedding: data.isDefaultEmbedding,
        isDefaultTranscription: data.isDefaultTranscription,
      };

      const url = editingConfig
        ? `/api/ai-configs/${editingConfig.id}`
        : "/api/ai-configs";
      const method = editingConfig ? "PUT" : "POST";

      await apiClient(url, {
        method,
        body: payload,
      });

      toast.success(
        `Configuration ${editingConfig ? "updated" : "created"} successfully`,
      );
      setDialogOpen(false);
      setEditingConfig(null);
      form.reset();
      loadConfigs();
    } catch (error) {
      toast.error("Error saving configuration");
    }
  };

  const handleEdit = (config: AIConfig) => {
    setEditingConfig(config);
    form.reset({
      name: config.name,
      apiProviderType: config.apiProviderType as any,
      baseUrl: config.baseUrl || "",
      apiKey: "", // Don't pre-fill API key for security
      chatModel: config.modelsConfig?.chatModel || "",
      embeddingModel: config.modelsConfig?.embeddingModel || "",
      transcriptionModel: config.modelsConfig?.transcriptionModel || "",
      isDefaultChat: config.isDefaultChat,
      isDefaultEmbedding: config.isDefaultEmbedding,
      isDefaultTranscription: config.isDefaultTranscription,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (configId: string) => {
    try {
      await apiClient(`/api/ai-configs/${configId}`, {
        method: "DELETE",
      });

      toast.success("Configuration deleted successfully");
      loadConfigs();
    } catch (error) {
      toast.error("Error deleting configuration");
    }
  };

  const handleTest = async (configId: string) => {
    setTestingConfig(configId);
    try {
      const result = await apiClient<{ success: boolean; error?: string; models?: any[] }>(`/api/ai-configs/${configId}/test`, {
        method: "POST",
      });

      if (result.success) {
        toast.success(
          `Connection successful! Found ${result.models?.length || 0} models.`,
        );
      } else {
        toast.error(`Connection failed: ${result.error}`);
      }
    } catch (error) {
      toast.error("Error testing configuration");
    } finally {
      setTestingConfig(null);
    }
  };

  const getProviderDisplayName = (type: string) => {
    switch (type) {
      case "openai":
        return "OpenAI";
      case "ollama":
        return "Ollama";
      case "azure_openai":
        return "Azure OpenAI";
      case "custom_openai_compatible":
        return "Custom OpenAI Compatible";
      default:
        return type;
    }
  };

  const getProviderDescription = (type: string) => {
    switch (type) {
      case "openai":
        return "Connect to OpenAI's API for GPT models and Whisper transcription";
      case "ollama":
        return "Connect to your local Ollama instance for open-source models";
      case "azure_openai":
        return "Connect to Azure OpenAI Service";
      case "custom_openai_compatible":
        return "Connect to any OpenAI-compatible API";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">AI Configuration</h1>
          <p className="text-muted-foreground">
            Manage your AI provider settings for chat, embeddings, and
            transcription
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingConfig(null);
                form.reset();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Configuration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? "Edit" : "Add"} AI Configuration
              </DialogTitle>
              <DialogDescription>
                Configure your AI provider settings. Your API keys are encrypted
                and stored securely.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Configuration Name</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="My OpenAI Config"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="apiProviderType">Provider Type</Label>
                  <Select
                    value={form.watch("apiProviderType")}
                    onValueChange={(value) =>
                      form.setValue("apiProviderType", value as any)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="ollama">Ollama</SelectItem>
                      <SelectItem value="azure_openai">Azure OpenAI</SelectItem>
                      <SelectItem value="custom_openai_compatible">
                        Custom OpenAI Compatible
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {form.watch("apiProviderType") !== "openai" && (
                <div>
                  <Label htmlFor="baseUrl">Base URL</Label>
                  <Input
                    id="baseUrl"
                    {...form.register("baseUrl")}
                    placeholder="https://api.example.com"
                  />
                  {form.formState.errors.baseUrl && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.baseUrl.message}
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="apiKey">
                  API Key {editingConfig && "(leave blank to keep current)"}
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  {...form.register("apiKey")}
                  placeholder={
                    editingConfig
                      ? "Enter new API key or leave blank"
                      : "Enter your API key"
                  }
                />
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Model Configuration</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label htmlFor="chatModel">Chat Model</Label>
                    <Input
                      id="chatModel"
                      {...form.register("chatModel")}
                      placeholder="gpt-3.5-turbo, llama2, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="embeddingModel">Embedding Model</Label>
                    <Input
                      id="embeddingModel"
                      {...form.register("embeddingModel")}
                      placeholder="text-embedding-ada-002, nomic-embed-text, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="transcriptionModel">
                      Transcription Model
                    </Label>
                    <Input
                      id="transcriptionModel"
                      {...form.register("transcriptionModel")}
                      placeholder="whisper-1, etc."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Default Settings</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isDefaultChat"
                      checked={form.watch("isDefaultChat")}
                      onCheckedChange={(checked) =>
                        form.setValue("isDefaultChat", checked)
                      }
                    />
                    <Label htmlFor="isDefaultChat">
                      Use as default for chat
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isDefaultEmbedding"
                      checked={form.watch("isDefaultEmbedding")}
                      onCheckedChange={(checked) =>
                        form.setValue("isDefaultEmbedding", checked)
                      }
                    />
                    <Label htmlFor="isDefaultEmbedding">
                      Use as default for embeddings
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isDefaultTranscription"
                      checked={form.watch("isDefaultTranscription")}
                      onCheckedChange={(checked) =>
                        form.setValue("isDefaultTranscription", checked)
                      }
                    />
                    <Label htmlFor="isDefaultTranscription">
                      Use as default for transcription
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingConfig ? "Update" : "Create"} Configuration
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {configs.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">
                No AI configurations found. Add your first configuration to get
                started.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Configuration
              </Button>
            </CardContent>
          </Card>
        ) : (
          configs.map((config) => (
            <Card key={config.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {config.name}
                      <div className="flex gap-1">
                        {config.isDefaultChat && (
                          <Badge variant="secondary">Chat</Badge>
                        )}
                        {config.isDefaultEmbedding && (
                          <Badge variant="secondary">Embedding</Badge>
                        )}
                        {config.isDefaultTranscription && (
                          <Badge variant="secondary">Transcription</Badge>
                        )}
                      </div>
                    </CardTitle>
                    <CardDescription>
                      {getProviderDisplayName(config.apiProviderType)}
                      {config.baseUrl && ` • ${config.baseUrl}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(config.id)}
                      disabled={
                        testingConfig === config.id || !config.hasApiKey
                      }
                    >
                      {testingConfig === config.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <TestTube className="h-4 w-4" />
                      )}
                      Test
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(config)}
                    >
                      <Settings className="h-4 w-4" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete Configuration
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{config.name}"?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(config.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    {config.hasApiKey ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    {config.hasApiKey ? "API Key configured" : "No API Key"}
                  </div>
                  <div>
                    Created: {new Date(config.createdAt).toLocaleDateString()}
                  </div>
                  {config.modelsConfig &&
                    Object.keys(config.modelsConfig).length > 0 && (
                      <div>
                        Models:{" "}
                        {Object.values(config.modelsConfig)
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
