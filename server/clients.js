const { ClientError } = require('./errors');

const clients = new Map();

function addClient(clientId, ws) {
  if (!clientId) {
    throw new ClientError('Invalid client ID');
  }
  if (!ws || typeof ws !== 'object') {
    throw new ClientError('Invalid WebSocket instance');
  }
  clients.set(clientId, ws);
}

function removeClient(clientId) {
  if (!clientId) {
    throw new ClientError('Invalid client ID');
  }
  if (!clients.has(clientId)) {
    throw new ClientError(`Client ${clientId} not found`);
  }
  clients.delete(clientId);
}

function getClient(clientId) {
  if (!clientId) {
    throw new ClientError('Invalid client ID');
  }
  const client = clients.get(clientId);
  if (!client) {
    throw new ClientError(`Client ${clientId} not found`);
  }
  return client;
}

function getClientList() {
  return Array.from(clients.keys());
}

module.exports = { addClient, removeClient, getClient, getClientList };