const { getClientList } = require('./clients');
const { MessageError, ClientError, SuccessResponse } = require('./errors');

const publicKeys = new Map();

function storePublicKey(clientId, publicKey) {
  publicKeys.set(clientId, publicKey);
  const clientList = getClientList();
  clientList.forEach(client => {
    if (client && client.ws && client.ws.readyState === 1 && client.id !== clientId) {
      client.ws.send(JSON.stringify({
        type: 'publicKey',
        from: clientId,
        publicKey
      }));
    }
  });
  // Send existing public keys to the new client
  publicKeys.forEach((key, id) => {
    if (id !== clientId) {
      const client = clientList.find(c => c.id === clientId);
      if (client && client.ws && client.ws.readyState === 1) {
        client.ws.send(JSON.stringify({
          type: 'publicKey',
          from: id,
          publicKey: key
        }));
      }
    }
  });
}

function sendEncryptedMessage(from, to, message) {
  const clientList = getClientList();
  const recipient = clientList.find(client => client.id === to);
  if (!recipient || !recipient.ws || recipient.ws.readyState !== 1) {
    throw new ClientError('Recipient not found or not connected', { from, to });
  }
  recipient.ws.send(JSON.stringify({
    type: 'encryptedMessage',
    from,
    iv: message.iv,
    ciphertext: message.ciphertext,
    hmac: message.hmac
  }));
}

function clearPublicKey(clientId) {
  publicKeys.delete(clientId);
}

module.exports = { storePublicKey, sendEncryptedMessage, clearPublicKey };