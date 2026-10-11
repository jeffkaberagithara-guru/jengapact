import { toNextJsHandler } from "better-auth/next-js";
import type { NextRequest } from "next/server";
import { getAuth } from "@/modules/auth/auth";

/**
 * Route handlers are wired lazily so that `next build` can collect this route's
 * configuration without `AUTH_SECRET`/`DATABASE_URL` being present, and without
 * constructing the better-auth instance until a request actually arrives.
 */
type Handlers = ReturnType<typeof toNextJsHandler>;

let handlers: Handlers | null = null;

function getHandlers(): Handlers {
  return handlers ?? (handlers = toNextJsHandler(getAuth()));
}

export async function GET(request: NextRequest) {
  return getHandlers().GET(request);
}

export async function POST(request: NextRequest) {
  return getHandlers().POST(request);
}
