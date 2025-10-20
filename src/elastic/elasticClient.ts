import { Client } from '@elastic/elasticsearch';

export interface EmailDocument {
  id: string;
  accountId: string;
  folder: string;
  subject: string;
  body: string;
  from: string;
  to: string[];
  date: Date;
  aiCategory: 'Interested' | 'Meeting Booked' | 'Not Interested' | 'Spam' | 'Out of Office' | 'Uncategorized';
  indexedAt: Date;
  uid: number;
  flags: string[];
  size: number;
}

export class ElasticClient {
  private client: Client;
  private indexName = 'emails';

  constructor() {
    // Try to connect to Elasticsearch, fallback to mock if not available
    try {
      this.client = new Client({
        node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
        auth: process.env.ELASTICSEARCH_AUTH ? {
          username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
          password: process.env.ELASTICSEARCH_PASSWORD || 'changeme'
        } : undefined
      });
    } catch (error) {
      console.log('Elasticsearch not available, using mock mode');
      this.client = null as any;
    }
  }

  async ping(): Promise<boolean> {
    if (!this.client) return false;
    
    try {
      const response = await this.client.ping();
      return response;
    } catch (error) {
      console.log('Elasticsearch ping failed, using mock mode');
      return false;
    }
  }

  async createIndex(): Promise<boolean> {
    if (!this.client) return false;

    try {
      const exists = await this.client.indices.exists({ index: this.indexName });
      
      if (!exists) {
        await this.client.indices.create({
          index: this.indexName,
          mappings: {
            properties: {
              subject: { type: 'text', analyzer: 'standard' },
              body: { type: 'text', analyzer: 'standard' },
              accountId: { type: 'keyword' },
              folder: { type: 'keyword' },
              date: { type: 'date' },
              aiCategory: { type: 'keyword' },
              from: { type: 'keyword' },
              to: { type: 'keyword' },
              indexedAt: { type: 'date' },
              uid: { type: 'long' },
              flags: { type: 'keyword' },
              size: { type: 'long' }
            }
          }
        });
        console.log(`✅ Elasticsearch index '${this.indexName}' created`);
      }
      return true;
    } catch (error) {
      console.log('Elasticsearch index creation failed, using mock mode');
      return false;
    }
  }

