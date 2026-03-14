# Propuesta 012: Refactorización de SendGrid a Nodemailer y Corrección de Error 404

## Intent
Realizar una refactorización completa de los nombres de archivos, variables y referencias de "SendGrid" a "Nodemailer" para mantener la consistencia del código. Además, solucionar el error 404 que ocurre al hacer clic en el enlace de verificación de email recibido.

## Scope
1.  **Refactorización**:
    *   Renombrar archivo `sendgrid.service.ts` a `nodemailer.service.ts`.
    *   Actualizar todas las importaciones en el proyecto que referencien a "sendgrid".
    *   Renombrar variables de entorno de `SENDGRID_` a `SMTP_` (ya parcialmente hecho, pero asegurar consistencia).
    *   Actualizar nombres de funciones y comentarios internos.

2.  **Corrección de Error 404**:
    *   Investigar la ruta `/api/auth/confirm-email`.
    *   Verificar si el endpoint está configurado correctamente en Next.js App Router.
    *   Analizar por qué devuelve 404 (posible conflictos de rutas, falta de exportación, o problema en la lógica de redirección).
    *   Asegurar que el token de verificación se procese correctamente.

## Approach

### 1. Refactorización de SendGrid a Nodemailer
*   **Archivo**: `src/infrastructure/email/sendgrid.service.ts` -> `src/infrastructure/email/nodemailer.service.ts`.
*   **Importaciones**: Buscar y reemplazar en todo el proyecto `@/infrastructure/email/sendgrid.service` por `@/infrastructure/email/nodemailer.service`.
*   **Variables**: Verificar que todas las variables de entorno usen el prefijo `SMTP_` (ej. `SMTP_HOST`, `SMTP_USER`).
*   **Limpieza**: Eliminar cualquier referencia obsoleta a `@sendgrid/mail`.

### 2. Diagnóstico y Corrección del Error 404
*   **Verificación de Ruta**: Next.js App Router espera un archivo `route.ts` en la carpeta del endpoint.
    *   Ruta actual: `src/app/api/auth/confirm-email/route.ts`.
    *   Verificar que el método HTTP sea `GET` y que acepte `Request`.
*   **Análisis de Redirección**: El endpoint `confirm-email` redirige a `/login?success=email_confirmed` o `/login?error=...`.
    *   Si el usuario no tiene una sesión activa, la redirección debería funcionar.
    *   El error 404 sugiere que la ruta `/api/auth/confirm-email` no está siendo capturada por el servidor, o que la redirección falla internamente.
*   **Solución Propuesta**:
    1.  Asegurar que el endpoint `confirm-email` esté accessible y no tenga restricciones de middleware inesperadas.
    2.  Verificar que el token generado en el registro coincida con el esperado al verificar.
    3.  Si el 404 es en la redirección (ej. `/login` no existe), crear la página de login o ajustar la redirección.

## Affected Areas
*   `src/infrastructure/email/sendgrid.service.ts` (renombrar).
*   `src/app/api/auth/register/route.ts` (importación).
*   `src/app/api/auth/request-verification/route.ts` (importación).
*   `src/app/api/auth/confirm-email/route.ts` (lógica de verificación y redirección).
*   `.env.local` y `.env.example` (consistencia de variables).
*   `docs/proposals/011-migracion-nodemailer.md` (actualizar si es necesario, aunque es inmutable, se puede agregar nota).

## Risks
*   **Romper imports**: Si no se actualizan todas las referencias, la aplicación fallará.
*   **Redirección cíclica**: Si la lógica de redirección en `confirm-email` falla, puede causar bucles.
*   **Tokens inválidos**: Si el formato del token cambia o hay problemas de generación, la verificación fallará.

## Success Criteria
1.  ✅ No hay referencias a "sendgrid" en el código fuente (excepto en logs históricos).
2.  ✅ El archivo `nodemailer.service.ts` existe y se usa correctamente.
3.  ✅ Al hacer clic en el enlace de verificación del email, el navegador no devuelve error 404.
4.  ✅ El usuario es redirigido correctamente a la página de login con un mensaje de éxito.
5.  ✅ El usuario puede iniciar sesión después de verificar el email.