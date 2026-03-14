/**
 * Script para verificar dónde se almacenan los datos del usuario
 * En Supabase Auth, los datos se almacenan:
 * 1. En la base de datos de Supabase (auth.users)
 * 2. En localStorage del navegador (session tokens)
 * 3. En cookies (session persistence)
 */

console.log("=== Almacenamiento de usuarios en Supabase Auth ===");
console.log("1. Base de datos Supabase: auth.users table");
console.log("2. Session tokens: localStorage (sb-[project-id]-auth-token)");
console.log("3. Cookies: sb-[project-id]-auth-token");
console.log("");
console.log("¿Por qué puedes hacer login con usuarios borrados?");
console.log("- Los tokens JWT en localStorage NO se invalidan automáticamente al borrar un usuario");
console.log("- Supabase no invalida tokens existentes al eliminar un usuario");
console.log("- El token sigue siendo válido hasta que expire (normalmente 1 hora)");
console.log("");
console.log("Solución:");
console.log("1. Invalidar todas las sesiones del usuario en Supabase Dashboard");
console.log("2. Configurar hook de Supabase para invalidar sesiones al borrar usuarios");
console.log("3. Limpiar localStorage manualmente en el cliente");