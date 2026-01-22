import { 
  RESEND_API_KEY, 
  EMAIL_FROM, 
  APP_NAME, 
  SUPPORT_EMAIL,
  EMAILJS_SERVICE_ID,
  EMAILJS_TEMPLATE_ID,
  EMAILJS_PUBLIC_KEY,
} from "../config/env";
import { logError, logInfo } from "./logger";

const RESEND_API_URL = "https://api.resend.com/emails";
const EMAILJS_API_URL = "https://api.emailjs.com/api/v1.0/email/send";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

/**
 * Send an email using EmailJS API
 * Note: EmailJS blocks non-browser requests, so we add browser-like headers
 */
async function sendEmailViaEmailJS({
  to,
  subject,
  html,
  text,
  templateParams,
}: SendEmailOptions & { templateParams?: Record<string, any> }): Promise<void> {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    throw new Error("EmailJS is not fully configured. Missing EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, or EMAILJS_PUBLIC_KEY");
  }

  try {
    // EmailJS requires the recipient email in template_params
    // The template should have {{to_email}} variable
    const response = await fetch(EMAILJS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        "Origin": "https://emailjs.com",
        "Referer": "https://emailjs.com/",
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: to,
          subject: subject,
          message: html || text || "",
          html_content: html || "",
          text_content: text || html?.replace(/<[^>]*>/g, "") || "",
          ...templateParams,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `EmailJS API error: ${errorText}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.text || errorMessage;
      } catch {
        // Use the text as-is if not JSON
      }
      throw new Error(errorMessage);
    }

    logInfo("Email sent successfully via EmailJS", { to, subject });
  } catch (error: any) {
    logError("Error sending email via EmailJS", { to, subject }, error);
    throw error;
  }
}

/**
 * Send an email using Resend API
 */
async function sendEmailViaResend({
  to,
  subject,
  html,
  text,
  replyTo,
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
        reply_to: replyTo,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML tags for text version
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Failed to send email: ${response.statusText}`;
      const error = new Error(errorMessage);
      // Attach additional error info for better detection
      (error as any).status = response.status;
      (error as any).errorData = errorData;
      throw error;
    }

    const result = await response.json();
    logInfo("Email sent successfully via Resend", { emailId: result.id, to });
  } catch (error: any) {
    logError("Error sending email via Resend", { to, subject, status: error.status, errorData: error.errorData }, error);
    throw error;
  }
}

/**
 * Send an email using Resend API (default for all emails except support)
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  templateParams,
}: SendEmailOptions & { templateParams?: Record<string, any> }): Promise<void> {
  // Always use Resend for regular emails (verification, password reset, etc.)
  return sendEmailViaResend({ to, subject, html, text, replyTo });
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
 * Send a support email from the app to the SUPPORT_EMAIL address
 * Falls back to user's email if Resend free tier limitation prevents sending to SUPPORT_EMAIL
 */
