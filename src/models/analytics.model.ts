import { prisma } from '../config/prisma';
import { AnalyticsEvent, TrendingGradient } from '../types';
import { logger } from '../config/logger';

export class AnalyticsModel {
  static async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await prisma.analyticsEvent.create({
        data: {
          eventType: event.eventType,
          gradientId: event.gradientId,
          userId: event.userId,
          metadata: event.metadata || undefined,
        },
      });
    } catch (error) {
      logger.error('Error tracking analytics event:', error);
      // Don't throw - analytics should not break the main flow
    }
  }

  static async getTrendingGradients(limit: number = 10): Promise<TrendingGradient[]> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get gradient IDs with their event counts
      const eventCounts = await prisma.analyticsEvent.groupBy({
        by: ['gradientId'],
        where: {
          gradientId: { not: null },
          createdAt: { gte: thirtyDaysAgo },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: limit,
      });

      if (eventCounts.length === 0) {
        return [];
      }

      const gradientIds = eventCounts
        .map((e: { gradientId: string | null }) => e.gradientId)
        .filter((id: string | null): id is string => id !== null);

      // Get the actual gradients
      const gradients = await prisma.gradient.findMany({
        where: {
          id: { in: gradientIds },
          isPublic: true,
        },
      });

      // Get detailed counts for each gradient
      const result: TrendingGradient[] = [];

      for (const gradient of gradients) {
        const [viewCount, saveCount, exportCount] = await Promise.all([
          prisma.analyticsEvent.count({
            where: {
              gradientId: gradient.id,
              eventType: 'view',
              createdAt: { gte: thirtyDaysAgo },
            },
          }),
          prisma.analyticsEvent.count({
            where: {
              gradientId: gradient.id,
              eventType: 'save',
              createdAt: { gte: thirtyDaysAgo },
            },
          }),
          prisma.analyticsEvent.count({
            where: {
              gradientId: gradient.id,
              eventType: 'export',
              createdAt: { gte: thirtyDaysAgo },
            },
          }),
        ]);

        result.push({
          gradient: {
            id: gradient.id,
            userId: gradient.userId || undefined,
            name: gradient.name,
            type: gradient.type as 'linear' | 'radial' | 'conic',
            angle: gradient.angle || undefined,
            colorStops: gradient.colorStops as any,
            accessibilityScore: gradient.accessibilityScore
              ? Number(gradient.accessibilityScore)
              : undefined,
            tags: gradient.tags,
            isPublic: gradient.isPublic,
            createdAt: gradient.createdAt,
            updatedAt: gradient.updatedAt,
          },
          viewCount,
          saveCount,
          exportCount,
        });
      }

      // Sort by combined score
      result.sort(
        (a, b) =>
          b.viewCount + b.saveCount * 2 + b.exportCount * 3 -
          (a.viewCount + a.saveCount * 2 + a.exportCount * 3)
      );

      return result;
    } catch (error) {
      logger.error('Error getting trending gradients:', error);
      throw error;
    }
  }

  static async getPopularGradients(limit: number = 10): Promise<any[]> {
    try {
      const gradients = await prisma.gradient.findMany({
        where: { isPublic: true },
        orderBy: { accessibilityScore: 'desc' },
        take: limit,
      });

      return gradients.map((g: any) => ({
        id: g.id,
        userId: g.userId,
        name: g.name,
        type: g.type,
        angle: g.angle,
        colorStops: g.colorStops,
        accessibilityScore: g.accessibilityScore ? Number(g.accessibilityScore) : null,
        tags: g.tags,
        isPublic: g.isPublic,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      }));
    } catch (error) {
      logger.error('Error getting popular gradients:', error);
      throw error;
    }
  }
}
