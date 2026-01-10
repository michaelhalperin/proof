import * as SQLite from "expo-sqlite";
import { Record, Photo } from "../db/database";
import { User } from "../db/auth";

export interface DatabaseInfo {
  recordsCount: number;
  photosCount: number;
  usersCount: number;
  tables: string[];
}

export interface RecordDetail {
  dateKey: string;
  createdAt: number;
  note: string;
  recordHash: string;
  algo: string;
  tags?: string;
  location?: string;
  photosCount: number;
}

export async function getDatabaseInfo(): Promise<DatabaseInfo> {
  const db = await SQLite.openDatabaseAsync("proof.db");
  const authDb = await SQLite.openDatabaseAsync("proof_auth.db");

  const recordsCount = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM records"
  );
  const photosCount = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM photos"
  );
  const usersCount = await authDb.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM users"
  );

  // Get table names from main db
  const tables = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );

  return {
    recordsCount: recordsCount?.count || 0,
    photosCount: photosCount?.count || 0,
    usersCount: usersCount?.count || 0,
    tables: tables.map((t) => t.name),
  };
}

export async function getAllRecordsWithDetails(): Promise<RecordDetail[]> {
  const db = await SQLite.openDatabaseAsync("proof.db");
  const records = await db.getAllAsync<Record>(
    "SELECT * FROM records ORDER BY dateKey DESC"
  );

  const recordsWithPhotos = await Promise.all(
    records.map(async (record) => {
      const photos = await db.getAllAsync<Photo>(
        "SELECT * FROM photos WHERE dateKey = ?",
        [record.dateKey]
      );
      return {
        ...record,
        photosCount: photos.length,
      };
    })
  );

  return recordsWithPhotos;
}

export async function getAllUsers(): Promise<User[]> {
  const authDb = await SQLite.openDatabaseAsync("proof_auth.db");
  return await authDb.getAllAsync<User>(
    "SELECT * FROM users ORDER BY createdAt DESC"
  );
}

export async function executeQuery(
  dbName: "proof.db" | "proof_auth.db",
  query: string
): Promise<{ columns: string[]; rows: any[] }> {
  const db = await SQLite.openDatabaseAsync(dbName);
  try {
    // Check if it's a SELECT query
    const trimmedQuery = query.trim().toUpperCase();
    if (!trimmedQuery.startsWith("SELECT")) {
      throw new Error("Only SELECT queries are allowed for safety");
    }

    const rows = await db.getAllAsync<any>(query);

    // Get column names from first row
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return { columns, rows };
  } catch (error) {
    throw error;
  }
}

export async function getTableSchema(
  tableName: string
): Promise<Array<{ name: string; type: string }>> {
  const db = await SQLite.openDatabaseAsync("proof.db");
  const schema = await db.getAllAsync<{ name: string; type: string }>(
    `PRAGMA table_info(${tableName})`
  );
  return schema.map((s) => ({ name: s.name, type: s.type }));
}
