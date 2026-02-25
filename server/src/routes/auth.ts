import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User, hashPassword, verifyPassword } from "../models/User";
import { requireAuth, AuthRequest, getSecret } from "../middleware/auth";
// Temporarily disable auth rate limiting
// import { authRateLimiter } from "../middleware/rateLimit";

const router = express.Router();

/** Apply rate limiting to all auth routes (temporarily disabled) */
// router.use(authRateLimiter);

/** Safe user fields (no passwordHash or tokens) */
function toSafeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified || false,
    createdAt: user.createdAt,
  };
}

// POST /auth/login - email + plain password, returns JWT and user
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();
    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        error: "Please verify your email address before logging in. Check your inbox for the verification email.",
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      getSecret(),
      { expiresIn: "7d" }
    );
    res.json({ token, user: toSafeUser(user) });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /auth/me - requires JWT, returns current user
router.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ id: req.user!.id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user: toSafeUser(user) });
  } catch (error) {
    console.error("Error getting current user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /auth/me - requires JWT, deletes authenticated user
router.delete("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await User.deleteOne({ id: req.user!.id });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a new user (plain password; server hashes with bcrypt)
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { email, password, name, emailVerificationPin } = req.body;

    const normalizedEmail = email?.toLowerCase().trim();
    if (!normalizedEmail || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name required" });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: "User already exists" });
    }

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    const createdAt = Date.now();
    const emailVerificationTokenExpiry = emailVerificationPin
      ? Date.now() + 10 * 60 * 1000
      : null;

    const user = new User({
      id,
      email: normalizedEmail,
      name: name.trim(),
      passwordHash,
      createdAt,
      emailVerified: false,
      emailVerificationToken: emailVerificationPin || null,
      emailVerificationTokenExpiry,
    });

    await user.save();
    res.status(201).json({ id });
  } catch (error: any) {
    console.error("Error creating user:", error);
    if (error.code === 11000) {
      return res.status(409).json({ error: "User already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user by email - returns ONLY safe fields (no passwordHash or tokens)
router.get("/user/:email", async (req: Request, res: Response) => {
  try {
    const email = req.params.email?.toLowerCase().trim();
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: toSafeUser(user) });
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify password (plain password; server uses verifyPassword which supports bcrypt + legacy)
router.post("/verify-password", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ error: "User not found", valid: false });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    res.json({ valid });
  } catch (error) {
    console.error("Error verifying password:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Change user password (plain current + new; server hashes new with bcrypt)
router.put("/change-password", async (req: Request, res: Response) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const newPasswordHash = await hashPassword(newPassword);
    await User.updateOne(
      { email: user.email },
      { $set: { passwordHash: newPasswordHash } }
    );

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete user by email (kept for compatibility; prefer DELETE /me with JWT)
router.delete("/user/:email", async (req: Request, res: Response) => {
  try {
    const email = req.params.email?.toLowerCase().trim();
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await User.deleteOne({ email });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify email
router.post("/verify-email", async (req: Request, res: Response) => {
  try {
    const { email, token } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase().trim() });

    if (!user || !user.emailVerificationToken || user.emailVerified) {
      return res.json({ verified: false });
    }

    if (user.emailVerificationToken !== token) {
      return res.json({ verified: false });
    }

    if (
      user.emailVerificationTokenExpiry &&
      user.emailVerificationTokenExpiry < Date.now()
    ) {
      return res.json({ verified: false });
    }

    await User.updateOne(
      { email: user.email },
      {
        $set: {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationTokenExpiry: null,
        },
      }
    );

    res.json({ verified: true });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Set password reset token
router.post("/password-reset/set", async (req: Request, res: Response) => {
  try {
    const { email, pin } = req.body;
    const expiry = Date.now() + 10 * 60 * 1000;

    await User.updateOne(
      { email: email?.toLowerCase().trim() },
      {
        $set: {
          passwordResetToken: pin,
          passwordResetTokenExpiry: expiry,
        },
      }
    );

    res.json({ message: "Password reset token set" });
  } catch (error) {
    console.error("Error setting password reset token:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify password reset PIN
router.post("/password-reset/verify", async (req: Request, res: Response) => {
  try {
    const { email, pin } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase().trim() });

    if (!user) {
      return res.json({ valid: false });
    }

    if (!user.passwordResetToken || user.passwordResetToken !== pin?.trim()) {
      return res.json({ valid: false });
    }

    if (
      user.passwordResetTokenExpiry &&
      user.passwordResetTokenExpiry < Date.now()
    ) {
      return res.json({ valid: false });
    }

    res.json({ valid: true });
  } catch (error) {
    console.error("Error verifying password reset PIN:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Reset password with token (plain newPassword; server hashes with bcrypt)
router.post("/password-reset/reset", async (req: Request, res: Response) => {
  try {
    const { email, pin, newPassword } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase().trim() });

    if (!user) {
      return res.json({ success: false });
    }

    if (!user.passwordResetToken || user.passwordResetToken !== pin?.trim()) {
      return res.json({ success: false });
    }

    if (
      user.passwordResetTokenExpiry &&
      user.passwordResetTokenExpiry < Date.now()
    ) {
      return res.json({ success: false });
    }

    const newPasswordHash = await hashPassword(newPassword);
    await User.updateOne(
      { email: user.email },
      {
        $set: {
          passwordHash: newPasswordHash,
          passwordResetToken: null,
          passwordResetTokenExpiry: null,
        },
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Generate email verification PIN
router.post("/email-verification/generate", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000;

    await User.updateOne(
      { email: email?.toLowerCase().trim() },
      {
        $set: {
          emailVerificationToken: pin,
          emailVerificationTokenExpiry: expiry,
        },
      }
    );

    res.json({ pin });
  } catch (error) {
    console.error("Error generating email verification PIN:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
