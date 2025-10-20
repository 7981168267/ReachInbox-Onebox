import axios from 'axios';

export interface WebhookPayload {
  event: string;
  email: {
    id: string;
    subject: string;
    from: string;
    to: string[];
    category: string;
    body: string;
    date: string;
  };
  timestamp: string;
}

export class WebhookService {
  private slackWebhookUrl: string;
  private genericWebhookUrl: string;

  constructor() {
    this.slackWebhookUrl = process.env.SLACK_WEBHOOK_URL || '';
    this.genericWebhookUrl = process.env.WEBHOOK_SITE_URL || 'https://webhook.site/your-unique-url';
  }

  async sendSlackNotification(email: {
    id: string;
    subject: string;
    from: string;
    to: string[];
    body: string;
    date: Date;
  }): Promise<boolean> {
    if (!this.slackWebhookUrl) {
      console.log('📢 Mock Slack notification sent for:', email.subject);
      return true;
    }

    try {
      const payload = {
        text: "🎯 New Interested Lead Detected!",
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "🎯 New Interested Lead"
            }
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Subject:* ${email.subject}`
              },
              {
                type: "mrkdwn",
                text: `*From:* ${email.from}`
              },
              {
                type: "mrkdwn",
                text: `*Date:* ${email.date.toISOString()}`
              },
              {
                type: "mrkdwn",
                text: `*Email ID:* ${email.id}`
              }
            ]
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Preview:* ${email.body.substring(0, 200)}...`
            }
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "View Email"
                },
                url: `http://localhost:3000/api/emails/${email.id}`,
                style: "primary"
              }
            ]
          }
        ]
      };

      await axios.post(this.slackWebhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      console.log('✅ Slack notification sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to send Slack notification:', error);
      return false;
    }
  }

  async triggerGenericWebhook(email: {
    id: string;
    subject: string;
    from: string;
    to: string[];
    body: string;
    date: Date;
    category: string;
  }): Promise<boolean> {
    if (!this.genericWebhookUrl || this.genericWebhookUrl.includes('your-unique-url')) {
      console.log('🔗 Mock webhook triggered for:', email.subject);
      return true;
    }

    try {
      const payload: WebhookPayload = {
        event: 'InterestedLead',
        email: {
          id: email.id,
          subject: email.subject,
          from: email.from,
          to: email.to,
          category: email.category,
          body: email.body,
          date: email.date.toISOString()
        },
        timestamp: new Date().toISOString()
      };

      await axios.post(this.genericWebhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ReachInbox-Onebox/1.0'
        },
        timeout: 10000
      });

      console.log('✅ Generic webhook triggered successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to trigger generic webhook:', error);
      return false;
    }
  }

  async triggerInterestedLeadWebhooks(email: {
    id: string;
    subject: string;
    from: string;
    to: string[];
    body: string;
    date: Date;
    category: string;
  }): Promise<{ slack: boolean; webhook: boolean }> {
    console.log(`🚀 Triggering webhooks for interested lead: ${email.subject}`);

    const results = {
      slack: false,
      webhook: false
    };

    // Send Slack notification
    try {
      results.slack = await this.sendSlackNotification(email);
    } catch (error) {
      console.error('Slack notification failed:', error);
    }

    // Trigger generic webhook
    try {
      results.webhook = await this.triggerGenericWebhook(email);
    } catch (error) {
      console.error('Generic webhook failed:', error);
    }

    return results;
  }

  async testWebhooks(): Promise<{ slack: boolean; webhook: boolean }> {
    const testEmail = {
      id: 'test-webhook-' + Date.now(),
      subject: 'Test Webhook - Interested Lead',
      from: 'test@example.com',
      to: ['demo@reachinbox.com'],
      body: 'This is a test email to verify webhook functionality.',
      date: new Date(),
      category: 'Interested'
    };

    return await this.triggerInterestedLeadWebhooks(testEmail);
  }

  isConfigured(): boolean {
    return !!(this.slackWebhookUrl && this.genericWebhookUrl);
  }

  getConfigurationStatus(): {
    slack: boolean;
    webhook: boolean;
    configured: boolean;
  } {
    return {
      slack: !!this.slackWebhookUrl,
      webhook: !!this.genericWebhookUrl && !this.genericWebhookUrl.includes('your-unique-url'),
      configured: this.isConfigured()
    };
  }
}