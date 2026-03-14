import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usamos la service role key para operaciones admin (solo en desarrollo)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Solo para desarrollo - simula verificación de email
export async function POST(request: Request) {
  // Verificar que estamos en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Endpoint solo disponible en desarrollo' },
      { status: 403 }
    );
  }

  // Verificar que tenemos la service role key
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: 'Service role key no configurada' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { email } = await request.json();

    // Buscar usuario por email usando consulta SQL directa
    const { data: userData, error: userError } = await supabase
      .rpc('get_user_by_email', { email_param: email })
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Cast a tipo any para evitar error de TypeScript
    const users = userData as any;

    // Actualizar email_confirmed_at directamente en auth.users (solo en desarrollo)
    // NOTA: En producción, esto debería hacerse mediante el flujo normal de verificación
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
    console.error('Error en simulate-verification:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}