#!/bin/bash
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Starting the application..."
exec "$@"
