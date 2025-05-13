class ChatError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
  }
}

class WebSocketError extends ChatError {
  constructor(message, details = {}) {
    super('WEBSOCKET_ERROR', message, details);
  }
}

class MessageError extends ChatError {
  constructor(message, details = {}) {
    super('MESSAGE_ERROR', message, details);
  }
}

class ClientError extends ChatError {
  constructor(message, details = {}) {
    super('CLIENT_ERROR', message, details);
  }
}

class SuccessResponse {
  constructor(message, details = {}) {
    this.status = 'success';
    this.message = message;
    this.details = details;
  }
}

function handleError(error, ws = null, clientId = 'unknown') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${error.name} (${error.code}): ${error.message} | Client: ${clientId} | Details: ${JSON.stringify(error.details)}`;
  console.error(logMessage);

  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({
      type: 'error',
      code: error.code,
      message: error.message
    }));
  }

  // Return false to indicate error state
  return false;
}

function handleSuccess(response, ws = null, clientId = 'unknown') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] SUCCESS: ${response.message} | Client: ${clientId} | Details: ${JSON.stringify(response.details)}`;
  console.log(logMessage);

  if (ws && ws.readyState === ws.OPEN && response.message !== 'Client connected') {
    ws.send(JSON.stringify({
      type: 'success',
      message: response.message,
      details: response.details
    }));
  }

  // Return true to indicate success state
  return true;
}

module.exports = {
  ChatError,
  WebSocketError,
  MessageError,
  ClientError,
  SuccessResponse,
  handleError,
  handleSuccess
};