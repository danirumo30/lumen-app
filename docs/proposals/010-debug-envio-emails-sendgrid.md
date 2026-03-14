# Propuesta 010: Debug y Solución de Envío de Emails con SendGrid

## Intent
Investigar y solucionar por qué los emails de verificación no llegan a la bandeja de entrada del usuario, a pesar de que el código de envío con SendGrid está implementado.

## Scope
- Verificar configuración de variables de entorno para SendGrid.
- Analizar logs de errores del servidor.
- Revisar restricciones de cuentas de SendGrid gratuitas.
- Implementar mejoras en el logging y manejo de errores.
- Probar envío de emails con un dominio verificado.

## Approach

### 1. Verificación de Variables de Entorno
El archivo `.env.local` debe contener las siguientes variables:
- `SENDGRID_API_KEY`: API Key de SendGrid.
- `SENDGRID_FROM_EMAIL`: Email del remitente (debe ser un dominio verificado en SendGrid).
- `SUPABASE_SERVICE_ROLE_KEY`: Para crear usuarios admin (necesario para el registro).

**Nota**: SendGrid tiene restricciones para cuentas gratuitas:
- No se pueden enviar emails a dominios de prueba (ej. `example.com`).
- El dominio del remitente debe estar verificado.
- Se requiere autenticación de dominio (SPF, DKIM).

### 2. Análisis de Logs
El código actual en `sendgrid.service.ts` captura errores:
```ts
catch (error) {
  console.error('Error enviando email:', error);
  throw new Error('Error enviando email de verificación');
}
```

Sin embargo, el endpoint de registro (`src/app/api/auth/register/route.ts`) captura el error pero no lo retorna al cliente (solo muestra "Error interno del servidor"). Esto dificulta la depuración.

**Mejora propuesta**:
- Retornar el mensaje de error específico al cliente en desarrollo.
- Loggear detalles del error (código de estado de SendGrid, mensaje).

### 3. Modo Desarrollo vs Producción
El código actual tiene lógica para no enviar emails en desarrollo:
```ts
if (!isDevelopment || sendInDevelopment) {
  await sendEmail(...);
} else {
  console.log(`[DEVELOPMENT] Email no enviado (simulado). URL de verificación: ${verificationUrl}`);
}
```

Para probar el envío real en desarrollo, se debe configurar `SENDGRID_SEND_IN_DEVELOPMENT=true` en `.env.local`.

### 4. Validación de Dominio en SendGrid
Si el dominio del remitente no está verificado, SendGrid bloqueará los emails. Es necesario:
1. Verificar el dominio en el panel de SendGrid.
2. Configurar registros SPF y DKIM.
3. Usar un email de remitente que pertenezca al dominio verificado (ej. `noreply@tudominio.com`).

### 5. Implementación de Mejoras
- Agregar validación de variables de entorno al inicio del endpoint.
- Retornar mensajes de error específicos en desarrollo.
- Loggear el ID del mensaje enviado para seguimiento.

## Affected Areas
- `src/app/api/auth/register/route.ts` (endpoint de registro)
- `src/infrastructure/email/sendgrid.service.ts` (servicio de envío)
- `.env.local` (configuración de variables de entorno)

## Risks
- **Seguridad**: Retornar mensajes de error detallados en producción puede exponer información sensible. Solo debe hacerse en desarrollo.
- **Costos**: SendGrid tiene límites en planes gratuitos (100 emails/día).
- **Dependencia externa**: Si SendGrid tiene problemas, el registro fallará.

## Success Criteria
1. ✅ Las variables de entorno están configuradas correctamente.
2. ✅ El dominio del remitente está verificado en SendGrid.
3. ✅ Los emails se envían correctamente (verificable en el panel de SendGrid).
4. ✅ Los usuarios reciben emails de verificación en su bandeja de entrada.
5. ✅ Los logs muestran mensajes de éxito o error claros.

## Implementation Notes
- Usar `console.error` para logs detallados (ya implementado).
- En desarrollo, retornar el error específico al cliente para facilitar debugging.
- Verificar que `SENDGRID_FROM_EMAIL` sea un email válido y verificado.

## Testing
1. Configurar `.env.local` con las variables necesarias.
2. Ejecutar el registro de un usuario de prueba.
3. Verificar los logs del servidor.
4. Revisar el panel de SendGrid para ver si el email fue enviado.
5. Verificar la bandeja de entrada (y spam) del email de prueba.

## Next Steps
1. Verificar `.env.local` y configurar las variables de entorno.
2. Probar el envío de emails con un dominio verificado en SendGrid.
3. Si el problema persiste, revisar la configuración de Supabase (necesario `SUPABASE_SERVICE_ROLE_KEY`).
4. Documentar el proceso en `docs/features/email-verification.md`.