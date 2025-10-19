// Elasticsearch connection
import { Client } from '@elastic/elasticsearch';
import { config } from '../config';
import { logger } from '../utils/logger';
import { EmailDocument } from '../imap/imapClient';

export class ElasticClient {
  private client: Client;

  constructor() {
    this.client = new Client({
      node: config.ELASTICSEARCH_URL,
      // No auth needed for local development
    });
  }

  async ping(): Promise<boolean> {
    try {
      const response = await this.client.ping();
      logger.info('Elasticsearch connection successful');
      return true;
    } catch (error) {
      logger.error('Elasticsearch connection failed:', error);
      return false;
    }
  }

  async createIndex(indexName: string = config.ELASTICSEARCH_INDEX): Promise<void> {
    try {
      const exists = await this.client.indices.exists({ index: indexName });
      
      if (!exists) {
        await this.client.indices.create({
          index: indexName,
          body: {
            mappings: {
              properties: {
                id: { type: 'keyword' },
                accountId: { type: 'keyword' },
                folder: { type: 'keyword' },
                subject: { type: 'text', analyzer: 'standard' },
                body: { type: 'text', analyzer: 'standard' },
                from: { type: 'keyword' },
                to: { type: 'keyword' },
                date: { type: 'date' },
                aiCategory: { type: 'keyword' },
                indexedAt: { type: 'date' },
                uid: { type: 'long' },
                flags: { type: 'keyword' },
                size: { type: 'long' }
              }
            }
          }
        });
        logger.info(`Created index: ${indexName}`);
      } else {
        logger.info(`Index ${indexName} already exists`);
      }
    } catch (error) {
      logger.error('Error creating index:', error);
      throw error;
    }
  }

  async indexEmail(emailData: EmailDocument, indexName: string = config.ELASTICSEARCH_INDEX): Promise<void> {
    try {
      await this.client.index({
        index: indexName,
        id: emailData.id,
        body: emailData
      });
      logger.debug(`Indexed email with ID: ${emailData.id}`);
    } catch (error) {
      logger.error('Error indexing email:', error);
      throw error;
    }
  }

  async searchEmails(query: any, indexName: string = config.ELASTICSEARCH_INDEX): Promise<any> {
    try {
      const response = await this.client.search({
        index: indexName,
        body: query
      });
      return response.body;
    } catch (error) {
      logger.error('Error searching emails:', error);
      throw error;
    }
  }

  async bulkIndexEmails(emails: EmailDocument[], indexName: string = config.ELASTICSEARCH_INDEX): Promise<void> {
    try {
      const body = emails.flatMap(email => [
        { index: { _index: indexName, _id: email.id } },
        email
      ]);

      await this.client.bulk({ body });
      logger.info(`Bulk indexed ${emails.length} emails`);
    } catch (error) {
      logger.error('Error bulk indexing emails:', error);
      throw error;
    }
  }

  async deleteEmail(id: string, indexName: string = config.ELASTICSEARCH_INDEX): Promise<void> {
    try {
      await this.client.delete({
        index: indexName,
        id: id
      });
      logger.debug(`Deleted email with ID: ${id}`);
    } catch (error) {
      logger.error('Error deleting email:', error);
      throw error;
    }
  }

  async updateEmailCategory(id: string, category: string, indexName: string = config.ELASTICSEARCH_INDEX): Promise<void> {
    try {
      await this.client.update({
        index: indexName,
        id: id,
        body: {
          doc: {
            aiCategory: category
          }
        }
      });
      logger.debug(`Updated email category for ID: ${id}`);
    } catch (error) {
      logger.error('Error updating email category:', error);
      throw error;
    }
  }
}
