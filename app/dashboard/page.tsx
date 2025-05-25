'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Folder,
  FileText,
  Plus,
  Trash2,
  Edit,
  LogOut,
  MoreHorizontal,
  Pencil,
  FolderOpen,
  ExternalLink,
  Search,
  Grid,
  List,
} from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Form states
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [editingFolder, setEditingFolder] = useState<{ id: string; name: string } | null>(null);
  const [editFolderName, setEditFolderName] = useState('');

  // Filtered content based on search
  const filteredFolders = folders.filter((folder) =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.contentMarkdown?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

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
        const folderData = (await apiClient(`/api/folders/${currentId}`, {
          method: 'GET',
        })) as Folder;
        path.unshift(folderData);
        currentId = folderData.parentId;
      }
      setBreadcrumbPath(path);
    } catch (err) {
      console.error('Failed to load breadcrumb path:', err);
      setBreadcrumbPath([]);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [foldersResponse, notesResponse] = await Promise.all([
        apiClient(`/api/folders?parentId=${currentFolderId || 'null'}`, { method: 'GET' }),
        apiClient(`/api/notes?folderId=${currentFolderId || 'null'}`, { method: 'GET' }),
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
      <div className='min-h-screen bg-background flex items-center justify-center text-foreground'>
        <div className='flex items-center space-x-2'>
          <div className='animate-pulse w-4 h-4 bg-primary rounded-full'></div>
          <div>Checking authentication...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center text-foreground'>
        <div>Please log in to access this page.</div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/20 text-foreground selection:bg-primary/30 selection:text-primary-foreground'>
      {/* Enhanced Header */}
      <header className='glass-effect border-b border-border shadow-lg sticky top-0 z-50 animate-slide-in-top'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-20'>
            <div className='flex items-center animate-slide-in-left'>
              <svg
                width='32'
                height='32'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
                className='text-primary mr-3 animate-float'
              >
                <path
                  d='M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z'
                  fill='currentColor'
                />
                <path d='M12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z' fill='currentColor' />
                <path
                  d='M8.5 10.5C8.5 9.67 9.17 9 10 9C10.83 9 11.5 9.67 11.5 10.5C11.5 11.33 10.83 12 10 12C9.17 12 8.5 11.33 8.5 10.5Z'
                  fill='currentColor'
                />
              </svg>
              <h1 className='text-3xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent'>
                Noteworthy
              </h1>
            </div>
            <div className='flex items-center space-x-4 animate-slide-in-right'>
              <span className='text-muted-foreground hidden sm:inline'>Welcome, {user.email}</span>
              <ThemeToggle />
              <Button variant='outline' onClick={logout} className='smooth-hover'>
                <LogOut className='w-4 h-4 mr-2 sm:mr-0 md:mr-2' />
                <span className='hidden md:inline'>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto py-8 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0 space-y-8'>
          {/* Breadcrumb */}
          <div className='animate-slide-in-left'>
            <nav className='flex' aria-label='Breadcrumb'>
              <ol className='inline-flex items-center space-x-1 md:space-x-2'>
                <li className='inline-flex items-center'>
                  <button
                    onClick={() => setCurrentFolderId(null)}
                    className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors smooth-hover'
                  >
                    <Folder className='w-4 h-4 mr-1.5' />
                    Root
                  </button>
                </li>
                {breadcrumbPath.map((folder, index) => (
                  <li key={folder.id} className='inline-flex items-center'>
                    <svg
                      className='w-3 h-3 text-muted-foreground mx-1'
                      aria-hidden='true'
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 6 10'
                    >
                      <path
                        stroke='currentColor'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='m1 9 4-4-4-4'
                      />
                    </svg>
                    {index === breadcrumbPath.length - 1 ? (
                      <span className='text-sm font-medium text-muted-foreground ms-1 md:ms-2'>
                        {folder.name}
                      </span>
                    ) : (
                      <button
                        onClick={() => setCurrentFolderId(folder.id)}
                        className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors smooth-hover ms-1 md:ms-2'
                      >
                        {folder.name}
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          {/* Search and Controls */}
          <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between animate-slide-in-right'>
            <div className='relative flex-1 max-w-md'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
              <Input
                placeholder='Search notes and folders...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10 smooth-hover'
              />
            </div>
            <div className='flex items-center space-x-2'>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size='icon'
                onClick={() => setViewMode('grid')}
                className='smooth-hover'
              >
                <Grid className='w-4 h-4' />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size='icon'
                onClick={() => setViewMode('list')}
                className='smooth-hover'
              >
                <List className='w-4 h-4' />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className='flex flex-wrap gap-4 animate-fade-in-scale'>
            <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
              <DialogTrigger asChild>
                <Button variant='primary' className='group'>
                  <Plus className='w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-200' />
                  New Folder
                </Button>
              </DialogTrigger>
              <DialogContent className='glass-effect animate-fade-in-scale'>
                <DialogHeader>
                  <DialogTitle>Create New Folder</DialogTitle>
                </DialogHeader>
                <div className='space-y-4 py-4'>
                  <Input
                    placeholder='Folder name'
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && createFolder()}
                    className='smooth-hover'
                  />
                  <div className='flex justify-end space-x-2'>
                    <Button variant='outline' onClick={() => setIsCreateFolderOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createFolder} variant='primary'>
                      Create
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateNoteOpen} onOpenChange={setIsCreateNoteOpen}>
              <DialogTrigger asChild>
                <Button variant='outline' className='group smooth-hover'>
                  <Plus className='w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-200' />
                  New Note
                </Button>
              </DialogTrigger>
              <DialogContent className='glass-effect animate-fade-in-scale'>
                <DialogHeader>
                  <DialogTitle>Create New Note</DialogTitle>
                </DialogHeader>
                <div className='space-y-4 py-4'>
                  <Input
                    placeholder='Note title'
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && createNote()}
                    className='smooth-hover'
                  />
                  <div className='flex justify-end space-x-2'>
                    <Button variant='outline' onClick={() => setIsCreateNoteOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createNote} variant='primary'>
                      Create
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Rename Folder Dialog */}
            <Dialog open={!!editingFolder} onOpenChange={() => cancelRenameFolder()}>
              <DialogContent className='glass-effect animate-fade-in-scale'>
                <DialogHeader>
                  <DialogTitle>Rename Folder</DialogTitle>
                </DialogHeader>
                <div className='space-y-4 py-4'>
                  <Input
                    placeholder='Folder name'
                    value={editFolderName}
                    onChange={(e) => setEditFolderName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && renameFolder()}
                    className='smooth-hover'
                  />
                  <div className='flex justify-end space-x-2'>
                    <Button variant='outline' onClick={cancelRenameFolder}>
                      Cancel
                    </Button>
                    <Button onClick={renameFolder} variant='primary'>
                      Rename
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Error Display */}
          {error && (
            <div className='p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg shadow-md animate-slide-in-bottom'>
              <span className='font-semibold'>Error:</span> {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className='text-center py-12'>
              <div className='space-y-4'>
                <div className='flex justify-center'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                </div>
                <div className='text-muted-foreground'>Loading content...</div>
              </div>
            </div>
          ) : (
            <div
              className={`${
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-3'
              } animate-slide-in-bottom`}
            >
              {/* Folders */}
              {filteredFolders.map((folder, index) => (
                <ContextMenu key={folder.id}>
                  <ContextMenuTrigger>
                    <Card
                      className={`card-hover glass-effect group cursor-pointer animate-slide-in-bottom ${
                        viewMode === 'list' ? 'flex items-center p-4' : ''
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {viewMode === 'grid' ? (
                        <>
                          <CardHeader
                            className='pb-3 flex flex-row items-center justify-between space-y-0'
                            onClick={() => setCurrentFolderId(folder.id)}
                          >
                            <div className='flex items-center space-x-3 flex-grow min-w-0'>
                              <div className='p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg group-hover:scale-110 transition-transform duration-300'>
                                <Folder className='w-5 h-5 text-white' />
                              </div>
                              <CardTitle
                                className='text-lg font-semibold truncate group-hover:text-primary transition-colors'
                                title={folder.name}
                              >
                                {folder.name}
                              </CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent onClick={() => setCurrentFolderId(folder.id)}>
                            <p className='text-sm text-muted-foreground mb-2'>
                              {folder.childrenCount} folders, {folder.notesCount} notes
                            </p>
                            <p className='text-xs text-muted-foreground'>
                              Updated: {new Date(folder.updatedAt).toLocaleDateString()}
                            </p>
                          </CardContent>
                        </>
                      ) : (
                        <div
                          className='flex items-center space-x-4 flex-grow'
                          onClick={() => setCurrentFolderId(folder.id)}
                        >
                          <div className='p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg group-hover:scale-110 transition-transform duration-300'>
                            <Folder className='w-5 h-5 text-white' />
                          </div>
                          <div className='flex-grow'>
                            <h3 className='font-semibold group-hover:text-primary transition-colors'>
                              {folder.name}
                            </h3>
                            <p className='text-sm text-muted-foreground'>
                              {folder.childrenCount} folders, {folder.notesCount} notes
                            </p>
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            {new Date(folder.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </Card>
                  </ContextMenuTrigger>
                  <ContextMenuContent className='glass-effect'>
                    <ContextMenuItem
                      onClick={() => setCurrentFolderId(folder.id)}
                      className='smooth-hover'
                    >
                      <FolderOpen className='mr-2 h-4 w-4' />
                      Open
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => startRenameFolder(folder)}
                      className='smooth-hover'
                    >
                      <Pencil className='mr-2 h-4 w-4' />
                      Rename
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onClick={() => deleteFolder(folder.id)}
                      className='text-destructive hover:bg-destructive/10 smooth-hover'
                    >
                      <Trash2 className='mr-2 h-4 w-4' />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}

              {/* Notes */}
              {filteredNotes.map((note, index) => (
                <ContextMenu key={note.id}>
                  <ContextMenuTrigger>
                    <Card
                      className={`card-hover glass-effect group cursor-pointer animate-slide-in-bottom ${
                        viewMode === 'list' ? 'flex items-center p-4' : ''
                      }`}
                      style={{ animationDelay: `${(filteredFolders.length + index) * 50}ms` }}
                    >
                      {viewMode === 'grid' ? (
                        <>
                          <CardHeader
                            className='pb-3 flex flex-row items-center justify-between space-y-0'
                            onClick={() => (window.location.href = `/notes/${note.id}`)}
                          >
                            <div className='flex items-center space-x-3 flex-grow min-w-0'>
                              <div className='p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg group-hover:scale-110 transition-transform duration-300'>
                                <FileText className='w-5 h-5 text-white' />
                              </div>
                              <CardTitle
                                className='text-lg font-semibold truncate group-hover:text-primary transition-colors'
                                title={note.title}
                              >
                                {note.title}
                              </CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent onClick={() => (window.location.href = `/notes/${note.id}`)}>
                            <p className='text-sm text-muted-foreground truncate h-10 leading-5 mb-2'>
                              {note.contentMarkdown || <span className='italic'>No content</span>}
                            </p>
                            <p className='text-xs text-muted-foreground'>
                              Updated: {new Date(note.updatedAt).toLocaleDateString()}
                            </p>
                          </CardContent>
                        </>
                      ) : (
                        <div
                          className='flex items-center space-x-4 flex-grow'
                          onClick={() => (window.location.href = `/notes/${note.id}`)}
                        >
                          <div className='p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg group-hover:scale-110 transition-transform duration-300'>
                            <FileText className='w-5 h-5 text-white' />
                          </div>
                          <div className='flex-grow'>
                            <h3 className='font-semibold group-hover:text-primary transition-colors'>
                              {note.title}
                            </h3>
                            <p className='text-sm text-muted-foreground truncate'>
                              {note.contentMarkdown || 'No content'}
                            </p>
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            {new Date(note.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </Card>
                  </ContextMenuTrigger>
                  <ContextMenuContent className='glass-effect'>
                    <ContextMenuItem
                      onClick={() => (window.location.href = `/notes/${note.id}`)}
                      className='smooth-hover'
                    >
                      <ExternalLink className='mr-2 h-4 w-4' />
                      Edit / View
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onClick={() => deleteNote(note.id)}
                      className='text-destructive hover:bg-destructive/10 smooth-hover'
                    >
                      <Trash2 className='mr-2 h-4 w-4' />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}

              {/* Empty State */}
              {filteredFolders.length === 0 && filteredNotes.length === 0 && !loading && (
                <div className='col-span-full text-center py-16 animate-fade-in-scale'>
                  <div className='space-y-6'>
                    <div className='relative'>
                      <Folder className='w-20 h-20 mx-auto text-muted-foreground/50 animate-float' />
                      <div className='absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center'>
                        <Plus className='w-4 h-4 text-white' />
                      </div>
                    </div>
                    <div className='space-y-3'>
                      <h3 className='text-2xl font-semibold'>
                        {searchQuery ? 'No results found' : 'This folder is empty'}
                      </h3>
                      <p className='text-muted-foreground max-w-md mx-auto'>
                        {searchQuery
                          ? `No folders or notes match "${searchQuery}". Try a different search term.`
                          : 'Create your first folder or note to get started on your knowledge journey.'}
                      </p>
                    </div>
                    {!searchQuery && (
                      <div className='flex justify-center space-x-4 pt-4'>
                        <Button onClick={() => setIsCreateFolderOpen(true)} variant='primary'>
                          <Plus className='w-4 h-4 mr-2' />
                          Create Folder
                        </Button>
                        <Button onClick={() => setIsCreateNoteOpen(true)} variant='outline'>
                          <Plus className='w-4 h-4 mr-2' />
                          Create Note
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
