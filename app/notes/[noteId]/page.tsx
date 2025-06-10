"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import apiClient from "@/lib/apiClient";
import { EditorView } from "@codemirror/view";
import {
  ArrowLeft,
  Clock,
  Edit3,
  Eye,
  FileText,
  Save,
  Sparkles,
  Split,
} from "lucide-react";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
// import { Mermaid } from "@/components/Mermaid";

// Dynamic import for CodeMirror to avoid SSR issues
const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), {
  ssr: false,
});

interface Note {
  id: string;
  title: string;
  content: string | null;
  folderId: string | null;
  folder?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export default function NoteEditor() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const noteId = params.noteId as string;

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"preview" | "edit" | "split">(
    "preview",
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [markdownExtension, setMarkdownExtension] = useState<any>(null);
  const [wordCount, setWordCount] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef(false);

  // Load markdown extension dynamically
  useEffect(() => {
    const loadMarkdown = async () => {
      try {
        const { markdown } = await import("@codemirror/lang-markdown");
        setMarkdownExtension(() => markdown);
      } catch (error) {
        console.warn("Failed to load markdown extension:", error);
      }
    };
    loadMarkdown();
  }, []);

  // Update word count
  useEffect(() => {
    const words = content
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    setWordCount(words.length);
  }, [content]);

  const loadNote = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient(`/api/notes/${noteId}`, {
        method: "GET",
      });
      const { note: noteData } = response as { note: Note };

      setNote(noteData);
      setTitle(noteData.title);
      setContent(noteData.content || "");
      setHasUnsavedChanges(false);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to load note",
      );
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  const saveNote = useCallback(async () => {
    if (!note) return;

    try {
      setSaving(true);
      setError(null);

      await apiClient(`/api/notes/${noteId}`, {
        method: "PUT",
        body: {
          title: (title || "").trim() || "Untitled",
          content: content || "",
        },
      });

      setHasUnsavedChanges(false);
    } catch (err: unknown) {
      console.error("Error saving note:", err);
      const errorMessage = (err as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error 
        || (err as { message?: string })?.message 
        || "Failed to save note";
      console.error("Error message:", errorMessage);
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  }, [note, noteId, title, content]);

  useEffect(() => {
    if (user && noteId) {
      loadNote();
    }
  }, [user, noteId, loadNote]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Synchronized scrolling effect
  useEffect(() => {
    const editorEl = editorRef.current?.view?.scrollDOM;
    const previewEl = previewRef.current;

    if (viewMode !== "split" || !editorEl || !previewEl) {
      return;
    }

    const syncScrollEditorToPreview = () => {
      if (isSyncingScroll.current) return;
      isSyncingScroll.current = true;
      const editorScrollPercentage =
        editorEl.scrollTop / (editorEl.scrollHeight - editorEl.clientHeight);
      previewEl.scrollTop =
        editorScrollPercentage *
        (previewEl.scrollHeight - previewEl.clientHeight);
      requestAnimationFrame(() => {
        isSyncingScroll.current = false;
      });
    };

    const syncScrollPreviewToEditor = () => {
      if (isSyncingScroll.current) return;
      isSyncingScroll.current = true;
      const previewScrollPercentage =
        previewEl.scrollTop / (previewEl.scrollHeight - previewEl.clientHeight);
      editorEl.scrollTop =
        previewScrollPercentage *
        (editorEl.scrollHeight - editorEl.clientHeight);
      requestAnimationFrame(() => {
        isSyncingScroll.current = false;
      });
    };

    editorEl.addEventListener("scroll", syncScrollEditorToPreview);
    previewEl.addEventListener("scroll", syncScrollPreviewToEditor);

    return () => {
      editorEl.removeEventListener("scroll", syncScrollEditorToPreview);
      previewEl.removeEventListener("scroll", syncScrollPreviewToEditor);
    };
  }, [viewMode, content]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setHasUnsavedChanges(true);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
  };

  const goBack = () => {
    if (hasUnsavedChanges) {
      if (
        confirm("You have unsaved changes. Are you sure you want to leave?")
      ) {
        router.back();
      }
    } else {
      router.back();
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (!hasUnsavedChanges || !note) return;

    const autoSaveTimer = setTimeout(() => {
      saveNote();
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [title, content, hasUnsavedChanges, note, saveNote]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <div>Checking authentication...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <Card className="glass-effect animate-fade-in-scale">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">
              Authentication Required
            </h2>
            <p className="text-muted-foreground">
              Please log in to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <Card className="glass-effect animate-fade-in-scale">
          <CardContent className="p-8 text-center space-y-4">
            <div className="loading-shimmer w-16 h-16 rounded-full mx-auto"></div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Loading Note</h2>
              <p className="text-muted-foreground">
                Please wait while we fetch your content...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !note) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <Card className="glass-effect animate-fade-in-scale">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-destructive">
                Error Loading Note
              </h2>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button onClick={goBack} variant="outline" className="smooth-hover">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 text-foreground selection:bg-primary/30 selection:text-primary-foreground">
      {/* Enhanced Header */}
      <header className="glass-effect border-b border-border shadow-lg sticky top-0 z-50 animate-slide-in-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                onClick={goBack}
                className="smooth-hover shrink-0"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <div className="flex items-center flex-1 min-w-0">
                <div className="relative flex-1 max-w-md">
                  <Input
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="text-lg font-semibold border-none shadow-none focus:ring-0 bg-transparent placeholder:text-muted-foreground smooth-hover"
                    placeholder="Note title..."
                  />
                </div>

                <div className="flex items-center space-x-3 ml-4">
                  {hasUnsavedChanges && (
                    <div className="flex items-center space-x-2 text-amber-500 animate-pulse">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">Unsaved</span>
                    </div>
                  )}

                  <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>{wordCount} words</span>
                    <span>•</span>
                    <span>{content.length} characters</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {/* View Mode Toggle */}
              <div className="hidden md:flex items-center space-x-1 bg-muted/30 rounded-lg p-1">
                <Button
                  variant={viewMode === "preview" ? "default" : "ghost"}
                  onClick={() => setViewMode("preview")}
                  size="sm"
                  className="smooth-hover"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "edit" ? "default" : "ghost"}
                  onClick={() => setViewMode("edit")}
                  size="sm"
                  className="smooth-hover"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "split" ? "default" : "ghost"}
                  onClick={() => setViewMode("split")}
                  size="sm"
                  className="smooth-hover"
                  title="Split View"
                >
                  <Split className="w-4 h-4" />
                </Button>
              </div>

              <Button
                onClick={saveNote}
                disabled={saving || !hasUnsavedChanges}
                variant="default"
                className="group"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg shadow-md animate-slide-in-bottom">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-destructive rounded-full"></div>
              <span>{error}</span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile View Mode Toggle */}
      <div className="md:hidden max-w-7xl mx-auto px-4 py-3 border-b border-border">
        <div className="flex items-center justify-center space-x-1 bg-muted/30 rounded-lg p-1 w-fit mx-auto">
          <Button
            variant={viewMode === "preview" ? "default" : "ghost"}
            onClick={() => setViewMode("preview")}
            size="sm"
            className="smooth-hover"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            variant={viewMode === "edit" ? "default" : "ghost"}
            onClick={() => setViewMode("edit")}
            size="sm"
            className="smooth-hover"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant={viewMode === "split" ? "default" : "ghost"}
            onClick={() => setViewMode("split")}
            size="sm"
            className="smooth-hover"
          >
            <Split className="w-4 h-4 mr-2" />
            Split
          </Button>
        </div>
      </div>

      {/* Editor & Preview Area */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 flex-grow">
        <div
          className={`px-4 py-6 sm:px-0 ${
            viewMode === "split" ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : ""
          }`}
        >
          {/* Editor Column */}
          {(viewMode === "edit" || viewMode === "split") && (
            <Card
              className={`card-hover glass-effect animate-slide-in-left ${
                viewMode === "edit" ? "lg:col-span-2" : ""
              }`}
            >
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <Edit3 className="w-5 h-5 text-primary" />
                  <span>Editor</span>
                  <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative">
                  <CodeMirror
                    value={content}
                    onChange={handleContentChange}
                    extensions={[
                      markdownExtension && markdownExtension(),
                      EditorView.lineWrapping,
                    ].filter(Boolean)}
                    theme={resolvedTheme === "dark" ? "dark" : "light"}
                    placeholder="Start writing your note in Markdown..."
                    className="min-h-[calc(100vh-300px)]"
                    height="calc(100vh - 300px)"
                    ref={editorRef}
                  />
                  {/* Floating word count for editor */}
                  <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm border border-border rounded-lg px-3 py-1 text-xs text-muted-foreground">
                    {wordCount} words • {content.length} chars
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview Column */}
          {(viewMode === "preview" || viewMode === "split") && (
            <Card
              className={`card-hover glass-effect animate-slide-in-right ${
                viewMode === "preview" ? "lg:col-span-2" : ""
              }`}
            >
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-primary" />
                  <span>Preview</span>
                </CardTitle>
              </CardHeader>
              <CardContent
                ref={previewRef}
                className="overflow-y-auto h-[calc(100vh-300px)] relative"
              >
                <div className="prose max-w-none dark:prose-invert">
                  {content ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeSanitize, rehypeHighlight]}
                      components={{
                        code({
                          node: _node,
                          className,
                          children,
                          ...props
                        }: React.ComponentPropsWithoutRef<"code"> & {
                          node?: unknown;
                        }) {
                          const match = /language-(\w+)/.exec(className || "");
                          return match?.[1] === "mermaid" ? (
                            <div>Mermaid diagrams temporarily disabled</div>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  ) : (
                    <div className="text-center py-16 text-muted-foreground">
                      <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">
                        No content to preview
                      </h3>
                      <p className="text-sm">
                        Start writing in the editor to see your content here.
                      </p>
                    </div>
                  )}
                </div>
                {/* Floating indicator for preview */}
                {content && (
                  <div className="absolute top-4 right-4 bg-primary/10 border border-primary/20 rounded-lg px-3 py-1 text-xs text-primary">
                    Live Preview
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
