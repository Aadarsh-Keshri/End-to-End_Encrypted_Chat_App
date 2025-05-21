const express = require('express');
const https = require('https');
const fs = require('fs');
const { Server } = require('ws');
const { handleWebSocketConnection } = require('./server/websocket');

const app = express();
const serverOptions = {
  cert: fs.readFileSync('cert.pem'),
  key: fs.readFileSync('key.pem')
};

app.use(express.static('public'));

const server = https.createServer(serverOptions, app);
const wss = new Server({ server });

wss.on('connection', handleWebSocketConnection);

// Bind to all interfaces (0.0.0.0) instead of localhost
server.listen(3000, '0.0.0.0', () => {
  console.log('Server running on https://0.0.0.0:3000');
});