import { answerChatbot } from '../utils/chatbotKnowledge.js';
import { ValidationError } from '../utils/errors.js';

export const askChatbot = async (req, res) => {
  const message = typeof req.body?.message === 'string' ? req.body.message.trim().slice(0, 500) : '';
  if (!message) throw new ValidationError('Please type a message');
  const result = answerChatbot(message);
  return res.status(200).json({ success: true, status: 200, data: result });
};