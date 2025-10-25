import ipfs from './config/ipfs.js';
import all from 'it-all';

async function testIPFS() {
  try {
    const { cid } = await ipfs.add('Hello from IPFS 👋');
    console.log('✅ File added successfully: ', cid.toString());

    const data = Buffer.concat(await all(ipfs.cat(cid)));
    console.log('📦 Fetched content:', data.toString());
  } catch (error) {
    console.error('❌ IPFS error:', error);
  }
}

testIPFS();
