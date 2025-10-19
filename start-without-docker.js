// Simple startup script without Docker dependencies
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting ReachInbox Onebox (without Docker)...');
console.log('⚠️  Note: Some features may be limited without Elasticsearch and Qdrant');

// Set environment variables for demo mode
process.env.NODE_ENV = 'development';
process.env.PORT = '3000';
process.env.ELASTICSEARCH_URL = 'http://localhost:9200';
process.env.QDRANT_URL = 'http://localhost:6333';

// Start the server
const server = spawn('npx', ['ts-node', 'src/server.ts'], {
  stdio: 'inherit',
  shell: true,
  env: process.env
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGINT');
  process.exit(0);
});
