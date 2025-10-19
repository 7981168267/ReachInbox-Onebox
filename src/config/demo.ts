// Demo configuration for running without external services
export const demoConfig = {
  // Mock data for demonstration
  mockEmails: [
    {
      id: 'demo-1',
      accountId: 'demo@reachinbox.com',
      folder: 'INBOX',
      subject: 'Interested in your AI outreach platform',
      body: 'Hi, I saw your platform and I\'m very interested in learning more about how it can help our sales team. Could we schedule a demo?',
      from: 'prospect@company.com',
      to: ['demo@reachinbox.com'],
      date: new Date('2024-01-15T10:30:00Z'),
      aiCategory: 'Interested',
      indexedAt: new Date(),
      uid: 1,
      flags: [],
      size: 1024
    },
    {
      id: 'demo-2',
      accountId: 'demo@reachinbox.com',
      folder: 'INBOX',
      subject: 'Meeting confirmed for tomorrow',
      body: 'Thank you for the demo. I\'d like to confirm our meeting for tomorrow at 2 PM. Looking forward to discussing pricing.',
      from: 'client@business.com',
      to: ['demo@reachinbox.com'],
      date: new Date('2024-01-14T15:45:00Z'),
      aiCategory: 'Meeting Booked',
      indexedAt: new Date(),
      uid: 2,
      flags: [],
      size: 856
    },
    {
      id: 'demo-3',
      accountId: 'demo@reachinbox.com',
      folder: 'INBOX',
      subject: 'Out of office - vacation',
      body: 'I am currently out of office until January 20th. For urgent matters, please contact my assistant.',
      from: 'manager@corporate.com',
      to: ['demo@reachinbox.com'],
      date: new Date('2024-01-13T09:00:00Z'),
      aiCategory: 'Out of Office',
      indexedAt: new Date(),
      uid: 3,
      flags: [],
      size: 512
    },
    {
      id: 'demo-4',
      accountId: 'demo@reachinbox.com',
      folder: 'INBOX',
      subject: 'Newsletter: Weekly Tech Updates',
      body: 'Check out our latest newsletter with the newest tech trends and updates from the industry.',
      from: 'newsletter@techblog.com',
      to: ['demo@reachinbox.com'],
      date: new Date('2024-01-12T08:00:00Z'),
      aiCategory: 'Spam',
      indexedAt: new Date(),
      uid: 4,
      flags: [],
      size: 2048
    },
    {
      id: 'demo-5',
      accountId: 'demo@reachinbox.com',
      folder: 'INBOX',
      subject: 'Not interested in your service',
      body: 'Thank you for reaching out, but we are not currently looking for new solutions. Please remove us from your list.',
      from: 'noreply@company.com',
      to: ['demo@reachinbox.com'],
      date: new Date('2024-01-11T14:20:00Z'),
      aiCategory: 'Not Interested',
      indexedAt: new Date(),
      uid: 5,
      flags: [],
      size: 768
    }
  ]
};
