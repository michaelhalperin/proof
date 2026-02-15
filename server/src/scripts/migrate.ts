import * as SQLite from "expo-sqlite";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { Record } from "../models/Record";
import { User } from "../models/User";
import { hashPassword } from "../models/User";

dotenv.config();

interface SQLiteRecord {
  dateKey: string;
  createdAt: number;
  note: string;
  recordHash: string;
  algo: string;
  tags?: string;
  location?: string;
  pinned?: number;
}

interface SQLitePhoto {
  id: string;
  dateKey: string;
  fileUri: string;
  mimeType: string;
  sha256: string;
  sortIndex: number;
}

interface SQLiteUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: number;
  emailVerified?: number;
  emailVerificationToken?: string;
  emailVerificationTokenExpiry?: number;
  passwordResetToken?: string;
  passwordResetTokenExpiry?: number;
}

async function migrateRecords() {
  console.log("Starting records migration...");

  // Note: This script needs to run in a Node.js environment that can access SQLite
  // For Expo SQLite, you might need to export the data first or run this differently
  // This is a template - you may need to adapt it based on your setup

  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI not set");
    }
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // For SQLite migration, you have a few options:
    // 1. Export SQLite data to JSON first, then import
    // 2. Use a tool that can read SQLite files
    // 3. Run this script from the mobile device (not recommended)

    console.log("⚠️  SQLite migration requires exporting data first.");
    console.log("Please use the export script to create JSON files, then import them.");
    
    // Example structure for importing from JSON:
    // const recordsData = require('./exported-records.json');
    // for (const recordData of recordsData) {
    //   const record = new Record({
    //     dateKey: recordData.dateKey,
    //     createdAt: recordData.createdAt,
    //     note: recordData.note,
    //     recordHash: recordData.recordHash,
    //     algo: recordData.algo,
    //     tags: recordData.tags,
    //     location: recordData.location,
    //     pinned: recordData.pinned || false,
    //     photos: recordData.photos || [],
    //   });
    //   await record.save();
    // }

    await mongoose.disconnect();
    console.log("Migration completed");
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

// Run migration
migrateRecords();
