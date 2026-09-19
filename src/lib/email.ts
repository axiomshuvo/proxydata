import nodemailer from "nodemailer";
import { env } from "./env";
import { logRuntime } from "./runtime-log";

// Hostinger SMTP configuration
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  secure: Number(env.SMTP_PORT) === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const info = await transporter.sendMail({
      from: `"ProxyData Alerts" <${env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    logRuntime({ level: "INFO", source: "email", operation: "EMAIL_SEND", status: "SUCCESS", message: `Email sent: ${subject}` });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("SMTP Delivery Failed:", error);
    logRuntime({ level: "ERROR", source: "email", operation: "EMAIL_SEND", status: "FAILED", message: `SMTP failed: ${subject}` });
    // Fail silently so it doesn't crash the main transaction thread,
    // but log it for PM2 logs.
    return { success: false, error };
  }
}
