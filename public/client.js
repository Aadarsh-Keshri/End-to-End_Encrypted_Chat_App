(async () => {
  // Initialize WebSocket
  const ws = new WebSocket('wss://localhost:3000');
  let clientId = null;
  const sharedSecrets = new Map();
  let publicKey = null;
  let privateKey = null;

  // Constant-time comparison function
  function timingSafeEqual(a, b) {
    if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array)) {
      return false;
    }
    if (a.length !== b.length) {
      return false;
    }
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    return result === 0;
  }

  // Generate ECDH key pair (P-256)
  try {
    const keyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey', 'deriveBits']);
    privateKey = keyPair.privateKey;
    publicKey = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    console.log('Generated public key length:', new Uint8Array(publicKey).length, 'First few bytes:', new Uint8Array(publicKey).slice(0, 10));
  } catch (error) {
    console.error('Key generation failed:', error);
    document.getElementById('chat').innerHTML += `<p><strong>Error:</strong> Failed to generate encryption keys: ${error.message}</p>`;
    return;
  }

  // DOM elements
  const chat = document.getElementById('chat');
  const messageInput = document.getElementById('message');
  const sendButton = document.getElementById('send');
  const clientsSelect = document.getElementById('clients');
  const clientIdSpan = document.getElementById('clientId');

  // WebSocket event handlers
  ws.onopen = () => {
    console.log('Connected to server');
  };

  ws.onmessage = async (event) => {
    try {
      console.log('Received:', event.data);
      const data = JSON.parse(event.data);
      if (data.type === 'clientId') {
        console.log('Setting clientId:', data.id);
        clientId = data.id;
        clientIdSpan.textContent = clientId;
        const publicKeyArray = Array.from(new Uint8Array(publicKey));
        console.log('Sending public key length:', publicKeyArray.length, 'First few bytes:', publicKeyArray.slice(0, 10));
        ws.send(JSON.stringify({ type: 'publicKey', to: null, publicKey: publicKeyArray }));
      } else if (data.type === 'clientList') {
        clientsSelect.innerHTML = '<option value="">Select a client</option>';
        data.clients.forEach((id) => {
          if (id !== clientId) {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = id;
            clientsSelect.appendChild(option);
          }
        });
      } else if (data.type === 'publicKey') {
        console.log('Processing publicKey from:', data.from, 'Key length:', data.publicKey.length);
        try {
          // Validate public key data
          if (!Array.isArray(data.publicKey)) {
            throw new Error('Public key is not an array');
          }
          const peerPublicKey = new Uint8Array(data.publicKey);
          console.log('Peer public key length:', peerPublicKey.length, 'First few bytes:', peerPublicKey.slice(0, 10));
          if (peerPublicKey.length !== 65 || peerPublicKey[0] !== 4) {
            throw new Error(`Invalid public key: length=${peerPublicKey.length}, firstByte=${peerPublicKey[0]}`);
          }

          let sharedSecretKey;
          try {
            // Primary approach: deriveKey
            const peerKey = await crypto.subtle.importKey('raw', peerPublicKey, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
            console.log('Peer key imported successfully:', peerKey);
            sharedSecretKey = await crypto.subtle.deriveKey(
              { name: 'ECDH', public: peerKey },
              privateKey,
              { name: 'AES-CBC', length: 256 },
              true,
              ['encrypt', 'decrypt']
            );
            console.log('Derived AES key using deriveKey');
          } catch (deriveKeyError) {
            console.error('deriveKey failed:', deriveKeyError);
            // Fallback: deriveBits
            try {
              const peerKey = await crypto.subtle.importKey('raw', peerPublicKey, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
              console.log('Peer key imported successfully (fallback):', peerKey);
              const sharedSecret = await crypto.subtle.deriveBits({ name: 'ECDH', public: peerKey }, privateKey, 256);
              sharedSecretKey = await crypto.subtle.importKey(
                'raw',
                new Uint8Array(sharedSecret),
                { name: 'AES-CBC' },
                true,
                ['encrypt', 'decrypt']
              );
              console.log('Derived AES key using deriveBits fallback');
            } catch (deriveBitsError) {
              console.error('deriveBits failed:', deriveBitsError);
              throw new Error(`Key derivation failed: ${deriveBitsError.message}`);
            }
          }
          sharedSecrets.set(data.from, sharedSecretKey);
          console.log('Shared secret key set for:', data.from);
        } catch (error) {
          console.error('Public key processing error:', error);
          chat.innerHTML += `<p><strong>Error:</strong> Failed to process public key from ${data.from}: ${error.message}</p>`;
          chat.scrollTop = chat.scrollHeight;
        }
      } else if (data.type === 'encryptedMessage') {
        console.log('Processing encryptedMessage from:', data.from);
        const sharedSecretKey = sharedSecrets.get(data.from);
        if (!sharedSecretKey) {
          chat.innerHTML += `<p><strong>Error:</strong> No shared secret with ${data.from}</p>`;
          chat.scrollTop = chat.scrollHeight;
          return;
        }

        try {
          const iv = new Uint8Array(data.iv);
          const ciphertext = new Uint8Array(data.ciphertext);
          const receivedHmac = new Uint8Array(data.hmac);
          const ivAndCiphertext = new Uint8Array([...iv, ...ciphertext]);

          // Verify HMAC
          const rawSharedSecret = await crypto.subtle.exportKey('raw', sharedSecretKey);
          const hmacKey = await crypto.subtle.importKey('raw', rawSharedSecret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
          const computedHmac = await crypto.subtle.sign('HMAC', hmacKey, ivAndCiphertext);
          if (!timingSafeEqual(receivedHmac, new Uint8Array(computedHmac))) {
            chat.innerHTML += `<p><strong>Error:</strong> HMAC verification failed</p>`;
            chat.scrollTop = chat.scrollHeight;
            return;
          }

          // Decrypt
          const decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, sharedSecretKey, ciphertext);
          const plaintext = new TextDecoder().decode(decrypted);
          chat.innerHTML += `<p><strong>${data.from}:</strong> ${plaintext}</p>`;
          chat.scrollTop = chat.scrollHeight;
        } catch (error) {
          console.error('Encrypted message processing error:', error);
          chat.innerHTML += `<p><strong>Error:</strong> Failed to process message from ${data.from}: ${error.message}</p>`;
          chat.scrollTop = chat.scrollHeight;
        }
      } else if (data.type === 'error') {
        chat.innerHTML += `<p><strong>Error from server:</strong> ${data.message} (Code: ${data.code})</p>`;
        chat.scrollTop = chat.scrollHeight;
      }
    } catch (error) {
      console.error('Message processing error:', error);
      chat.innerHTML += `<p><strong>Error:</strong> Failed to process server message: ${error.message}</p>`;
      chat.scrollTop = chat.scrollHeight;
    }
  };

  ws.onclose = () => {
    chat.innerHTML += '<p><strong>Disconnected from server</strong></p>';
    chat.scrollTop = chat.scrollHeight;
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    chat.innerHTML += `<p><strong>Error:</strong> WebSocket connection error</p>`;
    chat.scrollTop = chat.scrollHeight;
  };

  // Send message
  sendButton.onclick = async () => {
    if (!sharedSecrets.size) {
      chat.innerHTML += `<p><strong>Wait:</strong> Key exchange in progress...</p>`;
      chat.scrollTop = chat.scrollHeight;
      for (let i = 0; i < 10; i++) {
        if (sharedSecrets.size) break;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      if (!sharedSecrets.size) {
        chat.innerHTML += `<p><strong>Error:</strong> Key exchange timed out</p>`;
        chat.scrollTop = chat.scrollHeight;
        return;
      }
    }
    const recipient = clientsSelect.value;
    const message = messageInput.value.trim();
    if (!recipient || !message) return;

    const sharedSecretKey = sharedSecrets.get(recipient);
    if (!sharedSecretKey) {
      chat.innerHTML += `<p><strong>Error:</strong> No shared secret with ${recipient}</p>`;
      chat.scrollTop = chat.scrollHeight;
      return;
    }

    try {
      // Encrypt message
      const iv = crypto.getRandomValues(new Uint8Array(16));
      const encodedMessage = new TextEncoder().encode(message);
      const ciphertext = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, sharedSecretKey, encodedMessage);

      // Generate HMAC
      const rawSharedSecret = await crypto.subtle.exportKey('raw', sharedSecretKey);
      const ivAndCiphertext = new Uint8Array([...iv, ...new Uint8Array(ciphertext)]);
      const hmacKey = await crypto.subtle.importKey('raw', rawSharedSecret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const hmac = await crypto.subtle.sign('HMAC', hmacKey, ivAndCiphertext);

      // Send encrypted message
      ws.send(JSON.stringify({
        type: 'encryptedMessage',
        to: recipient,
        iv: Array.from(iv),
        ciphertext: Array.from(new Uint8Array(ciphertext)),
        hmac: Array.from(new Uint8Array(hmac))
      }));

      // Display sent message
      chat.innerHTML += `<p><strong>You to ${recipient}:</strong> ${message}</p>`;
      chat.scrollTop = chat.scrollHeight;
      messageInput.value = '';
    } catch (error) {
      console.error('Message sending error:', error);
      chat.innerHTML += `<p><strong>Error:</strong> Failed to send message: ${error.message}</p>`;
      chat.scrollTop = chat.scrollHeight;
    }
  };

  // Send message on Enter key
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendButton.click();
  });
})();
//By Aadarsh Keshri