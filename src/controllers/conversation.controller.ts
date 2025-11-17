import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ConversationModel, MessageModel } from '../models/conversation.model';
import { AIChatService } from '../services/ai-chat.service';
import { logger } from '../config/logger';
import { AppError } from '../middleware/errorHandler.middleware';

export class ConversationController {
  /**
   * Get all conversations for current user
   */
  static async getConversations(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const params = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await ConversationModel.findByUserId(userId, params);
      logger.info(`Retrieved ${result.data.length} conversations for user ${userId}`);

      res.json(result);
    } catch (error) {
      logger.error('Error getting conversations:', error);
      throw error;
    }
  }

  /**
   * Get specific conversation with messages
   */
  static async getConversation(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const conversation = await ConversationModel.getWithMessages(id, userId);

      if (!conversation) {
        throw new AppError('Conversation not found', 404);
      }

      logger.info(`Retrieved conversation ${id} with ${conversation.messages.length} messages`);

      res.json(conversation);
    } catch (error) {
      logger.error('Error getting conversation:', error);
      throw error;
    }
  }

  /**
   * Create a new conversation
   */
  static async createConversation(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { title } = req.body;

      const conversation = await ConversationModel.create(userId, title);
      logger.info(`Created conversation ${conversation.id} for user ${userId}`);

      res.status(201).json(conversation);
    } catch (error) {
      logger.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Send a message and get AI response (with gradient generation)
   */
  static async sendMessage(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { content, conversationId } = req.body;

      // Create conversation if not provided
      let convId = conversationId;
      let conversation;

      if (!convId) {
        conversation = await ConversationModel.create(userId);
        convId = conversation.id!;
      } else {
        conversation = await ConversationModel.findById(convId, userId);
        if (!conversation) {
          throw new AppError('Conversation not found', 404);
        }
      }

      // Save user message
      const userMessage = await MessageModel.create(convId, 'user', content);

      // Get conversation history
      const history = await MessageModel.findByConversationId(convId);

      // Generate AI response with gradients
      const { gradients, responseText } = await AIChatService.generateGradientsWithChat(
        content,
        history.filter((m) => m.id !== userMessage.id), // Exclude just-created message
        userId
      );

      // Save assistant message with suggested gradients
      const assistantMessage = await MessageModel.create(
        convId,
        'assistant',
        responseText,
        gradients
      );

      logger.info(
        `Sent message to conversation ${convId}, generated ${gradients.length} gradients`
      );

      res.json({
        message: assistantMessage,
        conversation,
        userMessage,
      });
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Stream AI response (for real-time chat)
   */
  static async streamMessage(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { content, conversationId } = req.body;

      if (!conversationId) {
        throw new AppError('conversationId required for streaming', 400);
      }

      const conversation = await ConversationModel.findById(conversationId, userId);
      if (!conversation) {
        throw new AppError('Conversation not found', 404);
      }

      // Save user message
      await MessageModel.create(conversationId, 'user', content);

      // Get conversation history
      const history = await MessageModel.findByConversationId(conversationId);

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Stream response
      const stream = AIChatService.streamGradientGeneration(content, history);

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      logger.error('Error streaming message:', error);
      throw error;
    }
  }

  /**
   * Update conversation title
   */
  static async updateConversation(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const { title } = req.body;

      const conversation = await ConversationModel.updateTitle(id, userId, title);
      logger.info(`Updated conversation ${id} title`);

      res.json(conversation);
    } catch (error) {
      logger.error('Error updating conversation:', error);
      throw error;
    }
  }

  /**
   * Delete conversation
   */
  static async deleteConversation(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      await ConversationModel.delete(id, userId);
      logger.info(`Deleted conversation ${id}`);

      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting conversation:', error);
      throw error;
    }
  }
}
