// RAG Service for Suggested Replies using Gemini API
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { logger } from '../utils/logger';
import { EmailDocument } from '../imap/imapClient';

export class RagService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async initialize(): Promise<void> {
    try {
      logger.info('RAG service initialized successfully (simplified version)');
    } catch (error) {
      logger.error('Error initializing RAG service:', error);
      throw error;
    }
  }

  async generateSuggestedReply(email: EmailDocument, context?: string): Promise<string> {
    try {
      if (!config.GEMINI_API_KEY) {
        return this.generateFallbackReply(email);
      }

      // Generate reply using Gemini with built-in context
      const reply = await this.generateRAGReply(email, context);

      logger.info(`Generated suggested reply for email: ${email.id}`);
      return reply;
    } catch (error) {
      logger.error('Error generating suggested reply:', error);
      return this.generateFallbackReply(email);
    }
  }

  private async generateRAGReply(email: EmailDocument, additionalContext?: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `
You are a helpful sales assistant for ReachInbox, an AI-driven cold outreach platform. Based on the original email, generate a professional and helpful reply.

REACHINBOX CONTEXT:
ReachInbox is an AI-driven platform that transforms cold outreach. We help businesses find, enrich, and engage high-intent leads through multi-channel outreach on Twitter, LinkedIn, email, and phone. Our platform uses AI to prospect and verify leads, craft personalized sequences, and notify businesses of responsive prospects.

Key Features:
- Smart lead scoring and verification
- Personalized email generation
- Multi-channel outreach automation
- Real-time engagement tracking
- Intelligent follow-up sequences

Meeting Booking: https://cal.com/reachinbox-demo
Pricing: Starting at $99/month for Starter plan
Support: support@reachinbox.com

ORIGINAL EMAIL:
Subject: ${email.subject || 'No subject'}
From: ${email.from || 'Unknown sender'}
Body: ${email.body}

${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}` : ''}

INSTRUCTIONS:
- Write a professional, helpful reply that addresses the recipient's needs
- Use the provided ReachInbox context to give relevant information
- Be concise but informative
- Include a clear call-to-action if appropriate
- Maintain a friendly and professional tone
- If they're interested, mention the demo booking link

Reply:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      logger.error('Error generating RAG reply:', error);
      throw error;
    }
  }

  private generateFallbackReply(email: EmailDocument): string {
    const senderName = this.extractSenderName(email.from);
    
    return `Hi ${senderName},

Thank you for your email regarding "${email.subject || 'your inquiry'}".

I appreciate you reaching out. I'd be happy to discuss how ReachInbox can help your business with AI-driven lead generation and outreach automation.

Would you be interested in scheduling a brief demo to see our platform in action? You can book a time that works for you here: https://cal.com/reachinbox-demo

Looking forward to hearing from you.

Best regards,
The ReachInbox Team`;
  }

  private extractSenderName(from: string): string {
    if (!from) return 'there';

    // Extract name from email format: "Name <email@domain.com>"
    const nameMatch = from.match(/^(.+?)\s*<.+>$/);
    if (nameMatch) {
      return nameMatch[1].trim();
    }

    // Extract name from email address
    const emailMatch = from.match(/^(.+?)@/);
    if (emailMatch) {
      return emailMatch[1].replace(/[._]/g, ' ');
    }

    return 'there';
  }
}

export const ragService = new RagService();