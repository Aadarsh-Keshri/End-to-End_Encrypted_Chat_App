const { v4: uuidv4 } = require('uuid');
const { WebSocket } = require('ws');
const messages = require('./messages');
const { SuccessResponse } = require('./errors');

function initializeWebSocket(wss) {
  const handleSuccess = (response) => {
    console.log(`[${new Date().toISOString()}] SUCCESS: ${response.message} | Client: ${response.details.clientId || 'unknown'} | Details:`, response.details);
  };

  const handleError = (code, message, ws) => {
    console.error(`[${new Date().toISOString()}] ERROR: ${message} | Client: ${ws.id || 'unknown'}`);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'error', code, message }));
    }
  };

  wss.on('connection', (ws) => {
    ws.id = uuidv4();
    handleSuccess(new SuccessResponse('Client connected', { clientId: ws.id }));
    ws.send(JSON.stringify({ type: 'clientId', id: ws.id }));
    const clientList = Array.from(wss.clients).map(client => client.id);
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'clientList', clients: clientList }));
      }
    });

    ws.on('message', async (data) => {
      try {
        console.log('Received message from:', ws.id, 'Data:', data);
        const parsedData = JSON.parse(data);
        if (!parsedData.type) {
          handleError(400, 'Message type is required', ws);
          return;
        }
        await messages.processMessage(wss, ws, ws.id, parsedData, handleSuccess, (code, message) => handleError(code, message, ws));
      } catch (error) {
        console.error(`[${new Date().toISOString()}] ERROR: Message processing failed | Client: ${ws.id} | Details:`, error);
        handleError(400, error.message, ws);
      }
    });

    ws.on('close', () => {
      const clientList = Array.from(wss.clients)
        .filter(client => client !== ws)
        .map(client => client.id);
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'clientList', clients: clientList }));
        }
      });
      handleSuccess(new SuccessResponse('Client disconnected', { clientId: ws.id }));
      // Clean up public keys
      messages.clearPublicKey(ws.id);
    });
  });
}

module.exports = {
  initializeWebSocket,
  clearPublicKey: (clientId) => {
    messages.clearPublicKey(clientId);
  }
};