// backend/services/ipfsService.js
const axios = require('axios');
const FormData = require('form-data');

// IPFS HTTP API endpoint
const IPFS_API = 'http://localhost:5001/api/v0';

/**
 * Note: Using direct HTTP requests to IPFS instead of ipfs-http-client
 * to avoid Node.js 18+ duplex errors with the official client
 */

/**
 * Upload file buffer to IPFS using direct HTTP API
 * @param {Buffer} fileBuffer - Encrypted file data
 * @returns {Promise<string>} CID (Content Identifier)
 */
async function uploadToIPFS(fileBuffer) {
  try {
    console.log(`📤 Uploading ${fileBuffer.length} bytes to IPFS...`);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: 'encrypted-image',
      contentType: 'application/octet-stream'
    });
    
    // Upload to IPFS using HTTP API
    const response = await axios.post(`${IPFS_API}/add`, formData, {
      headers: {
        ...formData.getHeaders()
      },
      params: {
        pin: 'true', // Pin the file
        'wrap-with-directory': 'false'
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });
    
    const cid = response.data.Hash;
    console.log(`✅ File uploaded to IPFS: ${cid}`);
    return cid;
  } catch (error) {
    console.error('❌ IPFS upload error:', error.message);
    if (error.response) {
      console.error('   Response data:', error.response.data);
    }
    throw new Error(`Failed to upload to IPFS: ${error.message}`);
  }
}

/**
 * Retrieve file from IPFS using CID with direct HTTP API
 * @param {string} cid - Content Identifier
 * @returns {Promise<Buffer>} File data
 */
async function getFromIPFS(cid) {
  try {
    console.log(`📥 Fetching file from IPFS: ${cid}`);
    
    // Get file from IPFS using HTTP API (POST request with CID as query param)
    const response = await axios.post(`${IPFS_API}/cat?arg=${cid}`, null, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    const fileBuffer = Buffer.from(response.data);
    console.log(`✅ Retrieved ${fileBuffer.length} bytes from IPFS`);
    return fileBuffer;
  } catch (error) {
    console.error('❌ IPFS retrieval error:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data?.toString().substring(0, 200));
    }
    throw new Error(`Failed to retrieve from IPFS: ${error.message}`);
  }
}

/**
 * Test IPFS connection using direct HTTP API
 * @returns {Promise<boolean>} Connection status
 */
async function testIPFSConnection() {
  try {
    const response = await axios.post(`${IPFS_API}/version`);
    console.log(`✅ IPFS connection successful (version: ${response.data.Version})`);
    return true;
  } catch (error) {
    console.error('❌ IPFS connection failed:', error.message);
    return false;
  }
}

module.exports = { 
  uploadToIPFS, 
  getFromIPFS,
  testIPFSConnection
};
