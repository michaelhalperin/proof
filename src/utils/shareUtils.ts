import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { Share } from "react-native";
import { formatTimestamp } from "./dateUtils";
import { Record, Photo } from "../db/database";

/**
 * Share a single photo
 */
export async function sharePhoto(photoUri: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing is not available on this device");
  }

  console.log("sharePhoto called with URI:", photoUri);

  // Normalize URI - get absolute path
  let absolutePath = photoUri.replace("file://", "");

  // Verify file exists
  let fileInfo = await FileSystem.getInfoAsync(absolutePath);
  console.log("File info for absolutePath:", {
    exists: fileInfo.exists,
    isDirectory: fileInfo.isDirectory,
    uri: absolutePath,
  });

  if (!fileInfo.exists) {
    // Try with file:// prefix
    const uriWithPrefix = `file://${absolutePath}`;
    fileInfo = await FileSystem.getInfoAsync(uriWithPrefix);
    console.log("File info for uriWithPrefix:", {
      exists: fileInfo.exists,
      uri: uriWithPrefix,
    });
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
      console.log("Attempting to share with URI:", uri);
      await Sharing.shareAsync(uri, {
        mimeType: "image/jpeg",
        dialogTitle: "Share Photo",
      });
      // Success!
      return;
    } catch (error: any) {
      console.log("Share attempt failed with URI:", uri, error);
      lastError = error;
      // Continue to next variation
    }
  }

  // If all variations failed, try copying to cache and sharing from there
  try {
    console.log("All direct sharing attempts failed, trying cache copy...");
    const fileName = absolutePath.split("/").pop() || `photo-${Date.now()}.jpg`;
    const cachePath = `${
      FileSystem.cacheDirectory
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
    console.error("Cache copy and share also failed:", cacheError);
  }

  // All attempts failed
  throw new Error(
    `Failed to share photo: ${lastError?.message || "Unknown error"}`
  );
}

/**
 * Share multiple photos
 */
export async function sharePhotos(photoUris: string[]): Promise<void> {
  if (photoUris.length === 0) return;

  if (photoUris.length === 1) {
    await sharePhoto(photoUris[0]);
    return;
  }

  // For multiple photos, share them one by one
  // (expo-sharing doesn't support sharing multiple files at once on all platforms)
  if (await Sharing.isAvailableAsync()) {
    // Share the first photo, user can share others individually
    await Sharing.shareAsync(photoUris[0], {
      mimeType: "image/jpeg",
      dialogTitle: `Share Photo 1 of ${photoUris.length}`,
    });
  } else {
    throw new Error("Sharing is not available on this device");
  }
}

/**
 * Share text/note as plain text
 * Uses React Native's Share API which is designed for sharing text content
 */
export async function shareText(text: string, record: Record): Promise<void> {
  const shareContent = `Proof Record\n\nCreated: ${formatTimestamp(
    record.createdAt
  )}\n\n${text}\n\nHash: ${record.recordHash}`;

  try {
    await Share.share({
      message: shareContent,
      title: "Share Proof",
    });
  } catch (error: any) {
    console.error("Error sharing text:", error);
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
