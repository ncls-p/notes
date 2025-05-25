'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Eye, Edit3 } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';

// Dynamic import for CodeMirror to avoid SSR issues
const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), { ssr: false });

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
  const { user } = useAuth();
  const noteId = params.noteId as string;

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [markdownExtension, setMarkdownExtension] = useState<any>(null);

  // Load markdown extension dynamically
  useEffect(() => {
    const loadMarkdown = async () => {
      try {
        const { markdown } = await import('@codemirror/lang-markdown');
        setMarkdownExtension(markdown);
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

  if (!user) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading note...</div>
      </div>
    );
  }

  if (error && !note) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={goBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={goBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center">
                <Input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="text-xl font-semibold border-none shadow-none focus:ring-0"
                  placeholder="Note title..."
                />
                {hasUnsavedChanges && (
                  <span className="ml-2 text-sm text-orange-600">• Unsaved</span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? (
                  <>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </>
                )}
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
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        </div>
      )}

      {/* Editor */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {showPreview ? (
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
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
          ) : (
            <Card>
              <CardContent className="p-0">
                <CodeMirror
                  value={content}
                  onChange={handleContentChange}
                  extensions={[markdownExtension && markdownExtension()].filter(Boolean)}
                  theme="light"
                  placeholder="Start writing your note in Markdown..."
                  className="min-h-[500px]"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}