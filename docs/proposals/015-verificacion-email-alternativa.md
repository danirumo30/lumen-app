# Propuesta 015: Implementación de Verificación de Email Alternativa

## Intent
Implementar una lógica de verificación de email en la aplicación para evitar la dependencia de la función SQL `confirm_email_with_token` de Supabase, que actualmente falla con un error de ambigüedad.

## Scope
- Modificar `src/app/api/auth/confirm-email/route.ts`.
- Implementar la verificación manualmente:
  1. Buscar el token en la tabla `email_verification_tokens`.
  2. Validar que no haya expirado y no esté usado.
  3. Actualizar el estado `email_confirmed_at` del usuario en `auth.users`.
  4. Marcar el token como usado.
- Mantener la respuesta y redirección consistente.

## Approach

### 1. Análisis del Problema Actual
La función `supabase.rpc('confirm_email_with_token', ...)` falla porque la función SQL en Supabase tiene un error de ambigüedad (`column reference "token" is ambiguous`). Mientras se corrige en Supabase (requiere acceso de admin), necesitamos una solución funcional en la app.

### 2. Implementación Alternativa
Reemplazar la llamada RPC por operaciones directas en el cliente de Supabase:

1. **Buscar el token** en la tabla `email_verification_tokens`:
   ```sql
   SELECT user_id, expires_at, used
   FROM email_verification_tokens
   WHERE token = $1
   ```
2. **Validar**:
   - ¿El token existe?
   - ¿No ha expirado? (`expires_at > now()`)
   - ¿No ha sido usado? (`used = false`)
3. **Actualizar usuario**:
   ```sql
   UPDATE auth.users
   SET email_confirmed_at = now()
   WHERE id = $user_id
   ```
4. **Marcar token como usado**:
   ```sql
   UPDATE email_verification_tokens
   SET used = true
   WHERE token = $1
   ```
5. **Transacción**: Asegurar que todas las operaciones se ejecuten en una transacción.

### 3. Consideraciones de Seguridad
- **Acceso a tablas internas**: `auth.users` es una tabla interna de Supabase. Para acceder a ella, se necesita usar el cliente con `service_role` (o tener RLS deshabilitado/admin).
- **Transacciones**: Usar transacciones de Supabase para garantizar atomicidad.

### 4. Pasos de Implementación
1.  Actualizar `src/app/api/auth/confirm-email/route.ts`.
2.  Usar `supabaseAdmin` (Service Role Key) para realizar las actualizaciones.
3.  Implementar la lógica de validación y actualización manual.
4.  Mantener las redirecciones actuales (`/?success=email_confirmed` o `/?error=...`).

## Affected Areas
- `src/app/api/auth/confirm-email/route.ts`.

## Risks
- **Seguridad**: Acceso a tabla interna `auth.users` requiere permisos elevados.
- **Consistencia**: La lógica manual debe replicar exactamente la lógica que la función SQL estaba destinada a hacer.
- **Token duplicate**: Si el token no se marca como usado inmediatamente, podría ser reutilizado (aunque poco probable dado el tiempo de expiración).

## Success Criteria
- ✅ Al acceder a la URL de verificación con un token válido, el email se confirma correctamente.
- ✅ La redirección es a `/?success=email_confirmed`.
- ✅ El usuario puede iniciar sesión después de la verificación.
- ✅ Los tokens expirados o usados son rechazados.

## Next Steps
1.  Implementar la lógica en `confirm-email/route.ts`.
2.  Probar el flujo completo de registro y verificación.