import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import {
  initAuthDatabase,
  createUser,
  login as serverLogin,
  getMe,
  getUserByEmail,
  deleteMe,
  verifyEmail,
  resetPasswordWithToken,
  verifyPasswordResetPin,
  generateEmailVerificationPin,
  setPasswordResetToken,
} from "../db/auth";
import { getAuthToken, setAuthToken, clearAuthToken } from "../utils/authToken";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  generatePin,
} from "../utils/emailService";
import {
  checkRateLimit,
  recordRateLimitAttempt,
  resetRateLimit,
  getRateLimitErrorMessage,
} from "../utils/rateLimiter";
import { logError, logInfo, logWarn } from "../utils/logger";

// User interface for AuthContext (excludes sensitive fields)
interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<string>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  verifyEmailToken: (email: string, token: string) => Promise<boolean>;
  resendVerificationEmail: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  verifyPasswordResetPin: (email: string, pin: string) => Promise<boolean>;
  resetPassword: (
    email: string,
    token: string,
    newPassword: string
  ) => Promise<boolean>;
  isEmailVerified: () => Promise<boolean>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize auth database
    initAuthDatabase().catch((error) => {
      logError("Failed to initialize auth database", {}, error);
    });
    // Check for stored session
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      const userData = await getMe();
      setUser({ id: userData.id, email: userData.email, name: userData.name });
    } catch (error) {
      logError("Error loading stored user", {}, error as Error);
      await clearAuthToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const rateLimitCheck = await checkRateLimit(email.toLowerCase(), "AUTH");
    if (!rateLimitCheck.allowed) {
      const errorMessage = getRateLimitErrorMessage(rateLimitCheck.lockedUntil);
      logWarn("Login rate limit exceeded", { email: email.toLowerCase() });
      throw new Error(errorMessage);
    }

    try {
      const { token, user: userData } = await serverLogin(email, password);
      await setAuthToken(token);
      setUser({ id: userData.id, email: userData.email, name: userData.name });
      await resetRateLimit(email.toLowerCase(), "AUTH");
      logInfo("User logged in successfully", { email: userData.email });
    } catch (error: any) {
      await recordRateLimitAttempt(email.toLowerCase(), "AUTH");
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        throw new Error("Email already registered");
      }

      // Generate 6-digit verification PIN
      const verificationPin = generatePin();

      const userId = await createUser(email, password, name, verificationPin);

      // Send verification email with PIN
      try {
        await sendVerificationEmail(email, verificationPin, name);
      } catch (emailError: any) {
        logError("Failed to send verification email", { email }, emailError);
        // Don't fail signup if email fails, but log it
      }

      // Don't auto-login after signup - user needs to verify email first
      // Return a special indicator instead of throwing error
      return userId;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await clearAuthToken();
      setUser(null);
      logInfo("User logged out");
    } catch (error) {
      logError("Error logging out", {}, error as Error);
    }
  };

  const deleteAccount = async () => {
    if (!user) {
      throw new Error("No user logged in");
    }

    try {
      await deleteMe();
      await clearAuthToken();
      setUser(null);
      logInfo("User account deleted", { email: user.email });
    } catch (error) {
      logError("Error deleting account", { email: user.email }, error as Error);
      throw error;
    }
  };

  const verifyEmailToken = async (
    email: string,
    pin: string
  ): Promise<boolean> => {
    // Check rate limit for PIN verification
    const rateLimitCheck = await checkRateLimit(email.toLowerCase(), "PIN_VERIFICATION");
    if (!rateLimitCheck.allowed) {
      const errorMessage = getRateLimitErrorMessage(rateLimitCheck.lockedUntil);
      logWarn("PIN verification rate limit exceeded", { email: email.toLowerCase() });
      throw new Error(errorMessage);
    }

    const isValid = await verifyEmail(email, pin);
    if (isValid) {
      // Reset rate limit on successful verification
      await resetRateLimit(email.toLowerCase(), "PIN_VERIFICATION");
      logInfo("Email verified successfully", { email });
    } else {
      // Record failed attempt
      await recordRateLimitAttempt(email.toLowerCase(), "PIN_VERIFICATION");
    }
    return isValid;
  };

  const resendVerificationEmail = async (email: string): Promise<void> => {
    // Check rate limit for email sending
    const rateLimitCheck = await checkRateLimit(email.toLowerCase(), "EMAIL");
    if (!rateLimitCheck.allowed) {
      const errorMessage = getRateLimitErrorMessage(rateLimitCheck.lockedUntil);
      logWarn("Resend verification email rate limit exceeded", { email: email.toLowerCase() });
      throw new Error(errorMessage);
    }

    const userData = await getUserByEmail(email);
    if (!userData) {
      // Don't reveal if email exists, but record attempt
      await recordRateLimitAttempt(email.toLowerCase(), "EMAIL");
      throw new Error("User not found");
    }

    const isVerified = userData.emailVerified === true;
    if (isVerified) {
      throw new Error("Email is already verified");
    }

    const pin = await generateEmailVerificationPin(email);
    try {
      await sendVerificationEmail(email, pin, userData.name);
      await recordRateLimitAttempt(email.toLowerCase(), "EMAIL");
      logInfo("Verification email resent", { email });
    } catch (error) {
      logError("Failed to resend verification email", { email }, error as Error);
      throw error;
    }
  };

  const requestPasswordReset = async (email: string): Promise<void> => {
    // Check rate limit for password reset
    const rateLimitCheck = await checkRateLimit(email.toLowerCase(), "EMAIL");
    if (!rateLimitCheck.allowed) {
      const errorMessage = getRateLimitErrorMessage(rateLimitCheck.lockedUntil);
      logWarn("Password reset rate limit exceeded", { email: email.toLowerCase() });
      throw new Error(errorMessage);
    }

    const userData = await getUserByEmail(email);
    if (!userData) {
      // Don't reveal if email exists for security, but record attempt
      await recordRateLimitAttempt(email.toLowerCase(), "EMAIL");
      return;
    }

    // Generate 6-digit reset PIN
    const resetPin = generatePin();

    await setPasswordResetToken(email, resetPin);

    // Send reset email with PIN
    try {
      await sendPasswordResetEmail(email, resetPin, userData.name);
      await recordRateLimitAttempt(email.toLowerCase(), "EMAIL");
      logInfo("Password reset email sent", { email });
    } catch (emailError: any) {
      logError("Failed to send password reset email", { email }, emailError);
      throw new Error("Failed to send password reset email");
    }
  };

  const verifyPasswordResetPinCode = async (
    email: string,
    pin: string
  ): Promise<boolean> => {
    return await verifyPasswordResetPin(email, pin);
  };

  const resetPassword = async (
    email: string,
    pin: string,
    newPassword: string
  ): Promise<boolean> => {
    return await resetPasswordWithToken(email, pin, newPassword);
  };

  const isEmailVerified = async (): Promise<boolean> => {
    if (!user) {
      return false;
    }
    try {
      const userData = await getMe();
      return userData.emailVerified === true;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        deleteAccount,
        verifyEmailToken,
        resendVerificationEmail,
        requestPasswordReset,
        verifyPasswordResetPin: verifyPasswordResetPinCode,
        resetPassword,
        isEmailVerified,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
