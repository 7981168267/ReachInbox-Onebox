// Simple test server to check if basic functionality works
import express from "express";
import cors from "cors";

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static("public"));

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString()
  });
});

// API status
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
      elasticsearch: "Mock Mode",
      aiCategorization: "Mock Mode", 
      webhookIntegration: "Mock Mode",
      ragReplies: "Mock Mode",
      frontend: "Ready"
    }
  });
});

// Mock emails endpoint
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
  const { q } = req.query;
  
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
    }
  ];

  let filteredEmails = mockEmails;
  if (q) {
    const searchTerm = q.toString().toLowerCase();
    filteredEmails = mockEmails.filter(email => 
      email.subject.toLowerCase().includes(searchTerm) ||
      email.body.toLowerCase().includes(searchTerm)
    );
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
  try {
    const { id } = req.params;
    const { context } = req.body || {};
    
    console.log(`Generating reply for email ID: ${id}`);
    
    // Get email details from our mock data
    const mockEmails = [
      {
        id: "demo-1",
        subject: "Interested in your AI outreach platform",
        from: "prospect@company.com",
        aiCategory: "Interested"
      },
      {
        id: "demo-2", 
        subject: "Meeting confirmed for tomorrow",
        from: "client@business.com",
        aiCategory: "Meeting Booked"
      },
      {
        id: "demo-3",
        subject: "Out of office - vacation", 
        from: "manager@corporate.com",
        aiCategory: "Out of Office"
      },
      {
        id: "demo-4",
        subject: "Newsletter: Weekly Tech Updates",
        from: "newsletter@techblog.com", 
        aiCategory: "Spam"
      },
      {
        id: "demo-5",
        subject: "Not interested in your service",
        from: "noreply@company.com",
        aiCategory: "Not Interested"
      },
      {
        id: "demo-6",
        subject: "Follow-up on pricing discussion",
        from: "decision.maker@startup.io",
        aiCategory: "Interested"
      },
      {
        id: "demo-7",
        subject: "Demo call scheduled - Friday 3 PM",
        from: "procurement@enterprise.com",
        aiCategory: "Meeting Booked"
      }
    ];
    
    const email = mockEmails.find(e => e.id === id);
    
    if (!email) {
      return res.status(404).json({ 
        error: 'Email not found',
        suggestedReply: "I apologize, but I couldn't find the email you're referring to. Please try again."
      });
    }
    
    // Generate contextual replies based on email category
    let suggestedReply;
    const senderName = email.from.split('@')[0];
    
    switch (email.aiCategory) {
      case 'Interested':
        suggestedReply = `Hi ${senderName},\n\nThank you for your interest in ReachInbox! I'd be happy to schedule a demo to show you how our AI-driven platform can help your sales team.\n\nYou can book a convenient time here: https://cal.com/reachinbox-demo\n\nLooking forward to speaking with you!\n\nBest regards,\nThe ReachInbox Team`;
        break;
        
      case 'Meeting Booked':
        suggestedReply = `Hi ${senderName},\n\nPerfect! I'm excited about our meeting. I'll send you a calendar invite shortly with all the details.\n\nSee you then!\n\nBest regards,\nThe ReachInbox Team`;
        break;
        
      case 'Not Interested':
        suggestedReply = `Hi ${senderName},\n\nThank you for your response. I understand you're not interested at this time.\n\nI'll remove you from our list. If you change your mind in the future, feel free to reach out.\n\nBest regards,\nThe ReachInbox Team`;
        break;
        
      case 'Out of Office':
        suggestedReply = `Hi ${senderName},\n\nThank you for your auto-reply. I understand you're currently out of office.\n\nI'll follow up when you return. Have a great time!\n\nBest regards,\nThe ReachInbox Team`;
        break;
        
      case 'Spam':
        suggestedReply = `Hi ${senderName},\n\nThank you for reaching out. I appreciate your interest in ReachInbox.\n\nI'd be happy to help you with any questions you might have about our AI-powered email outreach platform.\n\nFeel free to schedule a demo if you'd like to see it in action: https://cal.com/reachinbox-demo\n\nBest regards,\nThe ReachInbox Team`;
        break;
        
      default:
        suggestedReply = `Hi ${senderName},\n\nThank you for reaching out. I appreciate your interest in ReachInbox.\n\nI'd be happy to help you with any questions you might have about our AI-powered email outreach platform.\n\nFeel free to schedule a demo if you'd like to see it in action: https://cal.com/reachinbox-demo\n\nBest regards,\nThe ReachInbox Team`;
    }

    console.log(`Generated reply for ${email.aiCategory} email: ${email.subject}`);
    
    res.json({
      suggestedReply: suggestedReply,
      emailId: id,
      category: email.aiCategory
    });
    
  } catch (error) {
    console.error('Error generating reply:', error);
    res.status(500).json({ 
      error: 'Failed to generate reply',
      suggestedReply: "I apologize, but I encountered an error while generating a reply. Please try again."
    });
  }
});

// Mock categorize endpoint
app.post("/api/emails/categorize", (req, res) => {
  try {
    const { emailIds } = req.body;
    
    if (!Array.isArray(emailIds)) {
      return res.status(400).json({ 
        error: 'emailIds must be an array',
        results: []
      });
    }
    
    console.log(`Re-categorizing ${emailIds.length} emails`);
    
    const results = emailIds.map((id) => {
      // Mock categorization logic - randomly assign categories for demo
      const categories = ['Interested', 'Meeting Booked', 'Not Interested', 'Spam', 'Out of Office'];
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      
      return {
        id: id,
        category: randomCategory,
        confidence: 0.8 + Math.random() * 0.2 // Random confidence between 0.8-1.0
      };
    });

    console.log('Categorization results:', results);
    res.json({ results });
    
  } catch (error) {
    console.error('Error categorizing emails:', error);
    res.status(500).json({ 
      error: 'Failed to categorize emails',
      results: []
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📧 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API status: http://localhost:${PORT}/api/status`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
});

export default app;