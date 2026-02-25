import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from "../utils/api";

export interface Record {
  dateKey: string;
  createdAt: number;
  note: string;
  recordHash: string;
  algo: string;
  tags?: string; // JSON array of tags
  location?: string | null; // JSON object with lat, lng, address
  pinned?: boolean | number; // Can be boolean or number for compatibility
}

export interface Photo {
  id: string;
  dateKey: string;
  fileUri: string;
  mimeType: string;
  sha256: string;
  sortIndex: number;
}

interface GetRecordResponse {
  record: Record;
  photos: Photo[];
}

interface GetAllRecordsResponse {
  records: Record[];
}

interface RecordExistsResponse {
  exists: boolean;
}

interface DeleteRecordResponse {
  message: string;
  photoUris: string[];
}

interface DeleteAllRecordsResponse {
  message: string;
  photoUris: string[];
}

interface TogglePinnedResponse {
  pinned: boolean;
}

interface GetPinnedRecordsResponse {
  records: Record[];
}

/**
 * Initialize database connection (no-op for API-based implementation)
 * Kept for backward compatibility
 */
export async function initDatabase(): Promise<any> {
  // No-op for API-based implementation
  return null;
}

/**
 * Get a single record by dateKey
 */
export async function getRecord(dateKey: string): Promise<Record | null> {
  try {
    const response = await apiGet<GetRecordResponse>(`/records/${dateKey}`);
    return response.record || null;
  } catch (error: any) {
    if (error.message?.includes("404") || error.message?.includes("not found")) {
      return null;
    }
    throw error;
  }
}

/**
 * Get photos for a specific record
 */
export async function getPhotos(dateKey: string): Promise<Photo[]> {
  try {
    const response = await apiGet<GetRecordResponse>(`/records/${dateKey}`);
    return response.photos || [];
  } catch (error: any) {
    if (error.message?.includes("404") || error.message?.includes("not found")) {
      return [];
    }
    throw error;
  }
}

/**
 * Insert a new record with photos
 */
export async function insertRecord(
  record: Record,
  photos: Photo[]
): Promise<void> {
  await apiPost("/records", { record, photos });
}

/**
 * Check if a record exists
 */
export async function recordExists(dateKey: string): Promise<boolean> {
  try {
    const response = await apiGet<RecordExistsResponse>(`/records/${dateKey}/exists`);
    return response.exists;
  } catch (error) {
    return false;
  }
}

/**
 * Get all records
 */
export async function getAllRecords(): Promise<Record[]> {
  try {
    const response = await apiGet<GetAllRecordsResponse>("/records");
    return response.records || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Update an existing record
 */
export async function updateRecord(
  record: Record,
  photos: Photo[]
): Promise<void> {
  await apiPut(`/records/${record.dateKey}`, { record, photos });
}

/**
 * Delete a record
 */
export async function deleteRecord(dateKey: string): Promise<void> {
  await apiDelete<DeleteRecordResponse>(`/records/${dateKey}`);
}

/**
 * Delete all records and photos from the database
 * Returns array of photo file URIs that should be deleted from file system
 */
export async function deleteAllRecords(): Promise<string[]> {
  try {
    const response = await apiDelete<DeleteAllRecordsResponse>("/records");
    return response.photoUris || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Toggle pinned status of a record
 */
export async function togglePinnedRecord(dateKey: string): Promise<boolean> {
  try {
    const response = await apiPatch<TogglePinnedResponse>(`/records/${dateKey}/toggle-pinned`);
    return response.pinned;
  } catch (error) {
    throw error;
  }
}

/**
 * Get all pinned records
 */
export async function getPinnedRecords(): Promise<Record[]> {
  try {
    const response = await apiGet<GetPinnedRecordsResponse>("/records/pinned/all");
    return response.records || [];
  } catch (error) {
    throw error;
  }
}
