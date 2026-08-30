import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { RefereeServiceError } from "@/lib/referee-service-error";

type RefereeApiErrorStatus = 400 | 404 | 408 | 409 | 413 | 415 | 429;

export class RefereeApiInputError extends Error {
  constructor(message: string, readonly status: RefereeApiErrorStatus = 400) {
    super(message);
    this.name = "RefereeApiInputError";
  }
}

export async function readRefereeApiJson(request: Request, invalidMessage: string) {
  try {
    return await request.json() as unknown;
  } catch {
    throw new RefereeApiInputError(invalidMessage);
  }
}

export function refereeApiErrorResponse(
  error: unknown,
  fallback: string,
  options: { includeInternalCode?: boolean } = {},
) {
  if (error instanceof RefereeApiInputError || error instanceof RefereeServiceError) {
    return NextResponse.json(
      {
        error: error.message,
        ...(error instanceof RefereeServiceError && error.warnings.length
          ? { warnings: error.warnings }
          : {}),
      },
      { status: error.status },
    );
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: "请求内容格式不正确。" }, { status: 400 });
  }

  const correlationId = randomUUID();
  const candidateName = error instanceof Error ? error.name : "UnknownError";
  const errorName = /^[A-Za-z][A-Za-z0-9]*$/u.test(candidateName) ? candidateName : "Error";
  console.error("[referee-api] unexpected failure", {
    correlationId,
    errorName,
  });
  return NextResponse.json(
    options.includeInternalCode === false
      ? { error: fallback }
      : { error: fallback, code: "INTERNAL_ERROR", correlationId },
    { status: 500 },
  );
}
