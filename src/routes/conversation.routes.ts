import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller';
import { authenticate } from '../middleware/auth.middleware';
import { defaultRateLimiter, strictRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// Get all conversations
router.get(
  '/',
  defaultRateLimiter,
  authenticate,
  ConversationController.getConversations
);

// Get specific conversation with messages
router.get(
  '/:id',
  defaultRateLimiter,
  authenticate,
  ConversationController.getConversation
);

// Create new conversation
router.post(
  '/',
  defaultRateLimiter,
  authenticate,
  ConversationController.createConversation
);

// Send message (generates AI response with gradients)
router.post(
  '/messages',
  strictRateLimiter,
  authenticate,
  ConversationController.sendMessage
);

// Stream message (real-time AI response)
router.post(
  '/messages/stream',
  strictRateLimiter,
  authenticate,
  ConversationController.streamMessage
);

// Update conversation
router.put(
  '/:id',
  defaultRateLimiter,
  authenticate,
  ConversationController.updateConversation
);

// Delete conversation
router.delete(
  '/:id',
  defaultRateLimiter,
  authenticate,
  ConversationController.deleteConversation
);

export default router;
