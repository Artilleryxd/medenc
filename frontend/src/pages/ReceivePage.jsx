// frontend/src/pages/ReceivePage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export default function ReceivePage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [decryptedImages, setDecryptedImages] = useState({});
  const [decryptingIds, setDecryptingIds] = useState(new Set());

  // Fetch all images from blockchain on component mount
  useEffect(() => {
    fetchAllImages();
  }, []);

  const fetchAllImages = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('📋 Fetching all images from blockchain...');
      const res = await axios.get(`${API_BASE_URL}/all-images`);
      
      if (res.data.success) {
        console.log(`✅ Found ${res.data.count} images`);
        setImages(res.data.images);
        
        if (res.data.count === 0) {
          setError('No images found. Upload some images first!');
        }
      }
    } catch (err) {
      console.error('Failed to fetch images:', err);
      setError('Failed to fetch images from blockchain: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDecryptImage = async (image) => {
    const imageID = image.imageID;
    
    // Mark this image as decrypting
    setDecryptingIds(prev => new Set(prev).add(imageID));
    setError('');
    
    try {
      console.log(`🔓 Decrypting image ${imageID}...`);
      
      // Call simplified endpoint that gets image by ID and CID
      const res = await axios.get(`${API_BASE_URL}/get-image/${imageID}/${image.cid}`, {
        responseType: 'blob',
      });
      
      // Create object URL from the blob
      const imageUrl = URL.createObjectURL(res.data);
      
      setDecryptedImages(prev => ({
        ...prev,
        [imageID]: imageUrl
      }));
      
      console.log(`✅ Image ${imageID} decrypted successfully`);
      
    } catch (err) {
      console.error(`Failed to decrypt image ${imageID}:`, err);
      setError(`Failed to decrypt image ${imageID}: ${err.response?.data?.error || err.message}`);
    } finally {
      setDecryptingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageID);
        return newSet;
      });
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleString();
  };

  const shortenHash = (hash) => {
    return hash ? `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}` : '';
  };

  if (loading && images.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading images from blockchain...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold text-gray-800">
          All Uploaded Images
        </h2>
        <button
          onClick={fetchAllImages}
          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors duration-200 flex items-center gap-2"
          disabled={loading}
        >
          <span>🔄</span>
          <span>Refresh</span>
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {images.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-xl">No images found on blockchain</p>
          <p className="mt-2">Upload some images first!</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <div key={image.imageID} className="bg-gray-50 p-5 rounded-lg shadow-sm border border-gray-200">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Image ID: {image.imageID}
              </h3>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600 font-medium">CID:</span>
                  <p className="font-mono text-xs text-gray-800 break-all">{shortenHash(image.cid)}</p>
                </div>
                
                <div>
                  <span className="text-gray-600 font-medium">Uploader:</span>
                  <p className="font-mono text-xs text-gray-800">{shortenHash(image.uploader)}</p>
                </div>
                
                <div>
                  <span className="text-gray-600 font-medium">Uploaded:</span>
                  <p className="text-xs text-gray-800">{formatTimestamp(image.timestamp)}</p>
                </div>
                
                <div>
                  <span className="text-gray-600 font-medium">Tx Hash:</span>
                  <p className="font-mono text-xs text-gray-800">{shortenHash(image.transactionHash)}</p>
                </div>
              </div>
            </div>
            
            {decryptedImages[image.imageID] ? (
              <div className="mb-4">
                <img 
                  src={decryptedImages[image.imageID]} 
                  alt={`Image ${image.imageID}`} 
                  className="w-full h-48 object-contain rounded-md border border-gray-200 bg-white"
                />
              </div>
            ) : (
              <div className="h-48 bg-gray-200 rounded-md mb-4 flex items-center justify-center">
                <span className="text-gray-500">🔒 Encrypted</span>
              </div>
            )}
            
            <button
              onClick={() => handleDecryptImage(image)}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={decryptingIds.has(image.imageID) || decryptedImages[image.imageID]}
            >
              {decryptingIds.has(image.imageID) ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Decrypting...
                </span>
              ) : decryptedImages[image.imageID] ? (
                '✅ Decrypted'
              ) : (
                '🔓 Decrypt & View'
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
