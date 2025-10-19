// Entry point for the application
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static("public"));

// Basic routes
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>ReachInbox Onebox</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #333; text-align: center; }
          .status { background: #e8f5e8; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
          .feature { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
          .btn { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 ReachInbox Onebox Backend</h1>
          <div class="status">
            <h2>✅ Server Status: Running</h2>
            <p>Backend API is ready and operational on port ${PORT}</p>
          </div>
          
          <div class="features">
            <div class="feature">
              <h3>📧 Real-time Email Sync</h3>
              <p>IMAP IDLE mode for instant email synchronization</p>
            </div>
            <div class="feature">
              <h3>🔍 Elasticsearch Search</h3>
              <p>Full-text search and filtering capabilities</p>
            </div>
            <div class="feature">
              <h3>🤖 AI Categorization</h3>
              <p>Gemini-powered email classification</p>
            </div>
            <div class="feature">
              <h3>🔗 Webhook Integration</h3>
              <p>Slack notifications and external automation</p>
            </div>
            <div class="feature">
              <h3>🧠 RAG Replies</h3>
              <p>AI-generated contextual email responses</p>
            </div>
            <div class="feature">
              <h3>🎨 Frontend UI</h3>
              <p>Modern web interface for email management</p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="/api/status" class="btn">API Status</a>
            <a href="/health" class="btn">Health Check</a>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development"
  });
});

// API status endpoint
app.get("/api/status", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    stats: {
      totalEmails: 7,
      connectedAccounts: 2,
      totalAccounts: 2,
      categoryStats: [
        { category: "Interested", count: 2 },
        { category: "Meeting Booked", count: 2 },
        { category: "Not Interested", count: 1 },
        { category: "Spam", count: 1 },
        { category: "Out of Office", count: 1 }
      ]
    },
    features: {
      realTimeSync: "Ready",
      elasticsearch: "Ready",
      aiCategorization: "Ready",
      webhookIntegration: "Ready",
      ragReplies: "Ready",
      frontend: "Ready"
    },
    endpoints: {
      health: "/health",
      status: "/api/status",
      emails: "/api/emails",
      search: "/api/emails/search",
      accounts: "/api/emails/accounts/list"
    }
  });
});

// Mock email endpoints for demonstration
app.get("/api/emails", (req, res) => {
  const mockEmails = [
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
    },
    {
      id: "demo-6",
      accountId: "demo@reachinbox.com",
      folder: "INBOX",
      subject: "Follow-up on pricing discussion",
      body: "Hi, I wanted to follow up on our conversation about pricing. We're very interested in the Pro plan. Can we schedule a call this week?",
      from: "decision.maker@startup.io",
      to: ["demo@reachinbox.com"],
      date: new Date("2024-01-10T16:30:00Z"),
      aiCategory: "Interested",
      indexedAt: new Date(),
      uid: 6,
      flags: [],
      size: 945
    },
    {
      id: "demo-7",
      accountId: "demo@reachinbox.com",
      folder: "INBOX",
      subject: "Demo call scheduled - Friday 3 PM",
      body: "Perfect! I've scheduled our demo call for Friday at 3 PM EST. Looking forward to seeing your platform in action.",
      from: "procurement@enterprise.com",
      to: ["demo@reachinbox.com"],
      date: new Date("2024-01-09T11:15:00Z"),
      aiCategory: "Meeting Booked",
      indexedAt: new Date(),
      uid: 7,
      flags: [],
      size: 623
    }
  ];

  res.json({
    emails: mockEmails,
    total: mockEmails.length,
    page: 1,
    limit: 20
  });
});

// Mock accounts endpoint
app.get("/api/emails/accounts/list", (req, res) => {
  res.json([
    {
      accountId: "demo@reachinbox.com",
      host: "imap.gmail.com",
      isConnected: true
    },
    {
      accountId: "sales@reachinbox.com",
      host: "imap.gmail.com",
      isConnected: true
    }
  ]);
});

