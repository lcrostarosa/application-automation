import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface HealthCheck {
  status: "healthy" | "unhealthy";
  latencyMs?: number;
  error?: string;
}

interface HealthResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  checks: {
    database: HealthCheck;
  };
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: "healthy",
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function GET() {
  const database = await checkDatabase();

  const checks = { database };
  const allHealthy = Object.values(checks).every((c) => c.status === "healthy");

  const response: HealthResponse = {
    status: allHealthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    checks,
  };

  return NextResponse.json(response, { status: allHealthy ? 200 : 503 });
}
