# Propuesta 002: Correcciones de Autenticación

## Intent
Mejorar la experiencia de usuario en el flujo de autenticación corrigiendo problemas de verificación de email y redirección post-login.

## Scope
1. **Eliminar botón de simulación de verificación:** Quitar el botón "Simular verificación (Dev)" del componente VerificationMessage.
2. **Corregir reenvío de email de verificación:** Arreglar el error "usuario no encontrado" al intentar reenviar el email de verificación.
3. **Implementar delay de 10 segundos:** Agregar un temporizador de 10 segundos después de usar "Reenviar email" para prevenir spam.
4. **Corregir redirección post-login:** Cambiar la redirección de `/dashboard` a la página principal (`/`).
5. **Reemplazar función RPC por inserción directa:** Cambiar de `supabaseAdmin.rpc('create_email_verification')` a inserción directa en la tabla `email_verifications`.

## Approach
1. **VerificationMessage.tsx:**
   - Eliminar el bloque de código del botón "Simular verificación (Dev)".
   - Agregar estado `canResend` y `resendTimer` para manejar el delay de 10 segundos.
   - Deshabilitar el botón de reenvío mientras el timer esté activo.

2. **API Route - request-verification:**
   - Usar Service Role Key en lugar de Anon Key para operaciones admin.
   - Utilizar `listUsers()` y filtrar por email ya que no hay método directo `getUserByEmail`.
   - Agregar validación para asegurar que el email del usuario exista.
   - **Cambio clave:** Reemplazar `supabaseAdmin.rpc('create_email_verification')` por inserción directa en `email_verifications` usando `randomUUID()` para el token.

3. **API Route - register:**
   - **Cambio clave:** Reemplazar `supabaseAdmin.rpc('create_email_verification')` por inserción directa en `email_verifications`.

4. **LoginPage.tsx:**
   - Cambiar `router.push('/dashboard')` a `router.push('/')`.

## Affected Areas
- `src/modules/auth/ui/components/VerificationMessage.tsx`
- `src/app/api/auth/request-verification/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/login/page.tsx`

## Risks
- El delay de 10 segundos podría afectar la UX si el usuario espera más tiempo del necesario.
- Cambiar la redirección podría romper enlaces existentes si hay referencias a `/dashboard`.
- `listUsers()` puede ser ineficiente con muchos usuarios, pero es aceptable para esta etapa del proyecto.
- **Nuevo riesgo:** La inserción directa en `email_verifications` requiere que la tabla exista y tenga los permisos adecuados (RLS).

## Success Criteria
1. ✅ Botón "Simular verificación (Dev)" eliminado.
2. ✅ "Reenviar email" funciona sin errores de "usuario no encontrado".
3. ✅ Botón de reenvío se deshabilita por 10 segundos tras usarse.
4. ✅ Post-login redirige a la página principal (`/`).
5. ✅ TypeScript compilation pasa sin errores.
6. ✅ Tokens de verificación se generan e insertan correctamente en la tabla `email_verifications`.
