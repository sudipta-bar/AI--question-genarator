import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://3.6.165.7';

function targetUrl(request: NextRequest, path: string[]) {
  const url = new URL(request.url);
  const target = new URL(`/api/${path.join('/')}${url.search}`, backendUrl);
  return target.toString();
}

function forwardedHeaders(request: NextRequest) {
  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const authorization = request.headers.get('authorization');
  const cookie = request.headers.get('cookie');

  if (contentType) headers.set('content-type', contentType);
  if (authorization) headers.set('authorization', authorization);
  if (cookie) headers.set('cookie', cookie);

  return headers;
}

function responseHeaders(upstream: Response) {
  const headers = new Headers();

  upstream.headers.forEach((value, key) => {
    if (['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) return;
    headers.set(key, value);
  });

  return headers;
}

async function proxy(request: NextRequest, context: { params: { path: string[] } }) {
  const method = request.method.toUpperCase();
  const hasBody = !['GET', 'HEAD'].includes(method);
  const upstream = await fetch(targetUrl(request, context.params.path), {
    method,
    headers: forwardedHeaders(request),
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: 'no-store',
  });

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders(upstream),
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
