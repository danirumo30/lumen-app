# Guía de Gestión de Sesiones y Usuarios

## Almacenamiento de Usuarios

### ¿Dónde se guardan los usuarios?
**Respuesta:** Los usuarios se guardan **exclusivamente en Supabase** (base de datos PostgreSQL en la tabla `auth.users`). **NO** se guardan en archivos locales ni en cache del cliente.

### Flujo de datos:
```
Cliente (Next.js) → Supabase Auth API → Base de datos PostgreSQL (auth.users)
```

### ¿Qué se almacena en el cliente?
1. **Token JWT** en `localStorage` (clave: `sb-[project-id]-auth-token`)
2. **Session data** en cookies (si persistencia está activada)
3. **Estado de autenticación** en React Context (memoria RAM del browser)

## Problema: Usuarios borrados pueden hacer login

### ¿Por qué ocurre esto?
Cuando borras un usuario en Supabase Dashboard:
- ❌ Los tokens JWT existentes **NO se invalidan automáticamente**
- ❌ Supabase no invalida sesiones activas al eliminar un usuario
- ✅ El token sigue siendo válido hasta su expiración (~1 hora)

### ¿Cómo solucionarlo?

#### Opción 1: Invalidar sesiones en Supabase Dashboard
1. Ve a Supabase Dashboard > Authentication > Users
2. Selecciona el usuario
3. Haz clic en "Disable user" o "Delete user"
4. **Importante:** Esto NO invalida sesiones activas existentes

#### Opción 2: Invalidar todas las sesiones (Programático)
```typescript
// En tu código, después de borrar un usuario:
await supabase.auth.admin.signOut(userId);
```

#### Opción 3: Limpiar storage del cliente
```typescript
// Al hacer logout, limpia todo:
localStorage.clear(); // Elimina todos los tokens
// O específicamente:
localStorage.removeItem('sb-[project-id]-auth-token');
```

#### Opción 4: Verificación de Integridad Automática (Implementada)
**Esta solución ya está implementada en `AuthContext.tsx`**

La aplicación verifica automáticamente si el usuario existe en la base de datos:
1. Al cargar la aplicación (checkSession)
2. Después de hacer login (signIn)
3. Al cambiar el estado de autenticación (onAuthStateChange)

**Flujo:**
```
Usuario intenta acceder → Verificar existencia en BD vía admin API →
  - Si existe: Permitir acceso
  - Si no existe: Cerrar sesión automáticamente → Redirigir a login
```

**Requisitos:**
- `SUPABASE_SERVICE_ROLE_KEY` configurado en `.env.local`
- Clave con permisos de administrador

## Mensaje de Verificación de Email

### Configuración necesaria en Supabase:
1. **Dashboard > Authentication > Email Providers**
   - ✅ "Enable email confirmations" debe estar activado
   - Configura SMTP si usas proveedor externo

2. **Dashboard > Authentication > Templates**
   - Edita el template "Confirm Email"
   - Usa placeholder: `{{ .ConfirmationURL }}`

### Flujo de verificación:
1. Usuario registra cuenta con `signUp()`
2. Supabase envía email automáticamente
3. `data.session` es `null` (email confirmation required)
4. Cliente muestra mensaje de verificación
5. Usuario hace clic en enlace del email
6. Email se confirma y sesión se activa

### Debug: ¿Por qué no llega el email?
```typescript
// Para depurar en consola:
const { error, data } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password',
});
console.log('Session:', data.session); // null si email confirmation
console.log('User:', data.user); // user object con email confirmation pending
```

## Buenas Prácticas

### 1. Validar sesión en cada carga
```typescript
useEffect(() => {
  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // Sesión inválida o expirada
      await supabase.auth.signOut();
    }
  };
  checkSession();
}, []);
```

### 2. Manejar expiración de tokens
```typescript
// Escuchar eventos de auth
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
      // Actualizar estado de la aplicación
    }
  }
);
```

### 3. Forzar re-autenticación para acciones sensibles
```typescript
// Para operaciones críticas, pide re-autenticación
const { error } = await supabase.auth.reauthenticate();
```

### 4. Validar RLS (Row Level Security)
```sql
-- Asegurar que solo usuarios autenticados puedan acceder a sus datos
ALTER POLICY "Users can only access their own data" ON user_profiles
  USING (auth.uid() = id);
```

## Referencias

- [Supabase Auth - Session Management](https://supabase.com/docs/guides/auth/sessions)
- [Supabase Auth - JWT Tokens](https://supabase.com/docs/guides/auth/jwt)
- [Supabase Auth - Email Confirmation](https://supabase.com/docs/guides/auth/email-templates)