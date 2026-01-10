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
export const APP_NAME = "Proof";
