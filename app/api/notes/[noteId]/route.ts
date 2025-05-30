import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyJWT } from "@/lib/auth/serverAuth";
import prisma from "@/lib/db";

// Schema for updating a note
const updateNoteSchema = z.object({
  title: z
    .string()
    .min(1, "Note title is required")
    .max(255, "Note title too long")
    .optional(),
  content: z.string().optional(),
  folderId: z.string().optional().nullable(),
});

export async function GET(request: NextRequest, context: any) {
  try {
    const authResult = await verifyJWT(request);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const noteId = context.params.noteId;

    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        ownerId: authResult.userId,
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!note) {
      return NextResponse.json(
        { error: "Note not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      note: {
        id: note.id,
        title: note.title,
        content: note.contentMarkdown,
        folderId: note.folderId,
        folder: note.folderId ? { id: note.folderId, name: note.folder?.name } : null,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: any) {
  try {
    const authResult = await verifyJWT(request);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const noteId = context.params.noteId;

    // Verify note exists and belongs to user
    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        ownerId: authResult.userId,
      },
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: "Note not found or access denied" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateNoteSchema.parse(body);

    // If folderId is being changed, verify the new folder exists and belongs to the user
    if (
      validatedData.folderId !== undefined &&
      validatedData.folderId !== null
    ) {
      const folder = await prisma.folder.findFirst({
        where: {
          id: validatedData.folderId,
          ownerId: authResult.userId,
        },
      });

      if (!folder) {
        return NextResponse.json(
          { error: "Folder not found or access denied" },
          { status: 404 }
        );
      }
    }

    // If title is being changed, check for duplicates in the target folder
    if (validatedData.title) {
      const targetFolderId =
        validatedData.folderId !== undefined
          ? validatedData.folderId
          : existingNote.folderId;

      const duplicateNote = await prisma.note.findFirst({
        where: {
          title: validatedData.title,
          folderId: targetFolderId,
          ownerId: authResult.userId,
          id: { not: noteId }, // Exclude current note
        },
      });

      if (duplicateNote) {
        return NextResponse.json(
          { error: "A note with this title already exists in this location" },
          { status: 409 }
        );
      }
    }

    // Map content to contentMarkdown for database
    const updateData: any = {};
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.content !== undefined) updateData.contentMarkdown = validatedData.content;
    if (validatedData.folderId !== undefined) updateData.folderId = validatedData.folderId;

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: updateData,
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      note: {
        id: updatedNote.id,
        title: updatedNote.title,
        content: updatedNote.contentMarkdown,
        folderId: updatedNote.folderId,
        folder: updatedNote.folder,
        createdAt: updatedNote.createdAt,
        updatedAt: updatedNote.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating note:", error);
    return NextResponse.json(
      { error极: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: any) {
  try {
    const authResult = await verifyJWT(request);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const noteId = context.params.noteId;

    // Verify note exists and belongs to user
    const existingNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        ownerId: authResult.userId,
      },
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: "Note not found or access denied" },
        { status: 404 }
      );
    }

    await prisma.note.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
