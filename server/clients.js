const clients = new Map();

function addClient(clientId, ws) {
  clients.set(clientId, { id: clientId, ws });
}

function removeClient(clientId) {
  clients.delete(clientId);
}

function getClientList() {
  return Array.from(clients.values());
}

module.exports = { addClient, removeClient, getClientList };