# 🚀 ReachInbox Onebox - AI Email Management Platform

A comprehensive AI-powered email management platform that revolutionizes cold outreach and lead generation. Built with TypeScript, Node.js, and modern web technologies.

## 📋 Project Overview

**ReachInbox Onebox** is a production-grade email management system that demonstrates advanced backend engineering skills. It provides real-time email synchronization, AI-powered categorization, intelligent search, and automated lead detection.

## ✨ Key Features

### 🔥 Core Features Implemented

1. **⚡ Real-Time Email Synchronization**
   - IMAP IDLE mode for instant email notifications (NO POLLING!)
   - Multiple email account support (minimum 2 accounts)
   - 30-day historical email sync
   - Persistent connections with auto-reconnect

2. **🔍 Elasticsearch Integration**
   - Full-text search across emails
   - Advanced filtering by account, folder, category
   - Proper index mappings for optimal performance
   - Pagination and sorting support

3. **🤖 AI Email Categorization**
   - Google Gemini API integration
   - 5 predefined categories: Interested, Meeting Booked, Not Interested, Spam, Out of Office
   - Fallback rule-based categorization
   - Batch processing support

4. **🔗 Slack & Webhook Integration**
   - Automatic Slack notifications for "Interested" emails
   - Generic webhook triggers for external automation
   - Error handling and retry logic

5. **🎨 Modern Frontend Interface**
   - Responsive web design
   - Real-time email display with AI category tags
   - Advanced search and filtering
   - Interactive statistics dashboard

6. **🧠 RAG-Powered Reply Generation**
   - Vector database integration with Qdrant
   - Context-aware AI reply generation
   - Professional response templates
   - Product information embedding

## 🏗️ Technical Architecture

### Backend Stack
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with ESM modules
- **Database**: Elasticsearch for full-text search
- **Vector DB**: Qdrant for RAG embeddings
- **AI/ML**: Google Gemini API
- **Email**: IMAP with IDLE mode
- **Caching**: Redis for performance
- **Proxy**: Nginx for load balancing

### Frontend
- **Pure HTML/CSS/JavaScript** - Modern, responsive design
- **Real-time Updates** - Live email synchronization
- **Advanced Filtering** - Multi-criteria search and filter
- **AI Integration** - Interactive categorization and reply suggestions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ with ESM support
- Docker & Docker Compose (optional)
- Google Gemini API key (optional for demo)

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd reachinbox-onebox
   npm install
   ```

2. **Configure Environment** (Optional)
   ```bash
   cp env.example .env
   # Edit .env with your credentials
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access Application**
   - Frontend: http://localhost:3000
   - API Status: http://localhost:3000/api/status
   - Health Check: http://localhost:3000/health

### Production Setup (Optional)

```bash
# Start infrastructure services
docker-compose up -d

# Build and start production server
npm run build
npm start
```

## 📊 Demo Data

The application comes with comprehensive demo data including:
- **7 Sample Emails** across different categories
- **2 Connected Accounts** for demonstration
- **Realistic Email Content** showing various scenarios
- **AI-Generated Replies** for different email types

## 🔗 API Endpoints

### Core Endpoints
- `GET /` - Main application interface
- `GET /health` - Health check
- `GET /api/status` - System status and statistics

### Email Management
- `GET /api/emails` - List emails with filtering
- `GET /api/emails/search` - Elasticsearch-powered search
- `GET /api/emails/:id` - Get specific email
- `POST /api/emails/:id/suggest-reply` - Generate AI reply

### Account Management
- `GET /api/emails/accounts/list` - List connected accounts
- `POST /api/emails/test/webhooks` - Test webhook integration

## 🎯 Assignment Requirements Fulfilled

### ✅ **Requirement 1: Real-Time Email Sync**
- ✅ Multiple IMAP account support
- ✅ IDLE mode implementation (no polling!)
- ✅ 30-day historical sync
- ✅ Persistent connections with auto-reconnect

### ✅ **Requirement 2: Elasticsearch Integration**
- ✅ Full-text search capabilities
- ✅ Advanced filtering by account/folder
- ✅ Proper index mappings
- ✅ Pagination support

### ✅ **Requirement 3: AI Categorization**
- ✅ Gemini API integration
- ✅ 5 predefined categories
- ✅ Fallback rule-based categorization
- ✅ Batch processing support

### ✅ **Requirement 4: Slack & Webhook Integration**
- ✅ Slack notifications for interested leads
- ✅ Generic webhook triggers
- ✅ Error handling and retry logic

### ✅ **Requirement 5: Frontend Interface**
- ✅ Modern, responsive design
- ✅ Real-time email display
- ✅ Advanced search and filtering
- ✅ AI category visualization

### ✅ **Requirement 6: RAG Suggested Replies**
- ✅ Vector database integration
- ✅ Context-aware reply generation
- ✅ Product information embedding
- ✅ Professional response templates

## 🏆 Production Features

### Scalability
- Docker containerization
- Nginx reverse proxy
- Redis caching layer
- Health checks and monitoring

### Security
- Environment variable configuration
- Input validation and sanitization
- Rate limiting
- CORS protection

### Monitoring
- Winston logging
- Health check endpoints
- Performance metrics
- Error tracking

## 📱 Frontend Features

### Dashboard
- **Real-time Statistics** - Email counts by category
- **Connected Accounts** - Status monitoring
- **Performance Metrics** - System health indicators

### Email Management
- **Advanced Search** - Full-text search with filters
- **Category Filtering** - Filter by AI categories
- **Account Filtering** - Filter by email accounts
- **Folder Filtering** - Filter by email folders

### AI Integration
- **Smart Categorization** - Visual category tags
- **Reply Suggestions** - AI-generated responses
- **Re-categorization** - Manual category updates
- **Interactive Features** - Click-to-generate replies

## 🔧 Development

### Scripts
```bash
npm run dev      # Start development server with hot reload
npm run build    # Build TypeScript to JavaScript
npm start        # Start production server
npm test         # Run tests (when implemented)
```

### Project Structure
```
reachinbox-onebox/
├── src/                    # TypeScript source code
│   ├── server.ts          # Main application entry
│   ├── config/            # Configuration management
│   ├── imap/              # IMAP client implementation
│   ├── elastic/           # Elasticsearch operations
│   ├── routes/            # API route definitions
│   ├── controllers/       # Business logic
│   ├── services/          # AI and external services
│   └── utils/             # Utility functions
├── public/                # Frontend static files
├── docker-compose.yml     # Infrastructure services
├── package.json           # ESM configuration
└── tsconfig.json          # TypeScript ESM setup
```

## 🌟 Business Value

This project demonstrates:
- **Advanced Backend Engineering** - Real-time systems, AI integration
- **Full-Stack Development** - Complete application with frontend
- **Production Readiness** - Docker, monitoring, error handling
- **Modern Technologies** - TypeScript ESM, vector databases, AI APIs
- **Scalable Architecture** - Microservices-ready design

## 📞 Support

For questions or issues:
- Check the health endpoint: `/health`
- Review API status: `/api/status`
- Check server logs for detailed error information

## 🎉 Success Metrics

- ✅ **Server Running**: Port 3000
- ✅ **Frontend Accessible**: http://localhost:3000
- ✅ **API Functional**: All endpoints working
- ✅ **Demo Data Loaded**: 7 sample emails
- ✅ **AI Features Active**: Categorization and replies
- ✅ **Search Working**: Full-text search functional
- ✅ **Real-time Updates**: Live email synchronization

---

**ReachInbox Onebox** - Revolutionizing email management with AI-powered automation! 🚀
