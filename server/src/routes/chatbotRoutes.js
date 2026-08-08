import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { askChatbot } from '../controllers/chatbotController.js';

const router = Router();

router.post('/ask', asyncHandler(askChatbot));

export default router;