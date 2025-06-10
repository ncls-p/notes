import { indexNote } from "@/lib/ai/rag";
import { getAuthenticatedUser } from "@/lib/auth/serverAuth";
import prisma from "@/lib/db";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.info({ userId: user.id }, "Starting to index existing notes");

    // Get all notes for the user that have content
    const notes = await prisma.note.findMany({
      where: {
        ownerId: user.id,
        contentMarkdown: {
          not: null,
        },
      },
      select: {
        id: true,
        title: true,
        contentMarkdown: true,
      },
    });

    logger.info(
      { userId: user.id, noteCount: notes.length },
      "Found notes to index",
    );

    const results = {
      total: notes.length,
      indexed: 0,
      skipped: 0,
      errors: 0,
      details: [] as Array<{
        noteId: string;
        title: string;
        status: "indexed" | "skipped" | "error";
        error?: string;
      }>,
    };

    // Index each note
    for (const note of notes) {
      try {
        if (!note.contentMarkdown || note.contentMarkdown.trim().length === 0) {
          results.skipped++;
          results.details.push({
            noteId: note.id,
            title: note.title,
            status: "skipped",
          });
          continue;
        }

        await indexNote(user.id, note.id, note.contentMarkdown);
        results.indexed++;
        results.details.push({
          noteId: note.id,
          title: note.title,
          status: "indexed",
        });

        logger.debug(
          { userId: user.id, noteId: note.id, title: note.title },
          "Note indexed successfully",
        );
      } catch (error) {
        results.errors++;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        results.details.push({
          noteId: note.id,
          title: note.title,
          status: "error",
          error: errorMessage,
        });

        logger.error(
          { userId: user.id, noteId: note.id, title: note.title, error },
          "Failed to index note",
        );
      }
    }

    logger.info(
      {
        userId: user.id,
        total: results.total,
        indexed: results.indexed,
        skipped: results.skipped,
        errors: results.errors,
      },
      "Completed indexing existing notes",
    );

    return NextResponse.json({
      message: "Indexing completed",
      results,
    });
  } catch (error) {
    logger.error({ error }, "Error in bulk note indexing");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
