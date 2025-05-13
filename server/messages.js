const { SuccessResponse } = require('./errors');
const { WebSocket } = require('ws');

const publicKeys = new Map(); // Store public keys for all clients

function processMessage(wss, ws, clientId, parsedData, handleSuccess, handleError) {
  if (parsedData.type === 'publicKey') {
    console.log('Storing and broadcasting public key from:', clientId, 'length:', parsedData.publicKey.length, 'first few bytes:', parsedData.publicKey.slice(0, 10));
    // Store the public key
    publicKeys.set(clientId, parsedData.publicKey);
    
    // Broadcast to other connected clients
    const publicKeyMessage = JSON.stringify({ type: 'publicKey', from: clientId, publicKey: parsedData.publicKey });
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        console.log('Sending public key to client:', client.id);
        client.send(publicKeyMessage);
      }
    });
    handleSuccess(new SuccessResponse('Public key broadcasted', { clientId }));
    
    // Send all existing public keys to the newly connected client
    publicKeys.forEach((key, id) => {
      if (id !== clientId) {
        const existingKeyMessage = JSON.stringify({ type: 'publicKey', from: id, publicKey: key });
        console.log('Sending existing public key from:', id, 'to:', clientId);
        ws.send(existingKeyMessage);
      }
    });
    return;
  }

  if (parsedData.type === 'encryptedMessage') {
    const recipientWs = Array.from(wss.clients).find(client => client.id === parsedData.to);
    if (!recipientWs) {
      handleError(400, `Recipient ${parsedData.to} not found or not connected`);
      return;
    }
    if (recipientWs.readyState !== WebSocket.OPEN) {
      handleError(400, `Recipient ${parsedData.to} is not connected`);
      return;
    }
    const message = JSON.stringify({
      type: 'encryptedMessage',
      from: clientId,
      iv: parsedData.iv,
      ciphertext: parsedData.ciphertext,
      hmac: parsedData.hmac
    });
    recipientWs.send(message);
    handleSuccess(new SuccessResponse('Encrypted message relayed', { from: clientId, to: parsedData.to }));
    return;
  }

  handleError(400, `Unknown message type: ${parsedData.type}`);
}

module.exports = {
  processMessage,
  clearPublicKey: (clientId) => {
    publicKeys.delete(clientId);
    console.log('Cleared public key for:', clientId);
  }
};