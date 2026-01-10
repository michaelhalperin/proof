/**
 * Input validation and sanitization utilities
 */

/**
 * Validate email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || !email.trim()) {
    return { valid: false, error: 'Email is required' };
  }

  const trimmedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  // Check length
  if (trimmedEmail.length > 254) {
    return { valid: false, error: 'Email address is too long' };
  }

  return { valid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; error?: string; strength?: 'weak' | 'medium' | 'strong' } {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password is too long (maximum 128 characters)' };
  }

  // Check for common weak passwords
  const commonPasswords = ['password', '123456', '12345678', 'qwerty', 'abc123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    return { valid: true, strength: 'weak', error: 'This is a commonly used password. Consider using a stronger one.' };
  }

  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  let score = 0;

  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score >= 4) strength = 'strong';
  else if (score >= 3) strength = 'medium';

  return { valid: true, strength };
}

/**
 * Validate name
 */
export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name || !name.trim()) {
    return { valid: false, error: 'Name is required' };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }

  if (trimmedName.length > 100) {
    return { valid: false, error: 'Name is too long (maximum 100 characters)' };
  }

  // Check for suspicious characters (basic XSS prevention)
  if (/[<>]/.test(trimmedName)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }

  return { valid: true };
}

/**
 * Sanitize user input (basic XSS prevention)
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate PIN code format (6 digits)
 */
export function validatePin(pin: string): { valid: boolean; error?: string } {
  if (!pin || !pin.trim()) {
    return { valid: false, error: 'PIN code is required' };
  }

  const trimmedPin = pin.trim();

  if (!/^\d{6}$/.test(trimmedPin)) {
    return { valid: false, error: 'PIN code must be exactly 6 digits' };
  }

  return { valid: true };
}

/**
 * Validate note text
 */
export function validateNote(note: string): { valid: boolean; error?: string } {
  if (!note) {
    return { valid: true }; // Note is optional
  }

  if (note.length > 500) {
    return { valid: false, error: 'Note cannot exceed 500 characters' };
  }

  return { valid: true };
}

/**
 * Validate tag
 */
export function validateTag(tag: string): { valid: boolean; error?: string } {
  if (!tag || !tag.trim()) {
    return { valid: false, error: 'Tag cannot be empty' };
  }

  const trimmedTag = tag.trim();

  if (trimmedTag.length > 30) {
    return { valid: false, error: 'Tag cannot exceed 30 characters' };
  }

  // Only allow alphanumeric, spaces, hyphens, and underscores
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmedTag)) {
    return { valid: false, error: 'Tag can only contain letters, numbers, spaces, hyphens, and underscores' };
  }

  return { valid: true };
}

