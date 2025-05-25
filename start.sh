#!/bin/bash
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting Next.js application..."
npm start