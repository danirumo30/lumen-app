import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Debug: Hardcodear URL si la del entorno parece incorrecta (http en lugar de https o localhost)
if (supabaseUrl.startsWith('http://localhost')) {
  logger.warn(`[WARN] Supabase URL parece ser local (${supabaseUrl}). Usando URL de nube hardcodeada.`);
  supabaseUrl = 'https://nyjbhwlnnhgaoctxrjdd.supabase.co';
}

// Usar cliente admin para acceder a tablas internas
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/?error=missing_token', request.url));
    }

    // 1. Buscar el token en la tabla email_verifications
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('email_verifications')
      .select('user_id, expires_at')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      logger.warn('Token no encontrado o error en búsqueda:', tokenError);
      return NextResponse.redirect(new URL('/?error=invalid_token', request.url));
    }

    // 2. Validar el token
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);

    if (expiresAt < now) {
      logger.warn('Token expirado:', token);
      return NextResponse.redirect(new URL('/?error=token_expired', request.url));
    }

    // 3. Marcar el email como verificado en email_verifications
    const confirmedAt = new Date().toISOString();
    const { error: confirmError } = await supabaseAdmin
      .from('email_verifications')
      .update({ confirmed_at: confirmedAt })
      .eq('token', token);

    if (confirmError) {
      logger.error('Error marcando email como verificado:', confirmError);
    } else {
      logger.debug(`Email verificado para usuario ${tokenData.user_id}.`);
    }

    const { error: deleteError } = await supabaseAdmin
      .from('email_verifications')
      .delete()
      .eq('token', token);

    if (deleteError) {
      logger.error('Error eliminando token:', deleteError);
    }

    // 5. Confirmar el email en auth.users
    try {
      const { error: confirmUserError } = await supabaseAdmin.auth.admin.updateUserById(tokenData.user_id, {
        email_confirm: true,
      });
      
      if (confirmUserError) {
        logger.error('Error confirmando usuario en auth.users:', confirmUserError);
      } else {
        logger.debug(`Usuario ${tokenData.user_id} confirmado en auth.users.`);
      }
    } catch (error) {
      logger.error('Excepción confirmando usuario:', error);
    }

    // 6. Obtener el email del usuario desde auth.users
    try {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(tokenData.user_id);
      
      
      if (userError || !userData) {
        logger.error('Error obteniendo usuario:', userError);
        // Si no podemos obtener el email, redirigimos al login normal
        return NextResponse.redirect(new URL('/login', request.url));
      }

      const userEmail = userData.user?.email;

      // 7. Eliminar el token usado
      await supabaseAdmin
        .from('email_verifications')
        .delete()
        .eq('token', token);

      const loginUrl = new URL('/login', request.url);
      if (userEmail) {
        loginUrl.searchParams.set('email', userEmail);
      }
      loginUrl.searchParams.set('verified', 'true');
      
      return NextResponse.redirect(loginUrl);

    } catch (error) {
      logger.error('Error obteniendo usuario o redirigiendo:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } catch (error) {
    logger.error('Error en confirm-email:', error);
    return NextResponse.redirect(new URL('/?error=server_error', request.url));
  }
}


