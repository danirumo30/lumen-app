import { logger } from '@/shared/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Endpoint solo disponible en desarrollo' },
      { status: 403 }
    );
  }

  
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: 'Service role key no configurada' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { email } = await request.json();

    
    const { data: userData, error: userError } = await supabase
      .rpc('get_user_by_email', { email_param: email })
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    
    interface UserResult {
      id: string;
      email: string;
      email_confirmed_at: string | null;
    }

    const users = userData as UserResult;

    
    const { error: updateError } = await supabase
      .from('users')
      .update({ email_confirmed_at: new Date().toISOString() })
      .eq('email', email);

    if (updateError) {
      return NextResponse.json(
        { error: 'Error actualizando usuario' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email verificado (simulado)',
      user_id: users.id,
    });
  } catch (error) {
    logger.error('Error en simulate-verification:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}




