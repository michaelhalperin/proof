/**
 * User-friendly error messages
 * Converts technical errors into helpful messages for users
 */

export function getUserFriendlyError(error: unknown): string {
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network/Connection errors
    if (message.includes('network') || message.includes('connection') || message.includes('fetch')) {
      return 'Unable to connect. Please check your internet connection and try again.';
    }

    // Rate limiting errors
    if (message.includes('rate limit') || message.includes('too many attempts')) {
      return error.message; // Rate limiter already provides user-friendly messages
    }

    // Validation errors
    if (message.includes('invalid') || message.includes('required') || message.includes('must be')) {
      return error.message; // Validation errors are already user-friendly
    }

    // Authentication errors
    if (message.includes('user not found') || message.includes('invalid password')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }

    if (message.includes('email not verified') || message.includes('verify your email')) {
      return 'Please verify your email address before logging in. Check your inbox for the verification code.';
    }

    if (message.includes('email already registered')) {
      return 'This email is already registered. Please sign in or use a different email.';
    }

    // Permission errors
    if (message.includes('permission') || message.includes('access denied')) {
      return 'Permission required. Please grant the necessary permissions in your device settings.';
    }

    // File/Storage errors
    if (message.includes('file') || message.includes('storage') || message.includes('disk')) {
      return 'Storage error. Please ensure you have enough storage space and try again.';
    }

    // Database errors
    if (message.includes('database') || message.includes('sql') || message.includes('query')) {
      return 'Data error occurred. Please restart the app and try again.';
    }

    // Generic fallback - use original message if it seems user-friendly
    if (error.message.length < 100 && !error.message.includes('error:') && !error.message.includes('at ')) {
      return error.message;
    }

    // For technical errors, provide a generic message
    return 'Something went wrong. Please try again. If the problem persists, restart the app.';
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Format error for display with optional details
 */
export function formatError(error: unknown, showDetails: boolean = false): { message: string; details?: string } {
  const userMessage = getUserFriendlyError(error);
  
  if (!showDetails) {
    return { message: userMessage };
  }

  const details = error instanceof Error ? error.stack || error.message : String(error);
  return { message: userMessage, details };
}

