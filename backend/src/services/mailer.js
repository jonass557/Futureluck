import nodemailer from 'nodemailer';

export async function sendOtpEmail({ to, fullName, otp }) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.log(`[FutureLuck OTP Email Demo] Destinataire: ${to} | Code OTP: ${otp}`);
    return { sent: false, demoMode: true };
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"FutureLuck" <${user}>`,
    to,
    subject: 'FutureLuck — Code OTP de réinitialisation de mot de passe',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
        <h2 style="color: #0033B3; margin-top: 0;">FutureLuck — Réinitialisation</h2>
        <p>Bonjour <strong>${fullName || 'Utilisateur'}</strong>,</p>
        <p>Voici votre code OTP pour réinitialiser votre mot de passe :</p>
        <div style="background: #EEF4FF; color: #001B6B; font-size: 28px; font-weight: 900; letter-spacing: 6px; text-align: center; padding: 16px; border-radius: 12px; margin: 16px 0;">
          ${otp}
        </div>
        <p style="font-size: 13px; color: #64748b;">Ce code expire dans 15 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      </div>
    `,
  });

  return { sent: true, demoMode: false };
}
