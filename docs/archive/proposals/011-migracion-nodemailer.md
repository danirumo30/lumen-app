# Propuesta 011: Migración de SendGrid a Nodemailer

## Intent
Reemplazar el servicio de envío de emails basado en SendGrid por Nodemailer para mejorar la compatibilidad local y reducir la dependencia de servicios externos en desarrollo.

## Scope
- Desinstalar dependencias de SendGrid (`@sendgrid/mail`).
- Instalar dependencia de Nodemailer (`nodemailer`).
- Reemplazar la lógica de envío en `src/infrastructure/email/sendgrid.service.ts`.
- Actualizar variables de entorno (cambiar `SENDGRID_*` por `SMTP_*`).
- Actualizar endpoints que usan el servicio de email.

## Approach

### 1. Cambio de Dependencias
- **Eliminar**: `@sendgrid/mail`
- **Instalar**: `nodemailer`

### 2. Reestructuración del Servicio de Email
Renombrar el archivo para reflejar el cambio o modificar el existente. Usaremos el mismo archivo para minimizar cambios en imports.
Archivo: `src/infrastructure/email/email.service.ts` (o actualizar `sendgrid.service.ts`).

**Lógica de Nodemailer**:
```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
```

### 3. Variables de Entorno
Actualizar `.env.local`:
- `SMTP_HOST`: Host del servidor SMTP (ej. `smtp.gmail.com`).
- `SMTP_PORT`: Puerto (ej. `587`).
- `SMTP_USER`: Usuario/Email del remitente.
- `SMTP_PASS`: Contraseña o API Key de aplicación.
- Eliminar `SENDGRID_API_KEY` y `SENDGRID_FROM_EMAIL`.

### 4. Actualización de Endpoints
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/request-verification/route.ts`

Ambos deben importar desde el nuevo servicio de email.

## Affected Areas
- `package.json` (cambio de dependencias).
- `src/infrastructure/email/sendgrid.service.ts` (renombrar o modificar).
- `src/app/api/auth/register/route.ts`.
- `src/app/api/auth/request-verification/route.ts`.
- `.env.local` (actualización de variables).

## Risks
- Configuración SMTP compleja (requiere credenciales válidas de un proveedor de email).
- Posible bloqueo por parte del proveedor de email si no se configura correctamente (SPF, DKIM).
- Nodemailer no envía emails real en localhost sin configuración específica.

## Success Criteria
- ✅ Instalar `nodemailer` sin errores.
- ✅ Implementar función `sendEmail` usando Nodemailer.
- ✅ Los endpoints de registro y reenvío usan el nuevo servicio.
- ✅ La aplicación compila y los tests pasan.
- ✅ Configurar variables de entorno SMTP.

## Implementation Notes
- Mantener la estructura HTML del email (usar `generateVerificationEmailHtml` existente).
- Validar que el transporte SMTP funcione antes de enviar.

## Testing
- Configurar variables SMTP en `.env.local`.
- Ejecutar registro de usuario.
- Verificar logs de Nodemailer.
- Revisar bandeja de entrada del email destino.

## Next Steps
1. Instalar `nodemailer`.
2. Crear/Actualizar servicio de email.
3. Actualizar endpoints.
4. Configurar variables de entorno SMTP.
5. Probar envío de emails.