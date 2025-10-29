# Troubleshooting Guide

## Common Issues and Solutions

### ❌ Error: "could not decode result data" / BAD_DATA

**Error Message:**
```
Verification error: Error: could not decode result data (value="0x", info={ "method": "getImageData", "signature": "getImageData(uint256)" }, code=BAD_DATA, version=6.15.0)
```

**Cause:**
This happens when you try to access images that were uploaded with the OLD contract structure (before adding encrypted key storage) or when the blockchain state doesn't match the uploaded data.

**When This Occurs:**
- You restart the Hardhat blockchain (it loses all data)
- You try to access old images after redeploying the contract
- Contract artifacts are out of sync with deployed contract

**Solution:**

#### Quick Fix - Use the Reset Script:
```bash
./reset-and-deploy.sh
```

#### Manual Fix:

1. **Stop Everything:**
   ```bash
   # Press Ctrl+C on all running terminals
   # - Hardhat node
   # - Backend server
   # - Frontend server
   ```

2. **Clean and Recompile:**
   ```bash
   cd backend
   rm -rf artifacts/ cache/
   npx hardhat compile
   ```

3. **Start Fresh Hardhat Node:**
   ```bash
   # In Terminal 1
   cd backend
   npx hardhat node
   ```

4. **Deploy Contract:**
   ```bash
   # In Terminal 2
   cd backend
   npx hardhat run scripts/deploy.js --network localhost
   
   # Note the contract address from output
   ```

5. **Update Contract Address:**
   ```bash
   # Edit backend/routes/fileRoutes.js
   # Line 22: const contractAddress = "YOUR_NEW_ADDRESS";
   ```

6. **Restart Backend:**
   ```bash
   cd backend
   npm start
   ```

7. **Upload Fresh Images:**
   - All old images are gone (blockchain restarted)
   - Upload new images through the UI
   - These will have the correct structure

---

## ⚠️ Blockchain Restarted - Found 0 Images

**What Happened:**
Hardhat's local blockchain runs in-memory. When you stop it, all data is lost.

**Logs Example:**
```
📋 Fetching all images
   Found 2 images
[Later, after restart]
📋 Fetching all images
   Found 0 images
```

**Solution:**
1. This is expected behavior for a development blockchain
2. Re-upload your test images
3. For persistent data, use:
   - Hardhat Network with persistence enabled
   - Local Ganache
   - Testnet (Sepolia, Goerli)
   - Mainnet (for production)

---

## 🔄 Cannot Connect to Blockchain

**Error:**
```
Get image error: connect ECONNREFUSED 127.0.0.1:8545
```

**Cause:**
Hardhat node is not running.

**Solution:**
```bash
# In a separate terminal
cd backend
npx hardhat node
```

Keep this terminal running while using the app.

---

## 📦 IPFS Connection Issues

**Error:**
```
Failed to upload to IPFS: connect ECONNREFUSED 127.0.0.1:5001
```

**Cause:**
IPFS daemon is not running.

**Solution:**
```bash
# Start IPFS daemon
ipfs daemon
```

Or install IPFS Desktop which runs automatically.

---

## 🔐 Verification Always Returns "Tampered"

**Symptom:**
Even legitimate files show as tampered.

**Possible Causes:**

1. **Wrong Image ID:**
   - Verify you're using the correct imageID
   - Check `/api/all-images` for valid IDs

2. **CID Mismatch:**
   - Make sure you're using the exact CID from the upload response
   - CIDs are case-sensitive

3. **Wrong Contract:**
   - Contract address in fileRoutes.js doesn't match deployed contract
   - Redeploy and update address

**Debug:**
```bash
# Check what's on blockchain
curl http://localhost:8000/api/all-images | jq

# Verify specific image
curl -X POST http://localhost:8000/api/verify-file \
  -H "Content-Type: application/json" \
  -d '{"imageID": "YOUR_ID", "cid": "YOUR_CID"}' | jq
```

---

## 📝 Contract Address Mismatch

**Symptoms:**
- "Image not found on blockchain"
- Empty responses
- Cannot upload

**Check:**
```bash
# In backend logs, look for:
📝 Contract: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

# This should match the address in:
# backend/routes/fileRoutes.js line 22
```

**Fix:**
Update the contract address in `backend/routes/fileRoutes.js` to match the deployed contract.

---

## 🚀 Starting Clean - Complete Reset

If you want to start completely fresh:

```bash
# 1. Stop all running processes (Ctrl+C)

# 2. Clean everything
cd backend
rm -rf artifacts/ cache/ node_modules/
cd ../frontend
rm -rf node_modules/

# 3. Reinstall dependencies
cd ../backend
npm install
cd ../frontend
npm install

# 4. Start Hardhat node
cd ../backend
npx hardhat node
# Keep this running

# 5. In new terminal, deploy contract
cd backend
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost

# 6. Update contract address in routes/fileRoutes.js

# 7. Start backend
npm start

# 8. In new terminal, start frontend
cd ../frontend
npm run dev

# 9. Upload fresh images and test
```

---

## 📊 Useful Debugging Commands

### Check Backend Health:
```bash
curl http://localhost:8000/health
```

### List All Images:
```bash
curl http://localhost:8000/api/all-images | jq
```

### Verify File:
```bash
curl -X POST http://localhost:8000/api/verify-file \
  -H "Content-Type: application/json" \
  -d '{"imageID": "123", "cid": "QmYour..."}' | jq
```

### Check Hardhat Network:
```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Check IPFS:
```bash
curl http://localhost:5001/api/v0/version
```

---

## 💡 Best Practices

1. **Keep Terminals Organized:**
   - Terminal 1: Hardhat node (always running)
   - Terminal 2: Backend server
   - Terminal 3: Frontend dev server
   - Terminal 4: IPFS daemon
   - Terminal 5: Testing/commands

2. **After Restarting Hardhat:**
   - Always redeploy contract
   - Update contract address
   - Restart backend
   - Re-upload test images

3. **Before Testing Tamper Detection:**
   - Ensure you have at least one uploaded image
   - Note the imageID and CID
   - Use `./test-tamper-detection.sh` for automated tests

4. **For Persistent Development:**
   - Consider using Hardhat's persistence feature
   - Or use a testnet for longer-term testing
   - Document your contract addresses

---

## 🆘 Still Having Issues?

Check these files are present and correct:
```bash
backend/
├── artifacts/contracts/ImageRegistry.sol/ImageRegistry.json ✓
├── routes/fileRoutes.js (correct contract address) ✓
├── contracts/ImageRegistry.sol ✓
└── keys/
    ├── rsa-private.pem ✓
    └── rsa-public.pem ✓
```

Check logs for specific errors and search for the error message in this guide.

---

**Quick Reference:**
- Reset script: `./reset-and-deploy.sh`
- Test tamper detection: `./test-tamper-detection.sh`
- API docs: `TAMPER_DETECTION_TEST.md`
- Implementation details: `IMPLEMENTATION_CHANGES.md`

