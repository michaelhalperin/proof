import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { Share } from "react-native";
import Constants from "expo-constants";
import { generateImagesOnlyPDF, generateProofPhotosPDF } from "./pdfExport";
import { encodeInvisibleProof } from "./invisibleProof";
import { Record, Photo } from "../db/database";

const BASE64URL =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/** Encode dateKey + timestamp + hash into one base64url token (~58 chars). */
function encodeCompactProof(
  dateKey: string,
  createdAt: number,
  hash: string
): string | null {
  const clean = hash.replace(/\s/g, "").toLowerCase();
  if (clean.length !== 64 || !/^[a-f0-9]{64}$/.test(clean)) return null;
  const m = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = parseInt(m[1], 10) - 2000;
  const month = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);
  if (y < 0 || y > 255 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const hashBytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) hashBytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  const buf = new Uint8Array(3 + 8 + 32);
  buf[0] = y;
  buf[1] = month;
  buf[2] = day;
  const hi = Math.floor(createdAt / 0x100000000);
  const lo = createdAt >>> 0;
  buf[3] = (hi >> 24) & 0xff;
  buf[4] = (hi >> 16) & 0xff;
  buf[5] = (hi >> 8) & 0xff;
  buf[6] = hi & 0xff;
  buf[7] = (lo >> 24) & 0xff;
  buf[8] = (lo >> 16) & 0xff;
  buf[9] = (lo >> 8) & 0xff;
  buf[10] = lo & 0xff;
  buf.set(hashBytes, 11);
  let result = "";
  for (let i = 0; i < buf.length; i += 3) {
    const a = buf[i];
    const b = i + 1 < buf.length ? buf[i + 1] : 0;
    const c = i + 2 < buf.length ? buf[i + 2] : 0;
    result += BASE64URL[a >> 2];
    result += BASE64URL[((a & 3) << 4) | (b >> 4)];
    result += i + 1 < buf.length ? BASE64URL[((b & 15) << 2) | (c >> 6)] : "";
    result += i + 2 < buf.length ? BASE64URL[c & 63] : "";
  }
  return result;
}

/**
 * Share a single photo
 */
export async function sharePhoto(photoUri: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing is not available on this device");
  }

  // Normalize URI - get absolute path
  let absolutePath = photoUri.replace("file://", "");

  // Verify file exists
  let fileInfo = await FileSystem.getInfoAsync(absolutePath);

  if (!fileInfo.exists) {
    // Try with file:// prefix
    const uriWithPrefix = `file://${absolutePath}`;
    fileInfo = await FileSystem.getInfoAsync(uriWithPrefix);
    if (!fileInfo.exists) {
      throw new Error(`Photo file not found: ${photoUri}`);
    }
    absolutePath = uriWithPrefix;
  }

  if (fileInfo.isDirectory) {
    throw new Error(`URI points to a directory: ${photoUri}`);
  }

  // Try different URI formats that expo-sharing might accept
  const uriVariations = [
    absolutePath, // Original absolute path
    `file://${absolutePath}`, // With file:// prefix
    absolutePath.replace("file://", ""), // Without file:// prefix
  ];

  let lastError: any = null;
  for (const uri of uriVariations) {
    try {
      await Sharing.shareAsync(uri, {
        mimeType: "image/jpeg",
        dialogTitle: "Share Photo",
      });
      // Success!
      return;
    } catch (error: any) {
      lastError = error;
      // Continue to next variation
    }
  }

  // If all variations failed, try copying to cache and sharing from there
  try {
    const fileName = absolutePath.split("/").pop() || `photo-${Date.now()}.jpg`;
    const cachePath = `${FileSystem.cacheDirectory
      }share_${Date.now()}_${fileName}`;

    // Copy to cache
    const sourcePath = absolutePath.replace("file://", "");
    await FileSystem.copyAsync({
      from: sourcePath,
      to: cachePath,
    });

    // Verify cache file
    const cacheInfo = await FileSystem.getInfoAsync(cachePath);
    if (!cacheInfo.exists) {
      throw new Error("Failed to copy to cache");
    }

    // Try sharing from cache with both formats
    const cacheUriWithPrefix = `file://${cachePath}`;
    try {
      await Sharing.shareAsync(cacheUriWithPrefix, {
        mimeType: "image/jpeg",
        dialogTitle: "Share Photo",
      });
      return;
    } catch {
      await Sharing.shareAsync(cachePath, {
        mimeType: "image/jpeg",
        dialogTitle: "Share Photo",
      });
      return;
    }
  } catch (cacheError) {
  }

  // All attempts failed
  throw new Error(
    `Failed to share photo: ${lastError?.message || "Unknown error"}`
  );
}

