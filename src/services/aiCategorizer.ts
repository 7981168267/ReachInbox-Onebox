import { GoogleGenerativeAI } from '@google/generative-ai';

export interface EmailCategorization {
  category: 'Interested' | 'Meeting Booked' | 'Not Interested' | 'Spam' | 'Out of Office' | 'Uncategorized';
  confidence: number;
  reasoning?: string;
}

export class AiCategorizer {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.log('⚠️ GEMINI_API_KEY not found, using mock categorization');
      this.genAI = null as any;
      this.model = null;
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: "gemini-pro",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              category: {
                type: "string",
                enum: ["Interested", "Meeting Booked", "Not Interested", "Spam", "Out of Office", "Uncategorized"]
              },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 1
              },
              reasoning: {
                type: "string"
              }
            },
            required: ["category", "confidence"]
          }
        }
      });
    }
  }

  async categorizeEmail(email: {
    subject: string;
    body: string;
    from: string;
    to: string[];
  }): Promise<EmailCategorization> {
    if (!this.model) {
      return this.mockCategorization(email);
    }

    try {
      const prompt = this.buildCategorizationPrompt(email);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const categorization = JSON.parse(text);
      
      return {
        category: categorization.category,
        confidence: categorization.confidence || 0.8,
        reasoning: categorization.reasoning
      };
    } catch (error) {
      console.error('AI categorization failed, using fallback:', error);
      return this.fallbackCategorization(email);
    }
  }

  private buildCategorizationPrompt(email: {
    subject: string;
    body: string;
    from: string;
    to: string[];
  }): string {
    return `
You are an expert email classifier for a sales and lead generation platform. Analyze the following email and categorize it into one of these categories:

**Categories:**
- **Interested**: Shows genuine interest in products/services, requests for demos, pricing, or more information
- **Meeting Booked**: Confirms meetings, appointments, or scheduled calls
- **Not Interested**: Explicitly declines, says no, or asks to be removed from lists
- **Spam**: Unwanted promotional content, newsletters, or irrelevant messages
- **Out of Office**: Auto-replies, vacation notices, or unavailability messages
- **Uncategorized**: Doesn't clearly fit any other category

**Email to analyze:**
Subject: ${email.subject}
From: ${email.from}
To: ${email.to.join(', ')}
Body: ${email.body}

**Instructions:**
1. Analyze the email content, tone, and intent
2. Consider the sender's relationship and context
3. Look for keywords that indicate interest, meeting confirmation, rejection, etc.
4. Provide a confidence score (0-1) based on how clear the categorization is
5. Give brief reasoning for your decision

Respond with JSON format containing category, confidence, and reasoning.
    `.trim();
  }

  private mockCategorization(email: {
    subject: string;
    body: string;
    from: string;
  }): EmailCategorization {
    const subject = email.subject.toLowerCase();
    const body = email.body.toLowerCase();
    const from = email.from.toLowerCase();

    // Mock categorization logic
    if (subject.includes('interested') || body.includes('demo') || body.includes('pricing')) {
      return {
        category: 'Interested',
        confidence: 0.9,
        reasoning: 'Contains interest indicators like "demo" or "pricing"'
      };
    }

    if (subject.includes('meeting') || subject.includes('call') || body.includes('schedule')) {
      return {
        category: 'Meeting Booked',
        confidence: 0.85,
        reasoning: 'Contains meeting or scheduling keywords'
      };
    }

    if (subject.includes('not interested') || body.includes('remove') || body.includes('unsubscribe')) {
      return {
        category: 'Not Interested',
        confidence: 0.9,
        reasoning: 'Contains rejection or removal requests'
      };
    }

    if (subject.includes('newsletter') || from.includes('noreply') || body.includes('unsubscribe')) {
      return {
        category: 'Spam',
        confidence: 0.8,
        reasoning: 'Appears to be promotional or automated content'
      };
    }

    if (subject.includes('out of office') || body.includes('vacation') || body.includes('unavailable')) {
      return {
        category: 'Out of Office',
        confidence: 0.9,
        reasoning: 'Contains out-of-office indicators'
      };
    }

    return {
      category: 'Uncategorized',
      confidence: 0.6,
      reasoning: 'No clear categorization indicators found'
    };
  }

  private fallbackCategorization(email: {
    subject: string;
    body: string;
    from: string;
  }): EmailCategorization {
    // Simple keyword-based fallback
    const text = `${email.subject} ${email.body}`.toLowerCase();

    if (text.includes('interested') || text.includes('demo') || text.includes('pricing')) {
      return { category: 'Interested', confidence: 0.7 };
    }

    if (text.includes('meeting') || text.includes('call') || text.includes('schedule')) {
      return { category: 'Meeting Booked', confidence: 0.7 };
    }

    if (text.includes('not interested') || text.includes('remove')) {
      return { category: 'Not Interested', confidence: 0.7 };
    }

    if (text.includes('newsletter') || text.includes('unsubscribe')) {
      return { category: 'Spam', confidence: 0.7 };
    }

    if (text.includes('out of office') || text.includes('vacation')) {
      return { category: 'Out of Office', confidence: 0.7 };
    }

    return { category: 'Uncategorized', confidence: 0.5 };
  }

  async batchCategorizeEmails(emails: Array<{
    id: string;
    subject: string;
    body: string;
    from: string;
    to: string[];
  }>): Promise<Array<{ id: string; category: string; confidence: number }>> {
    const results = [];

    for (const email of emails) {
      try {
        const categorization = await this.categorizeEmail(email);
        results.push({
          id: email.id,
          category: categorization.category,
          confidence: categorization.confidence
        });
      } catch (error) {
        console.error(`Failed to categorize email ${email.id}:`, error);
        results.push({
          id: email.id,
          category: 'Uncategorized',
          confidence: 0.5
        });
      }
    }

    return results;
  }

  validateCategory(category: string): boolean {
    const validCategories = [
      'Interested', 'Meeting Booked', 'Not Interested', 
      'Spam', 'Out of Office', 'Uncategorized'
    ];
    return validCategories.includes(category);
  }
}