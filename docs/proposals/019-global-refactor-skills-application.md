# Propuesta 003: Aplicación Global de Skills de Calidad y Diseño

## Intent
Aplicar las habilidades de "Clean Code", "Email & Password Best Practices", "Hexagonal Architecture" y "Frontend Design" a todo el código existente para asegurar la máxima calidad, seguridad y consistencia arquitectónica.

## Scope
1. **Clean Code**: Revisión global de nombres, funciones, comentarios y formato.
2. **Email & Password Best Practices**: Implementación de password reset, validación de contraseñas fuertes.
3. **Hexagonal Architecture**: Refactorización de `AuthContext` para usar Repository Pattern.
4. **Frontend Design**: Mejora de estética, tipografía, colores y motion en componentes UI (LoginModal, VerificationMessage).

## Approach
1. **Análisis Estructural**: Revisar la estructura de directorios contra el mapa hexagonal.
2. **Clean Code Review**:
   - Verificar nombres significativos.
   - Asegurar funciones pequeñas y de una sola responsabilidad.
   - Eliminar comentarios redundantes.
3. **Auth Review**:
   - Implementar flujo de Password Reset (API y UI).
   - Refactorizar `AuthContext` para usar `SupabaseAuthRepository`.
   - Verificar implementación de email verification.
4. **Architecture Review**:
   - Crear `AuthRepository` interface en `domain`.
   - Crear `SupabaseAuthRepository` en `infrastructure`.
   - Verificar que `domain` no importe de `infrastructure`.
5. **Frontend Design**:
   - Mejorar estética de `LoginModal` y `VerificationMessage`.
   - Agregar animaciones y micro-interacciones.
   - Actualizar `globals.css` con animaciones personalizadas.

## Affected Areas
- `src/modules/auth/**` (Auth, Repositories, UI)
- `src/modules/shared/domain` (Tipos comunes)
- `src/components/ui` (Componentes base)
- `src/app/**` (Páginas, API routes)
- `src/infrastructure/email` (Generadores de emails)

## Risks
- Cambios visuales podrían afectar la usabilidad si no se testean.
- Refactorización arquitectónica extensa podría romper imports existentes.
- Implementación de password reset requiere tabla `password_resets` en BD.

## Success Criteria
1. Código pasa verificación de Clean Code (funciones < 20 líneas, nombres significativos).
2. Flujos de auth siguen best practices (email verification, password reset, seguridad).
3. Arquitectura hexagonal respetada (Repository Pattern implementado).
4. Diseño frontend aplicado con tipografía distintiva, motion y estética mejorada.
5. TypeScript compila sin errores.
6. Password reset funciona correctamente (endpoints API y UI).
