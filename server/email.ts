import sgMail from '@sendgrid/mail';

// For development, we'll provide a fallback for when SendGrid is not configured
const isDevelopment = process.env.NODE_ENV !== 'production';
const hasSendgridKey = !!process.env.SENDGRID_API_KEY;

// Configure SendGrid if API key is available
if (hasSendgridKey) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
}

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email with SendGrid or log it if in development
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  // If we don't have a SendGrid key and we're in development, just log the email
  if (!hasSendgridKey && isDevelopment) {
    console.log('\n==== DEV EMAIL ====');
    console.log(`To: ${params.to}`);
    console.log(`Subject: ${params.subject}`);
    console.log('Content:');
    console.log(params.html || params.text);
    console.log('==== END EMAIL ====\n');
    return true;
  }
  
  // If we're in production but don't have a key, report an error
  if (!hasSendgridKey && !isDevelopment) {
    console.error('SendGrid API key is required in production');
    return false;
  }
  
  // Otherwise, use SendGrid to send the email
  try {
    await sgMail.send({
      to: params.to,
      from: process.env.SENDGRID_FROM_EMAIL as string || 'noreply@teleclone.app',
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send a verification email
 */
export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'Verifique seu email no TeleClone',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0088cc;">Verificação de Email TeleClone</h2>
        <p>Obrigado por se registrar no TeleClone!</p>
        <p>Seu código de verificação é: <strong>${code}</strong></p>
        <p>Digite este código na tela de verificação para completar seu registro.</p>
        <p>Se você não se registrou no TeleClone, por favor ignore este email.</p>
      </div>
    `,
    text: `Seu código de verificação do TeleClone é: ${code}\n\nDigite este código na tela de verificação para completar seu registro.\n\nSe você não se registrou no TeleClone, por favor ignore este email.`
  });
}
