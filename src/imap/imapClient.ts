// Real-time IMAP sync logic with IDLE mode
import Imap from 'imap';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface EmailDocument {
  id: string;
  accountId: string;
  folder: string;
  subject: string;
  body: string;
  from: string;
  to: string[];
  date: Date;
  aiCategory: 'Interested' | 'Meeting Booked' | 'Not Interested' | 'Spam' | 'Out of Office';
  indexedAt: Date;
  uid: number;
  flags: string[];
  size: number;
}

export class ImapClient {
  private imap: Imap;
  private isConnected: boolean = false;
  private isIdle: boolean = false;
  private accountId: string;
  private idleTimeout: NodeJS.Timeout | null = null;

  constructor(
    private user: string,
    private password: string,
    private host: string,
    private port: number,
    private secure: boolean = true,
    accountId: string
  ) {
    this.accountId = accountId;
    this.imap = new Imap({
      user,
      password,
      host,
      port,
      tls: secure,
      tlsOptions: { rejectUnauthorized: false },
      keepalive: {
        interval: 10000,
        idleInterval: 300000,
        forceNoop: true
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.imap.once('ready', () => {
      logger.info(`IMAP connection established for ${this.accountId}`);
      this.isConnected = true;
    });

    this.imap.once('error', (err: Error) => {
      logger.error(`IMAP connection error for ${this.accountId}:`, err);
      this.isConnected = false;
      this.isIdle = false;
      this.clearIdleTimeout();
    });

    this.imap.once('end', () => {
      logger.info(`IMAP connection ended for ${this.accountId}`);
      this.isConnected = false;
      this.isIdle = false;
      this.clearIdleTimeout();
    });

    // Status update events
    this.imap.on('alert', (message: string) => {
      logger.warn(`IMAP Alert for ${this.accountId}: ${message}`);
    });

    // Handle IDLE timeout and re-establish
    this.imap.on('close', () => {
      logger.warn(`IMAP connection closed for ${this.accountId}, attempting reconnect`);
      this.isConnected = false;
      this.isIdle = false;
      this.clearIdleTimeout();
      this.reconnect();
    });
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve();
        return;
      }

      this.imap.once('ready', () => {
        this.isConnected = true;
        resolve();
      });
      this.imap.once('error', reject);
      this.imap.connect();
    });
  }

  async initialSync(): Promise<EmailDocument[]> {
    if (!this.isConnected) {
      throw new Error('IMAP client not connected');
    }

    const emails: EmailDocument[] = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - config.SYNC_DAYS);

