'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Folder, FileText, Plus, Trash2, Edit } from 'lucide-react';
import apiClient from '@/lib/apiClient';

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  parent?: { id: string; name: string } | null;
  childrenCount: number;
  notesCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Note {
  id: string;
  title: string;
  contentMarkdown: string | null;
  folderId: string | null;
  folder?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, currentFolderId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load folders and notes for current folder
      const [foldersResponse, notesResponse] = await Promise.all([
        apiClient(`/api/folders?parentId=${currentFolderId || 'null'}`, { method: 'GET' }),
        apiClient(`/api/notes?folderId=${currentFolderId || 'null'}`, { method: 'GET' })
      ]);

      setFolders(foldersResponse as Folder[]);
      setNotes(notesResponse as Note[]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await apiClient('/api/folders', {
        method: 'POST',
        body: {
          name: newFolderName,
          parentId: currentFolderId,
        },
      });

      setNewFolderName('');
      setIsCreateFolderOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create folder');
    }
  };

  const createNote = async () => {
    if (!newNoteTitle.trim()) return;

    try {
      await apiClient('/api/notes', {
        method: 'POST',
        body: {
          title: newNoteTitle,
          contentMarkdown: '',
          folderId: currentFolderId,
        },
      });

      setNewNoteTitle('');
      setIsCreateNoteOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create note');
    }
  };

  const deleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder?')) return;

    try {
      await apiClient(`/api/folders/${folderId}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete folder');
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await apiClient(`/api/notes/${noteId}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete note');
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Notes Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.email}</span>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                  <button
                    onClick={() => setCurrentFolderId(null)}
                    className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
                  >
                    Root
                  </button>
                </li>
                {/* TODO: Add breadcrumb for nested folders */}
              </ol>
            </nav>
          </div>

          {/* Actions */}
          <div className="flex space-x-4 mb-6">
            <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Folder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Folder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && createFolder()}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createFolder}>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateNoteOpen} onOpenChange={setIsCreateNoteOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  New Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Note</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Note title"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && createNote()}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateNoteOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createNote}>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Folders */}
              {folders.map((folder) => (
                <Card key={folder.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <div
                        className="flex items-center"
                        onClick={() => setCurrentFolderId(folder.id)}
                      >
                        <Folder className="w-5 h-5 mr-2 text-blue-600" />
                        {folder.name}
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFolder(folder.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      {folder.childrenCount} folders, {folder.notesCount} notes
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Updated: {new Date(folder.updatedAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}

              {/* Notes */}
              {notes.map((note) => (
                <Card key={note.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-green-600" />
                        {note.title}
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNote(note.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 truncate">
                      {note.contentMarkdown || 'No content'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Updated: {new Date(note.updatedAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}

              {/* Empty State */}
              {folders.length === 0 && notes.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Folder className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
                  <p className="text-gray-600 mb-4">Create your first folder or note to get started.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}