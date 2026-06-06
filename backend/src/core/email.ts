import nodemailer from "nodemailer";
import { env } from "./env";

function createTransporter() {
  if (!env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: (env.SMTP_PORT ?? 587) === 465,
    auth: env.SMTP_USER
      ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
      : undefined,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  code: string
): Promise<void> {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(
      `[DEV] Şifre sıfırlama kodu ${to} adresine gönderildi: ${code}`
    );
    return;
  }

  await transporter.sendMail({
    from: env.SMTP_FROM ?? `"Edu AI Asistan" <noreply@eduaiasistan.com>`,
    to,
    subject: "Şifrenizi Sıfırlayın",
    text: `Şifre sıfırlama kodunuz: ${code}\n\nBu kod 15 dakika geçerlidir.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#06080D;color:#E8EDF6;border-radius:16px">
        <h2 style="color:#2BE26E;margin-bottom:8px">Şifre Sıfırlama</h2>
        <p>Aşağıdaki kodu kullanarak şifrenizi sıfırlayabilirsiniz:</p>
        <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#2BE26E;background:#0E1219;padding:16px 24px;border-radius:12px;text-align:center;margin:20px 0">
          ${code}
        </div>
        <p style="color:#8A93A2;font-size:13px">Bu kod 15 dakika geçerlidir. Eğer bu isteği siz yapmadıysanız bu e-postayı dikkate almayın.</p>
      </div>
    `,
  });
}
