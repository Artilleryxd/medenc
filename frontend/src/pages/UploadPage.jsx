// frontend/src/pages/UploadPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import ImageGrid from '../components/ImageGrid';

const API_BASE_URL = 'http://localhost:5000/api';

export default function UploadPage() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(files);
    setError(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Create FormData for multiple file upload
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      console.log(`Uploading ${selectedFiles.length} file(s)...`);

      // Upload to backend
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      });

      console.log('Upload successful:', response.data);

      // Add uploaded images to state
      setUploadedImages([...uploadedImages, ...response.data.files]);
      
      // Clear selected files
      setSelectedFiles([]);
      
      // Show success message
      alert(`✅ Successfully uploaded ${response.data.files.length} image(s)!`);
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload & Encrypt Images
        </h2>

        {/* Drag & Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
          onClick={() => document.getElementById('fileInput').click()}
        >
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          
          <p className="text-gray-600 mb-2">
            Drag & drop images here, or click to select files
          </p>
          <p className="text-sm text-gray-400">
            {selectedFiles.length > 0
              ? `${selectedFiles.length} file(s) selected`
              : 'Supports: JPG, PNG, GIF (max 50MB per file)'}
          </p>
        </div>

        <input
          id="fileInput"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-2">Selected Files:</h3>
            <ul className="space-y-1">
              {selectedFiles.map((file, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            ❌ {error}
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={uploading || selectedFiles.length === 0}
          className={`mt-6 w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
            uploading || selectedFiles.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {uploading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Encrypting and uploading...
            </span>
          ) : (
            `🔐 Encrypt & Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`
          )}
        </button>
      </div>

      {/* Uploaded Images Grid */}
      {uploadedImages.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">
            Uploaded Images ({uploadedImages.length})
          </h3>
          <ImageGrid images={uploadedImages} />
        </div>
      )}
    </div>
  );
}
