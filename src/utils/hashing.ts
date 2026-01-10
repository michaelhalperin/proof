import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system/legacy";

export interface PhotoHash {
  id: string;
  mimeType: string;
  sha256: string;
  sortIndex: number;
}

export interface CanonicalRecord {
  dateKey: string;
  createdAt: number;
  note: string;
  photos: PhotoHash[];
}

/**
 * Stable stringify - sorts keys recursively for deterministic JSON
 */
export function stableStringify(obj: any): string {
  if (obj === null || obj === undefined) {
    return String(obj);
  }

  if (typeof obj !== "object") {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return "[" + obj.map((item) => stableStringify(item)).join(",") + "]";
  }

  const keys = Object.keys(obj).sort();
  const pairs = keys.map((key) => {
    const value = obj[key];
    return JSON.stringify(key) + ":" + stableStringify(value);
  });

  return "{" + pairs.join(",") + "}";
}

/**
 * Compute SHA-256 hash of a string (returns hex)
 */
export async function sha256Hex(input: string): Promise<string> {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    input
  );
  return hash;
}

/**
 * Compute SHA-256 hash of a file (returns hex)
 * Hashes the raw file bytes
 */
export async function sha256File(fileUri: string): Promise<string> {
  try {
    // Use digestAsync with base64 encoding - this hashes the file bytes correctly
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      base64,
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );
    return hash;
  } catch (error) {
    // Fallback: read as string and hash (less ideal but works)
    console.warn(
      "Error hashing file with base64 method, using fallback:",
      error
    );
    const data = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return sha256Hex(data);
  }
}

/**
 * Build canonical record object for hashing
 */
export function buildCanonicalRecord(
  dateKey: string,
  createdAt: number,
  note: string,
  photos: PhotoHash[]
): CanonicalRecord {
  // Sort photos by sortIndex, then by id
  const sortedPhotos = [...photos].sort((a, b) => {
    if (a.sortIndex !== b.sortIndex) {
      return a.sortIndex - b.sortIndex;
    }
    return a.id.localeCompare(b.id);
  });

  return {
    dateKey,
    createdAt,
    note: note || "",
    photos: sortedPhotos,
  };
}

/**
 * Compute record hash from canonical record
 */
export async function computeRecordHash(
  dateKey: string,
  createdAt: number,
  note: string,
  photos: PhotoHash[]
): Promise<string> {
  const canonical = buildCanonicalRecord(dateKey, createdAt, note, photos);
  const jsonString = stableStringify(canonical);
  return sha256Hex(jsonString);
}

/**
 * Verify record integrity by recomputing hash
 */
export async function verifyRecordIntegrity(
  storedHash: string,
  dateKey: string,
  createdAt: number,
  note: string,
  photos: PhotoHash[]
): Promise<boolean> {
  const computedHash = await computeRecordHash(
    dateKey,
    createdAt,
    note,
    photos
  );
  return storedHash.toLowerCase() === computedHash.toLowerCase();
}
