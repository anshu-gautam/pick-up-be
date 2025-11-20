import { prisma } from '../config/prisma';
import { PaginationParams, PaginatedResponse, GeneratedImage, HeroImageStyle } from '../types';
import { logger } from '../config/logger';
import { StorageService } from '../services/storage.service';

export interface CreateGeneratedImageInput {
  userId: string;
  prompt: string;
  style: HeroImageStyle;
  imageUrl: string;
  storagePath: string;
  mimeType: string;
  mood?: string;
  colorScheme?: string;
  includeText?: string;
}

export class GeneratedImageModel {
  /**
   * Create a new generated image record
   */
  static async create(input: CreateGeneratedImageInput): Promise<GeneratedImage> {
    try {
      const data = await prisma.generatedImage.create({
        data: {
          userId: input.userId,
          prompt: input.prompt,
          style: input.style,
          imageUrl: input.imageUrl,
          storagePath: input.storagePath,
          mimeType: input.mimeType,
          mood: input.mood,
          colorScheme: input.colorScheme,
          includeText: input.includeText,
        },
      });

      return await this.mapToGeneratedImage(data);
    } catch (error) {
      logger.error('Error creating generated image:', error);
      throw error;
    }
  }

  /**
   * Find a generated image by ID (only if owned by user)
   */
  static async findById(id: string, userId: string): Promise<GeneratedImage | null> {
    try {
      const image = await prisma.generatedImage.findFirst({
        where: {
          id,
          userId, // User can only access their own images
        },
      });

      return image ? await this.mapToGeneratedImage(image) : null;
    } catch (error) {
      logger.error('Error finding generated image:', error);
      throw error;
    }
  }

  /**
   * Find all generated images for a user with pagination
   */
  static async findByUserId(
    userId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<GeneratedImage>> {
    try {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const skip = (page - 1) * limit;
      const sortBy = params.sortBy || 'createdAt';
      const sortOrder = params.sortOrder || 'desc';

      const [images, total] = await Promise.all([
        prisma.generatedImage.findMany({
          where: { userId },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.generatedImage.count({ where: { userId } }),
      ]);

      // Generate fresh signed URLs for all images
      const mappedImages = await Promise.all(images.map((img: any) => this.mapToGeneratedImage(img)));

      return {
        data: mappedImages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error finding generated images by user:', error);
      throw error;
    }
  }

  /**
   * Find generated images by style for a user
   */
  static async findByStyle(
    userId: string,
    style: HeroImageStyle,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<GeneratedImage>> {
    try {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const skip = (page - 1) * limit;

      const [images, total] = await Promise.all([
        prisma.generatedImage.findMany({
          where: { userId, style },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.generatedImage.count({ where: { userId, style } }),
      ]);

      // Generate fresh signed URLs for all images
      const mappedImages = await Promise.all(images.map((img: any) => this.mapToGeneratedImage(img)));

      return {
        data: mappedImages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error finding generated images by style:', error);
      throw error;
    }
  }

  /**
   * Delete a generated image (only if owned by user)
   */
  static async delete(id: string, userId: string): Promise<boolean> {
    try {
      // First check if the image belongs to the user
      const image = await prisma.generatedImage.findFirst({
        where: { id, userId },
      });

      if (!image) {
        return false;
      }

      await prisma.generatedImage.delete({
        where: { id },
      });

      return true;
    } catch (error) {
      logger.error('Error deleting generated image:', error);
      throw error;
    }
  }

  /**
   * Delete all generated images for a user
   */
  static async deleteAllByUserId(userId: string): Promise<number> {
    try {
      const result = await prisma.generatedImage.deleteMany({
        where: { userId },
      });

      return result.count;
    } catch (error) {
      logger.error('Error deleting all user generated images:', error);
      throw error;
    }
  }

  /**
   * Get count of generated images for a user
   */
  static async countByUserId(userId: string): Promise<number> {
    try {
      return await prisma.generatedImage.count({
        where: { userId },
      });
    } catch (error) {
      logger.error('Error counting generated images:', error);
      throw error;
    }
  }

  /**
   * Map database record to GeneratedImage type with fresh signed URL
   */
  private static async mapToGeneratedImage(data: any): Promise<GeneratedImage> {
    // Generate fresh signed URL from storage path
    const freshSignedUrl = await StorageService.getPublicUrl(data.storagePath);

    return {
      id: data.id,
      userId: data.userId,
      prompt: data.prompt,
      style: data.style as HeroImageStyle,
      imageUrl: freshSignedUrl, // Use fresh signed URL instead of stored one
      storagePath: data.storagePath,
      mimeType: data.mimeType,
      mood: data.mood,
      colorScheme: data.colorScheme,
      includeText: data.includeText,
      generatedAt: data.createdAt,
    };
  }
}
