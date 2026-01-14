import * as SQLite from "expo-sqlite";

export interface Record {
  dateKey: string;
  createdAt: number;
  note: string;
  recordHash: string;
  algo: string;
  tags?: string; // JSON array of tags
  location?: string; // JSON object with lat, lng, address
  pinned?: boolean | number; // SQLite stores as INTEGER (0 or 1)
}

export interface Photo {
  id: string;
  dateKey: string;
  fileUri: string;
  mimeType: string;
  sha256: string;
  sortIndex: number;
}

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  db = await SQLite.openDatabaseAsync("proof.db");

  // Create records table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS records (
      dateKey TEXT PRIMARY KEY,
      createdAt INTEGER NOT NULL,
      note TEXT NOT NULL,
      recordHash TEXT NOT NULL,
      algo TEXT NOT NULL,
      tags TEXT,
      location TEXT,
      pinned INTEGER DEFAULT 0
    );
  `);

  // Migrate existing records to add new columns if they don't exist
  try {
    await db.execAsync(`
      ALTER TABLE records ADD COLUMN tags TEXT;
    `);
  } catch (e) {
    // Column may already exist, ignore
  }

  try {
    await db.execAsync(`
      ALTER TABLE records ADD COLUMN location TEXT;
    `);
  } catch (e) {
    // Column may already exist, ignore
  }

  try {
    await db.execAsync(`
      ALTER TABLE records ADD COLUMN pinned INTEGER DEFAULT 0;
    `);
  } catch (e) {
    // Column may already exist, ignore
  }

  // Create photos table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      dateKey TEXT NOT NULL,
      fileUri TEXT NOT NULL,
      mimeType TEXT NOT NULL,
      sha256 TEXT NOT NULL,
      sortIndex INTEGER NOT NULL,
      FOREIGN KEY (dateKey) REFERENCES records(dateKey)
    );
  `);

  // Create indexes for performance optimization
  try {
    // Index on createdAt for sorting/querying by date
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_records_createdAt ON records(createdAt DESC);
    `);
  } catch (e) {
    // Index may already exist, ignore
  }

  try {
    // Index on dateKey in photos for faster joins
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_photos_dateKey ON photos(dateKey);
    `);
  } catch (e) {
    // Index may already exist, ignore
  }

  try {
    // Composite index for photos sorting
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_photos_dateKey_sortIndex ON photos(dateKey, sortIndex);
    `);
  } catch (e) {
    // Index may already exist, ignore
  }

  return db;
}

export async function getRecord(dateKey: string): Promise<Record | null> {
  const database = await initDatabase();
  const result = await database.getFirstAsync<Record>(
    "SELECT * FROM records WHERE dateKey = ?",
    [dateKey]
  );
  return result || null;
}

export async function getPhotos(dateKey: string): Promise<Photo[]> {
  const database = await initDatabase();
  const result = await database.getAllAsync<Photo>(
    "SELECT * FROM photos WHERE dateKey = ? ORDER BY sortIndex, id",
    [dateKey]
  );
  return result || [];
}

export async function insertRecord(
  record: Record,
  photos: Photo[]
): Promise<void> {
  const database = await initDatabase();

  await database.runAsync(
    "INSERT INTO records (dateKey, createdAt, note, recordHash, algo, tags, location, pinned) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      record.dateKey,
      record.createdAt,
      record.note,
      record.recordHash,
      record.algo,
      record.tags || null,
      record.location || null,
      record.pinned ? 1 : 0,
    ]
  );

  for (const photo of photos) {
    await database.runAsync(
      "INSERT INTO photos (id, dateKey, fileUri, mimeType, sha256, sortIndex) VALUES (?, ?, ?, ?, ?, ?)",
      [
        photo.id,
        photo.dateKey,
        photo.fileUri,
        photo.mimeType,
        photo.sha256,
        photo.sortIndex,
      ]
    );
  }
}

export async function recordExists(dateKey: string): Promise<boolean> {
  const record = await getRecord(dateKey);
  return record !== null;
}

export async function getAllRecords(): Promise<Record[]> {
  const database = await initDatabase();
  const result = await database.getAllAsync<Record>(
    "SELECT * FROM records ORDER BY dateKey DESC"
  );
  return result || [];
}

export async function updateRecord(
  record: Record,
  photos: Photo[]
): Promise<void> {
  const database = await initDatabase();

  // Get existing pinned status if not provided
  const existingRecord = await getRecord(record.dateKey);
  const pinned = record.pinned !== undefined 
    ? (record.pinned ? 1 : 0) 
    : (existingRecord?.pinned ? 1 : 0);

  // Update record
  await database.runAsync(
    "UPDATE records SET createdAt = ?, note = ?, recordHash = ?, algo = ?, tags = ?, location = ?, pinned = ? WHERE dateKey = ?",
    [
      record.createdAt,
      record.note,
      record.recordHash,
      record.algo,
      record.tags || null,
      record.location || null,
      pinned,
      record.dateKey,
    ]
  );

  // Delete existing photos
  await database.runAsync("DELETE FROM photos WHERE dateKey = ?", [
    record.dateKey,
  ]);

  // Insert new photos
  for (const photo of photos) {
    await database.runAsync(
      "INSERT INTO photos (id, dateKey, fileUri, mimeType, sha256, sortIndex) VALUES (?, ?, ?, ?, ?, ?)",
      [
        photo.id,
        photo.dateKey,
        photo.fileUri,
        photo.mimeType,
        photo.sha256,
        photo.sortIndex,
      ]
    );
  }
}

export async function deleteRecord(dateKey: string): Promise<void> {
  const database = await initDatabase();

  // Delete photos first (foreign key constraint)
  await database.runAsync("DELETE FROM photos WHERE dateKey = ?", [dateKey]);

  // Delete record
  await database.runAsync("DELETE FROM records WHERE dateKey = ?", [dateKey]);
}

/**
 * Delete all records and photos from the database
 * Returns array of photo file URIs that should be deleted from file system
 */
export async function deleteAllRecords(): Promise<string[]> {
  const database = await initDatabase();

  // Get all photo file URIs before deleting
  const photos = await database.getAllAsync<Photo>(
    "SELECT fileUri FROM photos"
  );
  const photoUris = photos.map((p) => p.fileUri);

  // Delete all photos first (foreign key constraint)
  await database.runAsync("DELETE FROM photos");

  // Delete all records
  await database.runAsync("DELETE FROM records");

  return photoUris;
}

/**
 * Toggle pinned status of a record
 */
export async function togglePinnedRecord(dateKey: string): Promise<boolean> {
  const database = await initDatabase();
  const record = await getRecord(dateKey);
  
  if (!record) {
    throw new Error("Record not found");
  }

  const newPinnedStatus = !(record.pinned === true || record.pinned === 1);
  
  await database.runAsync(
    "UPDATE records SET pinned = ? WHERE dateKey = ?",
    [newPinnedStatus ? 1 : 0, dateKey]
  );

  return newPinnedStatus;
}

/**
 * Get all pinned records
 */
export async function getPinnedRecords(): Promise<Record[]> {
  const database = await initDatabase();
  const result = await database.getAllAsync<Record>(
    "SELECT * FROM records WHERE pinned = 1 ORDER BY dateKey DESC"
  );
  return result || [];
}
