/**
 * One-time fix: drop the unique index on dateKey alone from the records collection.
 * Records should be unique per (userId, dateKey), not per dateKey globally.
 *
 * Run from server dir: npx ts-node src/scripts/drop-dateKey-unique-index.ts
 */

import dotenv from "dotenv";
import path from "path";
import { connectDatabase, disconnectDatabase } from "../config/database";
import { Record } from "../models/Record";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function run() {
  try {
    await connectDatabase();

    const collection = Record.collection;
    try {
      await collection.dropIndex("dateKey_1");
      console.log("✓ Dropped index dateKey_1 (was causing duplicate key errors per date).");
    } catch (err: any) {
      if (err.code === 27 || err.codeName === "IndexNotFound") {
        console.log("Index dateKey_1 not found (already dropped or never existed).");
      } else {
        throw err;
      }
    }

    await disconnectDatabase();
  } catch (error: any) {
    console.error("Error:", error);
    process.exit(1);
  }
}

run();
