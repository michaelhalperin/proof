import * as FileSystem from "expo-file-system/legacy";
import { sha256File } from "./hashing";

const PHOTOS_DIR = "proof_photos";

export async function ensurePhotosDirectory(): Promise<string> {
  const dir = FileSystem.documentDirectory + PHOTOS_DIR;
  const dirInfo = await FileSystem.getInfoAsync(dir);

  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }

  return dir;
}

export async function copyPhotoToAppStorage(
  sourceUri: string,
  photoId: string,
  extension: string = ".jpg"
): Promise<{ fileUri: string; sha256: string }> {
  const photosDir = await ensurePhotosDirectory();
  const fileName = `${photoId}${extension}`;
  const destUri = photosDir + "/" + fileName;

  await FileSystem.copyAsync({
    from: sourceUri,
    to: destUri,
  });

  const sha256 = await sha256File(destUri);

  return {
    fileUri: destUri,
    sha256,
  };
}

export function getMimeTypeFromUri(uri: string): string {
  const ext = uri.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "heic":
      return "image/heic";
    default:
      return "image/jpeg";
  }
}

export function getExtensionFromUri(uri: string): string {
  const ext = uri.split(".").pop()?.toLowerCase();
  return ext ? `.${ext}` : ".jpg";
}

const PROFILE_IMAGE_FILENAME = "profile_photo";

/**
 * Copy a picked image to app storage for profile photo. Uses a fixed filename
 * so there is only one profile image. Returns the destination file URI.
 */
export async function copyProfileImageToAppStorage(
  sourceUri: string
): Promise<string> {
  const ext = getExtensionFromUri(sourceUri);
  const destUri =
    FileSystem.documentDirectory + PROFILE_IMAGE_FILENAME + ext;

  await FileSystem.copyAsync({
    from: sourceUri,
    to: destUri,
  });

  return destUri;
}

/**
 * Delete the profile image file if it exists at the given URI.
 */
export async function deleteProfileImageFile(uri: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch {
    // ignore
  }
}
