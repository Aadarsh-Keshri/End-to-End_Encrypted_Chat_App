const { v4: uuidv4 } = require('uuid');
const { addClient, removeClient, getClientList } = require('./clients');
const { storePublicKey, sendEncryptedMessage, clearPublicKey } = require('./messages');
const { handleError, handleSuccess, MessageError, SuccessResponse } = require('./errors');

function handleWebSocketConnection(ws) {
  // Assign client ID
  const clientId = uuidv4();
  addClient(clientId, ws);

  // Send client ID to client
  ws.send(JSON.stringify({ type: 'clientId', id: clientId }));

  // Broadcast client list
  const clientList = getClientList();
  clientList.forEach(client => {
    if (client && client.ws && client.ws.readyState === 1) { // WebSocket.OPEN
      client.ws.send(JSON.stringify({ type: 'clientList', clients: clientList.map(c => c.id) }));
    }
  });

  // Handle messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'publicKey') {
        if (Array.isArray(data.publicKey)) {
          storePublicKey(clientId, data.publicKey);
          handleSuccess(new SuccessResponse('Public key stored', { clientId }), ws, clientId);
        } else {
          throw new MessageError('Invalid public key format', { clientId });
        }
      } else if (data.type === 'encryptedMessage') {
        sendEncryptedMessage(clientId, data.to, {
          iv: data.iv,
          ciphertext: data.ciphertext,
          hmac: data.hmac
        });
        handleSuccess(new SuccessResponse('Encrypted message sent', { clientId, to: data.to }), ws, clientId);
      } else {
        throw new MessageError(`Unknown message type: ${data.type}`, { clientId });
      }
    } catch (error) {
      handleError(error instanceof MessageError ? error : new MessageError('Invalid message', { clientId, error: error.message }), ws, clientId);
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    clearPublicKey(clientId);
    removeClient(clientId);
    const updatedClientList = getClientList();
    updatedClientList.forEach(client => {
      if (client && client.ws && client.ws.readyState === 1) {
        client.ws.send(JSON.stringify({ type: 'clientList', clients: updatedClientList.map(c => c.id) }));
      }
    });
  });

  ws.on('error', (error) => {
    handleError(new MessageError('WebSocket error', { clientId, error: error.message }), ws, clientId);
  });
}

module.exports = { handleWebSocketConnection };