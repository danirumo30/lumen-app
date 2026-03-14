# Propuesta 014: Solución de Ambigüedad en Función SQL de Supabase

## Intent
Resolver el error de verificación de email causado por una ambigüedad en la función SQL `confirm_email_with_token` de Supabase.

## Scope
- Diagnosticar el error 42702 ("column reference 'token' is ambiguous").
- Modificar la función SQL en Supabase para eliminar la ambigüedad.
- Verificar que la verificación de email funcione correctamente después del cambio.

## Approach

### 1. Diagnóstico
Al intentar verificar un email mediante la URL de confirmación, el servidor devuelve una redirección a `/?error=invalid_token`. Los logs del servidor muestran el siguiente error de Supabase:

```
Error en confirm_email_with_token: {
  code: '42702',
  message: 'column reference "token" is ambiguous'
}
```

**Causa**: La función SQL `confirm_email_with_token` tiene un parámetro de entrada llamado `token`. Dentro de la función, la consulta SQL referencia una columna también llamada `token` (probablemente en la tabla `email_verification_tokens`), causando ambigüedad para el intérprete de PostgreSQL.

### 2. Solución (Supabase)
Necesitas acceder a la consola de Supabase y modificar la función `confirm_email_with_token`.

**Paso 1**: Ir a SQL Editor en Supabase.
**Paso 2**: Buscar la definición actual de `confirm_email_with_token`.
**Paso 3**: Modificar el nombre del parámetro de entrada para evitar el conflicto.

**Ejemplo de corrección (SQL):**
```sql
CREATE OR REPLACE FUNCTION confirm_email_with_token(p_token text) -- Cambiar nombre de parámetro
RETURNS boolean AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Buscar el token en la tabla (usando el nombre del parámetro)
  SELECT user_id INTO v_user_id
  FROM email_verification_tokens
  WHERE token = p_token -- Aquí la ambigüedad se resuelve
    AND expires_at > now()
    AND used = false
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Marcar el token como usado
  UPDATE email_verification_tokens
  SET used = true
  WHERE token = p_token;

  -- Confirmar el email del usuario
  UPDATE auth.users
  SET email_confirmed_at = now()
  WHERE id = v_user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Verificación
Una vez modificada la función en Supabase:
1. Reiniciar el servidor Next.js (o esperar a que se replique el cambio).
2. Registrar un nuevo usuario.
3. Hacer clic en el enlace de verificación del email.
4. Verificar que la redirección sea a `/?success=email_confirmed` (no a `/?error=invalid_token`).

## Affected Areas
- Supabase SQL Editor (función `confirm_email_with_token`).
- `src/app/api/auth/confirm-email/route.ts` (endpoint que llama a la función).

## Risks
- Modificar funciones SQL en producción puede afectar a usuarios existentes (aunque esta función solo se usa para verificación).
- Si la función no existe o tiene una estructura diferente, la corrección debe adaptarse.

## Success Criteria
- ✅ Al acceder a la URL de verificación, no se devuelve error 42702 en los logs.
- ✅ La verificación de email redirige a `/?success=email_confirmed`.
- ✅ El usuario puede iniciar sesión después de verificar el email.

## Next Steps
1. Acceder a Supabase y modificar la función `confirm_email_with_token`.
2. Probar la verificación de email con un nuevo registro.
3. Documentar la estructura de la base de datos en `docs/features/email-verification.md`.