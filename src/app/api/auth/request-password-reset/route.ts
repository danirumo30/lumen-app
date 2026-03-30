import { logger } from '@/shared/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  sendEmail, 
  generatePasswordResetEmailHtml, 
  generatePasswordResetEmailText 
} from '@/infrastructure/persistence/supabase/auth/email/nodemailer.service';
import { getBaseUrl } from '@/shared/get-base-url';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      );
    }

    
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      return NextResponse.json(
        { error: 'Error buscando usuario' },
        { status: 500 }
      );
    }

    const user = users.find(u => u.email === email);
    
    if (!user || !user.email) {
      
      return NextResponse.json({
        success: true,
        message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña.',
      });
    }

    
    const resetToken = randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); 

    
    
    
    
    
    
    
    
    
    
    
    
    try {
        const { error: insertError } = await supabaseAdmin
            .from('password_resets')
            .insert({
                user_id: user.id,
                token: resetToken,
                expires_at: expiresAt.toISOString(),
            });

        if (insertError) throw insertError;
    } catch {
        
        logger.warn("Tabla password_resets no encontrada, usando user_metadata como fallback");
        
        
        
        return NextResponse.json(
            { error: 'Configuración de base de datos incompleta (tabla password_resets)' },
            { status: 500 }
        );
    }

    const baseUrl = getBaseUrl(request);
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    
    const emailHtml = generatePasswordResetEmailHtml({
        userName: user.user_metadata?.full_name || 'Usuario',
        resetUrl,
    });
    
    const emailText = generatePasswordResetEmailText({
        userName: user.user_metadata?.full_name || 'Usuario',
        resetUrl,
    });

    const isDevelopment = process.env.NODE_ENV === 'development';
    const sendInDevelopment = process.env.SMTP_SEND_IN_DEVELOPMENT === 'true';

    if (!isDevelopment || sendInDevelopment) {
      try {
        await sendEmail({
          to: user.email,
          subject: 'Restablecer contraseña - Lumen',
          html: emailHtml,
          text: emailText,
        });
        logger.debug(`Email de restablecimiento enviado a ${user.email}`);
      } catch (emailError) {
        logger.error('Error enviando email de restablecimiento:', emailError);
        
      }
    } else {
      logger.debug(`[DEVELOPMENT] Email no enviado. URL: ${resetUrl}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña.',
    });

  } catch (error) {
    logger.error('Error en request-password-reset:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}





