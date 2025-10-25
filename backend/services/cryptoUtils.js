// backend/services/cryptoUtils.js
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Key storage directory
const keysDir = path.join(__dirname, '../keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

/**
 * Load or create permanent AES key
 * This key is reused across all uploads for consistent encryption
 */
function loadOrCreateAES() {
  const aesPath = path.join(keysDir, 'aes-key.json');
  
  if (fs.existsSync(aesPath)) {
    const { key, iv } = JSON.parse(fs.readFileSync(aesPath, 'utf-8'));
    return { 
      key: Buffer.from(key, 'hex'), 
      iv: Buffer.from(iv, 'hex') 
    };
  }
  
  // Create new permanent AES key
  const key = crypto.randomBytes(32); // 256-bit key for AES-256
  const iv = crypto.randomBytes(16);  // 128-bit IV for CBC mode
  
  fs.writeFileSync(aesPath, JSON.stringify({ 
    key: key.toString('hex'), 
    iv: iv.toString('hex') 
  }));
  
  console.log('✅ New permanent AES key created');
  return { key, iv };
}

/**
 * Load or create RSA key pair
 * Used to encrypt/decrypt the AES key for secure transmission
 */
function loadOrCreateRSA() {
  const rsaPubPath = path.join(keysDir, 'rsa-public.pem');
  const rsaPrivPath = path.join(keysDir, 'rsa-private.pem');
  
  if (fs.existsSync(rsaPubPath) && fs.existsSync(rsaPrivPath)) {
    return {
      publicKey: fs.readFileSync(rsaPubPath, 'utf-8'),
      privateKey: fs.readFileSync(rsaPrivPath, 'utf-8'),
    };
  }
  
  // Generate new RSA key pair
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { 
      type: 'spki', 
      format: 'pem' 
    },
    privateKeyEncoding: { 
      type: 'pkcs8', 
      format: 'pem' 
    },
  });
  
  fs.writeFileSync(rsaPubPath, publicKey);
  fs.writeFileSync(rsaPrivPath, privateKey);
  
  console.log('✅ New RSA key pair created');
  return { publicKey, privateKey };
}

// Initialize keys
const AES = loadOrCreateAES();
const RSA = loadOrCreateRSA();

/**
 * Encrypt file buffer using AES-256-CBC
 * @param {Buffer} buffer - File data to encrypt
 * @returns {Buffer} Encrypted data
 */
function encryptFile(buffer) {
  const cipher = crypto.createCipheriv('aes-256-cbc', AES.key, AES.iv);
  return Buffer.concat([cipher.update(buffer), cipher.final()]);
}

/**
 * Decrypt file buffer using AES-256-CBC
 * @param {Buffer} buffer - Encrypted data
 * @returns {Buffer} Decrypted file data
 */
function decryptFile(buffer) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', AES.key, AES.iv);
  return Buffer.concat([decipher.update(buffer), decipher.final()]);
}

/**
 * Encrypt AES key using RSA public key
 * This allows the receiver to decrypt the AES key with their private key
 * @returns {string} Base64 encoded encrypted AES key
 */
function encryptAESKey() {
  const encryptedKey = crypto.publicEncrypt(
    {
      key: RSA.publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    AES.key
  );
  return encryptedKey.toString('base64');
}

/**
 * Decrypt AES key using RSA private key
 * @param {string} encryptedKey - Base64 encoded encrypted AES key
 * @returns {Buffer} Decrypted AES key
 */
function decryptAESKey(encryptedKey) {
  const buf = Buffer.from(encryptedKey, 'base64');
  return crypto.privateDecrypt(
    {
      key: RSA.privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    buf
  );
}

/**
 * Calculate SHA-256 hash of buffer for integrity verification
 * @param {Buffer} buffer - Data to hash
 * @returns {string} Hex encoded hash
 */
function calculateHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

module.exports = { 
  encryptFile, 
  decryptFile, 
  encryptAESKey, 
  decryptAESKey,
  calculateHash,
  AES,
  RSA
};
