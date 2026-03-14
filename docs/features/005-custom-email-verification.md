# 004 - Sistema de Verificación de Email Personalizado

## Resumen
Implementación de un sistema de verificación de email personalizado que reemplaza el sistema automático de Supabase, permitiendo:
- Evitar límites de rate limiting
- Control total sobre el flujo de verificación
- Simulación de verificación en desarrollo sin enviar emails reales
- Lógica de negocio personalizada

## Configuración Inicial

### 1. Deshabilitar Email Confirmation de Supabase
**Paso necesario antes de usar el sistema:**
1. Ve a Supabase Dashboard > Authentication > Email Providers
2. Desmarca "Enable email confirmations"
3. Guarda los cambios

**Efecto:**
- Nuevos usuarios se crearán con `email_confirmed_at = NULL`
- No se enviarán emails de confirmación automáticamente
- Nuestro sistema personalizado tomará control

## Base de Datos

### Tabla `email_verifications`
```sql
CREATE TABLE email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);
```

### Funciones SQL
1. `create_email_verification(user_id UUID)`: Genera token único
2. `confirm_email_with_token(token TEXT)`: Confirma email con token
3. `get_user_by_email(email_param TEXT)`: Obtiene usuario por email

## Flujo de Verificación

### 1. Registro de Usuario
```
1. Usuario completa formulario de registro
2. Supabase crea usuario (email_confirmed_at = NULL)
3. Nuestro sistema genera token de verificación
4. Se muestra mensaje: "Revisa tu email para confirmar"
5. En desarrollo: Botón "Simular verificación"
```

### 2. Confirmación de Email
```
1. Usuario hace click en link de confirmación
2. Endpoint /api/auth/confirm-email valida token
3. Actualiza email_confirmed_at en auth.users
4. Redirige a login con mensaje de éxito
```

### 3. Login
```
1. Usuario intenta hacer login
2. Supabase valida credenciales
3. Nuestro sistema verifica email_confirmed_at
4. Si NULL: Muestra error "verifica tu email"
5. Si confirmado: Permite acceso
```

## Endpoints de API

### POST /api/auth/request-verification
Genera token de verificación para un usuario.

**Request:**
```json
{
  "email": "usuario@example.com"
}
```

**Response (desarrollo):**
```json
{
  "success": true,
  "message": "Token generado (desarrollo)",
  "token": "abc123...",
  "email": "usuario@example.com"
}
```

### GET /api/auth/confirm-email?token=xxx
Confirma email con token de verificación.

**Redirects:**
- Success: `/login?success=email_confirmed`
- Error: `/login?error=invalid_token`

### POST /api/auth/simulate-verification (Solo desarrollo)
Simula verificación de email sin enviar emails.

**Request:**
```json
{
  "email": "usuario@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verificado (simulado)",
  "user_id": "uuid-del-usuario"
}
```

## UI Componentes

### VerificationMessage
Componente que se muestra después del registro:
- Icono de verificación
- Mensaje principal
- Botón "Simular verificación" (solo desarrollo)
- Botón "Reenviar email de verificación"
- Botón "Cerrar"

## Seguridad

### Tokens
- **Generación**: `gen_random_bytes(32)` (256 bits de entropía)
- **Formato**: Hexadecimal (64 caracteres)
- **Expiración**: 24 horas
- **Unicidad**: Constraint UNIQUE en base de datos

### RLS (Row Level Security)
```sql
-- Users can view their own verifications
CREATE POLICY "Users can view their own verifications" ON email_verifications
  FOR SELECT USING (user_id = auth.uid());

-- System can insert and update
CREATE POLICY "System can insert verifications" ON email_verifications
  FOR INSERT WITH CHECK (true);
```

### Service Role Key
Requerida para operaciones admin (generación/confirmación de tokens).
- Solo usar en backend (API routes)
- Nunca exponer en cliente
- Configurar en `.env.local`

## Entornos

### Desarrollo
- Botón "Simular verificación" disponible
- No se envían emails reales
- Token mostrado en consola

### Producción
- Email enviado con link de confirmación
- Token no expuesto al usuario
- Link con estructura: `/api/auth/confirm-email?token=xxx`

## Configuración

### Variables de Entorno
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Pasos de Configuración
1. Obtener Service Role Key de Supabase Dashboard
2. Añadir a `.env.local`
3. Deshabilitar email confirmation en Supabase
4. Ejecutar migraciones SQL
5. Probar registro y verificación

## Testing

### Pruebas Recomendadas
1. **Registro**: Usuario se crea con email no confirmado
2. **Login fallido**: Error al intentar login sin confirmar
3. **Simulación (dev)**: Botón funciona y confirma email
4. **Confirmación real**: Link de email confirma correctamente
5. **Expiración**: Token expira después de 24 horas

### Tests Existentes
- `auth-trigger.test.ts` (3/3 pasando)
- Verifican creación de usuarios y normalización

## Referencias

- [Propuesta 006](../proposals/006-custom-email-verification-system.md)
- [Supabase Auth - Custom Flow](https://supabase.com/docs/guides/auth/custom-flows/email-verification)
- [AGENTS.md](../AGENTS.md)