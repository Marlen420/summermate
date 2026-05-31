import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, success: true }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json(
    { error: message, details, success: false },
    { status: 400 }
  );
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json(
    { error: message, success: false },
    { status: 401 }
  );
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json(
    { error: message, success: false },
    { status: 403 }
  );
}

export function notFound(message = "Not found") {
  return NextResponse.json(
    { error: message, success: false },
    { status: 404 }
  );
}

export function conflict(message: string) {
  return NextResponse.json(
    { error: message, success: false },
    { status: 409 }
  );
}

export function tooManyRequests() {
  return NextResponse.json(
    { error: "Too many requests. Please slow down.", success: false },
    { status: 429 }
  );
}

export function internalError(message = "Internal server error") {
  return NextResponse.json(
    { error: message, success: false },
    { status: 500 }
  );
}

export function handleZodError(error: ZodError) {
  return badRequest("Validation failed", error.flatten().fieldErrors);
}
