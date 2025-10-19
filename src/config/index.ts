// Configuration variables
export const config = {
  // Server configuration
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // IMAP configuration for multiple accounts
  EMAIL_ACCOUNTS: [
    {
      user: process.env.EMAIL_USER_1,
      password: process.env.EMAIL_PASSWORD_1,
      host: process.env.EMAIL_HOST_1 || 'imap.gmail.com',
      port: parseInt(process.env.EMAIL_PORT_1 || '993'),
      secure: true,
      accountId: process.env.EMAIL_USER_1
    },
    {
      user: process.env.EMAIL_USER_2,
      password: process.env.EMAIL_PASSWORD_2,
      host: process.env.EMAIL_HOST_2 || 'imap.gmail.com',
      port: parseInt(process.env.EMAIL_PORT_2 || '993'),
      secure: true,
      accountId: process.env.EMAIL_USER_2
    }
  ].filter(account => account.user && account.password),
  
  // Elasticsearch configuration
  ELASTICSEARCH_URL: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  ELASTICSEARCH_INDEX: process.env.ELASTICSEARCH_INDEX || 'emails',
  
  // AI configuration - Gemini API
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  
  // Slack and Webhook configuration
  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL,
  WEBHOOK_SITE_URL: process.env.WEBHOOK_SITE_URL,
  
  // Qdrant Vector Database
  QDRANT_URL: process.env.QDRANT_URL || 'http://localhost:6333',
  
  // Email configuration
  EMAIL_BATCH_SIZE: parseInt(process.env.EMAIL_BATCH_SIZE || '50'),
  SYNC_DAYS: parseInt(process.env.SYNC_DAYS || '30'),
  
  // AI Categories
  AI_CATEGORIES: ['Interested', 'Meeting Booked', 'Not Interested', 'Spam', 'Out of Office']
};
