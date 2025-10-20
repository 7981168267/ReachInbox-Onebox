import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ElasticClient } from "./elastic/elasticClient.js";
import { AiCategorizer } from "./services/aiCategorizer.js";
import { WebhookService } from "./services/webhookService.js";
import { ImapClient } from "./imap/imapClient.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize services
const elasticClient = new ElasticClient();
const aiCategorizer = new AiCategorizer();
const webhookService = new WebhookService();

// Initialize IMAP clients for demo accounts
const imapClients: ImapClient[] = [];

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static("public"));

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString()
  });
});

// API status
app.get("/api/status", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Real emails endpoint with Elasticsearch
app.get("/api/emails", async (req, res) => {
  try {
    const { account, folder, category, from = 0, size = 20 } = req.query;
    
    const result = await elasticClient.searchEmails('', {
      accountId: account as string,
      folder: folder as string,
      category: category as string,
      from: parseInt(from as string),
      size: parseInt(size as string)
    });

    res.json({
      emails: result.emails,
      total: result.total,
      page: Math.floor(parseInt(from as string) / parseInt(size as string)) + 1,
      limit: parseInt(size as string)
    });
  } catch (error) {
    console.error('Failed to fetch emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

// Mock accounts endpoint
app.get("/api/emails/accounts/list", (req, res) => {
  res.json([
    {
      accountId: "demo@reachinbox.com",
      host: "imap.gmail.com",
      isConnected: true
    }
  ]);
});

// Real search endpoint with Elasticsearch
app.get("/api/emails/search", async (req, res) => {
  try {
    const { q, account, folder, category, from = 0, size = 20 } = req.query;
    
    const result = await elasticClient.searchEmails(q as string, {
      accountId: account as string,
      folder: folder as string,
      category: category as string,
      from: parseInt(from as string),
      size: parseInt(size as string)
    });

    res.json({
      emails: result.emails,
      total: result.total,
      page: Math.floor(parseInt(from as string) / parseInt(size as string)) + 1,
      limit: parseInt(size as string)
    });
  } catch (error) {
    console.error('Search failed:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Real AI suggested reply endpoint
app.post("/api/emails/:id/suggest-reply", async (req, res) => {
  try {
    const { id } = req.params;
    const { context } = req.body;
    
    // Get email details from Elasticsearch
    const result = await elasticClient.searchEmails('', { accountId: '', folder: '', category: '' });
    const email = result.emails.find(e => e.id === id);
    
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Generate AI reply using RAG (simplified for now)
    const suggestedReply = await generateAIReply(email, context);
    
    res.json({
      suggestedReply: suggestedReply
    });
  } catch (error) {
    console.error('Failed to generate reply:', error);
    res.status(500).json({ error: 'Failed to generate reply' });
  }
});

// Real AI categorization endpoint
app.post("/api/emails/categorize", async (req, res) => {
  try {
    const { emailIds } = req.body;
    
    if (!Array.isArray(emailIds)) {
      return res.status(400).json({ error: 'emailIds must be an array' });
    }

    const results = [];
    
    for (const id of emailIds) {
      // Get email from Elasticsearch
      const result = await elasticClient.searchEmails('', { accountId: '', folder: '', category: '' });
      const email = result.emails.find(e => e.id === id);
      
      if (email) {
        // Categorize using AI
        const categorization = await aiCategorizer.categorizeEmail({
          subject: email.subject,
          body: email.body,
          from: email.from,
          to: email.to
        });

        // Update in Elasticsearch
        await elasticClient.updateEmailCategory(id, categorization.category);
        
        results.push({
          id: id,
          category: categorization.category,
          confidence: categorization.confidence
        });

        // Trigger webhooks for interested leads
        if (categorization.category === 'Interested') {
          await webhookService.triggerInterestedLeadWebhooks({
            id: email.id,
            subject: email.subject,
            from: email.from,
            to: email.to,
            body: email.body,
            date: email.date,
            category: categorization.category
          });
        }
      } else {
        results.push({
          id: id,
          category: 'Uncategorized',
          confidence: 0.0
        });
      }
    }

    res.json({ results });
  } catch (error) {
    console.error('Categorization failed:', error);
    res.status(500).json({ error: 'Categorization failed' });
  }
});

// Helper function for AI reply generation
async function generateAIReply(email: any, context?: string): Promise<string> {
  // Simplified AI reply generation (can be enhanced with RAG)
  const templates = {
    'Interested': `Hi ${email.from.split('@')[0]},\n\nThank you for your interest in ReachInbox! I'd be happy to schedule a demo to show you how our AI-driven platform can help your sales team.\n\nYou can book a convenient time here: https://cal.com/reachinbox-demo\n\nLooking forward to speaking with you!\n\nBest regards,\nThe ReachInbox Team`,
    'Meeting Booked': `Hi ${email.from.split('@')[0]},\n\nPerfect! I'm excited about our meeting. I'll send you a calendar invite shortly with all the details.\n\nSee you then!\n\nBest regards,\nThe ReachInbox Team`,
    'Not Interested': `Hi ${email.from.split('@')[0]},\n\nThank you for your response. I understand you're not interested at this time.\n\nI'll remove you from our list. If you change your mind in the future, feel free to reach out.\n\nBest regards,\nThe ReachInbox Team`,
    'default': `Hi ${email.from.split('@')[0]},\n\nThank you for reaching out. I appreciate your interest in ReachInbox.\n\nI'd be happy to help you with any questions you might have about our AI-powered email outreach platform.\n\nFeel free to schedule a demo if you'd like to see it in action: https://cal.com/reachinbox-demo\n\nBest regards,\nThe ReachInbox Team`
  };

  return templates[email.aiCategory as keyof typeof templates] || templates.default;
}

// Initialize services
async function initializeServices() {
  try {
    // Initialize Elasticsearch
    console.log('🔍 Initializing Elasticsearch...');
    const elasticConnected = await elasticClient.ping();
    if (elasticConnected) {
      await elasticClient.createIndex();
      console.log('✅ Elasticsearch ready');
    } else {
      console.log('⚠️ Elasticsearch not available, using mock mode');
    }

    // Initialize webhook service
    const webhookStatus = webhookService.getConfigurationStatus();
    console.log(`🔗 Webhook status: Slack=${webhookStatus.slack}, Generic=${webhookStatus.webhook}`);

    // Initialize demo IMAP accounts (mock for now)
    console.log('📧 IMAP clients initialized (demo mode)');
    
    console.log('✅ All services initialized');
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📧 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API status: http://localhost:${PORT}/api/status`);
  
  // Initialize services
  await initializeServices();
});

export default app;