import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from './requireAuth';

type RouteContext = {
  userId: string;
  params: Record<string, string>;
};

type AuthHandler = (
  req: NextRequest,
  ctx: RouteContext,
) => Promise<NextResponse | Response>;

/**
 * Wraps an API route handler with auth + error handling.
 *
 * - Calls `requireAuth(req)` and passes `userId` to the handler
 * - Resolves dynamic route `params` Promise automatically
 * - Returns 401 for auth errors, 500 for unhandled errors
 * - Logs errors with method + pathname for traceability
 *
 * Usage:
 *   export const GET = authRoute(async (req, { userId, params }) => { ... });
 */
export function authRoute(handler: AuthHandler) {
  return async (
    req: NextRequest,
    routeCtx?: { params: Promise<Record<string, string>> },
  ): Promise<NextResponse | Response> => {
    try {
      const { userId } = requireAuth(req);
      const params = routeCtx?.params ? await routeCtx.params : {};
      return await handler(req, { userId, params });
    } catch (err) {
      if (err instanceof Error && err.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      console.error(`[${req.method} ${req.nextUrl.pathname}]`, err);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}
