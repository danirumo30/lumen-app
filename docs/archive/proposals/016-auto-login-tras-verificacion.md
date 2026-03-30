# Propuesta 016: Auto-Login Tras Verificación de Email

## Intent
Modificar el flujo de verificación de email para que, una vez verificado el email, el usuario inicie sesión automáticamente en lugar de ser redirigido a una página con un mensaje de éxito.

## Scope
- Modificar `src/app/api/auth/confirm-email/route.ts`.
- Implementar lógica de autenticación (login) en el backend tras confirmar el email.
- Establecer la sesión del usuario (cookies/headers) para que el cliente esté autenticado.
- Redirigir a una página de destino (ej. dashboard o home) ya autenticada.

## Approach

### 1. Flujo Actual
1. Usuario hace clic en el enlace de verificación.
2. Endpoint `/api/auth/confirm-email` verifica el token.
3. Establece `confirmed_at` en `email_verificaciones`.
4. Redirige a `/?success=email_confirmed`.
5. El usuario ve un mensaje en la home y debe hacer clic en "Login".

### 2. Nuevo Flujo Propuesto
1. Usuario hace clic en el enlace de verificación.
2. Endpoint `/api/auth/confirm-email` verifica el token.
3. Establece `confirmed_at` en `email_verificaciones`.
4. **Inicia sesión automáticamente** usando el `user_id` asociado al token.
5. Establece la sesión (cookies de Supabase) en la respuesta.
6. Redirige a `/dashboard` (o `/`) ya autenticado.

### 3. Implementación Técnica
Para iniciar sesión desde el backend, necesitamos usar el cliente de Service Role (`supabaseAdmin`) para generar una sesión JWT válida.

**Pasos:**
1. Obtener el `user_id` del token verificado.
2. Generar un JWT para ese usuario usando `supabaseAdmin.auth.admin.generateAccessToken()` (si está disponible) o creando la sesión manualmente.
3. Establecer la cookie `sb-<project-ref>-auth-token` en la respuesta de redirección.
4. Redirigir a la página principal.

**Nota:** Supabase no expone directamente un método para generar sesiones desde el backend en el cliente JS estándar. La forma correcta es usar la función `auth.admin.generateAccessToken` del cliente de Service Role (disponible en supabase-js v2).

### 4. Código Ejemplo (Aproximado)
```typescript
// En confirm-email/route.ts

// Después de verificar el token...
const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateAccessToken({
  user_id: tokenData.user_id,
});

if (sessionError) {
  // Manejar error
}

// Crear respuesta de redirección con cookie
const response = NextResponse.redirect(new URL('/dashboard', request.url));
response.cookies.set('sb-auth-token', sessionData.access_token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7, // 1 semana
});

return response;
```

## Affected Areas
- `src/app/api/auth/confirm-email/route.ts` (lógica de verificación y login).
- `src/app/page.tsx` (posiblemente eliminar lógica de mostrar mensajes de estado).
- `src/app/dashboard/page.tsx` (página de destino después del login).

## Risks
- **Seguridad**: Asegurar que solo usuarios con email verificado puedan generar sesiones.
- **Expiración**: El token de verificación debe ser válido y no expirado.
- **Sesión**: La cookie debe configurarse correctamente para que Supabase la reconozca en el cliente.

## Success Criteria
- ✅ Al hacer clic en el enlace de verificación, el usuario es redirigido directamente al dashboard/home autenticado.
- ✅ No se muestra mensaje de "email verificado".
- ✅ La sesión persiste después de la redirección.

## Next Steps
1. Implementar la generación de sesión en `confirm-email/route.ts`.
2. Probar el flujo completo: registro -> email -> verificación -> auto-login.
3. Actualizar documentación en `docs/features/email-verification.md`.