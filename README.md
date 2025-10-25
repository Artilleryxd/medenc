# Secure Image Storage System

A complete implementation of secure image storage using **hybrid encryption** (AES-256 + RSA-2048), **IPFS**, and **Ethereum blockchain** for tamper-proof verification.

## 🏗️ Architecture

- **Backend**: Node.js + Express (CommonJS)
- **Frontend**: React + Tailwind CSS + React Router
- **Storage**: IPFS (InterPlanetary File System)
- **Blockchain**: Ethereum (Hardhat local network)
- **Encryption**: Hybrid (AES-256-CBC + RSA-2048)

## 🔐 Security Features

1. **Hybrid Encryption**: Images encrypted with permanent AES-256 key
2. **Key Protection**: AES key encrypted with RSA-2048 public key
3. **Blockchain Verification**: CIDs stored on immutable blockchain
4. **Tamper Detection**: Automatic verification against blockchain
5. **IPFS Storage**: Decentralized encrypted file storage

## 📦 Installation

### Prerequisites

- Node.js 18+ installed
- IPFS daemon installed and running
- Git

### Setup Instructions

**Step 1: Install IPFS**
```bash
# Install IPFS
npm install -g ipfs

# Initialize IPFS
ipfs init

# Start IPFS daemon (keep this running)
ipfs daemon
```

**Step 2: Backend Setup**
```bash
cd backend

# Install dependencies
npm install

# Start Hardhat local blockchain (Terminal 1)
npx hardhat node

# Deploy smart contract (Terminal 2)
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost

# Update contract address in routes/fileRoutes.js (line 24)

# Start backend server (Terminal 3)
npm start
```

**Step 3: Frontend Setup**
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🚀 Usage

### Upload Images

1. Navigate to http://localhost:3000
2. Click "Upload" tab
3. Drag & drop or select multiple images
4. Click "Encrypt & Upload"
5. Save the Image ID, CID, and Encrypted AES Key for each image

### Receive Images

1. Click "Receive" tab
2. Enter Image ID, CID, and Encrypted AES Key
3. Click "Verify & Decrypt Images"
4. View decrypted images (verified from blockchain)

## 📊 API Endpoints

### POST `/api/upload`
Upload multiple encrypted images

**Request**: `multipart/form-data`
```javascript
FormData with 'images' field (multiple files)
```

**Response**:
```json
{
  "success": true,
  "files": [
    {
      "imageID": "1234567890",
      "cid": "Qm...",
      "encryptedAESKey": "...",
      "originalName": "image.jpg",
      "size": 1024000
    }
  ]
}
```

### POST `/api/receive`
Verify and decrypt image

**Request**:
```json
{
  "imageID": "1234567890",
  "cid": "Qm...",
  "encryptedAESKey": "..."
}
```

**Response**: Decrypted image file

### GET `/api/events`
Get all blockchain events

## 🔧 Technical Details

### Encryption Flow

1. **Image Encryption**: AES-256-CBC with permanent key
2. **Key Encryption**: RSA-2048 OAEP encryption of AES key
3. **IPFS Storage**: Upload encrypted file, receive CID
4. **Blockchain**: Store CID immutably on smart contract
5. **Event Emission**: Contract emits `CIDStored` event

### Decryption Flow

1. **Blockchain Verification**: Retrieve CID from contract
2. **Tamper Check**: Compare provided CID with blockchain CID
3. **Key Decryption**: Decrypt AES key using RSA private key
4. **File Retrieval**: Download encrypted file from IPFS
5. **File Decryption**: Decrypt using AES key

### File Structure

```
medenc/
├── backend/
│   ├── server.js                 # Express server
│   ├── package.json              # Dependencies
│   ├── hardhat.config.js         # Hardhat configuration
│   ├── contracts/
│   │   └── ImageRegistry.sol     # Smart contract
│   ├── scripts/
│   │   └── deploy.js             # Deployment script
│   ├── routes/
│   │   └── fileRoutes.js         # API routes
│   ├── services/
│   │   ├── cryptoUtils.js        # Encryption services
│   │   └── ipfsService.js        # IPFS services
│   └── keys/                     # Generated keys (auto-created)
│
└── frontend/
    ├── package.json              # Dependencies
    ├── vite.config.js            # Vite configuration
    ├── tailwind.config.js        # Tailwind configuration
    ├── src/
    │   ├── App.jsx               # Main app component
    │   ├── main.jsx              # Entry point
    │   ├── index.css             # Global styles
    │   ├── pages/
    │   │   ├── UploadPage.jsx    # Upload interface
    │   │   └── ReceivePage.jsx   # Receive interface
    │   └── components/
    │       └── ImageGrid.jsx     # Image display grid
    └── index.html                # HTML template
```

## 🎯 Features

✅ Multiple image upload at once
✅ Hybrid encryption (AES + RSA)
✅ IPFS decentralized storage
✅ Blockchain tamper-proof verification
✅ Event emission on uploads
✅ Automatic CID verification
✅ Responsive UI with Tailwind CSS
✅ React Router navigation
✅ CommonJS backend (Node 18+ compatible)
✅ Permanent AES key (reused across uploads)
✅ Error handling for tampering detection

## 🛠️ Troubleshooting

**IPFS not running**:
```bash
ipfs daemon
```

**Hardhat network not running**:
```bash
cd backend
npx hardhat node
```

**Contract not deployed**:
```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost
```

**Update contract address**:
Edit `backend/routes/fileRoutes.js` line 24 with deployed contract address

## 📝 License

MIT

## 🎓 Academic Project

This is an educational project demonstrating hybrid cryptography, IPFS, and blockchain integration for secure image storage.

