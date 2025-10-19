// AI email categorization using Gemini API
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { logger } from '../utils/logger';
import { EmailDocument } from '../imap/imapClient';

export class AiCategorizer {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async categorizeEmail(email: EmailDocument): Promise<string> {
    try {
      if (!config.GEMINI_API_KEY) {
        logger.warn('Gemini API key not configured, using fallback categorization');
        return this.fallbackCategorization(email);
      }

      const prompt = this.buildCategorizationPrompt(email);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const category = response.text().trim();

      const validCategory = this.validateCategory(category);
      if (validCategory) {
        logger.debug(`Email categorized as: ${validCategory}`);
        return validCategory;
      } else {
        logger.warn(`Invalid category received: ${category}, using fallback`);
        return this.fallbackCategorization(email);
      }
    } catch (error) {
      logger.error('Error categorizing email with AI:', error);
      return this.fallbackCategorization(email);
    }
  }

  private buildCategorizationPrompt(email: EmailDocument): string {
    return `
You are an expert email classifier for a sales outreach platform. Analyze the provided email and categorize it into exactly ONE of these categories:

1. "Interested" - The recipient shows interest in the product/service, asks questions, or wants to learn more
2. "Meeting Booked" - The recipient has scheduled or confirmed a meeting/call
3. "Not Interested" - The recipient explicitly states they are not interested or declines the offer
4. "Spam" - Unwanted promotional emails, newsletters, or irrelevant content
5. "Out of Office" - Automated out-of-office replies or vacation responses

Email Details:
Subject: ${email.subject || 'No subject'}
From: ${email.from || 'Unknown sender'}
Body: ${this.truncateText(email.body || '', 800)}

Instructions:
- Return ONLY the category name (exactly as written above)
- Be precise and conservative in your classification
- If uncertain, choose the most appropriate category based on the email content

Category:`;
  }

  private fallbackCategorization(email: EmailDocument): string {
    const subject = (email.subject || '').toLowerCase();
    const from = (email.from || '').toLowerCase();
    const body = (email.body || '').toLowerCase();

    // Simple rule-based categorization for the 5 required categories
    if (subject.includes('out of office') || subject.includes('auto-reply') || 
        subject.includes('vacation') || body.includes('out of office')) {
      return 'Out of Office';
    }

    if (subject.includes('unsubscribe') || from.includes('noreply') || 
        subject.includes('newsletter') || body.includes('unsubscribe')) {
      return 'Spam';
    }

    if (subject.includes('not interested') || body.includes('not interested') ||
        body.includes('decline') || body.includes('pass')) {
      return 'Not Interested';
    }

    if (subject.includes('meeting') || subject.includes('call') || 
        subject.includes('schedule') || body.includes('calendar')) {
      return 'Meeting Booked';
    }

    if (body.includes('interested') || body.includes('more information') ||
        body.includes('tell me more') || body.includes('?')) {
      return 'Interested';
    }

    return 'Spam'; // Default fallback
  }

  private validateCategory(category: string | undefined): string | null {
    const validCategories = config.AI_CATEGORIES;

    if (category && validCategories.includes(category as any)) {
      return category;
    }

    return null;
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }

  async batchCategorizeEmails(emails: EmailDocument[]): Promise<Array<{ email: EmailDocument; category: string }>> {
    try {
      const results = await Promise.all(
        emails.map(async (email) => {
          const category = await this.categorizeEmail(email);
          return { email, category };
        })
      );

      logger.info(`Categorized ${emails.length} emails`);
      return results;
    } catch (error) {
      logger.error('Error batch categorizing emails:', error);
      throw error;
    }
  }
}

export const aiCategorizer = new AiCategorizer();
