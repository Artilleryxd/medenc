#!/bin/bash
# Start Backend Server

echo "🛑 Stopping any existing backend processes..."
pkill -f "node.*server.js" 2>/dev/null
sleep 1

echo "🚀 Starting backend server..."
cd /home/artillery/Coding/medenc/backend
npm start &

echo "⏳ Waiting for backend to start..."
sleep 3

echo ""
echo "✅ Backend should now be running!"
echo "📍 Check status: curl http://localhost:5000/api/all-images"
echo "📋 View logs: tail -f backend logs or check the terminal"

