# Tamper Detection Testing Guide

## Overview
The `/api/verify-file` endpoint allows you to verify if a file's CID has been tampered with by comparing it against the blockchain-stored CID.

## New Endpoint

### POST /api/verify-file

**Purpose:** Verify file integrity by checking if the provided CID matches the blockchain record.

**Request Body:**
```json
{
  "imageID": "1761763672127",
  "cid": "QmYfNSWu38u3r1SjqqyJU2xiHh29YGyAe9JfJcwqm2Y9zv"
}
```

**Response (No Tampering):**
```json
{
  "success": true,
  "tampered": false,
  "message": "File integrity verified. No tampering detected.",
  "imageID": "1761763672127",
  "cid": "QmYfNSWu38u3r1SjqqyJU2xiHh29YGyAe9JfJcwqm2Y9zv"
}
```

**Response (Tampering Detected):**
```json
{
  "success": true,
  "tampered": true,
  "message": "File tampering detected! CID mismatch.",
  "imageID": "1761763672127",
  "providedCID": "QmFAKE_CID_HERE",
  "blockchainCID": "QmYfNSWu38u3r1SjqqyJU2xiHh29YGyAe9JfJcwqm2Y9zv",
  "recommendation": "Do not trust this file. It has been modified after upload."
}
```

## Testing Scenarios

### Scenario 1: Verify Legitimate File (No Tampering)

```bash
# Using curl
curl -X POST http://localhost:8000/api/verify-file \
  -H "Content-Type: application/json" \
  -d '{
    "imageID": "1761763672127",
    "cid": "QmYfNSWu38u3r1SjqqyJU2xiHh29YGyAe9JfJcwqm2Y9zv"
  }'
```

**Expected Result:**
- `tampered: false`
- Success message
- Returns the verified CID

### Scenario 2: Test with Tampered CID

```bash
# Using curl with a fake/modified CID
curl -X POST http://localhost:8000/api/verify-file \
  -H "Content-Type: application/json" \
  -d '{
    "imageID": "1761763672127",
    "cid": "QmFakeOrModifiedCID123456789"
  }'
```

**Expected Result:**
- `tampered: true`
- Warning message
- Shows both provided CID and blockchain CID
- Provides security recommendation

### Scenario 3: Test with Non-Existent Image

```bash
# Using curl with imageID that doesn't exist
curl -X POST http://localhost:8000/api/verify-file \
  -H "Content-Type: application/json" \
  -d '{
    "imageID": "9999999999",
    "cid": "QmSomeCID"
  }'
```

**Expected Result:**
- HTTP 404 status
- Error: "Image not found on blockchain"
- `tampered: null`

## JavaScript/Axios Example

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

async function verifyFileIntegrity(imageID, cid) {
  try {
    const response = await axios.post(`${API_BASE_URL}/verify-file`, {
      imageID,
      cid
    });
    
    if (response.data.tampered) {
      console.error('⚠️  TAMPERING DETECTED!');
      console.error('Provided CID:', response.data.providedCID);
      console.error('Blockchain CID:', response.data.blockchainCID);
      console.error('Recommendation:', response.data.recommendation);
      return false;
    } else {
      console.log('✅ File integrity verified');
      return true;
    }
  } catch (error) {
    console.error('Verification failed:', error.response?.data || error.message);
    return false;
  }
}

// Test with correct CID
await verifyFileIntegrity('1761763672127', 'QmYfNSWu38u3r1SjqqyJU2xiHh29YGyAe9JfJcwqm2Y9zv');

// Test with tampered CID
await verifyFileIntegrity('1761763672127', 'QmFakeCID');
```

## Step-by-Step Testing

### 1. Upload an Image

```bash
# First, upload an image to get imageID and CID
curl -X POST http://localhost:8000/api/upload \
  -F "images=@/path/to/image.jpg"
```

Note the `imageID` and `cid` from the response.

### 2. Verify with Correct CID

```bash
# Replace with actual values from step 1
curl -X POST http://localhost:8000/api/verify-file \
  -H "Content-Type: application/json" \
  -d '{
    "imageID": "YOUR_IMAGE_ID",
    "cid": "YOUR_ACTUAL_CID"
  }'
