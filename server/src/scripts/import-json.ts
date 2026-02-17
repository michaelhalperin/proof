import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { connectDatabase } from "../config/database";
import { Record } from "../models/Record";
import { User } from "../models/User";

dotenv.config();

async function importData() {
  try {
    await connectDatabase();

    const migrationDir = path.join(__dirname, "../migration-data");

    // Import records (require RECORD_USER_ID to assign ownership)
    const recordsPath = path.join(migrationDir, "records.json");
    const recordUserId = process.env.RECORD_USER_ID;
    if (fs.existsSync(recordsPath)) {
      if (!recordUserId) {
        console.error("RECORD_USER_ID env var is required to import records (user id from users collection)");
        process.exit(1);
      }
      const recordsData = JSON.parse(fs.readFileSync(recordsPath, "utf-8"));

      for (const recordData of recordsData) {
        try {
          const record = new Record({
            userId: recordUserId,
            dateKey: recordData.dateKey,
            createdAt: recordData.createdAt,
            note: recordData.note,
            recordHash: recordData.recordHash,
            algo: recordData.algo,
            tags: recordData.tags,
            location: recordData.location,
            pinned: recordData.pinned || false,
            photos: recordData.photos || [],
          });
          await record.save();
        } catch (error: any) {
          console.error("Error importing record:", error);
        }
      }
    }

    // Import users
    const usersPath = path.join(migrationDir, "users.json");
    if (fs.existsSync(usersPath)) {
      const usersData = JSON.parse(fs.readFileSync(usersPath, "utf-8"));

      for (const userData of usersData) {
        try {
          const user = new User({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            passwordHash: userData.passwordHash,
            createdAt: userData.createdAt,
            emailVerified: userData.emailVerified || false,
            emailVerificationToken: userData.emailVerificationToken,
            emailVerificationTokenExpiry: userData.emailVerificationTokenExpiry,
            passwordResetToken: userData.passwordResetToken,
            passwordResetTokenExpiry: userData.passwordResetTokenExpiry,
          });
          await user.save();
        } catch (error: any) {
          console.error("Error importing user:", error);
        }
      }
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

importData();
