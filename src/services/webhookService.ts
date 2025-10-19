// Slack and Webhook Integration Service
import axios from 'axios';
// Removed node-schedule import as it's not needed
import { config } from '../config';
import { logger } from '../utils/logger';
import { EmailDocument } from '../imap/imapClient';

export class WebhookService {
  private slackWebhookUrl: string;
  private webhookSiteUrl: string;

  constructor() {
    this.slackWebhookUrl = config.SLACK_WEBHOOK_URL || '';
    this.webhookSiteUrl = config.WEBHOOK_SITE_URL || '';
  }

  async triggerInterestedEmailWebhooks(email: EmailDocument): Promise<void> {
    try {
      logger.info(`Triggering webhooks for Interested email: ${email.id}`);

      // Send Slack notification
      if (this.slackWebhookUrl) {
        await this.sendSlackNotification(email);
      }

      // Send generic webhook for external automation
      if (this.webhookSiteUrl) {
        await this.sendGenericWebhook(email);
      }

      logger.info(`Webhooks triggered successfully for email: ${email.id}`);
    } catch (error) {
      logger.error('Error triggering webhooks:', error);
      throw error;
    }
  }

  private async sendSlackNotification(email: EmailDocument): Promise<void> {
    try {
      const slackPayload = {
        text: `🎯 New Interested Lead Detected!`,
        attachments: [
          {
            color: 'good',
            fields: [
              {
                title: 'Email Subject',
                value: email.subject || 'No Subject',
                short: true
              },
              {
                title: 'From',
                value: email.from || 'Unknown Sender',
                short: true
              },
              {
                title: 'Account',
                value: email.accountId,
                short: true
              },
              {
                title: 'Date',
                value: email.date.toISOString(),
                short: true
              },
              {
                title: 'Email Preview',
                value: email.body ? email.body.substring(0, 200) + '...' : 'No content',
                short: false
              }
            ],
            footer: 'ReachInbox Onebox',
            ts: Math.floor(email.date.getTime() / 1000)
          }
        ]
      };

      await axios.post(this.slackWebhookUrl, slackPayload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      logger.info(`Slack notification sent for email: ${email.id}`);
    } catch (error) {
      logger.error('Error sending Slack notification:', error);
      throw error;
    }
  }

  private async sendGenericWebhook(email: EmailDocument): Promise<void> {
    try {
      const webhookPayload = {
        event: 'InterestedLead',
        timestamp: new Date().toISOString(),
        email: {
          id: email.id,
          accountId: email.accountId,
          folder: email.folder,
          subject: email.subject,
          from: email.from,
          to: email.to,
          date: email.date.toISOString(),
          aiCategory: email.aiCategory,
          body: email.body,
          size: email.size
        },
        metadata: {
          source: 'ReachInbox Onebox',
          version: '1.0.0',
          action: 'lead_detected'
        }
      };

      await axios.post(this.webhookSiteUrl, webhookPayload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      logger.info(`Generic webhook sent for email: ${email.id}`);
    } catch (error) {
      logger.error('Error sending generic webhook:', error);
      throw error;
    }
  }

  async testWebhooks(): Promise<{ slack: boolean; webhook: boolean }> {
    const results = { slack: false, webhook: false };

    try {
      if (this.slackWebhookUrl) {
        await axios.post(this.slackWebhookUrl, {
          text: '🧪 ReachInbox Onebox - Webhook Test',
          attachments: [
            {
              color: 'warning',
              fields: [
                {
                  title: 'Test Message',
                  value: 'This is a test message to verify webhook connectivity.',
                  short: false
                }
              ],
              footer: 'ReachInbox Onebox Test',
              ts: Math.floor(Date.now() / 1000)
            }
          ]
        });
        results.slack = true;
        logger.info('Slack webhook test successful');
      }
    } catch (error) {
      logger.error('Slack webhook test failed:', error);
    }

    try {
      if (this.webhookSiteUrl) {
        await axios.post(this.webhookSiteUrl, {
          event: 'TestWebhook',
          timestamp: new Date().toISOString(),
          message: 'This is a test webhook from ReachInbox Onebox',
          metadata: {
            source: 'ReachInbox Onebox',
            version: '1.0.0',
            action: 'test'
          }
        });
        results.webhook = true;
        logger.info('Generic webhook test successful');
      }
    } catch (error) {
      logger.error('Generic webhook test failed:', error);
    }

    return results;
  }
}

export const webhookService = new WebhookService();
