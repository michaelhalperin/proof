import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";

export interface IUser extends Document {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: number;
  emailVerified?: boolean;
  emailVerificationToken?: string | null;
  emailVerificationTokenExpiry?: number | null;
  passwordResetToken?: string | null;
  passwordResetTokenExpiry?: number | null;
}

const UserSchema = new Schema<IUser>({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  name: { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Number, required: true },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationTokenExpiry: { type: Number },
  passwordResetToken: { type: String },
  passwordResetTokenExpiry: { type: Number },
}, {
  timestamps: false,
});

const SALT_ROUNDS = 10;

/** Hash a plain password with bcrypt (for new signups and password resets). */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** Legacy SHA256 hash (for backward compatibility when verifying old stored hashes). */
export function legacyHashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Verify password against stored hash.
 * Supports both bcrypt (new) and legacy SHA256 hashes.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;
  // Bcrypt hashes start with $2
  if (storedHash.startsWith("$2")) {
    return bcrypt.compare(password, storedHash);
  }
  // Legacy SHA256 (64 hex chars)
  const legacyHash = legacyHashPassword(password);
  return legacyHash === storedHash;
}

export const User = mongoose.model<IUser>("User", UserSchema);
