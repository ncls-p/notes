# Use the official Node.js 23 LTS image as the base image
FROM node:23-alpine AS base

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker cache
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Production image
FROM node:23-alpine AS runner

WORKDIR /app

# Copy necessary files from the build stage
COPY --from=base /app/public ./public
COPY --from=base /app/.next ./.next
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json

# Expose the port Next.js runs on
EXPOSE 3000

# Set environment variable for production
ENV NODE_ENV=production

# Command to run the application
CMD ["npm", "start"]
