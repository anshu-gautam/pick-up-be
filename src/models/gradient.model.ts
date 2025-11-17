import { supabase } from '../config/database';
import { Gradient, PaginationParams, PaginatedResponse } from '../types';
import { logger } from '../config/logger';

export class GradientModel {
  static async create(gradient: Gradient): Promise<Gradient> {
    try {
      const { data, error } = await supabase
        .from('gradients')
        .insert({
          user_id: gradient.userId,
          name: gradient.name,
          type: gradient.type,
          angle: gradient.angle,
          color_stops: gradient.colorStops,
          accessibility_score: gradient.accessibilityScore,
          tags: gradient.tags,
          is_public: gradient.isPublic || false,
        })
        .select()
        .single();

      if (error) throw error;
      return this.mapToGradient(data);
    } catch (error) {
      logger.error('Error creating gradient:', error);
      throw error;
    }
  }

  static async findById(id: string, userId?: string): Promise<Gradient | null> {
    try {
      let query = supabase.from('gradients').select('*').eq('id', id);

      if (userId) {
        query = query.or(`user_id.eq.${userId},is_public.eq.true`);
      } else {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapToGradient(data);
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
      const offset = (page - 1) * limit;
      const sortBy = params.sortBy || 'created_at';
      const sortOrder = params.sortOrder || 'desc';

      const query = supabase
        .from('gradients')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      const gradients = (data || []).map(this.mapToGradient);
      const total = count || 0;

      return {
        data: gradients,
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
      const offset = (page - 1) * limit;
      const sortBy = params.sortBy || 'created_at';
      const sortOrder = params.sortOrder || 'desc';

      const query = supabase
        .from('gradients')
        .select('*', { count: 'exact' })
        .eq('is_public', true)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      const gradients = (data || []).map(this.mapToGradient);
      const total = count || 0;

      return {
        data: gradients,
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
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.angle !== undefined) updateData.angle = updates.angle;
      if (updates.colorStops !== undefined) updateData.color_stops = updates.colorStops;
      if (updates.accessibilityScore !== undefined)
        updateData.accessibility_score = updates.accessibilityScore;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;

      const { data, error } = await supabase
        .from('gradients')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return this.mapToGradient(data);
    } catch (error) {
      logger.error('Error updating gradient:', error);
      throw error;
    }
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('gradients')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Error deleting gradient:', error);
      throw error;
    }
  }

  private static mapToGradient(data: any): Gradient {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      type: data.type,
      angle: data.angle,
      colorStops: data.color_stops,
      accessibilityScore: data.accessibility_score,
      tags: data.tags,
      isPublic: data.is_public,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}
