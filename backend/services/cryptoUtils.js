// backend/services/cryptoUtils.js
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const keysDir = path.join(__dirname, '../keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

/**
 * Load or create RSA key pair for encrypting/decrypting AES keys
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
  
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  
  fs.writeFileSync(rsaPubPath, publicKey);
  fs.writeFileSync(rsaPrivPath, privateKey);
  
  console.log('✅ RSA key pair created');
  return { publicKey, privateKey };
}

const RSA = loadOrCreateRSA();

/**
 * Encrypt file with unique AES-256-CBC key
 * @param {Buffer} buffer - File data to encrypt
 * @returns {Object} { encryptedData, key, iv }
 */
function encryptFile(buffer) {
  const key = crypto.randomBytes(32); 
  const iv = crypto.randomBytes(16);  
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encryptedData = Buffer.concat([cipher.update(buffer), cipher.final()]);
  
  return { encryptedData, key, iv };
}

/**
 * Decrypt file using provided AES key and IV
 * @param {Buffer} buffer - Encrypted data
 * @param {Buffer} key - AES key
 * @param {Buffer} iv - Initialization vector
 * @returns {Buffer} Decrypted file data
 */
function decryptFile(buffer, key, iv) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(buffer), decipher.final()]);
}

/**
 * Encrypt AES key and IV using RSA public key
 * @param {Buffer} key - AES key
 * @param {Buffer} iv - Initialization vector
 * @returns {string} Base64 encoded encrypted data
 */
function encryptAESKey(key, iv) {
  const combined = Buffer.concat([key, iv]); // 32 + 16 = 48 bytes
  const encrypted = crypto.publicEncrypt(
    {
      key: RSA.publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    combined
  );
  return encrypted.toString('base64');
}

/**
 * Decrypt AES key and IV using RSA private key
 * @param {string} encryptedKey - Base64 encoded encrypted key+IV
 * @returns {Object} { key, iv }
 */
function decryptAESKey(encryptedKey) {
  const buf = Buffer.from(encryptedKey, 'base64');
  const decrypted = crypto.privateDecrypt(
    {
      key: RSA.privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    buf
  );
  
  return {
    key: decrypted.slice(0, 32),
    iv: decrypted.slice(32, 48)
  };
}

module.exports = { 
  encryptFile, 
  decryptFile, 
  encryptAESKey, 
  decryptAESKey
};
