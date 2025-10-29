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
  limits: {
    fileSize: 50 * 1024 * 1024, 
    files: 10 
  }
});

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
let contract;
let signer;

/**
 * Initialize blockchain connection
 * Get signer and contract instance
 */
async function initBlockchain() {
  try {

    signer = await provider.getSigner(0);
    

    const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    
    contract = new ethers.Contract(
      contractAddress,
      ImageRegistry.abi,
      signer
    );
    
    console.log('✅ Blockchain connected');
    console.log(`📝 Contract address: ${contractAddress}`);
    console.log(`👤 Signer address: ${await signer.getAddress()}`);
    
    return true;
  } catch (error) {
    console.error('❌ Blockchain initialization error:', error);
    return false;
  }
}

initBlockchain();

/**
 * POST /api/upload
 * Upload multiple images with encryption and IPFS storage
 * 
 * Request: multipart/form-data with multiple 'images' files
 * Response: Array of {imageID, cid, encryptedAESKey, originalName, size}
 */
router.post('/upload', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    console.log(`📤 Processing ${req.files.length} files`);
    
    const uploadResults = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      const imageID = Date.now() + i;
      
      console.log(`\n🔐 Processing: ${file.originalname} (ID: ${imageID})`);
      
      const encryptedFile = encryptFile(file.buffer);
      console.log(`   ✅ Encrypted: ${encryptedFile.length} bytes`);
      
      const cid = await uploadToIPFS(encryptedFile);
      console.log(`   ✅ IPFS CID: ${cid}`);
      
      const tx = await contract.storeCID(imageID, cid);
      await tx.wait(); 
      console.log(`   ✅ Blockchain: ${tx.hash}`);
      
      const encryptedAESKey = encryptAESKey();
      console.log(`   ✅ Encrypted AES key generated`);
      
      uploadResults.push({
        imageID: imageID.toString(),
        cid,
        encryptedAESKey,
        originalName: file.originalname,
        size: file.size,
        transactionHash: tx.hash
      });
    }

    console.log(`\n✨ Upload complete: ${uploadResults.length} files processed\n`);
    
    res.json({
      success: true,
      message: `Successfully uploaded ${uploadResults.length} image(s)`,
      files: uploadResults
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed', 
      message: error.message 
    });
  }
});

/**
 * POST /api/receive
 * Verify and decrypt image
 * 
 * Request body: { imageID, cid, encryptedAESKey }
 * Response: Decrypted image file
 */
router.post('/receive', async (req, res) => {
  try {
    const { imageID, cid, encryptedAESKey } = req.body;
    
    console.log(`\n📥 Receiving image ${imageID}`);
    
    // Validate input
    if (!imageID || !cid || !encryptedAESKey) {
      return res.status(400).json({ 
        error: 'Missing required fields: imageID, cid, or encryptedAESKey' 
      });
    }

    // 1. Verify CID from blockchain
    console.log(`   🔍 Verifying CID from blockchain...`);
    const storedCID = await contract.getCID(imageID);
    
    if (!storedCID || storedCID === '') {
      return res.status(404).json({ 
        error: 'Image not found on blockchain',
        imageID 
      });
    }
    
    // 2. Check for tampering
    if (storedCID !== cid) {
      console.log(`   ⚠️ Tampering detected!`);
      console.log(`   Expected CID: ${storedCID}`);
      console.log(`   Received CID: ${cid}`);
      return res.status(400).json({ 
        error: 'File tampering detected! CID mismatch',
        storedCID,
        providedCID: cid
      });
    }
    
    console.log(`   ✅ CID verified: ${storedCID}`);

    // 3. Decrypt AES key using RSA private key
    console.log(`   🔓 Decrypting AES key...`);
    decryptAESKey(encryptedAESKey); // Verify key can be decrypted
    
    // 4. Retrieve encrypted file from IPFS
    console.log(`   📥 Retrieving from IPFS...`);
    const encryptedFile = await getFromIPFS(cid);
    
    // 5. Decrypt file using AES key
    console.log(`   🔓 Decrypting file...`);
    const decryptedFile = decryptFile(encryptedFile);
    
    console.log(`   ✅ File decrypted: ${decryptedFile.length} bytes\n`);

    // 6. Send decrypted file
    res.set({
      'Content-Type': 'image/jpeg', // Default to JPEG, can be enhanced
      'Content-Disposition': `inline; filename="image-${imageID}.jpg"`,
      'Cache-Control': 'no-cache'
    });
    
    res.send(decryptedFile);
    
  } catch (error) {
    console.error('Receive error:', error);
    res.status(500).json({ 
      error: 'Failed to receive/decrypt image', 
      message: error.message 
    });
  }
});

