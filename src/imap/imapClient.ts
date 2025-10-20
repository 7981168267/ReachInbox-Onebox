import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { EventEmitter } from 'events';

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

export interface ImapConfig {
  host: string;
  port: number;
  tls: boolean;
  user: string;
  password: string;
  accountId: string;
}

export class ImapClient extends EventEmitter {
  private imap: Imap | null = null;
  private config: ImapConfig;
  private isConnected = false;
  private isIdle = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 30000; // 30 seconds
  private idleTimeout: NodeJS.Timeout | null = null;

  constructor(config: ImapConfig) {
    super();
    this.config = config;
  }

  async connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        this.imap = new Imap({
          host: this.config.host,
          port: this.config.port,
          tls: this.config.tls,
          user: this.config.user,
          password: this.config.password,
          keepalive: {
            interval: 10000,
            idleInterval: 300000,
            forceNoop: true
          }
        });

        this.imap.once('ready', () => {
          console.log(`✅ IMAP connected for ${this.config.accountId}`);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected', this.config.accountId);
          resolve(true);
        });

        this.imap.once('error', (err: Error) => {
          console.error(`❌ IMAP connection error for ${this.config.accountId}:`, err.message);
          this.isConnected = false;
          this.emit('error', err);
          reject(err);
        });

        this.imap.once('end', () => {
          console.log(`📤 IMAP connection ended for ${this.config.accountId}`);
          this.isConnected = false;
          this.emit('disconnected', this.config.accountId);
        });

        this.imap.on('mail', (numNewMsgs: number) => {
          console.log(`📧 New mail detected for ${this.config.accountId}: ${numNewMsgs} messages`);
          this.emit('newMail', this.config.accountId, numNewMsgs);
        });

        this.imap.on('expunge', (seqno: number) => {
          console.log(`🗑️ Email expunged for ${this.config.accountId}: seqno ${seqno}`);
          this.emit('emailDeleted', this.config.accountId, seqno);
        });