```

Expected: `"tampered": false`

### 3. Test Tampering Detection

```bash
# Use same imageID but modify the CID slightly
curl -X POST http://localhost:8000/api/verify-file \
  -H "Content-Type: application/json" \
  -d '{
    "imageID": "YOUR_IMAGE_ID",
    "cid": "QmFakeTamperedCID123"
  }'
```

Expected: `"tampered": true`

## Postman/Thunder Client Example

**Method:** POST  
**URL:** `http://localhost:8000/api/verify-file`  
**Headers:**
```
Content-Type: application/json
```
**Body (JSON):**
```json
{
  "imageID": "1761763672127",
  "cid": "QmYfNSWu38u3r1SjqqyJU2xiHh29YGyAe9JfJcwqm2Y9zv"
}
```

## Backend Logs

When you call the endpoint, you'll see logs like this:

**No Tampering:**
```
🔍 Verifying file integrity for image 1761763672127
   Provided CID: QmYfNSWu38u3r1SjqqyJU2xiHh29YGyAe9JfJcwqm2Y9zv
   Blockchain CID: QmYfNSWu38u3r1SjqqyJU2xiHh29YGyAe9JfJcwqm2Y9zv
   ✅ File integrity verified - No tampering detected
```

**Tampering Detected:**
```
🔍 Verifying file integrity for image 1761763672127
   Provided CID: QmFakeCID
   Blockchain CID: QmYfNSWu38u3r1SjqqyJU2xiHh29YGyAe9JfJcwqm2Y9zv
   ⚠️  TAMPERING DETECTED!
   CID mismatch detected for image 1761763672127
```

## Security Use Cases

### 1. **Pre-Download Verification**
Before downloading/decrypting a file, verify its integrity:
```javascript
const isValid = await verifyFileIntegrity(imageID, cid);
if (!isValid) {
  alert('⚠️ File has been tampered! Download blocked for your safety.');
  return;
}
// Proceed with download
```

### 2. **Periodic Integrity Checks**
Regularly verify files to detect tampering:
```javascript
async function auditAllFiles() {
  const images = await fetchAllImages();
  for (const img of images) {
    const result = await verifyFileIntegrity(img.imageID, img.cid);
    if (result.tampered) {
      console.error(`Compromised: Image ${img.imageID}`);
    }
  }
}
```

### 3. **Third-Party Verification**
Allow anyone to verify file authenticity:
```javascript
// User provides imageID and suspected CID
const verification = await verifyFileIntegrity(
  userProvidedImageID,
  userProvidedCID
);

if (verification.tampered) {
  // Show warning in UI
  // Display both CIDs for transparency
}
```

## Integration Example

### Add Verification to ReceivePage.jsx

```javascript
const verifyBeforeDecrypt = async (image) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/verify-file`, {
      imageID: image.imageID,
      cid: image.cid
    });
    
    if (response.data.tampered) {
      alert(`⚠️ TAMPERING DETECTED!\n\n` +
            `This file has been modified after upload.\n` +
            `Expected CID: ${response.data.blockchainCID}\n` +
            `Received CID: ${response.data.providedCID}\n\n` +
            `${response.data.recommendation}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Verification failed:', error);
    return false;
  }
};

const handleDecryptImage = async (image) => {
  // Verify integrity first
  const isValid = await verifyBeforeDecrypt(image);
  if (!isValid) {
    setError('File verification failed - tampering detected!');
    return;
  }
  
  // Proceed with decryption...
};
```

## Notes

- The verification endpoint is **read-only** - it doesn't modify any data
- It's **fast** - only queries the blockchain, no IPFS access needed
- Can be called **unlimited times** without affecting the file
- Useful for **demonstrating** the security features of your system
- The `/get-image` endpoint already includes this verification automatically

---

**Endpoint Summary:**  
✅ Route: `POST /api/verify-file`  
✅ Purpose: Detect file tampering via CID comparison  
✅ Returns: Detailed tampering status and recommendations  
✅ Use Case: Pre-download verification, security audits, third-party validation

