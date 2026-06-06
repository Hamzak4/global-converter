import nodemailer from 'nodemailer';

// Simple in-memory mailbox to store simulated emails so the client UI can show them beautifully
export interface SimulatedEmail {
  id: string;
  to: string;
  subject: string;
  message: string;
  code: string;
  timestamp: string;
}

export const simulatedMailbox: SimulatedEmail[] = [];

// Transporter lazy initialization
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_PASS;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');

  if (user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
    console.log('Nodemailer SMTP Transporter initialized successfully.');
  }
  return transporter;
}

export async function sendOtpEmail(email: string, _name: string, code: string): Promise<boolean> {
  const subject = 'Verify Your ConvertHub Account';
  const message = `Welcome to ConvertHub.

Your verification code is:

${code}

This code expires in 10 minutes.`;

  // Always store in simulated mailbox so user can view it inside our UI without custom SMTP
  simulatedMailbox.push({
    id: Math.random().toString(36).slice(-8),
    to: email,
    subject,
    message,
    code,
    timestamp: new Date().toISOString()
  });

  const mailTransporter = getTransporter();
  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'ConvertHub Platform'}" <${process.env.SMTP_USER || 'no-reply@converthub-global.com'}>`,
        to: email,
        subject,
        text: message
      });
      console.log(`Verification OTP email successfully sent to ${email} via SMTP.`);
      return true;
    } catch (err) {
      console.error(`Failed to send verification email to ${email} via SMTP:`, err);
    }
  }

  console.log(`
┌────────────────────────────────────────────────────────┐
│               CONVERTHUB EMAIL SIMULATOR               │
├────────────────────────────────────────────────────────┤
│ To:      ${email}
│ Subject: ${subject}
│ Code:    ${code} (Expires in 10 min)
├────────────────────────────────────────────────────────┤
│ ${message.replace(/\n/g, '\n│ ')}
└────────────────────────────────────────────────────────┘
`);
  return false;
}

export async function sendResetEmail(email: string, code: string): Promise<boolean> {
  const subject = 'Reset Your ConvertHub Password';
  const message = `We received a request to reset your ConvertHub password.

Your secure 6-digit confirmation password reset code is:

${code}

This code expires in 10 minutes.`;

  simulatedMailbox.push({
    id: Math.random().toString(36).slice(-8),
    to: email,
    subject,
    message,
    code,
    timestamp: new Date().toISOString()
  });

  const mailTransporter = getTransporter();
  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'ConvertHub Platform'}" <${process.env.SMTP_USER || 'no-reply@converthub-global.com'}>`,
        to: email,
        subject,
        text: message
      });
      console.log(`Password reset email successfully sent to ${email} via SMTP.`);
      return true;
    } catch (err) {
      console.error(`Failed to send password-reset email to ${email} via SMTP:`, err);
    }
  }

  console.log(`
┌────────────────────────────────────────────────────────┐
│               CONVERTHUB EMAIL SIMULATOR               │
├────────────────────────────────────────────────────────┤
│ To:      ${email}
│ Subject: ${subject}
│ Code:    ${code} (Expires in 10 min)
├────────────────────────────────────────────────────────┤
│ ${message.replace(/\n/g, '\n│ ')}
└────────────────────────────────────────────────────────┘
`);
  return false;
}
