# End-to-End Encrypted Real-Time Chat Application

This is a secure, end-to-end encrypted real-time chat application built using Node.js, WebSocket, and the Web Crypto API. It leverages **ECDH (P-256)** for key exchange, **AES-256-CBC** for message encryption, and **HMAC-SHA256** for message integrity and authenticity. The application allows multiple clients to connect, exchange public keys, and send encrypted messages that only the intended recipient can decrypt.

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
- **Real-Time Communication**: WebSocket (WSS) enables instant message delivery.
- **Multi-Client Support**: Multiple users can connect and chat simultaneously.
- **Browser-Based**: Runs in modern browsers (Firefox, Chrome) with no additional software required.

## How It Works
The application consists of a Node.js server and a browser-based client interface. Here's a high-level overview of its operation:

1. **Server Setup**:
   - The server runs on `https://localhost:3000` using a self-signed SSL certificate (`key.pem`, `cert.pem`).
   - It uses WebSocket Secure (WSS) to handle real-time client connections.
   - The server assigns each client a unique ID and relays public keys and encrypted messages without accessing plaintext.

2. **Client Connection**:
   - Clients connect via a browser to `https://localhost:3000`, loading the client interface.
   - Each client generates an ECDH (P-256) key pair and sends its public key to the server.

3. **Key Exchange**:
   - The server broadcasts public keys to all connected clients and sends existing keys to new clients.
   - Each client derives a shared secret with other clients using their public keys and its private key.
   - The shared secret is used to generate a 256-bit AES key for encryption and an HMAC key for integrity.

4. **Message Encryption and Sending**:
   - A client selects a recipient from a dropdown, types a message, and encrypts it using AES-256-CBC with a random 16-byte IV.
   - An HMAC-SHA256 is computed over the IV and ciphertext using the shared secret.
   - The encrypted message (`iv`, `ciphertext`, `hmac`) is sent to the server, which relays it to the recipient.

5. **Message Decryption and Verification**:
   - The recipient verifies the HMAC using the shared secret to ensure integrity and authenticity.
   - If valid, the message is decrypted using AES-256-CBC with the shared secret and IV.
   - The plaintext is displayed in the chat interface.

6. **Disconnection**:
   - When a client disconnects, the server updates the client list and clears the client's public key from its store.

The application ensures **end-to-end encryption**, meaning the server only sees encrypted messages and cannot decrypt them. Private keys and shared secrets never leave the client’s browser.

## Prerequisites
- **Node.js**: Version 18.17.1 or later (download from [nodejs.org](https://nodejs.org)).
- **npm**: Included with Node.js for dependency management.
- **Modern Browser**: Firefox or Chrome for the client interface.
- **Git**: Optional, for cloning the repository.
- **Operating System**: Windows, macOS, or Linux.

## Installation
1. **Clone or Download the Repository**:
   ```bash
   git clone https://github.com/Aadarsh-Keshri/End-to-End_Encrypted_Chat_App.git
   cd secure-chat
   ```
   Alternatively, download and extract the project ZIP file.

2. **Install Dependencies**:
   Navigate to the project directory and install Node.js dependencies:
   ```bash
   npm install
   ```
   This installs `express`, `ws`, and `uuid`.

3. **Verify SSL Certificates**:
   Ensure `key.pem` and `cert.pem` are in the project root. These are self-signed certificates for HTTPS/WSS. If missing, generate them using OpenSSL:
   ```bash
   openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes
   ```

## Running the Application
1. **Start the Server**:
   In the project directory, run:
   ```bash
   node server.js
   ```
   You should see:
   ```
   Server running on https://localhost:3000
   ```

2. **Access the Client Interface**:
   - Open a modern browser (Firefox or Chrome).
   - Navigate to `https://localhost:3000`.
   - Accept the self-signed certificate warning (click "Advanced" and "Accept the Risk" in Firefox, or "Proceed" in Chrome).
   - Repeat in another tab or browser instance to simulate multiple clients.

3. **Use the Chat**:
   - Each tab displays a unique Client ID (e.g., `30efc335-1c2e-4ed7-96bc-c2bc5237caa8`).
   - Select a recipient from the dropdown (other connected Client IDs).
   - Type a message and click "Send" or press Enter.
   - Messages appear in the recipient’s tab, prefixed with the sender’s Client ID.

4. **Stop the Server**:
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
- **Name(USN)**: Aadarsh Keshri(1BI22IC002) , Bindu B N(1BI22IC014) 
- **Subject**: Cryptography and Network Security(BCY602)
- **Branch**:  Computer Science and Engineering- IoT and Cyber Security including Blockchain Technology
- **Year**: 2022-2026
- **College**: Bangalore Institute of Technology