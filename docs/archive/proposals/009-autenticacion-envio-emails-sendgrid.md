# Propuesta 009: Autenticación y Envío de Emails con SendGrid

## Intent
Solucionar el problema de autenticación donde los usuarios se loguean instantáneamente sin recibir email de verificación. Implementar envío de emails con SendGrid y asegurar que se muestre la ventana de verificación tras el registro.

## Scope
- Modificar el flujo de registro para usar SendGrid en lugar del email nativo de Supabase.
- Asegurar que los usuarios no se logueen automáticamente tras el registro.
- Mover endpoints API a la ubicación correcta de Next.js (`src/app/api/`).
- Aplicar diseño profesional al email de verificación usando las directrices de `frontend-design`.

## Approach

### 1. Crear endpoint de registro personalizado
- **Ubicación**: `src/app/api/auth/register/route.ts`
- **Funcionalidad**:
  - Usar Service Role Key de Supabase para crear usuarios sin enviar email automático.
  - Generar token de verificación usando función SQL `create_email_verification`.
  - Enviar email con SendGrid usando el diseño HTML de `sendgrid.service.ts`.
  - Retornar `requiresVerification: true` (no loguear al usuario).

### 2. Modificar `AuthContext`
- **Ubicación**: `src/modules/auth/infrastructure/contexts/AuthContext.tsx`
- **Cambio**: La función `signUp` ahora llama al endpoint `/api/auth/register` en lugar de `supabase.auth.signUp`.
- **Resultado**: El usuario siempre requiere verificación tras el registro.

### 3. Reorganizar endpoints API
- Mover endpoints de auth de `src/modules/auth/infrastructure/api/` a `src/app/api/auth/`:
  - `register/route.ts` (nuevo)
  - `confirm-email/route.ts` (movido)
  - `request-verification/route.ts` (movido)
  - `simulate-verification/route.ts` (movido)

### 4. Aplicar diseño de correo electrónico
- Usar `generateVerificationEmailHtml` de `src/infrastructure/email/sendgrid.service.ts`.
- Diseño profesional con gradientes oscuros, colores índigo, tipografía moderna y botón CTA.

## Affected Areas
- `src/app/api/auth/register/route.ts` (nuevo)
- `src/modules/auth/infrastructure/contexts/AuthContext.tsx` (modificado)
- `src/infrastructure/email/sendgrid.service.ts` (diseño de correo)
- `src/app/api/auth/confirm-email/route.ts` (movido)
- `src/app/api/auth/request-verification/route.ts` (movido)
- `src/app/api/auth/simulate-verification/route.ts` (movido)
- `LoginModal.tsx` (usa `requiresVerification` para mostrar `VerificationMessage`)
- `VerificationMessage.tsx` (muestra mensaje de verificación)

## Risks
- **Configuración de entorno**: Se requieren variables de entorno específicas (`SUPABASE_SERVICE_ROLE_KEY`, `SENDGRID_API_KEY`, etc.). Si no están configuradas, el registro fallará.
- **Envío de emails en desarrollo**: Por defecto, no se envían emails reales en desarrollo. Se puede habilitar con `SENDGRID_SEND_IN_DEVELOPMENT=true`.
- **Compatibilidad con Supabase**: El uso de Service Role Key para crear usuarios debe estar permitido en la configuración de Supabase.

## Success Criteria
1. ✅ Al registrarse, el usuario ve la ventana "Por favor, verifica tu correo electrónico".
2. ✅ Se envía un email de verificación con diseño profesional (SendGrid).
3. ✅ El usuario no se loguea automáticamente tras el registro.
4. ✅ El usuario puede verificar su email haciendo clic en el enlace del email.
5. ✅ Después de verificar, el usuario puede iniciar sesión normalmente.
6. ✅ La aplicación compila sin errores y los tests pasan.

## Implementation Notes
- El diseño del email cumple con las directrices de `frontend-design` (evitar diseños genéricos, usar colores oscuros, tipografía moderna).
- Se usó arquitectura hexagonal: el endpoint de registro es parte de la capa de infraestructura.
- Se sigue el workflow de `AGENTS.md`: Proposal-First Development.

## Testing
- Build: `npm run build` → Exitoso.
- Tests: `npm test` → 3 tests pasados.
- TypeScript: Sin errores.

## Next Steps
1. Configurar variables de entorno en `.env.local`.
2. Probar el flujo completo en entorno de desarrollo.
3. Probar en entorno de producción.
4. Actualizar documentación en `docs/features/`.