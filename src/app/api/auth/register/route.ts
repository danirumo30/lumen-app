import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sendEmail,
  generateVerificationEmailHtml,
  generateVerificationEmailText
} from '@/infrastructure/email/nodemailer.service';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente con Service Role Key para operaciones admin (crear usuario sin email automático)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Validación de seguridad de contraseña
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'La contraseña debe tener al menos 8 caracteres' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'La contraseña debe contener al menos una mayúscula' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'La contraseña debe contener al menos una minúscula' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'La contraseña debe contener al menos un número' };
  }
  
  // Opcional: rechazar patrones comunes débiles
  const weakPatterns = ['123456', 'password', 'qwerty', 'abc123', '111111'];
  if (weakPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    return { valid: false, error: 'La contraseña es demasiado débil' };
  }
  
  return { valid: true };
}

export async function POST(request: Request) {
  try {
    const { email, password, fullName, username } = await request.json();

    if (!email || !password || !fullName || !username) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validar seguridad de la contraseña
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Validar username (solo letras, números, guiones bajos, mínimo 3 caracteres)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'El username debe tener entre 3 y 20 caracteres y solo contener letras, números o guiones bajos' },
        { status: 400 }
      );
    }

    // 1. Crear usuario con Service Role Key (sin enviar email automático)
    const { data: userData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // No confirmar email automáticamente
      user_metadata: {
        full_name: fullName,
        username: username,
      },
    });

    if (createUserError) {
      console.error('Error creating user:', createUserError);
      return NextResponse.json(
        { error: 'Error al crear la cuenta' },
        { status: 500 }
      );
    }

    const user = userData.user;

    // 2. Crear o actualizar perfil de usuario en la tabla user_profiles
    // Usamos upsert porque Supabase puede crear automáticamente un perfil básico
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: user.id,
        first_name: fullName.split(' ')[0],
        last_name: fullName.split(' ').slice(1).join(' ') || null,
        username: username,
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('Error creating/updating user profile:', profileError);
      // Intentar eliminar el usuario si falla la creación del perfil
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      return NextResponse.json(
        { error: 'Error creando perfil de usuario' },
        { status: 500 }
      );
    }

    // 3. Generar token de verificación e insertar en la tabla email_verifications
    const verificationToken = crypto.randomUUID();
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
      // Intentar eliminar el usuario si falla la generación del token
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      return NextResponse.json(
        { error: 'Error generando token de verificación' },
        { status: 500 }
      );
    }

    // 3. Construir URL de verificación
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/api/auth/confirm-email?token=${verificationToken}`;

    // 4. Preparar y enviar email con Nodemailer
    const emailHtml = generateVerificationEmailHtml({
      userName: fullName,
      verificationUrl,
    });
    
    const emailText = generateVerificationEmailText({
      userName: fullName,
      verificationUrl,
    });

    // En desarrollo, permitir envío real si SMTP_SEND_IN_DEVELOPMENT es true
    const isDevelopment = process.env.NODE_ENV === 'development';
    const sendInDevelopment = process.env.SMTP_SEND_IN_DEVELOPMENT === 'true';

    if (!isDevelopment || sendInDevelopment) {
      try {
        await sendEmail({
          to: email,
          subject: 'Verifica tu email en Lumen',
          html: emailHtml,
          text: emailText,
        });
        console.log(`Email enviado exitosamente a ${email}`);
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
      message: 'Cuenta creada. Por favor verifica tu correo electrónico.',
      requiresVerification: true,
      // Solo devolver token y URL en desarrollo si está permitido
      ...(isDevelopment && sendInDevelopment ? { token: verificationToken, verificationUrl } : {}),
    });

  } catch (error) {
    console.error('Error en register:', error);
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorMessage = isDevelopment 
      ? (error instanceof Error ? error.message : 'Error desconocido')
      : 'Error interno del servidor';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}