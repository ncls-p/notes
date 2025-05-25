# Use the official Node.js 23 LTS image as the base image
FROM node:23-slim AS base

# Install OpenSSL and other required dependencies
RUN apt-get update -y && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker cache
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Generate Prisma client for the container environment
RUN npx prisma generate

# Build the Next.js application
RUN npm run build

# Production image
FROM node:23-slim AS runner

# Install OpenSSL and bash in the production image
RUN apt-get update -y && apt-get install -y openssl bash && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy necessary files from the build stage
COPY --from=base /app/public ./public
COPY --from=base /app/.next ./.next
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh

# Make the entrypoint script executable
RUN chmod +x ./scripts/docker-entrypoint.sh

# Expose the port Next.js runs on
EXPOSE 3000

# Set environment variable for production
ENV NODE_ENV=production

# Set the entrypoint to run migrations before starting the app
ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]

# Command to run the application
CMD ["npm", "start"]
