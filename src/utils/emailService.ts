import { RESEND_API_KEY, EMAIL_FROM, APP_NAME } from "../config/env";
import { logError, logInfo } from "./logger";

const RESEND_API_URL = "https://api.resend.com/emails";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using Resend API
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<void> {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML tags for text version
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to send email: ${response.statusText}`
      );
    }

    const result = await response.json();
    logInfo("Email sent successfully", { emailId: result.id, to });
  } catch (error: any) {
    logError("Error sending email", { to, subject }, error);
    throw new Error(error.message || "Failed to send email");
  }
}

/**
 * Generate a 6-digit PIN code
 */
function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send email verification email with PIN code
 */
export async function sendVerificationEmail(
  email: string,
  pinCode: string,
  userName: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #fff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 30px;">
          <h1 style="color: #000; margin-top: 0;">Verify Your Email</h1>
          <p>Hi ${userName},</p>
          <p>Thank you for signing up for ${APP_NAME}! Please verify your email address using the PIN code below:</p>
          <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
            <p style="font-size: 12px; color: #666; margin: 0 0 10px 0;">Your verification PIN:</p>
            <p style="font-size: 36px; font-weight: 700; color: #000; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${pinCode}</p>
          </div>
          <p style="color: #666; font-size: 14px;">Enter this PIN code in the ${APP_NAME} app to verify your email address.</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">This PIN will expire in 10 minutes.</p>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">If you didn't create an account with ${APP_NAME}, you can safely ignore this email.</p>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `Your ${APP_NAME} verification PIN`,
    html,
  });
}

/**
 * Export PIN generator for use in auth functions
 */
export { generatePin };

/**
 * Send password reset email with PIN code
 */
export async function sendPasswordResetEmail(
  email: string,
  pinCode: string,
  userName: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #fff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 30px;">
          <h1 style="color: #000; margin-top: 0;">Reset Your Password</h1>
          <p>Hi ${userName},</p>
          <p>We received a request to reset your password for your ${APP_NAME} account. Use the PIN code below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
            <p style="font-size: 12px; color: #666; margin: 0 0 10px 0;">Your password reset PIN:</p>
            <p style="font-size: 36px; font-weight: 700; color: #000; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${pinCode}</p>
          </div>
          <p style="color: #666; font-size: 14px;">Enter this PIN code in the ${APP_NAME} app to reset your password.</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">This PIN will expire in 10 minutes.</p>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `Your ${APP_NAME} password reset PIN`,
    html,
  });
}
