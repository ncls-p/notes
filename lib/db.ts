import { PrismaClient } from '@prisma/client';

// Get database configuration from environment variables
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';
const dbUser = process.env.POSTGRES_USER || 'notesuser';
const dbPassword = process.env.POSTGRES_PASSWORD || 'notespassword';
const dbName = process.env.POSTGRES_DB || 'notesdb';

// Construct the database URL with configurable host
const databaseUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public`;

// Create a global variable to store the Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create or reuse the Prisma client instance
// In development, use a global variable to prevent multiple instances
// In production, create a new instance each time
const prisma = global.__prisma || new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

if (process.env.NODE_ENV === 'development') {
  global.__prisma = prisma;
}

export default prisma;