import { supabase } from '../config/database';
import { Conversation, Message, ConversationWithMessages, PaginationParams, PaginatedResponse } from '../types';
import { logger } from '../config/logger';

export class ConversationModel {
  /**
   * Create a new conversation
   */
  static async create(userId: string, title?: string): Promise<Conversation> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          title: title || null,
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapToConversation(data);
    } catch (error) {
      logger.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Find conversation by ID
   */
  static async findById(id: string, userId: string): Promise<Conversation | null> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapToConversation(data);
    } catch (error) {
      logger.error('Error finding conversation:', error);
      throw error;
    }
  }

  /**
   * Find all conversations for a user (paginated)
   */
  static async findByUserId(
    userId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<Conversation>> {
    try {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const offset = (page - 1) * limit;
      const sortBy = params.sortBy || 'updated_at';
      const sortOrder = params.sortOrder || 'desc';

      const query = supabase
        .from('conversations')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      const conversations = (data || []).map(this.mapToConversation);
      const total = count || 0;

      return {
        data: conversations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error finding conversations:', error);
      throw error;
    }
  }

  /**
   * Get conversation with all messages
   */
  static async getWithMessages(id: string, userId: string): Promise<ConversationWithMessages | null> {
    try {
      // Get conversation
      const conversation = await this.findById(id, userId);
      if (!conversation) return null;

      // Get messages
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messages = (messagesData || []).map(MessageModel.mapToMessage);

      return {
        conversation,
        messages,
      };
    } catch (error) {
      logger.error('Error getting conversation with messages:', error);
      throw error;
    }
  }

  /**
   * Update conversation title
   */
  static async updateTitle(id: string, userId: string, title: string): Promise<Conversation> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .update({ title })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return this.mapToConversation(data);
    } catch (error) {
      logger.error('Error updating conversation:', error);
      throw error;
    }
  }

  /**
   * Delete conversation
   */
  static async delete(id: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      logger.error('Error deleting conversation:', error);
      throw error;
    }
  }

  /**
   * Map database row to Conversation type
   */
  private static mapToConversation(data: any): Conversation {
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

export class MessageModel {
  /**
   * Create a new message
   */
  static async create(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    suggestedGradients?: any[]
  ): Promise<Message> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role,
          content,
          suggested_gradients: suggestedGradients || null,
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapToMessage(data);
    } catch (error) {
      logger.error('Error creating message:', error);
      throw error;
    }
  }

  /**
   * Find messages by conversation ID
   */
  static async findByConversationId(conversationId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(this.mapToMessage);
    } catch (error) {
      logger.error('Error finding messages:', error);
      throw error;
    }
  }

  /**
   * Get message count for a conversation
   */
  static async getMessageCount(conversationId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      logger.error('Error getting message count:', error);
      throw error;
    }
  }

  /**
   * Delete all messages for a conversation
   */
  static async deleteByConversationId(conversationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      if (error) throw error;

      return true;
    } catch (error) {
      logger.error('Error deleting messages:', error);
      throw error;
    }
  }

  /**
   * Map database row to Message type
   */
  static mapToMessage(data: any): Message {
    return {
      id: data.id,
      conversationId: data.conversation_id,
      role: data.role,
      content: data.content,
      suggestedGradients: data.suggested_gradients,
      createdAt: new Date(data.created_at),
    };
  }
}