  async indexEmail(email: EmailDocument): Promise<boolean> {
    if (!this.client) {
      // Mock indexing - just log
      console.log(`📧 Mock indexed: ${email.subject}`);
      return true;
    }

    try {
      await this.client.index({
        index: this.indexName,
        id: email.id,
        body: {
          ...email,
          date: email.date.toISOString(),
          indexedAt: email.indexedAt.toISOString()
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to index email:', error);
      return false;
    }
  }

  async searchEmails(query: string, filters: {
    accountId?: string;
    folder?: string;
    category?: string;
    from?: number;
    size?: number;
  } = {}): Promise<{ emails: EmailDocument[]; total: number }> {
    if (!this.client) {
      // Return mock data for demo
      return this.getMockSearchResults(query, filters);
    }

    try {
      const esQuery: any = {
        query: {
          bool: {
            must: []
          }
        },
        from: filters.from || 0,
        size: filters.size || 20
      };

      // Add text search
      if (query) {
        esQuery.query.bool.must.push({
          multi_match: {
            query: query,
            fields: ['subject^2', 'body', 'from']
          }
        });
      } else {
        esQuery.query.bool.must.push({ match_all: {} });
      }

      // Add filters
      if (filters.accountId) {
        esQuery.query.bool.filter = esQuery.query.bool.filter || [];
        esQuery.query.bool.filter.push({ term: { accountId: filters.accountId } });
      }

      if (filters.folder) {
        esQuery.query.bool.filter = esQuery.query.bool.filter || [];
        esQuery.query.bool.filter.push({ term: { folder: filters.folder } });
      }

      if (filters.category) {
        esQuery.query.bool.filter = esQuery.query.bool.filter || [];
        esQuery.query.bool.filter.push({ term: { aiCategory: filters.category } });
      }

      const response = await this.client.search({
        index: this.indexName,
        body: esQuery
      });

      const emails = response.body.hits.hits.map((hit: any) => ({
        ...hit._source,
        date: new Date(hit._source.date),
        indexedAt: new Date(hit._source.indexedAt)
      }));

      return {
        emails,
        total: response.body.hits.total.value
      };
    } catch (error) {
      console.error('Elasticsearch search failed, using mock data:', error);
      return this.getMockSearchResults(query, filters);
    }
  }

  async bulkIndexEmails(emails: EmailDocument[]): Promise<boolean> {
    if (!this.client) {
      console.log(`📧 Mock bulk indexed: ${emails.length} emails`);
      return true;
    }

    try {
      const body = emails.flatMap(email => [
        { index: { _index: this.indexName, _id: email.id } },
        {
          ...email,
          date: email.date.toISOString(),
          indexedAt: email.indexedAt.toISOString()
        }
      ]);

      await this.client.bulk({ body });
      return true;
    } catch (error) {
      console.error('Bulk indexing failed:', error);
      return false;
    }
  }

  async deleteEmail(id: string): Promise<boolean> {
    if (!this.client) {
      console.log(`🗑️ Mock deleted email: ${id}`);
      return true;
    }

    try {
      await this.client.delete({
        index: this.indexName,
        id: id
      });
      return true;
    } catch (error) {
      console.error('Failed to delete email:', error);
      return false;
    }
  }

  async updateEmailCategory(id: string, category: string): Promise<boolean> {
    if (!this.client) {
      console.log(`🏷️ Mock updated category for ${id}: ${category}`);
      return true;
    }

    try {
      await this.client.update({
        index: this.indexName,
        id: id,
        body: {
          doc: {
            aiCategory: category,
            indexedAt: new Date().toISOString()
          }
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to update email category:', error);
      return false;
    }
  }

  private getMockSearchResults(query: string, filters: any): { emails: EmailDocument[]; total: number } {
    // Mock data for demo
    const mockEmails: EmailDocument[] = [
      {
        id: "demo-1",
        accountId: "demo@reachinbox.com",
        folder: "INBOX",
        subject: "Interested in your AI outreach platform",
        body: "Hi, I saw your platform and I'm very interested in learning more about how it can help our sales team. Could we schedule a demo?",
        from: "prospect@company.com",
        to: ["demo@reachinbox.com"],
        date: new Date("2024-01-15T10:30:00Z"),
        aiCategory: "Interested",
        indexedAt: new Date(),
        uid: 1,
        flags: [],
        size: 1024
      },
      {
        id: "demo-2",
        accountId: "demo@reachinbox.com",
        folder: "INBOX",
        subject: "Meeting confirmed for tomorrow",
        body: "Thank you for the demo. I'd like to confirm our meeting for tomorrow at 2 PM. Looking forward to discussing pricing.",
        from: "client@business.com",
        to: ["demo@reachinbox.com"],
        date: new Date("2024-01-14T15:45:00Z"),
        aiCategory: "Meeting Booked",
        indexedAt: new Date(),
        uid: 2,
        flags: [],
        size: 856
      },
      {
        id: "demo-3",
        accountId: "demo@reachinbox.com",
        folder: "INBOX",
        subject: "Out of office - vacation",
        body: "I am currently out of office until January 20th. For urgent matters, please contact my assistant.",
        from: "manager@corporate.com",
        to: ["demo@reachinbox.com"],
        date: new Date("2024-01-13T09:00:00Z"),
        aiCategory: "Out of Office",
        indexedAt: new Date(),
        uid: 3,
        flags: [],
        size: 512
      },
      {
        id: "demo-4",
        accountId: "demo@reachinbox.com",
        folder: "INBOX",
        subject: "Newsletter: Weekly Tech Updates",
        body: "Check out our latest newsletter with the newest tech trends and updates from the industry.",
        from: "newsletter@techblog.com",
        to: ["demo@reachinbox.com"],
        date: new Date("2024-01-12T08:00:00Z"),
        aiCategory: "Spam",
        indexedAt: new Date(),
        uid: 4,
        flags: [],
        size: 2048
      },
      {
        id: "demo-5",
        accountId: "demo@reachinbox.com",
        folder: "INBOX",
        subject: "Not interested in your service",
        body: "Thank you for reaching out, but we are not currently looking for new solutions. Please remove us from your list.",
        from: "noreply@company.com",
        to: ["demo@reachinbox.com"],
        date: new Date("2024-01-11T14:20:00Z"),
        aiCategory: "Not Interested",
        indexedAt: new Date(),
        uid: 5,
        flags: [],
        size: 768
      }
    ];

    let filteredEmails = mockEmails;

    // Apply text search
    if (query) {
      const searchTerm = query.toLowerCase();
      filteredEmails = filteredEmails.filter(email => 
        email.subject.toLowerCase().includes(searchTerm) ||
        email.body.toLowerCase().includes(searchTerm) ||
        email.from.toLowerCase().includes(searchTerm)
      );
    }

    // Apply filters
    if (filters.accountId) {
      filteredEmails = filteredEmails.filter(email => email.accountId === filters.accountId);
    }

    if (filters.folder) {
      filteredEmails = filteredEmails.filter(email => email.folder === filters.folder);
    }

    if (filters.category) {
      filteredEmails = filteredEmails.filter(email => email.aiCategory === filters.category);
    }

    return {
      emails: filteredEmails,
      total: filteredEmails.length
    };
  }
}