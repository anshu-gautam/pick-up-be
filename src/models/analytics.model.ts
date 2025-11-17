import { supabase } from '../config/database';
import { AnalyticsEvent, TrendingGradient } from '../types';
import { logger } from '../config/logger';

export class AnalyticsModel {
  static async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const { error } = await supabase.from('analytics_events').insert({
        event_type: event.eventType,
        gradient_id: event.gradientId,
        user_id: event.userId,
        metadata: event.metadata,
      });

      if (error) throw error;
    } catch (error) {
      logger.error('Error tracking analytics event:', error);
      // Don't throw - analytics should not break the main flow
    }
  }

  static async getTrendingGradients(limit: number = 10): Promise<TrendingGradient[]> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase.rpc('get_trending_gradients', {
        days_ago: 30,
        result_limit: limit,
      });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting trending gradients:', error);
      throw error;
    }
  }

  static async getPopularGradients(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('gradients')
        .select('*')
        .eq('is_public', true)
        .order('accessibility_score', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting popular gradients:', error);
      throw error;
    }
  }
}
