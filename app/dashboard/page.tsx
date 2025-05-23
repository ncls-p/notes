'use client';

import { AuthWrapper } from '@/components/auth/AuthWrapper';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/store';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { PlusIcon } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content_markdown?: string;
  updated_at: string;
}

export default function DashboardPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes');
      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }
      const data = await response.json();
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    }
  };

  const handleCreateNote = async () => {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Untitled Note',
          content_markdown: '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create note');
      }

      const newNote = await response.json();
      setNotes([newNote, ...notes]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
    }
  };

  return (
    <AuthWrapper>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Notes</h1>
          <Button onClick={handleCreateNote}>
            <PlusIcon className="w-4 h-4 mr-2" />
            New Note
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer"
            >
              <h3 className="text-lg font-semibold mb-2">{note.title}</h3>
              <p className="text-sm text-gray-500">
                Last updated: {new Date(note.updated_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>

        {notes.length === 0 && !error && (
          <div className="text-center text-gray-500 mt-8">
            No notes yet. Create your first note!
          </div>
        )}
      </div>
    </AuthWrapper>
  );
}
