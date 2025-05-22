import { notFound } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Folder, FileText, ExternalLink } from 'lucide-react';

// Metadata for better SEO and social sharing
type Props = {
  params: { token: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Fetch folder data
  const prisma = new PrismaClient();
  
  try {
    const folder = await prisma.folder.findUnique({
      where: {
        public_share_token: params.token,
        is_public: true
      },
      select: {
        name: true,
        owner: {
          select: {
            email: true
          }
        }
      }
    });

    if (!folder) {
      return {
        title: 'Folder not found',
        description: 'The requested folder does not exist or is not public.'
      };
    }

    return {
      title: `${folder.name} | Shared Folder`,
      description: `Shared folder by ${folder.owner.email}`
    };
  } catch (error) {
    console.error('Error fetching folder metadata:', error);
    return {
      title: 'Error',
      description: 'Could not load folder information'
    };
  }
}

export default async function PublicFolderPage({ params }: Props) {
  const { token } = params;
  const prisma = new PrismaClient();
  
  try {
    // First find the folder to get its owner ID
    const folderInfo = await prisma.folder.findUnique({
      where: {
        public_share_token: token,
        is_public: true
      },
      select: {
        id: true,
        owner_id: true
      }
    });
    
    if (!folderInfo) {
      return notFound();
    }
    
    // Then fetch the complete folder data with related content
    const folder = await prisma.folder.findUnique({
      where: {
        id: folderInfo.id
      },
      select: {
        id: true,
        name: true,
        created_at: true,
        updated_at: true,
        owner: {
          select: {
            email: true
          }
        },
        notes: {
          where: {
            OR: [
              { is_public: true },
              { owner_id: folderInfo.owner_id }
            ]
          },
          select: {
            id: true,
            title: true,
            is_public: true,
            public_share_token: true
          }
        },
        sub_folders: {
          where: {
            OR: [
              { is_public: true },
              { owner_id: folderInfo.owner_id }
            ]
          },
          select: {
            id: true,
            name: true,
            is_public: true,
            public_share_token: true
          }
        }
      }
    });
    
    if (!folder) {
      return notFound();
    }
    
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Folder className="h-6 w-6" />
              {folder.name}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {folder.sub_folders.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3">Folders</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {folder.sub_folders.map((subfolder) => (
                    <Card key={subfolder.id} className="hover:bg-accent transition-colors border border-accent/20">
                      {subfolder.is_public && subfolder.public_share_token ? (
                        <Link href={`/public/folders/${subfolder.public_share_token}`} className="block p-3">
                          <div className="flex items-center gap-2">
                            <Folder className="h-4 w-4" />
                            <span>{subfolder.name}</span>
                          </div>
                        </Link>
                      ) : (
                        <div className="p-3 text-muted-foreground flex items-center gap-2">
                          <Folder className="h-4 w-4" />
                          <span>{subfolder.name}</span>
                          <span className="text-xs">(Private)</span>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {folder.notes.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3">Notes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {folder.notes.map((note) => (
                    <Card key={note.id} className="hover:bg-accent transition-colors border border-accent/20">
                      {note.is_public && note.public_share_token ? (
                        <Link href={`/public/notes/${note.public_share_token}`} className="block p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>{note.title}</span>
                            </div>
                            <ExternalLink className="h-3 w-3" />
                          </div>
                        </Link>
                      ) : (
                        <div className="p-3 text-muted-foreground flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>{note.title}</span>
                          <span className="text-xs">(Private)</span>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {folder.notes.length === 0 && folder.sub_folders.length === 0 && (
              <p className="text-center text-muted-foreground py-8">This folder is empty</p>
            )}
          </CardContent>
          
          <CardFooter className="text-sm text-muted-foreground">
            Shared by {folder.owner.email} • Last updated: {new Date(folder.updated_at).toLocaleString()}
          </CardFooter>
        </Card>
      </div>
    );
  } catch (error) {
    console.error('Error fetching public folder:', error);
    return (
      <div className="container mx-auto py-6 text-center">
        <h1 className="text-2xl font-bold">Error</h1>
        <p className="text-muted-foreground">Could not load the requested folder.</p>
      </div>
    );
  }
}