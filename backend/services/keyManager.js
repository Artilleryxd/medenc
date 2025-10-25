// backend/services/keyManager.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const keysDir = path.join(__dirname, '../keys');
if (!fs.existsSync(keysDir)) fs.mkdirSync(keysDir);

const aesPath = path.join(keysDir, 'aes-key.json');
const rsaPubPath = path.join(keysDir, 'rsa-public.pem');
const rsaPrivPath = path.join(keysDir, 'rsa-private.pem');

function loadOrCreateAES() {
  if (fs.existsSync(aesPath)) {
    const { key, iv } = JSON.parse(fs.readFileSync(aesPath, 'utf-8'));
    return { key: Buffer.from(key, 'hex'), iv: Buffer.from(iv, 'hex') };
  }
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  fs.writeFileSync(aesPath, JSON.stringify({ key: key.toString('hex'), iv: iv.toString('hex') }));
  return { key, iv };
}

function loadOrCreateRSA() {
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
  return { publicKey, privateKey };
}

const AES = loadOrCreateAES();
const RSA = loadOrCreateRSA();

module.exports = { AES, RSA };
