// backend/routes/fileRoutes.js
const express = require('express');
const multer = require('multer');
const { ethers } = require('ethers');
const { encryptFile, decryptFile, encryptAESKey, decryptAESKey } = require('../services/cryptoUtils');
const { uploadToIPFS, getFromIPFS } = require('../services/ipfsService');
const ImageRegistry = require('../artifacts/contracts/ImageRegistry.sol/ImageRegistry.json');

const router = express.Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 10 }
});

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
let contract;

async function initBlockchain() {
  try {
    const signer = await provider.getSigner(0);
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    
    contract = new ethers.Contract(contractAddress, ImageRegistry.abi, signer);
    
    console.log('✅ Blockchain connected');
    console.log(`📝 Contract: ${contractAddress}`);
    console.log(`👤 Signer: ${await signer.getAddress()}`);
  } catch (error) {
    console.error('❌ Blockchain init error:', error);
  }
}

initBlockchain();

/**
 * POST /api/upload
 * Encrypt images, upload to IPFS, store CID and encrypted key on blockchain
 */
router.post('/upload', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    console.log(`📤 Uploading ${req.files.length} files`);
    const uploadResults = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const imageID = Date.now() + i;
      
      console.log(`🔐 ${file.originalname} (ID: ${imageID})`);
      
      // Encrypt with unique key
      const { encryptedData, key, iv } = encryptFile(file.buffer);
      console.log(`   ✅ Encrypted: ${encryptedData.length} bytes`);
      
      // Upload to IPFS
      const cid = await uploadToIPFS(encryptedData);
      console.log(`   ✅ IPFS: ${cid}`);
      
      // Encrypt the AES key+IV with RSA
      const encryptedKey = encryptAESKey(key, iv);
      
      // Store on blockchain
      const tx = await contract.storeCID(imageID, cid, encryptedKey);
      await tx.wait();
      console.log(`   ✅ Blockchain: ${tx.hash}`);
      
      uploadResults.push({
        imageID: imageID.toString(),
        cid,
        encryptedAESKey: encryptedKey,
        originalName: file.originalname,
        size: file.size,
        transactionHash: tx.hash
      });
    }

    console.log(`✨ ${uploadResults.length} files uploaded\n`);
    
    res.json({
      success: true,
      message: `Successfully uploaded ${uploadResults.length} image(s)`,
      files: uploadResults
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', message: error.message });
  }
});

/**
 * GET /api/get-image/:imageID/:cid
 * Fetch, verify, and decrypt image
 */
router.get('/get-image/:imageID/:cid', async (req, res) => {
  try {
    const { imageID, cid } = req.params;
    console.log(`🔍 Decrypting image ${imageID}`);
    
    // Get CID and encrypted key from blockchain
    const [storedCID, encryptedKey] = await contract.getImageData(imageID);
    
    if (!storedCID || storedCID === '') {
      return res.status(404).json({ error: 'Image not found on blockchain' });
    }
    
    // Verify CID to detect tampering
    if (storedCID !== cid) {
      console.warn(`⚠️  CID mismatch: ${storedCID} vs ${cid}`);
      return res.status(400).json({ error: 'File tampered! CID mismatch' });
    }
    
    console.log(`   ✅ CID verified`);
    
    // Decrypt the AES key
    const { key, iv } = decryptAESKey(encryptedKey);
    
    // Get encrypted file from IPFS
    const encryptedFile = await getFromIPFS(cid);
    console.log(`   ✅ Retrieved from IPFS: ${encryptedFile.length} bytes`);
    
    // Decrypt the file
    const decryptedFile = decryptFile(encryptedFile, key, iv);
    console.log(`   ✅ Decrypted: ${decryptedFile.length} bytes\n`);
    
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Disposition': `inline; filename="image-${imageID}.jpg"`,
      'Cache-Control': 'no-cache'
    });
    res.send(decryptedFile);
    
  } catch (error) {
    console.error('Get image error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/verify-file
 * Verify if a file has been tampered by checking CID against blockchain
 * Request body: { imageID, cid }
 */
router.post('/verify-file', async (req, res) => {
  try {
    const { imageID, cid } = req.body;
    
    if (!imageID || !cid) {
      return res.status(400).json({ 
        error: 'Missing required fields: imageID and cid' 
      });
    }
    
    console.log(`🔍 Verifying file integrity for image ${imageID}`);
    console.log(`   Provided CID: ${cid}`);
    
    // Get stored CID from blockchain
    const [storedCID] = await contract.getImageData(imageID);
    
    if (!storedCID || storedCID === '') {
      console.log(`   ❌ Image ${imageID} not found on blockchain`);
      return res.status(404).json({ 
        error: 'Image not found on blockchain',
        imageID,
        tampered: null
      });
    }
    
    console.log(`   Blockchain CID: ${storedCID}`);
    
    // Check if CIDs match
    const isTampered = storedCID !== cid;
    
    if (isTampered) {
      console.log(`   ⚠️  TAMPERING DETECTED!`);
      console.log(`   CID mismatch detected for image ${imageID}\n`);
      
      return res.json({
        success: true,
        tampered: true,
        message: 'File tampering detected! CID mismatch.',
        imageID,
        providedCID: cid,
        blockchainCID: storedCID,
        recommendation: 'Do not trust this file. It has been modified after upload.'
      });
    } else {
      console.log(`   ✅ File integrity verified - No tampering detected\n`);
      
      return res.json({
        success: true,
        tampered: false,
        message: 'File integrity verified. No tampering detected.',
        imageID,
        cid: storedCID
      });
    }
    
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ 
      error: 'Verification failed', 
      message: error.message 
    });
  }
});

/**
 * GET /api/all-images
 * Get all uploaded images from blockchain
 */
router.get('/all-images', async (req, res) => {
  try {
    console.log('📋 Fetching all images');
    
    const filter = contract.filters.CIDStored();
    const events = await contract.queryFilter(filter);
    
    const images = events.map(event => ({
      imageID: event.args.imageID.toString(),
      cid: event.args.cid,
      uploader: event.args.uploader,
      timestamp: event.args.timestamp.toString(),
      transactionHash: event.transactionHash
    }));
    
    console.log(`   Found ${images.length} images\n`);
    
    res.json({ success: true, count: images.length, images });
    
  } catch (error) {
    console.error('Failed to fetch images:', error);
    res.status(500).json({ error: 'Failed to fetch images', message: error.message });
  }
});

module.exports = router;
