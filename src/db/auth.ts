import { apiGet, apiPost, apiPut, apiDelete } from "../utils/api";

export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified?: boolean;
  createdAt?: number;
}

interface GetUserResponse {
  user: User;
}

interface CreateUserResponse {
  id: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

interface VerifyPasswordResponse {
  valid: boolean;
}

interface VerifyEmailResponse {
  verified: boolean;
}

interface VerifyPasswordResetPinResponse {
  valid: boolean;
}

interface ResetPasswordResponse {
  success: boolean;
}

interface GenerateEmailVerificationPinResponse {
  pin: string;
}

/**
 * Initialize auth database connection (no-op for API-based implementation)
 */
export async function initAuthDatabase(): Promise<any> {
  return null;
}

/**
 * Server login: email + plain password. Returns JWT and user.
 */
export async function login(
  email: string,
  password: string
): Promise<{ token: string; user: User }> {
  const response = await apiPost<LoginResponse>("/auth/login", {
    email: email.trim().toLowerCase(),
    password,
  });
  return { token: response.token, user: response.user };
}

/**
 * Get current user from JWT (GET /auth/me).
 */
export async function getMe(): Promise<User> {
  const response = await apiGet<GetUserResponse>("/auth/me");
  return response.user;
}

/**
 * Create a new user (plain password; server hashes with bcrypt).
 */
export async function createUser(
  email: string,
  password: string,
  name: string,
  emailVerificationPin?: string
): Promise<string> {
  const response = await apiPost<CreateUserResponse>("/auth/signup", {
    email: email.trim().toLowerCase(),
    password,
    name: name.trim(),
    emailVerificationPin,
  });
  return response.id;
}

/**
 * Get user by email (returns safe fields only; no passwordHash or tokens).
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const response = await apiGet<GetUserResponse>(
      `/auth/user/${encodeURIComponent(email.toLowerCase().trim())}`
    );
    return response.user || null;
  } catch (error: any) {
    if (error.message?.includes("404") || error.message?.includes("not found")) {
      return null;
    }
    throw error;
  }
}

/**
 * Change user password (plain passwords; server hashes with bcrypt).
 */
export async function changeUserPassword(
  email: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await apiPut("/auth/change-password", {
    email: email.toLowerCase().trim(),
    currentPassword,
    newPassword,
  });
}

/**
 * Delete current user (requires JWT). Use this instead of deleteUser for authenticated delete.
 */
export async function deleteMe(): Promise<void> {
  await apiDelete("/auth/me");
}

/**
 * Delete user by email (unauthenticated; kept for compatibility).
 */
export async function deleteUser(email: string): Promise<void> {
  await apiDelete(`/auth/user/${encodeURIComponent(email)}`);
}

/**
 * Verify email with token
 */
export async function verifyEmail(
  email: string,
  token: string
): Promise<boolean> {
  try {
    const response = await apiPost<VerifyEmailResponse>("/auth/verify-email", {
      email: email.toLowerCase().trim(),
      token,
    });
    return response.verified;
  } catch (error) {
    return false;
  }
}

/**
 * Set password reset PIN code
 */
export async function setPasswordResetToken(
  email: string,
  pin: string
): Promise<void> {
  await apiPost("/auth/password-reset/set", {
    email: email.toLowerCase().trim(),
    pin,
  });
}

/**
 * Verify password reset PIN code (without resetting password)
 */
export async function verifyPasswordResetPin(
  email: string,
  pin: string
): Promise<boolean> {
  try {
    const response = await apiPost<VerifyPasswordResetPinResponse>(
      "/auth/password-reset/verify",
      {
        email: email.toLowerCase().trim(),
        pin,
      }
    );
    return response.valid;
  } catch (error) {
    return false;
  }
}

/**
 * Reset password with PIN code (plain newPassword; server hashes with bcrypt).
 */
export async function resetPasswordWithToken(
  email: string,
  pin: string,
  newPassword: string
): Promise<boolean> {
  try {
    const response = await apiPost<ResetPasswordResponse>(
      "/auth/password-reset/reset",
      {
        email: email.toLowerCase().trim(),
        pin,
        newPassword,
      }
    );
    return response.success;
  } catch (error) {
    return false;
  }
}

/**
 * Generate new email verification PIN code
 */
export async function generateEmailVerificationPin(
  email: string
): Promise<string> {
  const response = await apiPost<GenerateEmailVerificationPinResponse>(
    "/auth/email-verification/generate",
    {
      email: email.toLowerCase().trim(),
    }
  );
  return response.pin;
}
