// RAG suggested reply
import OpenAI from 'openai';
import { config } from '../config';
import { logger } from '../utils/logger';

export class SuggestedReply {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.OPENAI_API_KEY
    });
  }

  async generateReply(email: any, context?: string): Promise<string> {
    try {
      if (!config.OPENAI_API_KEY) {
        logger.warn('OpenAI API key not configured, using fallback reply generation');
        return this.generateFallbackReply(email);
      }

      const prompt = this.buildReplyPrompt(email, context);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful email assistant. Generate appropriate, professional replies to emails. Keep replies concise and relevant to the original message.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      });

      const reply = response.choices[0]?.message?.content?.trim();
      return reply || this.generateFallbackReply(email);
    } catch (error) {
      logger.error('Error generating suggested reply:', error);
      return this.generateFallbackReply(email);
    }
  }

  private buildReplyPrompt(email: any, context?: string): string {
    let prompt = `
      Original Email:
      Subject: ${email.subject || 'No subject'}
      From: ${email.from || 'Unknown sender'}
      Date: ${email.date || 'Unknown date'}
      Body: ${this.truncateText(email.body || '', 1000)}
    `;

    if (context) {
      prompt += `\n\nContext: ${context}`;
    }

    prompt += `\n\nPlease generate a professional, appropriate reply to this email. The reply should be concise and address the main points of the original message.`;

    return prompt;
  }

  private generateFallbackReply(email: any): string {
    const subject = email.subject || 'No subject';
    const senderName = this.extractSenderName(email.from);

    return `Hi ${senderName},

Thank you for your email regarding "${subject}".

I have received your message and will review it shortly. I'll get back to you with a response as soon as possible.

Best regards`;
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

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }

  async generateMultipleReplies(email: any, count: number = 3): Promise<string[]> {
    try {
      if (!config.OPENAI_API_KEY) {
        return [this.generateFallbackReply(email)];
      }

      const prompt = this.buildReplyPrompt(email);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Generate ${count} different professional reply options for the email. Each reply should be distinct and appropriate for different response styles (formal, casual, brief, detailed). Return each reply separated by "---REPLY_SEPARATOR---".`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.8
      });

      const replyText = response.choices[0]?.message?.content?.trim();
      if (replyText) {
        return replyText.split('---REPLY_SEPARATOR---').map(reply => reply.trim()).filter(reply => reply.length > 0);
      }

      return [this.generateFallbackReply(email)];
    } catch (error) {
      logger.error('Error generating multiple replies:', error);
      return [this.generateFallbackReply(email)];
    }
  }

  async analyzeEmailTone(email: any): Promise<string> {
    try {
      if (!config.OPENAI_API_KEY) {
        return 'neutral';
      }

      const prompt = `
        Analyze the tone of this email:
        Subject: ${email.subject || 'No subject'}
        Body: ${this.truncateText(email.body || '', 500)}
        
        Determine if the tone is: formal, casual, urgent, friendly, professional, or neutral.
        Return only the tone classification.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an email tone analyzer. Analyze emails and classify their tone.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 20,
        temperature: 0.1
      });

      const tone = response.choices[0]?.message?.content?.trim().toLowerCase();
      const validTones = ['formal', 'casual', 'urgent', 'friendly', 'professional', 'neutral'];
      
      return validTones.includes(tone || '') ? tone : 'neutral';
    } catch (error) {
      logger.error('Error analyzing email tone:', error);
      return 'neutral';
    }
  }
}

export const suggestedReply = new SuggestedReply();
