import * as SQLite from "expo-sqlite";
import * as Crypto from "expo-crypto";

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: number;
  emailVerified?: boolean | number; // SQLite stores as INTEGER (0 or 1)
  emailVerificationToken?: string | null;
  emailVerificationTokenExpiry?: number | null;
  passwordResetToken?: string | null;
  passwordResetTokenExpiry?: number | null;
}

let authDb: SQLite.SQLiteDatabase | null = null;

export async function initAuthDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (authDb) {
    return authDb;
  }

  authDb = await SQLite.openDatabaseAsync("proof_auth.db");

  await authDb.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      emailVerified INTEGER DEFAULT 0,
      emailVerificationToken TEXT,
      emailVerificationTokenExpiry INTEGER,
      passwordResetToken TEXT,
      passwordResetTokenExpiry INTEGER
    );
  `);

  // Add new columns if they don't exist (migration)
  try {
    await authDb.execAsync(`
      ALTER TABLE users ADD COLUMN emailVerified INTEGER DEFAULT 0;
    `);
  } catch (e) {
    // Column may already exist, ignore
  }

  try {
    await authDb.execAsync(`
      ALTER TABLE users ADD COLUMN emailVerificationToken TEXT;
    `);
  } catch (e) {
    // Column may already exist, ignore
  }

  try {
    await authDb.execAsync(`
      ALTER TABLE users ADD COLUMN emailVerificationTokenExpiry INTEGER;
    `);
  } catch (e) {
    // Column may already exist, ignore
  }

  try {
    await authDb.execAsync(`
      ALTER TABLE users ADD COLUMN passwordResetToken TEXT;
    `);
  } catch (e) {
    // Column may already exist, ignore
  }

  try {
    await authDb.execAsync(`
      ALTER TABLE users ADD COLUMN passwordResetTokenExpiry INTEGER;
    `);
  } catch (e) {
    // Column may already exist, ignore
  }

  return authDb;
}

export async function createUser(
  email: string,
  password: string,
  name: string,
  emailVerificationPin?: string
): Promise<string> {
  const database = await initAuthDatabase();
  const id = Crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  const createdAt = Date.now();
  const emailVerificationTokenExpiry = emailVerificationPin
    ? Date.now() + 10 * 60 * 1000 // 10 minutes
    : null;

  await database.runAsync(
    `INSERT INTO users (id, email, name, passwordHash, createdAt, emailVerified, emailVerificationToken, emailVerificationTokenExpiry) 
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    [
      id,
      email.toLowerCase().trim(),
      name.trim(),
      passwordHash,
      createdAt,
      emailVerificationPin || null,
      emailVerificationTokenExpiry,
    ]
  );

  return id;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const database = await initAuthDatabase();
  const result = await database.getFirstAsync<User>(
    "SELECT * FROM users WHERE email = ?",
    [email.toLowerCase().trim()]
  );
  return result || null;
}

export async function hashPassword(password: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password,
    { encoding: Crypto.CryptoEncoding.HEX }
  );
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === storedHash;
}

export async function changeUserPassword(
  email: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const database = await initAuthDatabase();

  // Get user and verify current password
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error("User not found");
  }

  const isValidCurrentPassword = await verifyPassword(
    currentPassword,
    user.passwordHash
  );
  if (!isValidCurrentPassword) {
    throw new Error("Current password is incorrect");
  }

  // Hash new password and update
  const newPasswordHash = await hashPassword(newPassword);

  await database.runAsync("UPDATE users SET passwordHash = ? WHERE email = ?", [
    newPasswordHash,
    email.toLowerCase().trim(),
  ]);
}

export async function deleteUser(email: string): Promise<void> {
  const database = await initAuthDatabase();

  // Verify user exists
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error("User not found");
  }

  // Delete user
  await database.runAsync("DELETE FROM users WHERE email = ?", [
    email.toLowerCase().trim(),
  ]);
}

/**
 * Verify email with token
 */
export async function verifyEmail(
  email: string,
  token: string
): Promise<boolean> {
  const database = await initAuthDatabase();
  const user = await getUserByEmail(email);

  if (!user || !user.emailVerificationToken || user.emailVerified) {
    return false;
  }

  // Check token and expiry
  if (user.emailVerificationToken !== token) {
    return false;
  }

  if (
    user.emailVerificationTokenExpiry &&
    user.emailVerificationTokenExpiry < Date.now()
  ) {
    return false;
  }

  // Mark email as verified
  await database.runAsync(
    "UPDATE users SET emailVerified = 1, emailVerificationToken = NULL, emailVerificationTokenExpiry = NULL WHERE email = ?",
    [email.toLowerCase().trim()]
  );

  return true;
}

/**
 * Set password reset PIN code
 */
export async function setPasswordResetToken(
  email: string,
  pin: string
): Promise<void> {
  const database = await initAuthDatabase();
  const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

  await database.runAsync(
    "UPDATE users SET passwordResetToken = ?, passwordResetTokenExpiry = ? WHERE email = ?",
    [pin, expiry, email.toLowerCase().trim()]
  );
}

/**
 * Verify password reset PIN code (without resetting password)
 */
export async function verifyPasswordResetPin(
  email: string,
  pin: string
): Promise<boolean> {
  const user = await getUserByEmail(email);

  if (!user) {
    return false;
  }

  if (!user.passwordResetToken || user.passwordResetToken !== pin.trim()) {
    return false;
  }

  if (
    user.passwordResetTokenExpiry &&
    user.passwordResetTokenExpiry < Date.now()
  ) {
    return false;
  }

  return true;
}

/**
 * Reset password with PIN code
 */
export async function resetPasswordWithToken(
  email: string,
  pin: string,
  newPassword: string
): Promise<boolean> {
  const database = await initAuthDatabase();
  const user = await getUserByEmail(email);

  if (!user) {
    return false;
  }

  if (!user.passwordResetToken || user.passwordResetToken !== pin.trim()) {
    return false;
  }

  if (
    user.passwordResetTokenExpiry &&
    user.passwordResetTokenExpiry < Date.now()
  ) {
    return false;
  }

  // Update password and clear reset token
  const newPasswordHash = await hashPassword(newPassword);
  await database.runAsync(
    "UPDATE users SET passwordHash = ?, passwordResetToken = NULL, passwordResetTokenExpiry = NULL WHERE email = ?",
    [newPasswordHash, email.toLowerCase().trim()]
  );

  return true;
}

/**
 * Generate new email verification PIN code
 */
export async function generateEmailVerificationPin(
  email: string
): Promise<string> {
  const database = await initAuthDatabase();
  // Generate 6-digit PIN
  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

  await database.runAsync(
    "UPDATE users SET emailVerificationToken = ?, emailVerificationTokenExpiry = ? WHERE email = ?",
    [pin, expiry, email.toLowerCase().trim()]
  );

  return pin;
}
