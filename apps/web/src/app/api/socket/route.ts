import { NextRequest, NextResponse } from "next/server";

// Socket.IO is initialized via custom server (server.ts)
// This route exists to satisfy Next.js App Router routing
export async function GET(_request: NextRequest) {
  return NextResponse.json(
    { message: "Socket.IO endpoint. Use socket client to connect." },
    { status: 426 }
  );
}
