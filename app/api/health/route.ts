import { NextResponse } from "next/server";
import { apiLogger, logError, logPerformance } from "@/lib/logger";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  const startTime = Date.now();
  const requestId = request.headers.get("x-request-id") || "unknown";

  const logger = apiLogger.child({
    requestId,
    operation: "health_check",
  });

  logger.debug("Health check started");

  try {
    // Check database connectivity
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbDuration = Date.now() - dbStartTime;

    // Check environment variables
    const requiredEnvVars = [
      "JWT_SECRET",
      "REFRESH_TOKEN_SECRET",
      "DATABASE_URL",
    ];
    const missingEnvVars = requiredEnvVars.filter(
      (envVar) => !process.env[envVar],
    );

    const status = {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "notes-app",
      version: process.env.npm_package_version || "0.1.0",
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      database: {
        status: "connected",
        latency: dbDuration,
      },
      configuration: {
        status: missingEnvVars.length === 0 ? "ok" : "warning",
        missingEnvVars: missingEnvVars.length > 0 ? missingEnvVars : undefined,
      },
    };

    const totalDuration = Date.now() - startTime;

    logger.info(
      {
        dbLatency: dbDuration,
        totalDuration,
        missingEnvVars: missingEnvVars.length > 0 ? missingEnvVars : undefined,
      },
      "Health check completed successfully",
    );

    if (missingEnvVars.length > 0) {
      logger.warn({ missingEnvVars }, "Missing required environment variables");
    }

    logPerformance(logger, "health_check", startTime, {
      dbLatency: dbDuration,
      configStatus: status.configuration.status,
    });

    return NextResponse.json(status);
  } catch (error) {
    const errorStatus = {
      status: "error",
      timestamp: new Date().toISOString(),
      service: "notes-app",
      version: process.env.npm_package_version || "0.1.0",
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      database: {
        status: "disconnected",
        error:
          error instanceof Error ? error.message : "Unknown database error",
      },
      error: error instanceof Error ? error.message : "Unknown error",
    };

    logError(logger, error, {
      requestId,
      operation: "health_check",
      duration: Date.now() - startTime,
    });

    return NextResponse.json(errorStatus, { status: 503 });
  }
}
