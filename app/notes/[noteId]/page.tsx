'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Eye, Edit3, Split } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';

// Dynamic import for CodeMirror to avoid SSR issues
const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), { ssr: false });
import { EditorView } from '@codemirror/view'; // Needed for scroll event

interface Note {
  id: string;
  title: string;
  contentMarkdown: string | null;
  folderId: string | null;
  folder?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export default function NoteEditor() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { theme: appTheme } = useTheme();
  const noteId = params.noteId as string;

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'edit' | 'split'>('preview'); // Default to preview
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [markdownExtension, setMarkdownExtension] = useState<any>(null);
  const editorRef = useRef<any>(null); // Ref for CodeMirror editor view
  const previewRef = useRef<HTMLDivElement>(null); // Ref for preview pane
  const isSyncingScroll = useRef(false); // To prevent scroll event loops

  // Load markdown extension dynamically
  useEffect(() => {
    const loadMarkdown = async () => {
      try {
        const { markdown } = await import('@codemirror/lang-markdown');
        setMarkdownExtension(() => markdown);
      } catch (error) {
        console.warn('Failed to load markdown extension:', error);
      }
    };
    loadMarkdown();
  }, []);

  useEffect(() => {
    if (user && noteId) {
      loadNote();
    }
  }, [user, noteId]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);


  // Synchronized scrolling effect
  useEffect(() => {
    const editorEl = editorRef.current?.view?.scrollDOM;
    const previewEl = previewRef.current;

    if (viewMode !== 'split' || !editorEl || !previewEl) {
      return; // Only apply if in split view and refs are available
    }

    const syncScrollEditorToPreview = () => {
      if (isSyncingScroll.current) return;
      isSyncingScroll.current = true;
      const editorScrollPercentage = editorEl.scrollTop / (editorEl.scrollHeight - editorEl.clientHeight);
      previewEl.scrollTop = editorScrollPercentage * (previewEl.scrollHeight - previewEl.clientHeight);
      requestAnimationFrame(() => { isSyncingScroll.current = false; });
    };

    const syncScrollPreviewToEditor = () => {
      if (isSyncingScroll.current) return;
      isSyncingScroll.current = true;
      const previewScrollPercentage = previewEl.scrollTop / (previewEl.scrollHeight - previewEl.clientHeight);
      editorEl.scrollTop = previewScrollPercentage * (editorEl.scrollHeight - editorEl.clientHeight);
      requestAnimationFrame(() => { isSyncingScroll.current = false; });
    };

    editorEl.addEventListener('scroll', syncScrollEditorToPreview);
    previewEl.addEventListener('scroll', syncScrollPreviewToEditor);

    return () => {
      editorEl.removeEventListener('scroll', syncScrollEditorToPreview);
      previewEl.removeEventListener('scroll', syncScrollPreviewToEditor);
    };
  }, [viewMode, content]); // Re-attach if viewMode or content (affecting scrollHeight) changes

  const loadNote = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient(`/api/notes/${noteId}`, { method: 'GET' });
      const noteData = response as Note;

      setNote(noteData);
      setTitle(noteData.title);
      setContent(noteData.contentMarkdown || '');
      setHasUnsavedChanges(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load note');
    } finally {
      setLoading(false);
    }
  };

  const saveNote = async () => {
    if (!note) return;

    try {
      setSaving(true);
      setError(null);

      await apiClient(`/api/notes/${noteId}`, {
        method: 'PUT',
        body: {
          title: title.trim() || 'Untitled',
          contentMarkdown: content,
        },
      });

      setHasUnsavedChanges(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

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
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.back();
      }
    } else {
      router.back();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <div>Checking authentication...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <div>Please log in to access this page.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <div>Loading note...</div>
      </div>
    );
  }

  if (error && !note) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={goBack} variant="outline">Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground">
      {/* Header */}
      <header className="bg-card border-b border-border shadow sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={goBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center">
                <Input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="text-xl font-semibold border-none shadow-none focus:ring-0 bg-transparent placeholder:text-muted-foreground"
                  placeholder="Note title..."
                />
                {hasUnsavedChanges && (
                  <span className="ml-2 text-sm text-orange-500 dark:text-orange-400">• Unsaved</span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'preview' ? 'default' : 'outline'}
                onClick={() => setViewMode('preview')}
                size="icon"
                title="Preview"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'edit' ? 'default' : 'outline'}
                onClick={() => setViewMode('edit')}
                size="icon"
                title="Edit"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'split' ? 'default' : 'outline'}
                onClick={() => setViewMode('split')}
                size="icon"
                title="Split View"
              >
                <Split className="w-4 h-4" />
              </Button>
              <Button onClick={saveNote} disabled={saving || !hasUnsavedChanges}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Editor & Preview Area */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 flex-grow">
        <div
          className={`px-4 py-6 sm:px-0 ${
            viewMode === 'split' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : ''
          }`}
        >
          {/* Editor Column */}
          {(viewMode === 'edit' || viewMode === 'split') && (
            <Card className={viewMode === 'edit' ? 'md:col-span-2' : ''}>
              <CardHeader>
                <CardTitle>Edit</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <CodeMirror
                  value={content}
                  onChange={handleContentChange}
                  extensions={[
                    markdownExtension && markdownExtension(),
                    EditorView.lineWrapping, // Optional: ensure line wrapping
                  ].filter(Boolean)}
                  theme={appTheme === 'dark' ? 'dark' : 'light'}
                  placeholder="Start writing your note in Markdown..."
                  className="min-h-[calc(100vh-220px)]"
                  height="calc(100vh - 220px)"
                  ref={editorRef} // Assign ref to CodeMirror
                />
              </CardContent>
            </Card>
          )}

          {/* Preview Column */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <Card className={viewMode === 'preview' ? 'md:col-span-2' : ''}>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent ref={previewRef} className="overflow-y-auto h-[calc(100vh-220px)]">
                <div className="prose max-w-none dark:prose-invert">
                  {content ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeSanitize, rehypeHighlight]}
                    >
                      {content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-gray-500">No content to preview</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}