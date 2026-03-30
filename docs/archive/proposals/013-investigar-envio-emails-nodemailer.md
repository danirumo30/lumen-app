# Propuesta 013: Investigación y Solución de Envío de Emails con Nodemailer

## Intent
Investigar y solucionar por qué los emails de verificación no llegan a la bandeja de entrada del usuario tras la migración a Nodemailer, a pesar de que el código parece correcto.

## Scope
- Verificar la configuración de variables de entorno SMTP.
- Analizar logs del servidor para detectar errores en el envío.
- Probar el envío de emails con un servidor SMTP de prueba (ej. Mailtrap) si es necesario.
- Asegurar que el modo desarrollo no bloqueé el envío real si se desea probar.

## Approach

### 1. Verificación de Variables de Entorno
El archivo `.env.local` debe contener las siguientes variables SMTP:
- `SMTP_HOST`: Host del servidor SMTP (ej. `smtp.gmail.com`).
- `SMTP_PORT`: Puerto (ej. `587` para STARTTLS).
- `SMTP_USER`: Email/usuario del remitente.
- `SMTP_PASS`: Contraseña o "App Password" (si usas Gmail).
- `SMTP_FROM_EMAIL`: Email del remitente (debe coincidir con `SMTP_USER`).
- `SMTP_SEND_IN_DEVELOPMENT`: (opcional) `true` para enviar emails reales en desarrollo.

**Nota sobre Gmail**: Si tienes verificación en dos pasos activada, debes generar una "App Password" en la configuración de tu cuenta de Google.

### 2. Análisis de Logs
Revisar los logs del servidor (`/tmp/nextjs.log`) para ver si hay errores de conexión o autenticación de SMTP.
Errores comunes:
- `ECONNREFUSED`: No se puede conectar al servidor SMTP.
- `EAUTH`: Error de autenticación (usuario/contraseña incorrectos).
- `ECONNTIMEOUT`: Timeout de conexión.

### 3. Implementación de Mejoras
- **Validación de variables**: Asegurar que las variables SMTP estén presentes antes de intentar enviar el email.
- **Logging detallado**: Mejorar los logs para indicar claramente si el email se está intentando enviar y qué resultado obtuvo.
- **Modo desarrollo**: Asegurar que el código no bloquee el envío en desarrollo si `SMTP_SEND_IN_DEVELOPMENT` es `true`.

### 4. Prueba con Servidor de Desarrollo
Si el servidor SMTP real falla, configurar un servidor de prueba como Mailtrap para verificar que el flujo de email funciona correctamente sin enviar emails reales.

## Affected Areas
- `src/infrastructure/email/nodemailer.service.ts` (servicio de envío).
- `src/app/api/auth/register/route.ts` (punto de inicio del envío).
- `.env.local` (configuración de variables de entorno).
- Logs del servidor.

## Risks
- Exposición de credenciales SMTP en logs (evitar loggear contraseñas).
- Costos de envío de emails si se usa un servicio de pago.
- Complejidad de configuración de SMTP (especialmente con Gmail).

## Success Criteria
1. ✅ Las variables de entorno SMTP están configuradas correctamente.
2. ✅ Los logs del servidor muestran intentos de envío de email y resultados claros.
3. ✅ Los emails llegan a la bandeja de entrada (o a la carpeta de spam) del destinatario.
4. ✅ El flujo de registro y verificación funciona completamente.

## Next Steps
1. Verificar `.env.local` y configurar variables SMTP.
2. Iniciar el servidor y revisar logs durante el registro.
3. Probar el envío con un email de prueba.
4. Documentar la configuración en `docs/features/email-verification.md`.