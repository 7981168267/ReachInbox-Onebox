// Backend logic
import { ElasticClient } from '../elastic/elasticClient';
import { ImapClient, EmailDocument } from '../imap/imapClient';
import { aiCategorizer } from '../services/aiCategorizer';
import { webhookService } from '../services/webhookService';
import { ragService } from '../services/ragService';
import { config } from '../config';
import { logger } from '../utils/logger';

export class EmailController {
  private elasticClient: ElasticClient;
  private imapClients: ImapClient[] = [];
  private isInitialized: boolean = false;

  constructor() {
    this.elasticClient = new ElasticClient();
    this.initializeImapClients();
  }

  private initializeImapClients(): void {
    for (const account of config.EMAIL_ACCOUNTS) {
      const client = new ImapClient(
        account.user,
        account.password,
        account.host,
        account.port,
        account.secure,
        account.accountId
      );
      this.imapClients.push(client);
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      logger.info('Initializing Email Controller...');

      // Initialize Elasticsearch
      await this.elasticClient.createIndex();
      logger.info('Elasticsearch index created/verified');

      // Initialize RAG service
      await ragService.initialize();
      logger.info('RAG service initialized');

      // Connect all IMAP clients and start initial sync
      for (const client of this.imapClients) {
        await client.connect();
        logger.info(`Connected IMAP client for ${client['accountId']}`);
      }

      // Perform initial sync for all accounts
      await this.performInitialSync();

      // Start real-time IDLE mode for all accounts
      await this.startRealTimeSync();

      this.isInitialized = true;
      logger.info('Email Controller initialization completed');
    } catch (error) {
      logger.error('Error initializing Email Controller:', error);
      throw error;
    }
  }

