/**
 * Script de depuración para AuthContext
 */

console.log("=== Depuración de AuthContext ===");
console.log("");
console.log("Problemas comunes:");
console.log("1. Mensaje de verificación no aparece");
console.log("   Causa: requiresVerification no se establece en signUp()");
console.log("   Solución: Añadir requiresVerification: !data.session");
console.log("");
console.log("2. Usuarios borrados pueden hacer login");
console.log("   Causa: Tokens JWT en localStorage no se invalidan");
console.log("   Solución: Invalidar sesiones en Supabase Dashboard o usar signOut()");
console.log("");
console.log("3. Email de verificación no llega");
console.log("   Causa: Configuración de email en Supabase no activada");
console.log("   Solución: Dashboard > Authentication > Email Providers > Enable confirmations");
console.log("");
console.log("Pasos para probar el registro:");
console.log("1. Abrir modal de registro");
console.log("2. Introducir email y contraseña");
console.log("3. Hacer clic en 'Crear cuenta'");
console.log("4. Verificar que aparece el mensaje de verificación");
console.log("5. Revisar consola del navegador para errores");
console.log("6. Revisar email (carpeta spam incluida)");
console.log("");
console.log("Verificar configuración de Supabase:");
console.log("- Email confirmations: Enabled");
console.log("- Site URL: Configurado correctamente");
console.log("- SMTP Provider: Configurado si se usa email externo");