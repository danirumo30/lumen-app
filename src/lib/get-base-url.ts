
export function getBaseUrl(request?: Request): string {
  if (request) {
    try {
      const url = new URL(request.url);
      const origin = url.origin;
      if (origin && origin !== 'null' && !origin.startsWith('http://127.0.0.1')) {
        return origin;
      }
      
      const forwardedHost = request.headers.get('x-forwarded-host');
      const forwardedProto = request.headers.get('x-forwarded-proto');
      if (forwardedHost && forwardedProto) {
        return `${forwardedProto}://${forwardedHost}`;
      }
    } catch {
      
    }
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

