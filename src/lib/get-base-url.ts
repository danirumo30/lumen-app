/**
 * Obtiene la URL base de la app para construir enlaces en emails (verificación, reset password).
 * Prioridad: origen de la petición (Vercel/producción) → NEXT_PUBLIC_APP_URL → localhost.
 */
export function getBaseUrl(request?: Request): string {
  if (request) {
    try {
      const url = new URL(request.url);
      const origin = url.origin;
      // Evitar usar orígenes internos o vacíos
      if (origin && origin !== 'null' && !origin.startsWith('http://127.0.0.1')) {
        return origin;
      }
      // En algunos despliegues la request puede venir con host interno; usar headers
      const forwardedHost = request.headers.get('x-forwarded-host');
      const forwardedProto = request.headers.get('x-forwarded-proto');
      if (forwardedHost && forwardedProto) {
        return `${forwardedProto}://${forwardedHost}`;
      }
    } catch {
      // Si falla el parse, seguimos con env/localhost
    }
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}
