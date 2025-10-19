// API endpoints
import express from 'express';
import { emailController } from '../controllers/emailController';
import { logger } from '../utils/logger';

const router = express.Router();

// Get all emails with optional filtering (Assignment Requirement 2)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search, account, folder } = req.query;
    const emails = await emailController.getEmails({
      page: Number(page),
      limit: Number(limit),
      category: category as string,
      search: search as string,
      accountId: account as string,
      folder: folder as string
    });
    res.json(emails);
  } catch (error) {
    logger.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

// Search emails (Assignment Requirement 2 - Elasticsearch powered search)
router.get('/search', async (req, res) => {
  try {
    const { q, account, folder, page = 1, limit = 20 } = req.query;
    const emails = await emailController.getEmails({
      page: Number(page),
      limit: Number(limit),
      search: q as string,
      accountId: account as string,
      folder: folder as string
    });
    res.json(emails);
  } catch (error) {
    logger.error('Error searching emails:', error);
    res.status(500).json({ error: 'Failed to search emails' });
  }
});

// Get email by ID
router.get('/:id', async (req, res) => {
  try {
    const email = await emailController.getEmailById(req.params.id);
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }
    res.json(email);
  } catch (error) {
    logger.error('Error fetching email:', error);
    res.status(500).json({ error: 'Failed to fetch email' });
  }
});

// Get suggested reply for an email (Assignment Requirement 6 - RAG)
router.post('/:id/suggest-reply', async (req, res) => {
  try {
    const { context } = req.body;
    const suggestedReply = await emailController.getSuggestedReply(req.params.id, context);
    res.json({ suggestedReply });
  } catch (error) {
    logger.error('Error generating suggested reply:', error);
    res.status(500).json({ error: 'Failed to generate suggested reply' });
  }
});

// Categorize emails (Assignment Requirement 3 - AI Categorization)
router.post('/categorize', async (req, res) => {
  try {
    const { emailIds } = req.body;
    const result = await emailController.categorizeEmailsByIds(emailIds);
    res.json(result);
  } catch (error) {
    logger.error('Error categorizing emails:', error);
    res.status(500).json({ error: 'Failed to categorize emails' });
  }
});

// Delete email
router.delete('/:id', async (req, res) => {
  try {
    await emailController.deleteEmail(req.params.id);
    res.json({ message: 'Email deleted successfully' });
  } catch (error) {
    logger.error('Error deleting email:', error);
    res.status(500).json({ error: 'Failed to delete email' });
  }
});

// Get accounts (Assignment Requirement 5 - Frontend Support)
router.get('/accounts/list', async (req, res) => {
  try {
    const accounts = await emailController.getAccounts();
    res.json(accounts);
  } catch (error) {
    logger.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Get statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await emailController.getStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Test webhooks (Assignment Requirement 4)
router.post('/test/webhooks', async (req, res) => {
  try {
    const results = await emailController.testWebhooks();
    res.json(results);
  } catch (error) {
    logger.error('Error testing webhooks:', error);
    res.status(500).json({ error: 'Failed to test webhooks' });
  }
});

export { router as emailRoutes };