/**
 * GET /api/images/:imageID
 * Get image metadata from blockchain
 */
router.get('/images/:imageID', async (req, res) => {
  try {
    const { imageID } = req.params;
    
    const cid = await contract.getCID(imageID);
    
    if (!cid || cid === '') {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    res.json({
      imageID,
      cid,
      message: 'Image found on blockchain'
    });
    
  } catch (error) {
    console.error('Get image error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/get-image/:imageID/:cid
 * Get encrypted image from IPFS with CID verification, decrypt and return
 * This endpoint verifies CID against blockchain to detect tampering
 */
router.get('/get-image/:imageID/:cid', async (req, res) => {
  try {
    const { imageID, cid } = req.params;
    console.log(`\n🔍 Fetching and decrypting image ${imageID}...`);
    
    // 1. Verify CID against blockchain
    const storedCID = await contract.getCID(imageID);
    
    if (!storedCID || storedCID === '') {
      console.error(`   ❌ Image ${imageID} not found on blockchain`);
      throw new Error(`Image ${imageID} not found on blockchain`);
    }
    
    if (storedCID !== cid) {
      console.warn(`   ⚠️  CID mismatch for image ${imageID}`);
      console.warn(`      Blockchain CID: ${storedCID}`);
      console.warn(`      Provided CID:   ${cid}`);
      throw new Error('File tampered! CID mismatch with blockchain record.');
    }
    
    console.log(`   ✅ CID verified against blockchain`);
    
    // 2. Get encrypted file from IPFS
    console.log(`   📥 Fetching encrypted file from IPFS...`);
    const encryptedFile = await getFromIPFS(cid);
    console.log(`   ✅ Retrieved ${encryptedFile.length} bytes from IPFS`);
    
    // 3. Decrypt the file using permanent AES key
    console.log(`   🔓 Decrypting file...`);
    const decryptedFile = decryptFile(encryptedFile);
    console.log(`   ✅ Decrypted ${decryptedFile.length} bytes`);
    
    console.log(`✅ Image ${imageID} successfully retrieved and decrypted\n`);
    
    // Send as image with proper headers
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Disposition': `inline; filename="image-${imageID}.jpg"`,
      'Cache-Control': 'no-cache'
    });
    res.send(decryptedFile);
    
  } catch (error) {
    console.error('❌ Get image error:', error.message);
    res.status(500).json({ 
      error: error.message,
      imageID: req.params.imageID
    });
  }
});

/**
 * GET /api/events
 * Get all CIDStored events from blockchain
 */
router.get('/events', async (req, res) => {
  try {
    // Query all CIDStored events
    const filter = contract.filters.CIDStored();
    const events = await contract.queryFilter(filter);
    
    const formattedEvents = events.map(event => ({
      imageID: event.args.imageID.toString(),
      cid: event.args.cid,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash
    }));
    
    res.json({
      success: true,
      count: formattedEvents.length,
      events: formattedEvents
    });
    
  } catch (error) {
    console.error('Events query error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/all-images
 * Get all uploaded images with their metadata from blockchain
 * Returns imageID and CID for each image
 */
router.get('/all-images', async (req, res) => {
  try {
    console.log('\n📋 Fetching all images from blockchain...');
    
    // Query all CIDStored events
    const filter = contract.filters.CIDStored();
    const events = await contract.queryFilter(filter);
    
    console.log(`   Found ${events.length} images`);
    
    // Format the response with all necessary data
    const images = events.map(event => ({
      imageID: event.args.imageID.toString(),
      cid: event.args.cid,
      uploader: event.args.uploader,
      timestamp: event.args.timestamp.toString(),
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash
    }));
    
    res.json({
      success: true,
      count: images.length,
      images: images
    });
    
  } catch (error) {
    console.error('Failed to fetch images:', error);
    res.status(500).json({ 
      error: 'Failed to fetch images',
      message: error.message 
    });
  }
});

module.exports = router;