    return new Promise((resolve, reject) => {
      this.imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        // Search for emails from last 30 days
        this.imap.search(['SINCE', thirtyDaysAgo], (err, results) => {
          if (err) {
            reject(err);
            return;
          }

          if (!results || results.length === 0) {
            logger.info(`No emails found for ${this.accountId} in the last ${config.SYNC_DAYS} days`);
            resolve([]);
            return;
          }

          const fetch = this.imap.fetch(results, {
            bodies: '',
            struct: true
          });

          fetch.on('message', (msg) => {
            let emailData: Partial<EmailDocument> = {
              accountId: this.accountId,
              folder: 'INBOX'
            };
            
            msg.on('body', (stream) => {
              let buffer = '';
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
              stream.on('end', () => {
                emailData.body = this.extractTextFromEmail(buffer);
              });
            });

            msg.once('attributes', (attrs) => {
              emailData.uid = attrs.uid;
              emailData.flags = attrs.flags;
              emailData.date = attrs.date;
              emailData.size = attrs.size;
              emailData.id = `${this.accountId}-${attrs.uid}`;
              emailData.indexedAt = new Date();
              emailData.aiCategory = 'Uncategorized' as any;
            });

            msg.once('end', () => {
              if (emailData.id && emailData.body) {
                emails.push(emailData as EmailDocument);
              }
            });
          });

          fetch.once('error', reject);
          fetch.once('end', () => {
            logger.info(`Initial sync completed for ${this.accountId}: ${emails.length} emails`);
            resolve(emails);
          });
        });
      });
    });
  }

  async startIdleMode(onNewEmail: (email: EmailDocument) => void): Promise<void> {
    if (!this.isConnected) {
      throw new Error('IMAP client not connected');
    }

    if (this.isIdle) {
      return;
    }

    this.imap.openBox('INBOX', true, (err, box) => {
      if (err) {
        logger.error(`Error opening INBOX for ${this.accountId}:`, err);
        return;
      }

      this.isIdle = true;
      this.imap.idle();

      // Set up IDLE timeout (29 minutes)
      this.idleTimeout = setTimeout(() => {
        this.restartIdle(onNewEmail);
      }, 29 * 60 * 1000);

      // Listen for new mail events
      this.imap.on('mail', () => {
        logger.info(`New mail detected for ${this.accountId}`);
        this.fetchNewEmails(onNewEmail);
      });

      logger.info(`IDLE mode started for ${this.accountId}`);
    });
  }

  private async fetchNewEmails(onNewEmail: (email: EmailDocument) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        // Fetch only unseen emails
        this.imap.search(['UNSEEN'], (err, results) => {
          if (err || !results || results.length === 0) {
            resolve();
            return;
          }

          const fetch = this.imap.fetch(results, {
            bodies: '',
            struct: true
          });

          fetch.on('message', (msg) => {
            let emailData: Partial<EmailDocument> = {
              accountId: this.accountId,
              folder: 'INBOX'
            };
            
            msg.on('body', (stream) => {
              let buffer = '';
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
              stream.on('end', () => {
                emailData.body = this.extractTextFromEmail(buffer);
              });
            });

            msg.once('attributes', (attrs) => {
              emailData.uid = attrs.uid;
              emailData.flags = attrs.flags;
              emailData.date = attrs.date;
              emailData.size = attrs.size;
              emailData.id = `${this.accountId}-${attrs.uid}`;
              emailData.indexedAt = new Date();
              emailData.aiCategory = 'Uncategorized' as any;
            });

            msg.once('end', () => {
              if (emailData.id && emailData.body) {
                onNewEmail(emailData as EmailDocument);
              }
            });
          });

          fetch.once('error', reject);
          fetch.once('end', resolve);
        });
      });
    });
  }

  private restartIdle(onNewEmail: (email: EmailDocument) => void): void {
    logger.info(`Restarting IDLE for ${this.accountId}`);
    this.isIdle = false;
    this.clearIdleTimeout();
    
    setTimeout(() => {
      this.startIdleMode(onNewEmail);
    }, 1000);
  }

  private clearIdleTimeout(): void {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }
  }

  private async reconnect(): Promise<void> {
    logger.info(`Attempting to reconnect IMAP for ${this.accountId}`);
    setTimeout(() => {
      this.connect().catch(err => {
        logger.error(`Reconnection failed for ${this.accountId}:`, err);
      });
    }, 5000);
  }

  private extractTextFromEmail(buffer: string): string {
    // Simple text extraction from email buffer
    // This is a basic implementation - you might want to use a proper email parser
    try {
      const lines = buffer.split('\n');
      let inBody = false;
      let body = '';
      
      for (const line of lines) {
        if (line.trim() === '') {
          inBody = true;
          continue;
        }
        if (inBody) {
          body += line + '\n';
        }
      }
      
      return body.trim();
    } catch (error) {
      logger.error('Error extracting text from email:', error);
      return buffer;
    }
  }

  disconnect(): void {
    this.clearIdleTimeout();
    this.isIdle = false;
    this.isConnected = false;
    this.imap.end();
  }

  isConnectedToServer(): boolean {
    return this.isConnected;
  }

  isInIdleMode(): boolean {
    return this.isIdle;
  }
}
