import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  sendEmail, 
  generateVerificationEmailHtml, 
  generateVerificationEmailText 
} from '@/infrastructure/email/nodemailer.service';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Usar Service Role Key para operaciones admin (seguro ya que es server-side)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Obtener usuario por email usando Service Role Key
    // Supabase JS client doesn't have a direct "getUserByEmail" method
    // We need to use the admin API to list users and filter by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      return NextResponse.json(
        { error: 'Error buscando usuario' },
        { status: 500 }
      );
    }

    const user = users.find(u => u.email === email);
    
    if (!user || !user.email) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Generar token de verificación e insertar en la tabla email_verifications
    const verificationToken = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    const { error: insertError } = await supabaseAdmin
      .from('email_verifications')
      .insert({
        user_id: user.id,
        token: verificationToken,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Error inserting verification token:', insertError);
      return NextResponse.json(
        { error: 'Error generando token de verificación' },
        { status: 500 }
      );
    }

    // Construir URL de verificación
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/api/auth/confirm-email?token=${verificationToken}`;

    // Preparar contenido del email
    const emailHtml = generateVerificationEmailHtml({
      userName: user.email.split('@')[0],
      verificationUrl,
    });
    
    const emailText = generateVerificationEmailText({
      userName: user.email.split('@')[0],
      verificationUrl,
    });

    // En desarrollo, verificar si se deben enviar emails reales
    const isDevelopment = process.env.NODE_ENV === 'development';
    const sendInDevelopment = process.env.SMTP_SEND_IN_DEVELOPMENT === 'true';
    
    if (!isDevelopment || sendInDevelopment) {
      // En producción o desarrollo con envío habilitado, enviar email con Nodemailer
      try {
        await sendEmail({
          to: user.email,
          subject: 'Verifica tu email en Lumen',
          html: emailHtml,
          text: emailText,
        });
        console.log(`Email enviado exitosamente a ${user.email}`);
      } catch (emailError) {
        console.error('Error al enviar email de verificación:', emailError);
        // No fallamos el registro si el email falla, solo logueamos el error
      }
    } else {
      console.log(`[DEVELOPMENT] Email no enviado (simulado). Para enviar emails reales en desarrollo, configura SMTP_SEND_IN_DEVELOPMENT=true en .env.local`);
      console.log(`[DEVELOPMENT] URL de verificación: ${verificationUrl}`);
    }
    
    return NextResponse.json({
      success: true,
      message: isDevelopment && !sendInDevelopment
        ? `Token generado (desarrollo): ${verificationToken}` 
        : 'Email de verificación enviado',
      token: isDevelopment && sendInDevelopment ? verificationToken : undefined,
      email: user.email,
      verificationUrl: isDevelopment && sendInDevelopment ? verificationUrl : undefined,
    });
  } catch (error) {
    console.error('Error en request-verification:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}