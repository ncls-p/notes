import { notFound } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { Metadata, ResolvingMetadata } from 'next';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Metadata for better SEO and social sharing
type Props = {
  params: { token: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Fetch note data
  const prisma = new PrismaClient();
  
  try {
    const note = await prisma.note.findUnique({
      where: {
        public_share_token: params.token,
        is_public: true
      },
      select: {
        title: true,
        content_markdown: true
      }
    });

    if (!note) {
      return {
        title: 'Note not found',
        description: 'The requested note does not exist or is not public.'
      };
    }

    // Generate a description from the first few characters of the content
    const description = note.content_markdown
      ? note.content_markdown.slice(0, 150) + (note.content_markdown.length > 150 ? '...' : '')
      : 'No content';

    return {
      title: `${note.title} | Shared Note`,
      description
    };
  } catch (error) {
    console.error('Error fetching note metadata:', error);
    return {
      title: 'Error',
      description: 'Could not load note information'
    };
  }
}

export default async function PublicNotePage({ params }: Props) {
  const { token } = params;
  const prisma = new PrismaClient();
  
  try {
    // Fetch the note with the given public share token
    const note = await prisma.note.findUnique({
      where: {
        public_share_token: token,
        is_public: true
      },
      select: {
        id: true,
        title: true,
        content_markdown: true,
        created_at: true,
        updated_at: true,
        owner: {
          select: {
            email: true
          }
        }
      }
    });
    
    if (!note) {
      return notFound();
    }
    
    return (
      <div className="container mx-auto py-6 max-w-3xl">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{note.title}</CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="prose max-w-none dark:prose-invert">
              {note.content_markdown ? (
                <div dangerouslySetInnerHTML={{ __html: note.content_markdown }} />
              ) : (
                <p className="text-muted-foreground">No content</p>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="text-sm text-muted-foreground flex justify-between">
            <div>
              Shared by {note.owner.email}
            </div>
            <div>
              Last updated: {new Date(note.updated_at).toLocaleString()}
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  } catch (error) {
    console.error('Error fetching public note:', error);
    return (
      <div className="container mx-auto py-6 text-center">
        <h1 className="text-2xl font-bold">Error</h1>
        <p className="text-muted-foreground">Could not load the requested note.</p>
      </div>
    );
  }
}