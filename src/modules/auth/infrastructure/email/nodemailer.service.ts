import nodemailer from 'nodemailer';
import { getBaseUrl } from '@/lib/get-base-url';


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}


export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  const fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@lumen-app.com';

  const mailOptions = {
    from: {
      name: 'Lumen - Media Tracker',
      address: fromEmail,
    },
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''), 
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email enviado a ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error enviando email:', error);
    throw new Error('Error enviando email de verificación');
  }
}


export function generateVerificationEmailHtml({
  userName,
  verificationUrl,
}: {
  userName: string;
  verificationUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifica tu email - Lumen</title>
  <style>
    /* Reset y estilos base */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%);
      color: #ededed;
      line-height: 1.6;
      padding: 20px;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #16161a;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }
    
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      padding: 40px 30px;
      text-align: center;
    }
    
    .logo {
      width: 60px;
      height: 60px;
      background: white;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 15px;
    }
    
    .logo-text {
      font-size: 28px;
      font-weight: bold;
      color: #6366f1;
    }
    
    .header h1 {
      font-size: 24px;
      color: white;
      margin-bottom: 10px;
    }
    
    .header p {
      color: rgba(255, 255, 255, 0.9);
      font-size: 16px;
    }
    
    .content {
      padding: 40px 30px;
    }
    
    .greeting {
      font-size: 18px;
      margin-bottom: 25px;
      color: #ededed;
    }
    
    .message {
      color: #a0a0a0;
      margin-bottom: 30px;
      line-height: 1.7;
    }
    
    .cta-container {
      text-align: center;
      margin: 40px 0;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: white;
      text-decoration: none;
      padding: 15px 40px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }
    
    .alt-link {
      color: #6366f1;
      text-decoration: none;
      font-size: 14px;
    }
    
    .alt-link:hover {
      text-decoration: underline;
    }
    
    .footer {
      background: #0f0f0f;
      padding: 25px 30px;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    
    .footer a {
      color: #666;
      text-decoration: none;
    }
    
    .footer a:hover {
      color: #888;
    }
    
    .disclaimer {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #333;
      color: #555;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <img src="${getBaseUrl()}/images/lumen-logo.png" alt="Lumen Logo" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
      <h1>Verifica tu cuenta</h1>
      <p>Media Tracker para tus películas, series y videojuegos</p>
    </div>
    
    <div class="content">
      <p class="greeting">Hola, ${userName}</p>
      
      <p class="message">
        Gracias por registrarte en Lumen. Para completar tu registro y comenzar a 
        trackear tu contenido favorito, por favor verifica tu dirección de correo electrónico.
      </p>
      
      <div class="cta-container">
        <a href="${verificationUrl}" class="cta-button">
          Verificar mi email
        </a>
      </div>
      
      <p class="message" style="text-align: center; font-size: 14px;">
        O copia y pega este link en tu navegador:
        <br>
        <a href="${verificationUrl}" class="alt-link">${verificationUrl}</a>
      </p>
    </div>
    
    <div class="footer">
      <p>Lumen - Media Tracker</p>
      <p>Si no has creado una cuenta en Lumen, ignora este email.</p>
      
      <div class="disclaimer">
        Este email fue enviado automáticamente. Por favor, no respondas a este mensaje.
      </div>
    </div>
  </div>
</body>
</html>
  `;
}


export function generateVerificationEmailText({
  userName,
  verificationUrl,
}: {
  userName: string;
  verificationUrl: string;
}): string {
  return `
Hola, ${userName}

Gracias por registrarte en Lumen. Para completar tu registro y comenzar a trackear tu contenido favorito, por favor verifica tu dirección de correo electrónico.

Verifica tu email haciendo clic en el siguiente link:
${verificationUrl}

O copia y pega este link en tu navegador:
${verificationUrl}

---
Lumen - Media Tracker
Si no has creado una cuenta en Lumen, ignora este email.

Este email fue enviado automáticamente. Por favor, no respondas a este mensaje.
  `.trim();
}


export function generatePasswordResetEmailHtml({
  userName,
  resetUrl,
}: {
  userName: string;
  resetUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer contraseña - Lumen</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%);
      color: #ededed;
      line-height: 1.6;
      padding: 20px;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #16161a;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }
    
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      padding: 40px 30px;
      text-align: center;
    }
    
    .logo {
      width: 60px;
      height: 60px;
      background: white;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 15px;
    }
    
    .logo-text {
      font-size: 28px;
      font-weight: bold;
      color: #f59e0b;
    }
    
    .header h1 {
      font-size: 24px;
      color: white;
      margin-bottom: 10px;
    }
    
    .header p {
      color: rgba(255, 255, 255, 0.9);
      font-size: 16px;
    }
    
    .content {
      padding: 40px 30px;
    }
    
    .greeting {
      font-size: 18px;
      margin-bottom: 25px;
      color: #ededed;
    }
    
    .message {
      color: #a0a0a0;
      margin-bottom: 30px;
      line-height: 1.7;
    }
    
    .cta-container {
      text-align: center;
      margin: 40px 0;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      text-decoration: none;
      padding: 15px 40px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
    }
    
    .footer {
      background: #0f0f0f;
      padding: 25px 30px;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    
    .disclaimer {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #333;
      color: #555;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <img src="${getBaseUrl()}/images/lumen-logo.png" alt="Lumen Logo" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
      <h1>Restablecer contraseña</h1>
      <p>Media Tracker para tus películas, series y videojuegos</p>
    </div>
    
    <div class="content">
      <p class="greeting">Hola, ${userName}</p>
      
      <p class="message">
        Has solicitado restablecer tu contraseña de Lumen. Haz clic en el botón de abajo para crear una nueva contraseña.
      </p>
      
      <div class="cta-container">
        <a href="${resetUrl}" class="cta-button">
          Restablecer contraseña
        </a>
      </div>
      
      <p class="message" style="text-align: center; font-size: 14px;">
        Este enlace expirará en 15 minutos.
      </p>
    </div>
    
    <div class="footer">
      <p>Lumen - Media Tracker</p>
      <p>Si no has solicitado restablecer tu contraseña, ignora este email.</p>
      
      <div class="disclaimer">
        Este email fue enviado automáticamente. Por favor, no respondas a este mensaje.
      </div>
    </div>
  </div>
</body>
</html>
  `;
}


export function generatePasswordResetEmailText({
  userName,
  resetUrl,
}: {
  userName: string;
  resetUrl: string;
}): string {
  return `
Hola, ${userName}

Has solicitado restablecer tu contraseña de Lumen.

Haz clic en el siguiente link para restablecer tu contraseña:
${resetUrl}

Este enlace expirará en 15 minutos.

---
Lumen - Media Tracker
Si no has solicitado restablecer tu contraseña, ignora este email.

Este email fue enviado automáticamente. Por favor, no respondas a este mensaje.
  `.trim();
}