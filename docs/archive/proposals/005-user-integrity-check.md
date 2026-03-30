# 005 - Verificación de Integridad de Usuario (User Integrity Check)

## Intent
Asegurar que usuarios eliminados de la base de datos de Supabase **no puedan acceder** a la aplicación, incluso si poseen un token JWT válido en el cliente. Prevenir el acceso "fantasma" tras eliminación de cuenta.

## Scope
- Implementar verificación de existencia de usuario en el servidor cada vez que se carga la sesión.
- Invalidar sesión localmente si el usuario ha sido borrado.
- Prevenir login de usuarios que ya no existen (verificación extra en `signIn`).
- Mantener la arquitectura limpia (no mezclar lógica de Supabase en el dominio).

## Approach
1. **Modificar `AuthContext.tsx`**:
   - Al montar el provider, verificar si el usuario del token existe realmente en la tabla `auth.users`.
   - Usar `supabase.auth.admin.getUserById(userId)` (requiere `SUPABASE_SERVICE_ROLE_KEY`).
   - Si el usuario no existe (error 404 o null), ejecutar `signOut()` inmediatamente y limpiar el estado.
   - Añadir un estado `isCheckingUser` para evitar flicker en la UI.

2. **Modificar función `signIn`**:
   - Tras iniciar sesión correctamente, verificar inmediatamente si el usuario existe.
   - Esto previene el login con tokens antiguos o manipulados si el usuario fue borrado entre sesiones.

3. **Manejo de errores**:
   - Si la verificación falla por permisos (ej. `SUPABASE_SERVICE_ROLE_KEY` inválida), loggear error pero no bloquear (fallback seguro).

## Affected Areas
- `src/contexts/AuthContext.tsx`: Lógica de verificación de usuario existente.
- `src/components/auth/LoginModal.tsx`: Feedback visual durante verificación.
- `.env.local`: Requiere `SUPABASE_SERVICE_ROLE_KEY` (ya existente).

## Risks
1. **Performance**: Verificación adicional en cada carga de página puede aumentar latencia (mínima, ya que es una query interna de Supabase).
2. **Permisos**: Requiere `SUPABASE_SERVICE_ROLE_KEY` con permisos de administrador.
3. **Ciclos de sesión**: Si la verificación falla transitoriamente (red), podría desloguear al usuario injustamente (manejar con retry).

## Success Criteria
- [x] Al cargar la aplicación con sesión existente, se verifica si el usuario existe en BD.
- [x] Si el usuario ha sido borrado, se cierra sesión automáticamente.
- [x] Al hacer login, se verifica si el usuario existe antes de establecer la sesión.
- [x] Los usuarios eliminados no pueden acceder ni hacer login.
- [x] Los tests existentes continúan pasando.
- [x] Build sin errores TypeScript.

## Estado
✅ **COMPLETADA** - Implementación terminada y funcional