export async function sendSupportEmail(
  subject: string,
  message: string,
  userEmail?: string | null
): Promise<void> {
  const safeSubject = subject.trim() || "Proof Support Request";
  const safeMessage = message.trim() || "(no message provided)";

  const userLine = userEmail
    ? `<p style="background-color: #f0f7ff; padding: 12px; border-left: 4px solid #007AFF; margin-bottom: 20px;"><strong>📧 From User:</strong> <a href="mailto:${userEmail}" style="color: #007AFF; text-decoration: none;">${userEmail}</a></p>`
    : "";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${APP_NAME} Support Request</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #fff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 30px;">
          <h1 style="color: #000; margin-top: 0; font-size: 22px;">New Support Request</h1>
          ${userLine}
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap; margin-top: 8px; background-color: #f8f9fa; padding: 15px; border-radius: 6px;">${safeMessage}</p>
          ${userEmail ? `<p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e5e5; color: #666; font-size: 14px;"><strong>Reply to:</strong> <a href="mailto:${userEmail}" style="color: #007AFF;">${userEmail}</a></p>` : ""}
        </div>
      </body>
    </html>
  `;

  // Use EmailJS for support emails if configured, otherwise try Resend
  if (SUPPORT_EMAIL) {
    // Check if EmailJS is configured for support emails
    const useEmailJS = EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY;
    
    if (useEmailJS) {
      // Use EmailJS for support emails
      try {
        logInfo("Sending support email via EmailJS to SUPPORT_EMAIL", { 
          supportEmail: SUPPORT_EMAIL, 
          userEmail,
          subject: safeSubject
        });
        
        const templateParams = {
          to_email: SUPPORT_EMAIL, // Recipient (support email)
          from_email: userEmail || "unknown@user.com", // User's email (for display in template)
          user_email: userEmail || "Unknown", // User's email (alias)
          support_email: SUPPORT_EMAIL,
          subject: safeSubject,
          message: safeMessage,
          reply_to: userEmail || "", // For reply-to functionality
        };
        
        await sendEmailViaEmailJS({
          to: SUPPORT_EMAIL,
          subject: `[${APP_NAME} Support] ${safeSubject}`,
          html,
          templateParams,
        });
        
        logInfo("Support email successfully sent to SUPPORT_EMAIL via EmailJS", { supportEmail: SUPPORT_EMAIL });
        return; // Success
      } catch (error: any) {
        logError("Failed to send support email via EmailJS", {
          supportEmail: SUPPORT_EMAIL,
          errorMessage: error.message,
        }, error);
        throw error;
      }
    } else {
      // Fall back to Resend if EmailJS is not configured
      try {
        logInfo("Attempting to send support email to SUPPORT_EMAIL via Resend", { 
          supportEmail: SUPPORT_EMAIL, 
          userEmail,
          subject: safeSubject
        });
        
        await sendEmailViaResend({
          to: SUPPORT_EMAIL,
          subject: `[${APP_NAME} Support] ${safeSubject}`,
          html,
          replyTo: userEmail || undefined,
        });
        
        logInfo("Support email successfully sent to SUPPORT_EMAIL via Resend", { supportEmail: SUPPORT_EMAIL });
        return; // Success
      } catch (error: any) {
        // Check if it's the Resend free tier limitation
        const errorMessage = (error.message || "").toLowerCase();
        const status = error.status;
        const errorData = error.errorData || {};
        
        const isResendLimitation = 
          errorMessage.includes("only send testing emails") ||
          errorMessage.includes("verify a domain") ||
          errorMessage.includes("domain verification") ||
          errorMessage.includes("not authorized") ||
          errorMessage.includes("forbidden") ||
          status === 403 ||
          (status === 422 && (errorMessage.includes("email") || errorMessage.includes("domain")));
        
        logError("Failed to send support email to SUPPORT_EMAIL via Resend", {
          supportEmail: SUPPORT_EMAIL,
          errorMessage: error.message,
          status,
          errorData,
          isResendLimitation
        }, error);
        
        if (isResendLimitation) {
          // Fall back to user's email if Resend fails and EmailJS not configured
          if (userEmail) {
            logInfo(
              "Support email sent to user's email due to Resend free tier limitation (EmailJS not configured)",
              { userEmail, attemptedSupportEmail: SUPPORT_EMAIL }
            );
            await sendEmailViaResend({
              to: userEmail,
              subject: `[${APP_NAME} Support Request - Copy] ${safeSubject}`,
              html: html.replace(
                "<h1",
                '<h1 style="color: #FF6B00; margin-top: 0; font-size: 22px;">⚠️ Support Request (Sent to your email due to Resend limitation)</h1><p style="background-color: #FFF3E0; padding: 12px; border-radius: 6px; margin-bottom: 20px; color: #E65100; font-size: 14px;"><strong>Note:</strong> This support request was sent to your email because Resend\'s free tier only allows sending to your verified email address. Configure EmailJS to send directly to support.</p><h1'
              ),
              replyTo: userEmail,
            });
            return;
          }
        }
        // Re-throw if it's a different error or no user email available
        throw error;
      }
    }
  }

  // If SUPPORT_EMAIL is not configured, try user's email as fallback
  if (userEmail) {
    logInfo("Support email sent to user's email (SUPPORT_EMAIL not configured)", {
      userEmail,
    });
    await sendEmail({
      to: userEmail,
      subject: `[${APP_NAME} Support Request - Copy] ${safeSubject}`,
      html: html.replace(
        "<h1",
        '<h1 style="color: #FF6B00; margin-top: 0; font-size: 22px;">⚠️ Support Request (Sent to your email)</h1><p style="background-color: #FFF3E0; padding: 12px; border-radius: 6px; margin-bottom: 20px; color: #E65100; font-size: 14px;"><strong>Note:</strong> This support request was sent to your email because SUPPORT_EMAIL is not configured.</p><h1'
      ),
      replyTo: userEmail,
    });
    return;
  }

  // Last resort: throw error
  throw new Error(
    "SUPPORT_EMAIL is not configured and no user email is available"
  );
}

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
