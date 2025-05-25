'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Folder, FileText, Plus, Trash2, Edit, LogOut } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { ThemeToggle } from '@/components/ThemeToggle';

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
  const { user, logout, isLoading: authLoading } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbPath, setBreadcrumbPath] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [editingFolder, setEditingFolder] = useState<{ id: string; name: string } | null>(null);
  const [editFolderName, setEditFolderName] = useState('');

  useEffect(() => {
    if (user) {
      loadData();
      if (currentFolderId) {
        loadBreadcrumbPath(currentFolderId);
      } else {
        setBreadcrumbPath([]);
      }
    }
  }, [user, currentFolderId]);

  const loadBreadcrumbPath = async (folderId: string) => {
    const path: Folder[] = [];
    let currentId: string | null = folderId;
    try {
      while (currentId) {
        const folderData = await apiClient(`/api/folders/${currentId}`, { method: 'GET' }) as Folder;
        path.unshift(folderData); // Add to the beginning of the path
        currentId = folderData.parentId;
      }
      setBreadcrumbPath(path);
    } catch (err) {
      console.error('Failed to load breadcrumb path:', err);
      // Potentially set an error state for breadcrumbs or clear it
      setBreadcrumbPath([]); // Clear path on error
    }
  };

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

  const startRenameFolder = (folder: Folder) => {
    setEditingFolder({ id: folder.id, name: folder.name });
    setEditFolderName(folder.name);
  };

  const cancelRenameFolder = () => {
    setEditingFolder(null);
    setEditFolderName('');
  };

  const renameFolder = async () => {
    if (!editingFolder || !editFolderName.trim()) return;

    try {
      await apiClient(`/api/folders/${editingFolder.id}`, {
        method: 'PUT',
        body: {
          name: editFolderName,
        },
      });

      setEditingFolder(null);
      setEditFolderName('');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to rename folder');
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

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-white selection:bg-primary/30 selection:text-primary-foreground">
      {/* Header */}
      <header className="bg-slate-100 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 shadow-lg backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary mr-3">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
                <path d="M12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z" fill="currentColor"/>
                <path d="M8.5 10.5C8.5 9.67 9.17 9 10 9C10.83 9 11.5 9.67 11.5 10.5C11.5 11.33 10.83 12 10 12C9.17 12 8.5 11.33 8.5 10.5Z" fill="currentColor"/>
              </svg>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 dark:from-purple-400 dark:via-pink-500 dark:to-red-500">
                Noteworthy
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-slate-700 dark:text-slate-300 hidden sm:inline">Welcome, {user.email}</span>
              <ThemeToggle />
              <Button
                variant="outline"
                onClick={logout}
                className="border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-400"
              >
                <LogOut className="w-4 h-4 mr-2 sm:mr-0 md:mr-2" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Breadcrumb */}
          <div className="mb-8">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-2">
                <li className="inline-flex items-center">
                  <button
                    onClick={() => setCurrentFolderId(null)}
                    className="inline-flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors"
                  >
                    <Folder className="w-4 h-4 mr-1.5" />
                    Root
                  </button>
                </li>
                {breadcrumbPath.map((folder, index) => (
                  <li key={folder.id} className="inline-flex items-center">
                    <svg className="w-3 h-3 text-slate-400 dark:text-slate-500 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                    </svg>
                    {index === breadcrumbPath.length - 1 ? (
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 ms-1 md:ms-2">
                        {folder.name}
                      </span>
                    ) : (
                      <button
                        onClick={() => setCurrentFolderId(folder.id)}
                        className="inline-flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors ms-1 md:ms-2"
                      >
                        {folder.name}
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          {/* Actions */}
          <div className="flex space-x-4 mb-8">
            <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-150 ease-in-out">
                  <Plus className="w-4 h-4 mr-2" />
                  New Folder
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                <DialogHeader>
                  <DialogTitle className="text-slate-900 dark:text-slate-100">Create New Folder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input
                    placeholder="Folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && createFolder()}
                    className="bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-primary"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)} className="border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white">
                      Cancel
                    </Button>
                    <Button onClick={createFolder} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateNoteOpen} onOpenChange={setIsCreateNoteOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-400 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-150 ease-in-out">
                  <Plus className="w-4 h-4 mr-2" />
                  New Note
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                <DialogHeader>
                  <DialogTitle className="text-slate-900 dark:text-slate-100">Create New Note</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input
                    placeholder="Note title"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && createNote()}
                    className="bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-primary"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateNoteOpen(false)} className="border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white">
                      Cancel
                    </Button>
                    <Button onClick={createNote} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Rename Folder Dialog */}
            <Dialog open={!!editingFolder} onOpenChange={() => cancelRenameFolder()}>
              <DialogContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                <DialogHeader>
                  <DialogTitle className="text-slate-900 dark:text-slate-100">Rename Folder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input
                    placeholder="Folder name"
                    value={editFolderName}
                    onChange={(e) => setEditFolderName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && renameFolder()}
                    className="bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:ring-primary"
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={cancelRenameFolder} className="border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white">
                      Cancel
                    </Button>
                    <Button onClick={renameFolder} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">Rename</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg shadow-md">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">Loading content...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Folders */}
              {folders.map((folder) => (
                <Card key={folder.id} className="bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 shadow-lg dark:backdrop-blur-sm transition-all hover:shadow-xl dark:hover:shadow-slate-600/50 hover:border-slate-300 dark:hover:border-slate-500 cursor-pointer">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <div
                      className="flex items-center space-x-3 flex-grow min-w-0"
                      onClick={() => setCurrentFolderId(folder.id)}
                    >
                      <Folder className="w-6 h-6 text-primary shrink-0" />
                      <CardTitle className="text-lg font-semibold truncate" title={folder.name}>{folder.name}</CardTitle>
                    </div>
                    <div className="flex space-x-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700/50 w-8 h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          startRenameFolder(folder);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                         <span className="sr-only">Rename Folder</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 w-8 h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFolder(folder.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">Delete Folder</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent onClick={() => setCurrentFolderId(folder.id)}>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {folder.childrenCount} folders, {folder.notesCount} notes
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Updated: {new Date(folder.updatedAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}

              {/* Notes */}
              {notes.map((note) => (
                <Card key={note.id} className="bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 shadow-lg dark:backdrop-blur-sm transition-all hover:shadow-xl dark:hover:shadow-slate-600/50 hover:border-slate-300 dark:hover:border-slate-500">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                     <div className="flex items-center space-x-3 flex-grow min-w-0">
                        <FileText className="w-6 h-6 text-primary shrink-0" />
                        <CardTitle className="text-lg font-semibold truncate" title={note.title}>{note.title}</CardTitle>
                    </div>
                    <div className="flex space-x-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700/50 w-8 h-8"
                        onClick={() => window.location.href = `/notes/${note.id}`}
                      >
                        <Edit className="w-4 h-4" />
                        <span className="sr-only">Edit Note</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 w-8 h-8"
                        onClick={() => deleteNote(note.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">Delete Note</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent onClick={() => window.location.href = `/notes/${note.id}`} className="cursor-pointer">
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate h-10 leading-5">
                      {note.contentMarkdown || <span className="italic">No content</span>}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                      Updated: {new Date(note.updatedAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}

              {/* Empty State */}
              {folders.length === 0 && notes.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <Folder className="w-16 h-16 mx-auto text-slate-500 dark:text-slate-500 mb-6" />
                  <h3 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-3">This folder is empty</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">Create your first folder or note to get started.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}