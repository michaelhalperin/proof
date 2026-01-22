import Constants from "expo-constants";

// Get environment variables from app.json extra or default values
const getEnvVar = (key: string, defaultValue?: string): string => {
  const value =
    Constants.expoConfig?.extra?.[key] || process.env[key] || defaultValue;
  if (!value) {
    console.warn(`Environment variable ${key} is not set`);
  }
  return value || "";
};

export const RESEND_API_KEY = getEnvVar("RESEND_API_KEY");

// Email configuration
export const EMAIL_FROM = getEnvVar("EMAIL_FROM", "onboarding@resend.dev");
export const SUPPORT_EMAIL = getEnvVar("SUPPORT_EMAIL");
export const APP_NAME = "Proof";

// EmailJS configuration (for support emails)
export const EMAILJS_SERVICE_ID = getEnvVar("EMAILJS_SERVICE_ID");
export const EMAILJS_TEMPLATE_ID = getEnvVar("EMAILJS_TEMPLATE_ID");
export const EMAILJS_PUBLIC_KEY = getEnvVar("EMAILJS_PUBLIC_KEY");

// Log SUPPORT_EMAIL configuration for debugging
if (!SUPPORT_EMAIL) {
  console.warn("⚠️ SUPPORT_EMAIL is not configured. Support emails will not be sent to support address.");
} else {
  console.log("✓ SUPPORT_EMAIL configured:", SUPPORT_EMAIL);
}