  private async performInitialSync(): Promise<void> {
    try {
      logger.info('Starting initial email sync...');
      
      for (const client of this.imapClients) {
        try {
          const emails = await client.initialSync();
          
          if (emails.length > 0) {
            // Categorize emails with AI
            const categorizedEmails = await this.categorizeEmails(emails);
            
            // Index in Elasticsearch
            await this.elasticClient.bulkIndexEmails(categorizedEmails);
            
            logger.info(`Initial sync completed for ${client['accountId']}: ${emails.length} emails`);
          }
        } catch (error) {
          logger.error(`Error in initial sync for ${client['accountId']}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error in initial sync:', error);
      throw error;
    }
  }

  private async startRealTimeSync(): Promise<void> {
    try {
      logger.info('Starting real-time email sync...');
      
      for (const client of this.imapClients) {
        await client.startIdleMode(async (email: EmailDocument) => {
          await this.processNewEmail(email);
        });
      }
      
      logger.info('Real-time sync started for all accounts');
    } catch (error) {
      logger.error('Error starting real-time sync:', error);
      throw error;
    }
  }

  private async processNewEmail(email: EmailDocument): Promise<void> {
    try {
      logger.info(`Processing new email: ${email.id}`);

      // Categorize with AI
      const category = await aiCategorizer.categorizeEmail(email);
      email.aiCategory = category as any;

      // Index in Elasticsearch
      await this.elasticClient.indexEmail(email);

      // Trigger webhooks if email is categorized as "Interested"
      if (category === 'Interested') {
        await webhookService.triggerInterestedEmailWebhooks(email);
        logger.info(`Triggered webhooks for Interested email: ${email.id}`);
      }

      logger.info(`Processed new email: ${email.id} with category: ${category}`);
    } catch (error) {
      logger.error(`Error processing new email ${email.id}:`, error);
    }
  }

  private async categorizeEmails(emails: EmailDocument[]): Promise<EmailDocument[]> {
    try {
      const results = await aiCategorizer.batchCategorizeEmails(emails);
      
      return results.map(result => {
        result.email.aiCategory = result.category as any;
        return result.email;
      });
    } catch (error) {
      logger.error('Error categorizing emails:', error);
      // Return emails with default category
      return emails.map(email => {
        email.aiCategory = 'Spam' as any;
        return email;
      });
    }
  }

  async getEmails(options: {
    page: number;
    limit: number;
    category?: string;
    search?: string;
    accountId?: string;
    folder?: string;
  }): Promise<any> {
    try {
      const { page, limit, category, search, accountId, folder } = options;
      const from = (page - 1) * limit;

      let query: any = {
        size: limit,
        from: from,
        sort: [{ date: { order: 'desc' } }]
      };

      if (search || category || accountId || folder) {
        query.query = {
          bool: {
            must: []
          }
        };

        if (search) {
          query.query.bool.must.push({
            multi_match: {
              query: search,
              fields: ['subject', 'body', 'from', 'to']
            }
          });
        }

        if (category) {
          query.query.bool.must.push({
            term: { aiCategory: category }
          });
        }

        if (accountId) {
          query.query.bool.must.push({
            term: { accountId: accountId }
          });
        }

        if (folder) {
          query.query.bool.must.push({
            term: { folder: folder }
          });
        }
      } else {
        query.query = { match_all: {} };
      }

      const response = await this.elasticClient.searchEmails(query);
      return {
        emails: response.hits.hits.map((hit: any) => hit._source),
        total: response.hits.total.value,
        page,
        limit
      };
    } catch (error) {
      logger.error('Error getting emails:', error);
      throw error;
    }
  }

  async getEmailById(id: string): Promise<any> {
    try {
      const response = await this.elasticClient.searchEmails({
        query: { term: { id: id } }
      });
      
      if (response.hits.hits.length > 0) {
        return response.hits.hits[0]._source;
      }
      return null;
    } catch (error) {
      logger.error('Error getting email by ID:', error);
      throw error;
    }
  }

  async getAccounts(): Promise<any[]> {
    try {
      return config.EMAIL_ACCOUNTS.map(account => ({
        accountId: account.accountId,
        host: account.host,
        isConnected: this.imapClients.some(client => 
          client['accountId'] === account.accountId && client.isConnectedToServer()
        )
      }));
    } catch (error) {
      logger.error('Error getting accounts:', error);
      throw error;
    }
  }

  async getSuggestedReply(emailId: string, context?: string): Promise<string> {
    try {
      const email = await this.getEmailById(emailId);
      if (!email) {
        throw new Error('Email not found');
      }

      const reply = await ragService.generateSuggestedReply(email, context);
      return reply;
    } catch (error) {
      logger.error('Error generating suggested reply:', error);
      throw error;
    }
  }

  async categorizeEmailsByIds(emailIds: string[]): Promise<any> {
    try {
      const results = await Promise.all(
        emailIds.map(async (id) => {
          const email = await this.getEmailById(id);
          if (email) {
            const category = await aiCategorizer.categorizeEmail(email);
            await this.elasticClient.updateEmailCategory(id, category);
            return { id, category };
          }
          return { id, error: 'Email not found' };
        })
      );

      return { results };
    } catch (error) {
      logger.error('Error categorizing emails:', error);
      throw error;
    }
  }

  async deleteEmail(id: string): Promise<void> {
    try {
      await this.elasticClient.deleteEmail(id);
      logger.info(`Deleted email with ID: ${id}`);
    } catch (error) {
      logger.error('Error deleting email:', error);
      throw error;
    }
  }

  async testWebhooks(): Promise<any> {
    try {
      return await webhookService.testWebhooks();
    } catch (error) {
      logger.error('Error testing webhooks:', error);
      throw error;
    }
  }

  async getStats(): Promise<any> {
    try {
      // Get email count by category
      const categoryStats = await Promise.all(
        config.AI_CATEGORIES.map(async (category) => {
          const response = await this.elasticClient.searchEmails({
            query: { term: { aiCategory: category } },
            size: 0
          });
          return {
            category,
            count: response.hits.total.value
          };
        })
      );

      // Get total email count
      const totalResponse = await this.elasticClient.searchEmails({
        query: { match_all: {} },
        size: 0
      });

      return {
        totalEmails: totalResponse.hits.total.value,
        categoryStats,
        connectedAccounts: this.imapClients.filter(client => client.isConnectedToServer()).length,
        totalAccounts: this.imapClients.length
      };
    } catch (error) {
      logger.error('Error getting stats:', error);
      throw error;
    }
  }
}

export const emailController = new EmailController();