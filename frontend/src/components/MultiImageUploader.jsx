import React, { useState } from 'react';

export default function MultiImageUploader({ onUploadComplete }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFilesChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (files.length === 0) return alert("Select at least one file!");

    setLoading(true);
    const uploadedData = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imageID = `${Date.now()}-${i}`; // unique imageID

      const formData = new FormData();
      formData.append('image', file);
      formData.append('imageID', imageID);

      try {
        const res = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        uploadedData.push({ ...data, name: file.name });
      } catch (err) {
        console.error(err);
        alert(`Upload failed for ${file.name}`);
      }
    }

    onUploadComplete(uploadedData);
    setLoading(false);
  };

  return (
    <div className="p-4 bg-white shadow rounded-md">
      <input
        type="file"
        multiple
        onChange={handleFilesChange}
        className="mb-2"
      />
      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Uploading..." : "Upload All"}
      </button>
    </div>
  );
}
  