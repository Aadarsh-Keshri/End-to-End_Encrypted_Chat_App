# End-to-End Encrypted Real-Time Chat Application

This is a secure, end-to-end encrypted real-time chat application built using Node.js, WebSocket, and the Web Crypto API. It leverages **ECDH (P-256)** for key exchange, **AES-256-CBC** for message encryption, and **HMAC-SHA256** for message integrity and authenticity. The application allows multiple clients to connect, exchange public keys, and send encrypted messages across devices on the same network or locally, with only the intended recipient able to decrypt them.

## Table of Contents
- [Features](#features)
- [How It Works](#how-it-works)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Dependencies](#dependencies)
- [Security Details](#security-details)
- [About the Authors](#about-the-authors)

## Features
- **End-to-End Encryption**: Messages are encrypted on the client side and only decryptable by the intended recipient.
- **Secure Key Exchange**: Uses ECDH (P-256) to derive unique shared secrets for each client pair.
- **Message Integrity**: HMAC-SHA256 ensures messages are not tampered with during transit.
- **Real-Time Communication**: WebSocket Secure (WSS) enables instant message delivery.
- **Multi-Client Support**: Multiple users can connect and chat simultaneously.
- **Multi-Host Communication**: Clients can connect from different devices on the same network (e.g., via https://10.10.11.113:3000) or locally (https://localhost:3000).
- **Browser-Based**: Runs in modern browsers (Firefox, Chrome) with no additional software required.

## How It Works
The application consists of a Node.js server and a browser-based client interface. Here's a high-level overview:

1. **Server Setup**:
   - The server runs on `https://0.0.0.0:3000`, accessible via `https://localhost:3000` or `https://10.10.11.113:3000` (server IP) using a self-signed SSL certificate (`key.pem`, `cert.pem`).
   - It uses WebSocket Secure (WSS) for real-time connections across local and network devices.
   - The server assigns unique IDs and relays public keys and encrypted messages without accessing plaintext.

2. **Client Connection**:
   - Clients connect via browsers to `https://localhost:3000` (local) or `https://10.10.11.113:3000` (multi-host), loading the client interface.
   - Each client generates an ECDH (P-256) key pair and sends its public key to the server.

3. **Key Exchange**:
   - The server broadcasts public keys to all connected clients and sends existing keys to new clients.
   - Each client derives a shared secret with other clients using their public keys and its private key.
   - The shared secret generates a 256-bit AES key for encryption and an HMAC key for integrity.

4. **Message Encryption and Sending**:
   - A client selects a recipient, types a message, and encrypts it using AES-256-CBC with a random 16-byte IV.
   - An HMAC-SHA256 is computed over the IV and ciphertext.
   - The encrypted message (`iv`, `ciphertext`, `hmac`) is sent to the server, which relays it to the recipient.

5. **Message Decryption and Verification**:
   - The recipient verifies the HMAC to ensure integrity and authenticity.
   - If valid, the message is decrypted using AES-256-CBC with the shared secret and IV.
   - The plaintext is displayed in the chat interface.

6. **Disconnection**:
   - When a client disconnects, the server updates the client list and clears the client's public key.

The application ensures **end-to-end encryption**, with the server only relaying encrypted data. Private keys and shared secrets remain in the client’s browser.

## Prerequisites
- **Node.js**: Version 18.17.1 or later (download from [nodejs.org](https://nodejs.org)).
- **npm**: Included with Node.js for dependency management.
- **Modern Browser**: Firefox or Chrome for the client interface.
- **Git**: Optional, for cloning the repository.
- **Operating System**: Windows, macOS, or Linux.
- **Network**: For multi-host communication, devices must be on the same network, with port 3000 open.

## Installation
1. **Clone or Download the Repository**:
   ```bash
   git clone https://github.com/Aadarsh-Keshri/End-to-End_Encrypted_Chat_App.git
   cd chat-app
   ```
   Alternatively, download and extract the project ZIP file.

2. **Install Dependencies**:
   Navigate to the project directory and install Node.js dependencies:
   ```bash
   npm install
   ```
   This installs `express`, `ws`, and `uuid`.

3. **Verify SSL Certificates**:
   Ensure `key.pem` and `cert.pem` are in the project root for HTTPS/WSS. If missing, generate them:
   ```bash
   openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"
   ```
   For multi-host, use the server IP:
   ```bash
   openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=10.10.11.113"
   ```

## Running the Application
1. **Start the Server**:
   In the project directory (D:\CNS_Assignment\chat-app), run:
   ```bash
   node server.js
   ```
   You should see:
   ```
   Server running on https://0.0.0.0:3000
   ```

2. **Configure Network (Multi-Host)**:
   - Ensure port 3000 is open:
     ```bash
     netsh advfirewall firewall add rule name="Node 3000" dir=in action=allow protocol=TCP localport=3000
     ```
   - Find the server’s IP (e.g., 10.10.11.113):
     ```bash
     ipconfig
     ```
   - Update `public/client.js` (~line 3) to use the server IP:
     ```javascript
     const ws = new WebSocket('wss://10.10.11.113:3000');
     ```

3. **Access the Client Interface**:
   - **Local Testing**:
     - Open Firefox or Chrome and navigate to `https://localhost:3000`.
     - Accept the self-signed certificate warning (Firefox: "Advanced" > "Accept the Risk"; Chrome: "Advanced" > "Proceed").
   - **Multi-Host Testing**:
     - On the server device or other devices on the same network, navigate to `https://10.10.11.113:3000`.
     - Accept the certificate warning.
     - Use multiple devices (e.g., laptop, phone) to simulate clients.
   - Repeat in multiple tabs or devices to test multiple clients.

4. **Use the Chat**:
   - Each client displays a unique Client ID (e.g., `30efc335-1c2e-4ed7-96bc-c2bc5237caa8`).
   - Select a recipient from the dropdown (other connected Client IDs).
   - Type a message and click "Send" or press Enter.
   - Messages appear in the recipient’s interface, prefixed with the sender’s Client ID.

5. **Stop the Server**:
   Press `Ctrl+C` in the terminal to stop the server.

## Dependencies
- **express**: Serves static files for the client interface.
- **ws**: Implements WebSocket server for real-time communication.
- **uuid**: Generates unique Client IDs.
Install with:
```bash
npm install express ws uuid
```

## Security Details
The application ensures robust security through:
- **Transport Security**: HTTPS/WSS (TLS) protects against network eavesdropping.
- **Key Exchange**: ECDH (P-256) derives unique 256-bit shared secrets for each client pair, ensuring perfect forward secrecy.
- **Encryption**: AES-256-CBC encrypts messages with random 16-byte IVs, ensuring confidentiality.
- **Integrity and Authenticity**: HMAC-SHA256 verifies that messages are untampered and from the claimed sender, using a constant-time comparison.
- **End-to-End Encryption**: Only the sender and recipient can decrypt messages. The server only relays encrypted data and cannot access plaintext or private keys.

## About the Authors
- **Name(USN)**: Aadarsh Keshri(1BI22IC002), Bindu B N(1BI22IC014)
- **Subject**: Cryptography and Network Security(BCY602)
- **Branch**: Computer Science and Engineering - IoT and Cyber Security including Blockchain Technology
- **Year**: 2022-2026
- **College**: Bangalore Institute of Technology