# 001 - Autenticación (Login/Register)

## Resumen
Implementación completa del sistema de autenticación para Lumen, permitiendo a los usuarios iniciar sesión y registrarse mediante email y contraseña usando Supabase Auth.

## Arquitectura

### Estructura de Directorios
```
src/
├── contexts/
│   └── AuthContext.tsx          # Contexto global de autenticación
├── components/
│   └── auth/
│       └── LoginModal.tsx       # Modal de login/registro
├── infrastructure/
│   └── auth/                    # (Opcional) Servicios de autenticación
└── app/
    └── layout.tsx               # Layout con AuthProvider
```

### Patrones Utilizados
- **Provider Pattern**: AuthContext provee estado global de autenticación
- **Custom Hook**: `useAuth()` para acceder al estado desde componentes
- **Repository Pattern**: Supabase Auth como implementación concreta

## Implementación Detallada

### 1. AuthContext (`src/contexts/AuthContext.tsx`)
**Responsabilidades:**
- Mantener estado de usuario (User | null)
- Gestionar loading states
- Manejar errores de autenticación
- Proporcionar métodos: `signIn`, ` signUp`, `signOut`

**Integración con Supabase:**
```typescript
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});
```

**Eventos de Auth:**
- `onAuthStateChange`: Escucha cambios de sesión automáticamente
- `getSession`: Verifica sesión existente al montar el provider

### 2. LoginModal (`src/components/auth/LoginModal.tsx`)
**Funcionalidades:**
- Toggle entre modo Login y Register
- Formulario validado con HTML5
- Estados de carga con spinner animado
- Mensajes de error del backend
- Deshabilitación de inputs durante carga

**Validaciones:**
- Email: formato válido requerido
- Contraseña: requerida
- Nombre completo: requerido solo en registro

### 3. Integración en Layout
```tsx
<AuthProvider>
  <Header />
  {children}
</AuthProvider>
```

## Flujo de Autenticación

### Login
1. Usuario introduce email y contraseña
2. Se llama a `signIn(email, password)` de AuthContext
3. Supabase valida credenciales
4. Si éxito: sesión establecida, modal cerrado
5. Si error: mensaje mostrado al usuario

### Registro
1. Usuario introduce email, contraseña y nombre
2. Se llama a `signUp(email, password, fullName)`
3. Supabase crea usuario y envía email de confirmación
4. Si éxito con sesión: modal cerrado
5. Si éxito sin sesión (email confirmation): mensaje de confirmación

### Estado de Sesión
- Verificación automática al montar la app
- Escucha cambios de auth en tiempo real
- Persistencia entre navegaciones (Supabase maneja esto)

## Supabase Configuration

### Variables de Entorno (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://[tu-proyecto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

### Trigger en Base de Datos
El trigger `handle_new_user()` se ejecuta al crear usuarios:
- Normaliza nombres de usuario
- Crea perfiles de usuario en `user_profiles`
- Gestiona colisiones de usernames

## UX Details

### Feedback Visual
- **Cargando**: Spinner animado, botón deshabilitado
- **Error**: Mensaje en rojo, claro y no técnico
- **Éxito**: Modal cierra automáticamente

### Transiciones
- Modal: fade-in con backdrop blur
- Inputs: focus ring en indigo
- Botones: hover effects y active scale

## Testing

### Pruebas Existentes
- `src/modules/social/infrastructure/auth-trigger.test.ts`
- Testean creación de usuarios y normalización de perfiles

### Pruebas Unitarias (Futuro)
- `AuthContext` hook tests
- `LoginModal` component tests

## Seguridad

### Consideraciones
1. **Nunca loguear credenciales**
2. **HTTPS obligatorio** en producción
3. **Rate limiting** en Supabase Auth
4. **Validación server-side** en funciones de edge
5. **Password policy**: mínimo 8 caracteres

## Próximos Pasos

1. **Email confirmation**: Manejar estado de email no confirmado
2. **Google OAuth**: Integrar con Supabase Google provider
3. **Password reset**: Implementar flujo de recuperación
4. **Profile editing**: Permitir actualizar datos de usuario
5. **Two-factor auth**: Opcional para mayor seguridad

## Referencias

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js App Router](https://nextjs.org/docs/app)
- [AGENTS.md - Auth Section](../AGENTS.md)