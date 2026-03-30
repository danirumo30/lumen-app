# 007 - Integración de SendGrid para Envío de Emails

## Resumen
Implementación completa de envío de emails de verificación utilizando SendGrid con un diseño personalizado que coincide con la estética de Lumen.

## Configuración Necesaria

### 1. Variables de Entorno
Añade a `.env.local`:

```env
# SendGrid API Key (obtenla de sendgrid.com > Settings > API Keys)
SENDGRID_API_KEY=SG.tu_api_key_aqui

# Email de remitente (debe estar verificado en SendGrid)
SENDGRID_FROM_EMAIL=verificacion@tudominio.com

# URL de la aplicación (para links de confirmación)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Verificar Dominio en SendGrid
Para que los emails lleguen a la bandeja de entrada (no a spam):
1. Ve a SendGrid Dashboard > Settings > Sender Authentication
2. Verifica tu dominio o email
3. Añade los registros DNS que te pida SendGrid

## Flujo de Envío

### 1. Registro de Usuario
```
1. Usuario completa formulario de registro
2. Supabase crea usuario (email_confirmed_at = NULL)
3. Endpoint /api/auth/request-verification genera token
4. SendGrid envía email con diseño de Lumen
5. Usuario recibe email con link de confirmación
```

### 2. Email de Verificación
**Asunto:** "Verifica tu email en Lumen"

**Diseño:**
- Fondo oscuro con gradiente indigo
- Logo de Lumen estilizado
- Botón "Verificar mi email" con efectos hover
- Texto claro sobre fondo oscuro
- Footer con información de Lumen

**Contenido:**
- Saludo personalizado con nombre de usuario
- Instrucciones claras para verificar email
- Link de confirmación prominente
- Link alternativo para copiar/pegar

### 3. Confirmación de Email
```
1. Usuario hace click en link del email
2. Endpoint /api/auth/confirm-email valida token
3. Actualiza email_confirmed_at en auth.users
4. Redirige a login con mensaje de éxito
```

## Componentes del Sistema

### Servicio SendGrid (`src/infrastructure/email/sendgrid.service.ts`)
- **sendEmail**: Función para enviar emails usando SendGrid
- **generateVerificationEmailHtml**: Template HTML con diseño de Lumen
- **generateVerificationEmailText**: Versión texto plano del email

### Template HTML
**Características:**
- Responsive design (móvil y desktop)
- Dark mode con colores de Lumen (#6366f1 indigo)
- Gradientes y sombras suaves
- Tipografía limpia y moderna
- Botón CTA con efectos de hover

**Ejemplo visual:**
```
┌─────────────────────────────────────┐
│ [Logo L]                            │
│ VERIFICA TU CUENTA                  │
│ Media Tracker para tu contenido     │
├─────────────────────────────────────┤
│ Hola, nombre_usuario                │
│                                     │
│ Gracias por registrarte...          │
│                                     │
│    [ Verificar mi email ]           │
│                                     │
│ O copia este link:                  │
│ https://.../api/auth/confirm-email? │
│ token=abc123...                     │
├─────────────────────────────────────┤
│ Lumen - Media Tracker               │
│ Si no creaste cuenta, ignora email  │
└─────────────────────────────────────┘
```

## Endpoints Modificados

### POST /api/auth/request-verification
- Genera token de verificación
- Envía email con SendGrid (solo en producción)
- Devuelve token en desarrollo

### GET /api/auth/confirm-email?token=xxx
- Valida token
- Confirma email
- Redirige a login

## Configuración de SendGrid

### Paso 1: Crear Cuenta
1. Ve a sendgrid.com
2. Regístrate con email
3. Verifica tu email

### Paso 2: Crear API Key
1. Ve a Settings > API Keys
2. Click "Create API Key"
3. Seleccióna "Full Access"
4. Copia la API Key (solo se muestra una vez)

### Paso 3: Verificar Remitente
1. Ve a Settings > Sender Authentication
2. Verifica tu dominio o email
3. Añade registros DNS si es necesario

### Paso 4: Probar Envío
1. Añade API Key a `.env.local`
2. Ejecuta registro de prueba
3. Verifica que llega el email

## Consideraciones de Seguridad

### 1. API Key
- **Nunca** exponer en el cliente
- Guardar en `.env.local` (no commit a git)
- Rotar periódicamente

### 2. Tokens de Verificación
- Generados cryptográficamente (32 bytes random)
- Expiran en 24 horas
- Únicos por usuario

### 3. Rate Limiting
- SendGrid gratuito: 100 emails/día
- Para producción: upgradear plan
- Considerar límites de dominio

## Testing

### En Desarrollo
1. No se envían emails reales
2. Token mostrado en consola
3. Botón "Simular verificación" disponible

### En Producción
1. Configurar SendGrid correctamente
2. Verificar dominio
3. Probar envío con email real
4. Verificar llegada a bandeja de entrada

## Referencias

- [Propuesta 007](../proposals/007-integration-sendgrid-emails.md)
- [SendGrid API Docs](https://sendgrid.com/docs/API_Reference/api_v3.html)
- [AGENTS.md](../AGENTS.md)