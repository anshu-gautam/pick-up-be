import { prisma } from '../config/prisma';
import { Conversation, Message, ConversationWithMessages, PaginationParams, PaginatedResponse, Gradient } from '../types';
import { Prisma } from '@prisma/client';
import { logger } from '../config/logger';

export class ConversationModel {
  /**
   * Create a new conversation
   */
  static async create(userId: string, title?: string): Promise<Conversation> {
    try {
      const conversation = await prisma.conversation.create({
        data: {
          userId,
          title: title || null,
        },
      });

      return this.mapToConversation(conversation);
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
      const conversation = await prisma.conversation.findFirst({
        where: { id, userId },
      });

      return conversation ? this.mapToConversation(conversation) : null;
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
      const skip = (page - 1) * limit;
      const sortBy = params.sortBy || 'updatedAt';
      const sortOrder = params.sortOrder || 'desc';

      const [conversations, total] = await Promise.all([
        prisma.conversation.findMany({
          where: { userId },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.conversation.count({ where: { userId } }),
      ]);

      return {
        data: conversations.map(this.mapToConversation),
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
      const conversation = await prisma.conversation.findFirst({
        where: { id, userId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!conversation) return null;

      return {
        conversation: this.mapToConversation(conversation),
        messages: conversation.messages.map(MessageModel.mapToMessage),
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
      const conversation = await prisma.conversation.update({
        where: { id, userId },
        data: { title },
      });

      return this.mapToConversation(conversation);
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
      await prisma.conversation.delete({
        where: { id, userId },
      });
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
      userId: data.userId,
      title: data.title,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
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
      const message = await prisma.message.create({
        data: {
          conversationId,
          role,
          content,
          suggestedGradients: suggestedGradients
            ? (suggestedGradients as Prisma.InputJsonValue)
            : undefined,
        },
      });

      // Update conversation's updatedAt
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      // Auto-generate title if first user message
      if (role === 'user') {
        const messageCount = await prisma.message.count({
          where: { conversationId },
        });

        if (messageCount === 1) {
          const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
          });

          if (conversation && !conversation.title) {
            await prisma.conversation.update({
              where: { id: conversationId },
              data: { title: content.substring(0, 100) },
            });
          }
        }
      }

      return this.mapToMessage(message);
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
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
      });

      return messages.map(this.mapToMessage);
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
      return await prisma.message.count({
        where: { conversationId },
      });
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
      await prisma.message.deleteMany({
        where: { conversationId },
      });
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
      conversationId: data.conversationId,
      role: data.role as 'user' | 'assistant' | 'system',
      content: data.content,
      suggestedGradients: data.suggestedGradients as Gradient[] | undefined,
      createdAt: data.createdAt,
    };
  }
}
