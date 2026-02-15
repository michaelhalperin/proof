/**
 * One-time fix: set userId on records that are missing it.
 * Use when you have records in MongoDB that were created/imported without userId.
 *
 * Set the target user's id in the script or pass as USER_ID env var.
 * Run from server dir: USER_ID=c978f4b1-d4a0-4865-9102-34a5be6ddf1f npx ts-node src/scripts/fix-records-missing-userId.ts
 */

import dotenv from "dotenv";
import path from "path";
import { connectDatabase, disconnectDatabase } from "../config/database";
import { Record } from "../models/Record";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const USER_ID = process.env.USER_ID || "c978f4b1-d4a0-4865-9102-34a5be6ddf1f";

async function run() {
  try {
    await connectDatabase();

    const result = await Record.updateMany(
      { $or: [{ userId: { $exists: false } }, { userId: "" }, { userId: null }] },
      { $set: { userId: USER_ID } }
    );

    console.log(`✓ Updated ${result.modifiedCount} record(s) with userId: ${USER_ID}`);

    await disconnectDatabase();
  } catch (error: any) {
    console.error("Error:", error);
    process.exit(1);
  }
}

run();
