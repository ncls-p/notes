import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { sign } from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('/api/notes/[noteId]', () => {
  let authToken: string;
  let userId: string;
  let noteId: string;

  beforeEach(async () => {
    // Create test user
    const hashedPassword = await argon2.hash('StrongPassword123!');
    const user = await prisma.user.create({
      data: {
        email: 'testuser@example.com',
        password_hash: hashedPassword
      }
    });
    userId = user.id;

    // Create auth token
    authToken = sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!
    );

    // Create test note
    const note = await prisma.note.create({
      data: {
        title: 'Test Note',
        content_markdown: 'Initial content',
        owner_id: userId
      }
    });
    noteId = note.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.note.deleteMany({
      where: { owner_id: userId }
    });
    await prisma.user.delete({
      where: { id: userId }
    });
  });

  it('should update a note', async () => {
    const res = await fetch(`http://localhost:3001/api/notes/${noteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `auth_token=${authToken}`
      },
      body: JSON.stringify({
        title: 'Updated Title',
        content_markdown: 'Updated content'
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('title', 'Updated Title');
    expect(data).toHaveProperty('content_markdown', 'Updated content');
  });

  it('should prevent updating another user\'s note', async () => {
    // Create another user and their note
    const otherUser = await prisma.user.create({
      data: {
        email: 'other@example.com',
        password_hash: await argon2.hash('OtherPass123!')
      }
    });

    const otherNote = await prisma.note.create({
      data: {
        title: 'Other User\'s Note',
        content_markdown: 'Private content',
        owner_id: otherUser.id
      }
    });

    // Try to update the other user's note
    const res = await fetch(`http://localhost:3001/api/notes/${otherNote.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `auth_token=${authToken}`
      },
      body: JSON.stringify({
        title: 'Trying to update',
        content_markdown: 'Should not work'
      })
    });

    expect(res.status).toBe(404);

    // Clean up
    await prisma.note.delete({ where: { id: otherNote.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
  });

  it('should delete a note', async () => {
    const res = await fetch(`http://localhost:3001/api/notes/${noteId}`, {
      method: 'DELETE',
      headers: {
        Cookie: `auth_token=${authToken}`
      }
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('message', 'Note deleted successfully');

    // Verify note is deleted
    const note = await prisma.note.findUnique({
      where: { id: noteId }
    });
    expect(note).toBeNull();
  });

  it('should fetch a note', async () => {
    const res = await fetch(`http://localhost:3001/api/notes/${noteId}`, {
      headers: {
        Cookie: `auth_token=${authToken}`
      }
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('id', noteId);
    expect(data).toHaveProperty('title', 'Test Note');
    expect(data).toHaveProperty('content_markdown', 'Initial content');
  });
});
