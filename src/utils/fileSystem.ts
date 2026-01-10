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
