import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { logError, logInfo } from './logger';

/**
 * Image optimization utilities
 * Compresses and optimizes images for storage
 */

interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1, default 0.8
  maxFileSize?: number; // bytes, default 2MB
}

const DEFAULT_OPTIONS: Required<OptimizeImageOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  maxFileSize: 2 * 1024 * 1024, // 2MB
};

/**
 * Optimize an image by resizing and compressing if needed
 * Returns the optimized image URI or original if optimization fails
 */
export async function optimizeImage(
  imageUri: string,
  options: OptimizeImageOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Check file size first
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      throw new Error('Image file does not exist');
    }

    // If file is already small enough and no resize needed, return original
    if (fileInfo.size && fileInfo.size <= opts.maxFileSize) {
      // We can skip optimization for small files, but still might want to check dimensions
      // For now, return original if size is acceptable
      return imageUri;
    }

    // Use ImagePicker to manipulate the image
    // Note: expo-image-picker doesn't have built-in compression in SDK 54
    // We'll use the image manipulation from the picker result if available
    // Otherwise, we'll return the original and rely on the quality setting
    
    logInfo('Image optimization', {
      originalSize: fileInfo.size,
      uri: imageUri,
    });

    // For now, we'll return the original URI
    // In a production environment, you might want to use:
    // - expo-image-manipulator for resizing/compression
    // - or a server-side image processing service
    // For MVP, we rely on the quality setting from ImagePicker
    return imageUri;
  } catch (error) {
    logError('Failed to optimize image', { uri: imageUri }, error as Error);
    // Return original on error to avoid breaking the flow
    return imageUri;
  }
}

/**
 * Validate image file size
 */
export async function validateImageSize(
  imageUri: string,
  maxSizeBytes: number = DEFAULT_OPTIONS.maxFileSize
): Promise<{ valid: boolean; size?: number; error?: string }> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      return { valid: false, error: 'File does not exist' };
    }

    const size = fileInfo.size || 0;
    if (size > maxSizeBytes) {
      return {
        valid: false,
        size,
        error: `Image size (${Math.round(size / 1024)}KB) exceeds maximum allowed size (${Math.round(maxSizeBytes / 1024)}KB)`,
      };
    }

    return { valid: true, size };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get optimal image picker options for the app
 */
export function getImagePickerOptions(): ImagePicker.ImagePickerOptions {
  return {
    mediaTypes: ['images'],
    allowsEditing: false, // We handle optimization separately
    quality: 0.8, // Default compression quality
    exif: true, // Preserve EXIF data for orientation
  };
}

