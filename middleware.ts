import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const allowedOrigins = [
  'https://helloweekends.in',
  'http://localhost:3000',
  'https://localhost:3000',
];

export function middleware(request: NextRequest) {
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
    return new NextResponse(null, { status: 200, headers: preflightHeaders });
  }

  // Retrieve the current response for non-OPTIONS requests
  const response = NextResponse.next();

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
