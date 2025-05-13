const https = require('https');
const fs = require('fs');
const express = require('express');
const { WebSocketServer } = require('ws');
const { initializeWebSocket } = require('./server/websocket');

const app = express();

app.use(express.static('public'));

const server = https.createServer({
  cert: fs.readFileSync('cert.pem'),
  key: fs.readFileSync('key.pem')
}, app);

const wss = new WebSocketServer({ server });

try {
  initializeWebSocket(wss);
} catch (error) {
  console.error(`[${new Date().toISOString()}] WebSocketError (WEBSOCKET_ERROR): Error initializing WebSocket handlers | Client: unknown | Details:`, { error: error.message });
  process.exit(1);
}

server.listen(3000, () => {
  console.log('Server running on https://localhost:3000');
});