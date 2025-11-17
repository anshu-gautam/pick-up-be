import { supabase } from '../config/database';
import { UserProfile, UserStats } from '../types';
import { logger } from '../config/logger';

export class UserModel {
  static async findByClerkId(clerkId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', clerkId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapToUserProfile(data);
    } catch (error) {
      logger.error('Error finding user by Clerk ID:', error);
      throw error;
    }
  }

  static async create(clerkId: string, email: string, name?: string): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          clerk_id: clerkId,
          email,
          name,
        })
        .select()
        .single();

      if (error) throw error;
      return this.mapToUserProfile(data);
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
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.preferences !== undefined) updateData.preferences = updates.preferences;

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('clerk_id', clerkId)
        .select()
        .single();

      if (error) throw error;
      return this.mapToUserProfile(data);
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }
  }

  static async getStats(userId: string): Promise<UserStats> {
    try {
      const [userResult, gradientsResult, favoritesResult] = await Promise.all([
        supabase.from('users').select('*').eq('id', userId).single(),
        supabase
          .from('gradients')
          .select('id, is_public', { count: 'exact' })
          .eq('user_id', userId),
        supabase.from('favorites').select('id', { count: 'exact' }).eq('user_id', userId),
      ]);

      if (userResult.error) throw userResult.error;

      const user = userResult.data;
      const totalGradients = gradientsResult.count || 0;
      const publicGradients =
        gradientsResult.data?.filter((g) => g.is_public).length || 0;
      const favoriteGradients = favoritesResult.count || 0;

      return {
        totalGradients,
        publicGradients,
        generationsUsed: user.generations_used || 0,
        generationsLimit: user.generations_limit || 100,
        favoriteGradients,
      };
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw error;
    }
  }

  static async incrementGenerations(userId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_generations', { user_id: userId });
      if (error) throw error;
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
      createdAt: new Date(data.created_at),
      preferences: data.preferences,
    };
  }
}
