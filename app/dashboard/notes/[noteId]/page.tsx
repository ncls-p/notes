'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import { SaveIcon, TrashIcon } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content_markdown?: string;
  updated_at: string;
}

interface NoteEditorProps {
  noteId: string;
}

export default function NoteEditor({ noteId }: NoteEditorProps) {
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchNote();
  }, [noteId]);

  const fetchNote = async () => {
    try {
      const response = await fetch(`/api/notes/${noteId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch note');
      }
      const data = await response.json();
      setNote(data);
      setTitle(data.title);
      setContent(data.content_markdown || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load note');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content_markdown: content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save note');
      }

      const updatedNote = await response.json();
      setNote(updatedNote);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
    }
  };

  if (!note) {
    return error ? (
      <Alert variant="destructive">{error}</Alert>
    ) : (
      <div>Loading...</div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Edit Note</h1>
          <div className="space-x-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              <SaveIcon className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            {error}
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Note title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-semibold"
            />
          </div>

          <div>
            <Textarea
              placeholder="Write your note here (Markdown supported)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[400px] font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
