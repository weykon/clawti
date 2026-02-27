export { auth as middleware } from '@/src/lib/auth';

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|login|favicon.ico).*)'],
};