        this.imap.connect();
      } catch (error) {
        console.error('Failed to create IMAP connection:', error);
        reject(error);
      }
    });
  }

  async initialSync(daysBack = 30): Promise<EmailDocument[]> {
    if (!this.imap || !this.isConnected) {
      throw new Error('IMAP not connected');
    }

    return new Promise((resolve, reject) => {
      const emails: EmailDocument[] = [];
      const since = new Date();
      since.setDate(since.getDate() - daysBack);

      this.imap!.openBox('INBOX', false, (err, box) => {
        if (err) {
          console.error('Failed to open INBOX:', err);
          reject(err);
          return;
        }

        const searchCriteria = ['SINCE', since];
        this.imap!.search(searchCriteria, (err, results) => {
          if (err) {
            console.error('Search failed:', err);
            reject(err);
            return;
          }

          if (!results || results.length === 0) {
            console.log(`📭 No emails found for ${this.config.accountId} in the last ${daysBack} days`);
            resolve(emails);
            return;
          }

          console.log(`📥 Found ${results.length} emails for initial sync`);

          const fetch = this.imap!.fetch(results, {
            bodies: '',
            struct: true
          });

          fetch.on('message', (msg, seqno) => {
            let buffer = '';

            msg.on('body', (stream) => {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
            });

            msg.once('end', () => {
              this.parseEmail(buffer, seqno)
                .then(email => {
                  if (email) {
                    emails.push(email);
                  }
                })
                .catch(err => {
                  console.error('Failed to parse email:', err);
                });
            });
          });

          fetch.once('error', (err) => {
            console.error('Fetch error:', err);
            reject(err);
          });

          fetch.once('end', () => {
            console.log(`✅ Initial sync completed: ${emails.length} emails processed`);
            resolve(emails);
          });
        });
      });
    });
  }

  async startIdleMode(): Promise<void> {
    if (!this.imap || !this.isConnected) {
      throw new Error('IMAP not connected');
    }

    if (this.isIdle) {
      console.log('IDLE mode already active');
      return;
    }

    try {
      this.imap.idle();
      this.isIdle = true;
      console.log(`🔄 IDLE mode started for ${this.config.accountId}`);

      // Set up IDLE timeout (29 minutes to avoid server timeout)
      this.idleTimeout = setTimeout(() => {
        this.restartIdleMode();
      }, 29 * 60 * 1000);

      this.emit('idleStarted', this.config.accountId);
    } catch (error) {
      console.error('Failed to start IDLE mode:', error);
      throw error;
    }
  }

  private async restartIdleMode(): Promise<void> {
    if (this.isIdle) {
      try {
        this.imap!.idle();
        console.log(`🔄 IDLE mode restarted for ${this.config.accountId}`);
        
        // Reset timeout
        if (this.idleTimeout) {
          clearTimeout(this.idleTimeout);
        }
        this.idleTimeout = setTimeout(() => {
          this.restartIdleMode();
        }, 29 * 60 * 1000);
      } catch (error) {
        console.error('Failed to restart IDLE mode:', error);
        this.handleConnectionLoss();
      }
    }
  }

  async fetchNewEmails(count = 10): Promise<EmailDocument[]> {
    if (!this.imap || !this.isConnected) {
      throw new Error('IMAP not connected');
    }

    return new Promise((resolve, reject) => {
      const emails: EmailDocument[] = [];

      this.imap!.search(['UNSEEN'], (err, results) => {
        if (err) {
          reject(err);
          return;
        }

        if (!results || results.length === 0) {
          resolve(emails);
          return;
        }

        const recentResults = results.slice(-count);
        const fetch = this.imap!.fetch(recentResults, {
          bodies: '',
          struct: true
        });

        fetch.on('message', (msg, seqno) => {
          let buffer = '';

          msg.on('body', (stream) => {
            stream.on('data', (chunk) => {
              buffer += chunk.toString('utf8');
            });
          });

          msg.once('end', () => {
            this.parseEmail(buffer, seqno)
              .then(email => {
                if (email) {
                  emails.push(email);
                }
              })
              .catch(err => {
                console.error('Failed to parse email:', err);
              });
          });
        });

        fetch.once('error', (err) => {
          reject(err);
        });

        fetch.once('end', () => {
          resolve(emails);
        });
      });
    });
  }

  private async parseEmail(rawEmail: string, uid: number): Promise<EmailDocument | null> {
    try {
      const parsed = await simpleParser(rawEmail);
      
      if (!parsed.from || !parsed.subject) {
        return null;
      }

      const email: EmailDocument = {
        id: `${this.config.accountId}-${uid}-${Date.now()}`,
        accountId: this.config.accountId,
        folder: 'INBOX',
        subject: parsed.subject || 'No Subject',
        body: this.extractTextFromEmail(parsed.text || parsed.html || ''),
        from: this.formatEmailAddress(parsed.from),
        to: Array.isArray(parsed.to) ? parsed.to.map(this.formatEmailAddress) : [this.formatEmailAddress(parsed.to)],
        date: parsed.date || new Date(),
        aiCategory: 'Uncategorized',
        indexedAt: new Date(),
        uid: uid,
        flags: [],
        size: rawEmail.length
      };

      return email;
    } catch (error) {
      console.error('Failed to parse email:', error);
      return null;
    }
  }

  private extractTextFromEmail(content: string): string {
    // Remove HTML tags and decode entities
    return content
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private formatEmailAddress(address: any): string {
    if (typeof address === 'string') {
      return address;
    }
    if (address && address.address) {
      return address.address;
    }
    return 'unknown@example.com';
  }

  private handleConnectionLoss(): void {
    console.log(`🔌 Connection lost for ${this.config.accountId}, attempting to reconnect...`);
    this.isConnected = false;
    this.isIdle = false;
    
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }

    this.reconnect();
  }

  private async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`❌ Max reconnection attempts reached for ${this.config.accountId}`);
      this.emit('maxReconnectAttemptsReached', this.config.accountId);
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} for ${this.config.accountId}`);

    setTimeout(async () => {
      try {
        await this.connect();
        await this.startIdleMode();
        console.log(`✅ Reconnected successfully for ${this.config.accountId}`);
      } catch (error) {
        console.error(`❌ Reconnection failed for ${this.config.accountId}:`, error);
        this.reconnect();
      }
    }, this.reconnectInterval);
  }

  async disconnect(): Promise<void> {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }

    if (this.imap && this.isConnected) {
      this.imap.end();
      this.isConnected = false;
      this.isIdle = false;
      console.log(`📤 IMAP disconnected for ${this.config.accountId}`);
    }
  }

  getConnectionStatus(): {
    connected: boolean;
    idle: boolean;
    accountId: string;
    reconnectAttempts: number;
  } {
    return {
      connected: this.isConnected,
      idle: this.isIdle,
      accountId: this.config.accountId,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}