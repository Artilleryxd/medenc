// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import ReceivePage from './pages/ReceivePage';

function Navigation() {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path
      ? 'bg-blue-700'
      : 'hover:bg-blue-700';
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h1 className="text-2xl font-bold">Secure Image Storage</h1>
          </div>
          
          <div className="flex space-x-2">
            <Link
              to="/"
              className={`px-4 py-2 rounded transition-colors ${isActive('/')}`}
            >
              📤 Upload
            </Link>
            <Link
              to="/receive"
              className={`px-4 py-2 rounded transition-colors ${isActive('/receive')}`}
            >
              📥 Receive
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/receive" element={<ReceivePage />} />
          </Routes>
        </main>
        
        <footer className="bg-white border-t mt-12">
          <div className="container mx-auto px-4 py-6 text-center text-gray-600">
            <p className="text-sm">
              🔐 Hybrid Encryption • 📦 IPFS Storage • ⛓️ Blockchain Verified
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}
