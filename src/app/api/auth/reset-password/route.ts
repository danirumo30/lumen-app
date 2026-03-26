import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // 1. Buscar el token en la tabla password_resets
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('password_resets')
      .select('user_id, expires_at')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);

    if (expiresAt < now) {
      return NextResponse.json(
        { error: 'Token expirado' },
        { status: 400 }
      );
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(tokenData.user_id);
    
    if (userError || !userData?.user?.email) {
      logger.error('Error obteniendo usuario:', userError);
      return NextResponse.json(
        { error: 'Error obteniendo información del usuario' },
        { status: 500 }
      );
    }

    const userEmail = userData.user.email;

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(tokenData.user_id, {
      password: password,
    });

    if (updateError) {
      logger.error('Error actualizando contraseña:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar contraseña' },
        { status: 500 }
      );
    }

    // 5. Eliminar el token usado
    await supabaseAdmin
      .from('password_resets')
      .delete()
      .eq('token', token);

    return NextResponse.json({
      success: true,
      message: 'Contraseña restablecida exitosamente',
      email: userEmail,
    });

  } catch (error) {
    logger.error('Error en reset-password:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