/**
 * Ensure URI has file:// prefix for sharing
 */
function toFileUri(uri: string): string {
  if (
    uri.startsWith("file://") ||
    uri.startsWith("http://") ||
    uri.startsWith("https://") ||
    uri.startsWith("content://")
  ) {
    return uri;
  }
  return `file://${uri}`;
}

/**
 * Copy a file to cache and return its file:// URI (so share sheet can read it)
 */
async function copyToCacheForShare(uri: string, index: number): Promise<string> {
  const raw = uri.replace("file://", "");
  const name = raw.split("/").pop() || `photo-${index}.jpg`;
  const cachePath = `${FileSystem.cacheDirectory}share_${Date.now()}_${index}_${name}`;
  await FileSystem.copyAsync({
    from: raw,
    to: cachePath,
  });
  return `file://${cachePath}`;
}

/**
 * Share multiple photos. When record is provided, shares a single proof PDF
 * (date, created, integrity hash + images) so the share is verifiable.
 */
export async function sharePhotos(
  photoUris: string[],
  record?: Record
): Promise<void> {
  if (photoUris.length === 0) return;

  const isExpoGo = Constants.executionEnvironment === "storeClient";

  // When we have a record, always share as proof PDF (one share, verifiable)
  if (record) {
    const pdfUri = await generateProofPhotosPDF(photoUris, record);
    await sharePDF(pdfUri);
    return;
  }

  if (photoUris.length === 1) {
    await sharePhoto(photoUris[0]);
    return;
  }

  if (isExpoGo) {
    const pdfUri = await generateImagesOnlyPDF(photoUris);
    await sharePDF(pdfUri);
    return;
  }

  try {
    const RNShare = require("react-native-share").default;
    const urls = await Promise.all(
      photoUris.map((uri, i) => copyToCacheForShare(toFileUri(uri), i))
    );
    await RNShare.open({
      urls,
      type: "image/jpeg",
      failOnCancel: false,
    });
  } catch {
    for (let i = 0; i < photoUris.length; i++) {
      if (i > 0) {
        await new Promise((r) => setTimeout(r, 500));
      }
      await sharePhoto(photoUris[i]);
    }
  }
}

/** Format 64-char hash as 8 groups of 8 for a friendlier look. */
function formatHashForDisplay(hash: string): string {
  const clean = hash.replace(/\s/g, "").toLowerCase();
  if (clean.length !== 64) return hash;
  return clean.match(/.{1,8}/g)!.join("-");
}

/**
 * Share text/note as plain text.
 * Embeds verification invisibly (for paste-from-clipboard) and adds one visible line
 * with compact token (date + short code) so the line is small and nice.
 */
export async function shareText(text: string, record: Record): Promise<void> {
  const note = text.trim();
  const invisible = encodeInvisibleProof(
    record.dateKey,
    record.createdAt,
    record.recordHash
  );
  const compactToken = encodeCompactProof(
    record.dateKey,
    record.createdAt,
    record.recordHash
  );
  const visibleLine =
    compactToken != null
      ? `✓ Proof · ${record.dateKey} · ${compactToken}`
      : `✓ Proof · ${record.dateKey} · ${record.createdAt} · ${formatHashForDisplay(record.recordHash)}`;
  const shareContent = note
    ? `${note}${invisible}\n\n${visibleLine}`
    : invisible + "\n\n" + visibleLine;

  try {
    await Share.share({
      message: shareContent,
      title: "Share Proof",
    });
  } catch (error: any) {
    throw new Error(
      `Failed to share text: ${error.message || "Unknown error"}`
    );
  }
}

/**
 * Share PDF (imported from pdfExport for convenience)
 */
export async function sharePDF(pdfUri: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(pdfUri, {
      mimeType: "application/pdf",
      dialogTitle: "Share PDF",
    });
  } else {
    throw new Error("Sharing is not available on this device");
  }
}
