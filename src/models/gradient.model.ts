import { prisma } from '../config/prisma';
import { Gradient, PaginationParams, PaginatedResponse, ColorStop, PrismaTypes } from '../types';
import { logger } from '../config/logger';

export class GradientModel {
  static async create(gradient: Gradient): Promise<Gradient> {
    try {
      const data = await prisma.gradient.create({
        data: {
          userId: gradient.userId,
          name: gradient.name,
          type: gradient.type,
          angle: gradient.angle,
          colorStops: gradient.colorStops as unknown as PrismaTypes.InputJsonValue,
          accessibilityScore: gradient.accessibilityScore,
          tags: gradient.tags || [],
          isPublic: gradient.isPublic || false,
          conversationId: gradient.conversationId,
          messageId: gradient.messageId,
          previewUrl: gradient.previewUrl,
          storagePath: gradient.storagePath,
        },
      });

      return this.mapToGradient(data);
    } catch (error) {
      logger.error('Error creating gradient:', error);
      throw error;
    }
  }

  static async findById(id: string, userId?: string): Promise<Gradient | null> {
    try {
      const gradient = await prisma.gradient.findFirst({
        where: {
          id,
          OR: userId
            ? [{ userId }, { isPublic: true }]
            : [{ isPublic: true }],
        },
      });

      return gradient ? this.mapToGradient(gradient) : null;
    } catch (error) {
      logger.error('Error finding gradient:', error);
      throw error;
    }
  }

  static async findByUserId(
    userId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<Gradient>> {
    try {
      const page = params.page || 1;
      const limit = params.limit || 10;
      const skip = (page - 1) * limit;
      const sortBy = params.sortBy || 'createdAt';
      const sortOrder = params.sortOrder || 'desc';

      const [gradients, total] = await Promise.all([
        prisma.gradient.findMany({
          where: { userId },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.gradient.count({ where: { userId } }),
      ]);

      return {
        data: gradients.map(this.mapToGradient),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error finding gradients by user:', error);
      throw error;
    }
  }

  static async findPublic(
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<Gradient>> {
    try {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const skip = (page - 1) * limit;
      const sortBy = params.sortBy || 'createdAt';
      const sortOrder = params.sortOrder || 'desc';

      const [gradients, total] = await Promise.all([
        prisma.gradient.findMany({
          where: { isPublic: true },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.gradient.count({ where: { isPublic: true } }),
      ]);

      return {
        data: gradients.map(this.mapToGradient),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error finding public gradients:', error);
      throw error;
    }
  }

  static async update(id: string, userId: string, updates: Partial<Gradient>): Promise<Gradient> {
    try {
      const updateData: PrismaTypes.GradientUpdateInput = {};

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.angle !== undefined) updateData.angle = updates.angle;
      if (updates.colorStops !== undefined) {
        updateData.colorStops = updates.colorStops as unknown as PrismaTypes.InputJsonValue;
      }
      if (updates.accessibilityScore !== undefined) {
        updateData.accessibilityScore = updates.accessibilityScore;
      }
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic;
      if (updates.previewUrl !== undefined) updateData.previewUrl = updates.previewUrl;
      if (updates.storagePath !== undefined) updateData.storagePath = updates.storagePath;

      const data = await prisma.gradient.update({
        where: { id, userId },
        data: updateData,
      });

      return this.mapToGradient(data);
    } catch (error) {
      logger.error('Error updating gradient:', error);
      throw error;
    }
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    try {
      await prisma.gradient.delete({
        where: { id, userId },
      });
      return true;
    } catch (error) {
      logger.error('Error deleting gradient:', error);
      throw error;
    }
  }

  private static mapToGradient(data: any): Gradient {
    return {
      id: data.id,
      userId: data.userId,
      name: data.name,
      type: data.type as 'linear' | 'radial' | 'conic',
      angle: data.angle,
      colorStops: data.colorStops as ColorStop[],
      accessibilityScore: data.accessibilityScore ? Number(data.accessibilityScore) : undefined,
      tags: data.tags,
      isPublic: data.isPublic,
      conversationId: data.conversationId,
      messageId: data.messageId,
      previewUrl: data.previewUrl,
      storagePath: data.storagePath,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
