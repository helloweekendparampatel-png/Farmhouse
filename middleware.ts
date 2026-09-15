import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const allowedOrigins = [
  'https://helloweekends.in',
  'http://localhost:3000',
  'https://localhost:3000',
];

export function middleware(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { pathname, search } = request.nextUrl;
  const forwardedFor = request.headers.get('x-forwarded-for');
  const clientIp = forwardedFor?.split(',')[0]?.trim() ?? 'unknown';

  // Render collects stdout, so these structured logs are available in the web
  // service's Logs tab. Never include request bodies, cookies, or auth headers.
  console.log(
    JSON.stringify({
      level: 'info',
      event: 'api_request',
      requestId,
      method: request.method,
      path: `${pathname}${search}`,
      clientIp,
      userAgent: request.headers.get('user-agent') ?? 'unknown',
      timestamp: new Date().toISOString(),
    }),
  );

  // Retrieve the HTTP "Origin" header
  const origin = request.headers.get('origin') ?? '';

  // If it's a preflight request, we can short-circuit and just return the headers
  if (request.method === 'OPTIONS') {
    const preflightHeaders = new Headers();
    if (allowedOrigins.includes(origin)) {
      preflightHeaders.set('Access-Control-Allow-Origin', origin);
    }
    preflightHeaders.set('Access-Control-Allow-Credentials', 'true');
    preflightHeaders.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    preflightHeaders.set(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
    );
    preflightHeaders.set('X-Request-Id', requestId);
    return new NextResponse(null, { status: 200, headers: preflightHeaders });
  }

  // Retrieve the current response for non-OPTIONS requests
  const response = NextResponse.next();
  response.headers.set('X-Request-Id', requestId);

  // If the origin is in our allowed list, we add it to the response headers
  if (allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  // Set other CORS headers
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.headers.set(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  );

  return response;
}

// Specify the paths that the middleware should run on
export const config = {
  matcher: '/api/:path*',
};
