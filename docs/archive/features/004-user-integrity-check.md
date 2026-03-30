# 003 - Verificación de Integridad de Usuario

## Resumen
Implementación de seguridad para prevenir que usuarios eliminados de la base de datos de Supabase accedan a la aplicación, incluso si poseen tokens JWT válidos en el cliente.

## El Problema

### Antes de esta implementación:
1. Usuario se registra en Lumen
2. Token JWT se almacena en `localStorage` del navegador
3. Administrador borra el usuario en Supabase Dashboard
4. **Problema**: El token JWT en `localStorage` sigue siendo válido
5. Usuario puede seguir accediendo hasta que expire el token (~1 hora)

### Por qué ocurre esto:
- Los tokens JWT son **stateless** (no contienen información de si el usuario existe)
- Supabase valida la firma del token, no la existencia del usuario
- Al borrar un usuario, Supabase **no invalida tokens existentes**

## Solución Implementada

### Enfoque: Verificación de integridad en el cliente

Modificamos `AuthContext.tsx` para verificar que el usuario exista en la base de datos antes de permitir acceso:

1. **Cliente Admin**: Creamos un cliente de Supabase con `SUPABASE_SERVICE_ROLE_KEY` para operaciones administrativas
2. **Verificación en tiempo real**: Al cargar la app, iniciar sesión o cambiar estado, verificamos existencia
3. **Invalidación automática**: Si el usuario no existe, cerramos sesión inmediatamente

## Implementación Técnica

### 1. Cliente Administrativo (`src/contexts/AuthContext.tsx`)

```typescript
const getSupabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY no configurado...');
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
```

### 2. Verificación en `checkSession()` (montaje de app)

```typescript
if (user) {
  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    try {
      const { error: adminError } = await adminClient.auth.admin.getUserById(user.id);
      if (adminError) {
        // Usuario no encontrado o eliminado
        console.log(`Usuario ${user.id} no encontrado. Cerrando sesión.`);
        await supabase.auth.signOut();
        user = null;
      }
    } catch (adminCheckError) {
      console.error('Error verificando integridad:', adminCheckError);
      // En caso de error temporal, no cerramos sesión (seguridad conservadora)
    }
  }
}
```

### 3. Verificación en `signIn()` (después de login)

```typescript
// Después de login exitoso, verificamos que el usuario exista
if (user) {
  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    try {
      const { error: adminError } = await adminClient.auth.admin.getUserById(user.id);
      if (adminError) {
        await supabase.auth.signOut();
        throw new Error('La cuenta de usuario no existe o ha sido eliminada.');
      }
    } catch (adminCheckError) {
      console.error('Error verificando integridad:', adminCheckError);
    }
  }
}
```

### 4. Verificación en `onAuthStateChange`

Se verifica la integridad cada vez que cambia el estado de autenticación (login, logout, token refresh).

## Flujo de Seguridad

### Escenario 1: Usuario normal
1. Usuario hace login
2. Se verifica existencia en BD → ✅ Existe
3. Sesión se establece normalmente
4. Usuario accede a la aplicación

### Escenario 2: Usuario eliminado intenta acceder
1. Usuario intenta acceder con sesión existente
2. Al montar app, se verifica existencia en BD
3. `adminClient.auth.admin.getUserById()` devuelve error
4. **Sesión se cierra automáticamente**
5. Usuario es redirigido al login

### Escenario 3: Usuario eliminado intenta hacer login
1. Usuario introduce credenciales
2. Supabase valida credenciales (usuario aún existe en tabla `auth.users`)
3. Login exitoso
4. **Inmediatamente se verifica integridad**
5. Si usuario fue eliminado entre login y verificación, se cierra sesión
6. Se muestra mensaje de error

## Consideraciones de Seguridad

### 1. Service Role Key
- **Nunca** exponer en el cliente (solo en servidor)
- Usar solo para verificación de integridad
- Rotar periódicamente según políticas de seguridad

### 2. Manejo de errores
- Error de verificación temporal: No cerrar sesión (conservador)
- Error de "usuario no encontrado": Cerrar sesión inmediatamente
- Loggear errores para monitoreo

### 3. Performance
- Verificación solo al montar app y hacer login
- Query administrativa rápida (indexada por ID)
- Impacto mínimo en UX

### 4. Privacidad
- Verificar solo existencia, no datos sensibles
- No exponer información de otros usuarios
- Cumplir con RLS (Row Level Security)

## Configuración Necesaria

### Variables de Entorno (`.env.local`)
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Cómo obtener la Service Role Key:
1. Supabase Dashboard > Project Settings > API
2. Copiar "Service role key"
3. Añadir a `.env.local`

**Importante:** Esta clave tiene acceso completo a la base de datos. Nunca compartir o exponer públicamente.

## Testing

### Pruebas recomendadas:
1. **Registro + Eliminación**: Registrar usuario, borrarlo en Supabase, intentar acceder
2. **Login con usuario borrado**: Intentar hacer login con credenciales de usuario eliminado
3. **Token expirado**: Verificar comportamiento con tokens expirados
4. **Error de red**: Verificar que no se cierra sesión si falla la verificación temporalmente

### Tests existentes:
- `auth-trigger.test.ts` (3/3 pasando)
- Verifican creación de usuarios y normalización de perfiles

## Referencias

- [Supabase Auth - Admin API](https://supabase.com/docs/reference/javascript/auth-admin)
- [JWT Tokens - Supabase](https://supabase.com/docs/guides/auth/jwt)
- [Propuesta 005](../proposals/005-user-integrity-check.md)
- [AGENTS.md - Security Constraints](../AGENTS.md)