import { prisma } from '../config/prisma';
import { UserProfile, UserStats, PrismaTypes } from '../types';
import { logger } from '../config/logger';

export class UserModel {
  static async findByClerkId(clerkId: string): Promise<UserProfile | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId },
      });

      return user ? this.mapToUserProfile(user) : null;
    } catch (error) {
      logger.error('Error finding user by Clerk ID:', error);
      throw error;
    }
  }

  static async findById(id: string): Promise<UserProfile | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      return user ? this.mapToUserProfile(user) : null;
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  static async create(clerkId: string, email: string, name?: string): Promise<UserProfile> {
    try {
      const user = await prisma.user.create({
        data: {
          clerkId,
          email,
          name,
        },
      });

      return this.mapToUserProfile(user);
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  static async updateProfile(
    clerkId: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile> {
    try {
      const updateData: PrismaTypes.UserUpdateInput = {};

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.preferences !== undefined) {
        updateData.preferences = updates.preferences as PrismaTypes.InputJsonValue;
      }

      const user = await prisma.user.update({
        where: { clerkId },
        data: updateData,
      });

      return this.mapToUserProfile(user);
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }
  }

  static async getStats(userId: string): Promise<UserStats> {
    try {
      const [user, totalGradients, publicGradients, favoriteGradients] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.gradient.count({ where: { userId } }),
        prisma.gradient.count({ where: { userId, isPublic: true } }),
        prisma.favorite.count({ where: { userId } }),
      ]);

      if (!user) {
        throw new Error('User not found');
      }

      return {
        totalGradients,
        publicGradients,
        generationsUsed: user.generationsUsed,
        generationsLimit: user.generationsLimit,
        favoriteGradients,
      };
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw error;
    }
  }

  static async incrementGenerations(userId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          generationsUsed: { increment: 1 },
        },
      });
    } catch (error) {
      logger.error('Error incrementing generations:', error);
      throw error;
    }
  }

  private static mapToUserProfile(data: any): UserProfile {
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      createdAt: data.createdAt,
      preferences: data.preferences as UserProfile['preferences'],
    };
  }
}
