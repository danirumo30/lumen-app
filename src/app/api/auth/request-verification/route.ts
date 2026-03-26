import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  sendEmail, 
  generateVerificationEmailHtml, 
  generateVerificationEmailText 
} from '@/modules/auth/infrastructure/email/nodemailer.service';
import { getBaseUrl } from '@/lib/get-base-url';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;


const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    
    
    
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

    const verificationToken = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); 

    const { error: insertError } = await supabaseAdmin
      .from('email_verifications')
      .insert({
        user_id: user.id,
        token: verificationToken,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      logger.error('Error inserting verification token:', insertError);
      return NextResponse.json(
        { error: 'Error generando token de verificación' },
        { status: 500 }
      );
    }

    const baseUrl = getBaseUrl(request);
    const verificationUrl = `${baseUrl}/api/auth/confirm-email?token=${verificationToken}`;

    const emailHtml = generateVerificationEmailHtml({
      userName: user.email.split('@')[0],
      verificationUrl,
    });
    
    const emailText = generateVerificationEmailText({
      userName: user.email.split('@')[0],
      verificationUrl,
    });

    
    const isDevelopment = process.env.NODE_ENV === 'development';
    const sendInDevelopment = process.env.SMTP_SEND_IN_DEVELOPMENT === 'true';
    
    if (!isDevelopment || sendInDevelopment) {
      try {
        await sendEmail({
          to: user.email,
          subject: 'Verifica tu email en Lumen',
          html: emailHtml,
          text: emailText,
        });
        logger.debug(`Email enviado exitosamente a ${user.email}`);
      } catch (emailError) {
        logger.error('Error al enviar email de verificación:', emailError);
        
      }
    } else {
      logger.debug(`[DEVELOPMENT] Email no enviado (simulado). Para enviar emails reales en desarrollo, configura SMTP_SEND_IN_DEVELOPMENT=true en .env.local`);
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
    logger.error('Error en request-verification:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