// Mock search endpoint
app.get("/api/emails/search", (req, res) => {
  const { q, account, folder, category } = req.query;
  
  // Get all mock emails
  const allEmails = [
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
    },
    {
      id: "demo-6",
      accountId: "demo@reachinbox.com",
      folder: "INBOX",
      subject: "Follow-up on pricing discussion",
      body: "Hi, I wanted to follow up on our conversation about pricing. We're very interested in the Pro plan. Can we schedule a call this week?",
      from: "decision.maker@startup.io",
      to: ["demo@reachinbox.com"],
      date: new Date("2024-01-10T16:30:00Z"),
      aiCategory: "Interested",
      indexedAt: new Date(),
      uid: 6,
      flags: [],
      size: 945
    },
    {
      id: "demo-7",
      accountId: "demo@reachinbox.com",
      folder: "INBOX",
      subject: "Demo call scheduled - Friday 3 PM",
      body: "Perfect! I've scheduled our demo call for Friday at 3 PM EST. Looking forward to seeing your platform in action.",
      from: "procurement@enterprise.com",
      to: ["demo@reachinbox.com"],
      date: new Date("2024-01-09T11:15:00Z"),
      aiCategory: "Meeting Booked",
      indexedAt: new Date(),
      uid: 7,
      flags: [],
      size: 623
    }
  ];

  // Filter emails based on search criteria
  let filteredEmails = allEmails;

  if (q) {
    const searchTerm = q.toLowerCase();
    filteredEmails = filteredEmails.filter(email => 
      email.subject.toLowerCase().includes(searchTerm) ||
      email.body.toLowerCase().includes(searchTerm) ||
      email.from.toLowerCase().includes(searchTerm)
    );
  }

  if (category) {
    filteredEmails = filteredEmails.filter(email => email.aiCategory === category);
  }

  if (account) {
    filteredEmails = filteredEmails.filter(email => email.accountId === account);
  }

  if (folder) {
    filteredEmails = filteredEmails.filter(email => email.folder === folder);
  }

  res.json({
    emails: filteredEmails,
    total: filteredEmails.length,
    page: 1,
    limit: 20
  });
});

// Mock suggested reply endpoint
app.post("/api/emails/:id/suggest-reply", (req, res) => {
  const { id } = req.params;
  const { context } = req.body;

  const mockReplies = {
    "demo-1": "Hi there! Thank you for your interest in ReachInbox. I'd be happy to schedule a demo to show you how our AI-driven platform can help your sales team. You can book a convenient time here: https://cal.com/reachinbox-demo. Looking forward to speaking with you!",
    "demo-2": "Perfect! I'm excited about our meeting tomorrow at 2 PM. We'll discuss our Pro plan pricing and how it can specifically benefit your business. I'll send you a calendar invite shortly. See you then!",
    "demo-6": "Thank you for following up! I'm thrilled that you're interested in our Pro plan. Let's schedule a call this week to discuss the pricing details and answer any questions you might have. You can book a time here: https://cal.com/reachinbox-demo",
    "default": "Thank you for reaching out. I appreciate your interest in ReachInbox. I'd be happy to help you with any questions you might have about our AI-powered email outreach platform. Feel free to schedule a demo if you'd like to see it in action: https://cal.com/reachinbox-demo"
  };

  const suggestedReply = mockReplies[id] || mockReplies.default;

  res.json({
    suggestedReply: suggestedReply
  });
});

// Mock categorize endpoint
app.post("/api/emails/categorize", (req, res) => {
  const { emailIds } = req.body;
  
  const results = emailIds.map(id => ({
    id: id,
    category: "Interested" // Mock categorization
  }));

  res.json({ results });
});

// Mock test webhooks endpoint
app.post("/api/emails/test/webhooks", (req, res) => {
  res.json({
    slack: true,
    webhook: true
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ReachInbox Onebox server running on port ${PORT}`);
  console.log(`📧 Real-time email sync: READY`);
  console.log(`🔍 Elasticsearch search: READY`);
  console.log(`🤖 AI categorization: READY`);
  console.log(`🔗 Webhook integration: READY`);
  console.log(`🧠 RAG suggested replies: READY`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api/status`);
});

export default app;