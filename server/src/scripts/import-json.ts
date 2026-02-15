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
      console.log(`Importing ${recordsData.length} records for user ${recordUserId}...`);

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
          console.log(`  ✓ Imported record: ${recordData.dateKey}`);
        } catch (error: any) {
          if (error.code === 11000) {
            console.log(`  ⚠ Skipped duplicate record: ${recordData.dateKey}`);
          } else {
            console.error(`  ✗ Error importing record ${recordData.dateKey}:`, error.message);
          }
        }
      }
    } else {
      console.log("⚠ No records.json file found");
    }

    // Import users
    const usersPath = path.join(migrationDir, "users.json");
    if (fs.existsSync(usersPath)) {
      const usersData = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
      console.log(`Importing ${usersData.length} users...`);

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
          console.log(`  ✓ Imported user: ${userData.email}`);
        } catch (error: any) {
          if (error.code === 11000) {
            console.log(`  ⚠ Skipped duplicate user: ${userData.email}`);
          } else {
            console.error(`  ✗ Error importing user ${userData.email}:`, error.message);
          }
        }
      }
    } else {
      console.log("⚠ No users.json file found");
    }

    await mongoose.disconnect();
    console.log("\n✓ Migration completed successfully!");
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

importData();
