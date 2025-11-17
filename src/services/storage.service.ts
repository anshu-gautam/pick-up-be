import { supabase } from '../config/database';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

export class StorageService {
  private static bucket = env.SUPABASE_STORAGE_BUCKET;

  /**
   * Upload a gradient image to Supabase Storage
   * @param userId - User ID for folder organization
   * @param imageBuffer - Image buffer (PNG/SVG)
   * @param format - Image format (png/svg)
   * @param gradientId - Optional gradient ID for filename
   * @returns Public URL and storage path
   */
  static async uploadGradientImage(
    userId: string,
    imageBuffer: Buffer,
    format: 'png' | 'svg',
    gradientId?: string
  ): Promise<{ publicUrl: string; storagePath: string }> {
    try {
      const fileName = gradientId || uuidv4();
      const storagePath = `${userId}/${fileName}.${format}`;
      const contentType = format === 'png' ? 'image/png' : 'image/svg+xml';

      const { error: uploadError } = await supabase.storage
        .from(this.bucket)
        .upload(storagePath, imageBuffer, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        logger.error('Error uploading to Supabase Storage:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage.from(this.bucket).getPublicUrl(storagePath);

      logger.info(`Uploaded gradient image: ${storagePath}`);

      return {
        publicUrl: data.publicUrl,
        storagePath,
      };
    } catch (error) {
      logger.error('Failed to upload gradient image:', error);
      throw error;
    }
  }

  /**
   * Get public URL for a stored gradient image
   * @param storagePath - Storage path of the image
   * @returns Public URL
   */
  static getPublicUrl(storagePath: string): string {
    const { data } = supabase.storage.from(this.bucket).getPublicUrl(storagePath);
    return data.publicUrl;
  }

  /**
   * Delete a gradient image from storage
   * @param storagePath - Storage path of the image
   * @returns Success boolean
   */
  static async deleteGradientImage(storagePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage.from(this.bucket).remove([storagePath]);

      if (error) {
        logger.error('Error deleting from Supabase Storage:', error);
        throw error;
      }

      logger.info(`Deleted gradient image: ${storagePath}`);
      return true;
    } catch (error) {
      logger.error('Failed to delete gradient image:', error);
      throw error;
    }
  }

  /**
   * Delete all gradient images for a user
   * @param userId - User ID
   * @returns Number of deleted files
   */
  static async deleteUserGradients(userId: string): Promise<number> {
    try {
      const { data: files, error: listError } = await supabase.storage
        .from(this.bucket)
        .list(userId);

      if (listError) {
        throw listError;
      }

      if (!files || files.length === 0) {
        return 0;
      }

      const filePaths = files.map((file) => `${userId}/${file.name}`);

      const { error: deleteError } = await supabase.storage
        .from(this.bucket)
        .remove(filePaths);

      if (deleteError) {
        throw deleteError;
      }

      logger.info(`Deleted ${files.length} gradient images for user ${userId}`);
      return files.length;
    } catch (error) {
      logger.error('Failed to delete user gradients:', error);
      throw error;
    }
  }

  /**
   * Check if storage bucket exists and is accessible
   * @returns Boolean indicating bucket accessibility
   */
  static async checkBucketExists(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.getBucket(this.bucket);

      if (error || !data) {
        logger.warn(`Storage bucket '${this.bucket}' not found or not accessible`);
        return false;
      }

      logger.info(`Storage bucket '${this.bucket}' is accessible`);
      return true;
    } catch (error) {
      logger.error('Error checking storage bucket:', error);
      return false;
    }
  }

  /**
   * Initialize storage bucket (create if doesn't exist)
   * Note: This requires admin permissions
   */
  static async initializeBucket(): Promise<void> {
    try {
      const exists = await this.checkBucketExists();

      if (!exists) {
        const { error } = await supabase.storage.createBucket(this.bucket, {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['image/png', 'image/svg+xml'],
        });

        if (error) {
          logger.error('Failed to create storage bucket:', error);
          throw error;
        }

        logger.info(`Created storage bucket: ${this.bucket}`);
      }
    } catch (error) {
      logger.error('Failed to initialize storage bucket:', error);
      throw error;
    }
  }
}
