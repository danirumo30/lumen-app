# 006 - Sistema de Verificación de Email Personalizado

## Intent
Reemplazar el sistema de verificación de email automático de Supabase por una implementación personalizada que nos permita:
1. Evitar límites de rate limiting de Supabase
2. Tener control total sobre el flujo de verificación
3. Simular verificación en desarrollo sin enviar emails reales
4. Añadir lógica de negocio personalizada (ej. tokens con expiración, reenvío, etc.)

## Scope
1. **Deshabilitar email confirmation automática** de Supabase
2. **Crear tabla `email_verifications`** en la base de datos
3. **Implementar endpoint para generar tokens de verificación**
4. **Crear endpoint para confirmar email con token**
5. **Crear UI para mostrar mensaje de verificación manual**
6. **Añadir endpoint de desarrollo para simular verificación**

## Approach
### 1. Deshabilitar email confirmation en Supabase
- Dashboard > Authentication > Email Providers
- Desactivar "Enable email confirmations"
- Los usuarios se crearán con `email_confirmed_at = NULL`

### 2. Crear tabla de verificaciones
```sql
CREATE TABLE email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  INDEX idx_token (token),
  INDEX idx_user (user_id)
);
```

### 3. Flujo de verificación personalizado
1. Usuario registra cuenta
2. Se crea entrada en `email_verifications` con token único
3. Se muestra mensaje: "Revisa tu email para confirmar"
4. **En desarrollo**: Botón "Simular verificación" para probar sin enviar email
5. **En producción**: Enviar email con link de confirmación (endpoint personalizado)
6. Usuario hace click en link → endpoint valida token → marca email como confirmado

### 4. Endpoints a crear
- `POST /api/auth/request-verification`: Generar token y enviar email (o mostrar para desarrollo)
- `GET /api/auth/confirm-email?token=xxx`: Confirmar email con token
- `POST /api/auth/resend-verification`: Reenviar email de verificación
- **Development only**: `POST /api/auth/simulate-verification`: Simular confirmación

## Affected Areas
- `src/contexts/AuthContext.tsx`: Modificar signUp para crear token de verificación
- `src/components/auth/VerificationMessage.tsx`: Añadir botón "Simular verificación" en desarrollo
- `src/components/auth/LoginModal.tsx`: Mostrar mensaje de verificación con acciones
- `src/app/api/auth/**`: Nuevos endpoints de API
- `supabase/migrations/`: Nueva migración SQL para tabla `email_verifications`
- `docs/features/006-custom-email-verification.md`: Documentación del sistema

## Risks
1. **Seguridad**: Tokens deben ser cryptográficamente seguros y únicos
2. **Expiración**: Tokens deben tener tiempo de expiración (ej. 24 horas)
3. **Rate limiting**: Implementar límites en endpoints de API para evitar abuse
4. **Email delivery**: En producción, necesitar configurar SMTP o usar servicio de email
5. **Backwards compatibility**: Usuarios existentes sin email confirmado

## Success Criteria
- [x] Email confirmation automática de Supabase deshabilitada
- [x] Tabla `email_verifications` creada en base de datos
- [x] Endpoint para generar tokens de verificación
- [x] Endpoint para confirmar email con token
- [x] UI muestra mensaje de verificación con acciones
- [x] Botón "Simular verificación" funciona en desarrollo
- [x] Tests continúan pasando
- [x] Build sin errores TypeScript

## Estado
✅ **COMPLETADA** - Implementación terminada y funcional