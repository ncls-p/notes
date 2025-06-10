"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Bot, Loader2, MessageSquare, Send, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: Array<{
    noteId: string;
    chunkText: string;
  }>;
}

interface AIChatProps {
  noteIds?: string[];
  configId?: string;
  className?: string;
  placeholder?: string;
  maxHeight?: string;
}

export function AIChat({
  noteIds,
  configId,
  className,
  placeholder = "Ask me anything about your notes...",
  maxHeight = "600px",
}: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          configId,
          noteIds,
          history: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          includeContext: true,
          maxContextChunks: 5,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get AI response");
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        sources: data.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.contextChunks > 0) {
        toast.success(`Found context from ${data.contextChunks} note sections`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send message",
      );
      console.error("Chat error:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-4 right-4 rounded-full p-4 shadow-lg",
          className,
        )}
        size="lg"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card
      className={cn("fixed bottom-4 right-4 w-96 shadow-xl", className)}
      style={{ maxHeight }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Assistant
          </CardTitle>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearChat}>
                Clear
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {noteIds && noteIds.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Searching in {noteIds.length} note{noteIds.length > 1 ? "s" : ""}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96 px-4" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="text-center">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Start a conversation!</p>
                <p className="text-xs">
                  I can help you find information in your notes.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted",
                    )}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <div className="text-xs text-muted-foreground mb-1">
                          Sources:
                        </div>
                        <div className="space-y-1">
                          {message.sources.map((source, sourceIndex) => (
                            <div
                              key={sourceIndex}
                              className="text-xs bg-background/50 rounded p-1"
                            >
                              {source.chunkText}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  {message.role === "user" && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking...
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        <Separator />
        <form onSubmit={handleSubmit} className="p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={!input.trim() || loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Floating chat button component for easier integration
export function AIChatButton(props: AIChatProps) {
  return <AIChat {...props} />;
}
