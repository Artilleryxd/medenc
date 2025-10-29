import React, { useState } from 'react';

export default function ImageGrid({ images }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyToClipboard = (text, index, field) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(`${index}-${field}`);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const CopyButton = ({ text, index, field, label }) => (
    <button
      onClick={() => copyToClipboard(text, index, field)}
      className="ml-2 text-blue-600 hover:text-blue-800 text-xs"
      title={`Copy ${label}`}
    >
      {copiedIndex === `${index}-${field}` ? '✓ Copied!' : '📋 Copy'}
    </button>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {images.map((img, index) => (
        <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-br from-blue-100 to-purple-100 h-48 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-sm text-gray-600 mt-2">Encrypted & Stored</p>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-700">📄 {img.originalName}</p>
              <p className="text-xs text-gray-500">Size: {(img.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>

            <div className="bg-gray-50 p-2 rounded">
              <p className="text-xs text-gray-600 font-semibold mb-1">Image ID:</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-mono text-gray-800 break-all">{img.imageID}</p>
                <CopyButton text={img.imageID} index={index} field="id" label="Image ID" />
              </div>
            </div>

            <div className="bg-gray-50 p-2 rounded">
              <p className="text-xs text-gray-600 font-semibold mb-1">IPFS CID:</p>
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono text-gray-800 break-all">{img.cid.substring(0, 30)}...</p>
                <CopyButton text={img.cid} index={index} field="cid" label="CID" />
              </div>
            </div>

            <div className="bg-gray-50 p-2 rounded">
              <p className="text-xs text-gray-600 font-semibold mb-1">Encrypted AES Key:</p>
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono text-gray-800 break-all">{img.encryptedAESKey.substring(0, 30)}...</p>
                <CopyButton text={img.encryptedAESKey} index={index} field="key" label="AES Key" />
              </div>
            </div>

            <div className="pt-2 border-t flex items-center justify-between">
              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Uploaded
              </span>
              <span className="text-xs text-gray-500">🔐 Unique Key</span>
            </div>

            {img.transactionHash && (
              <p className="text-xs text-gray-500">TX: {img.transactionHash.substring(0, 15)}...</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
