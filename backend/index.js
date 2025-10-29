// backend/server.js
const express = require('express');
const cors = require('cors');
const fileRoutes = require('./routes/fileRoutes');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/api', fileRoutes);

app.listen(8000, () => console.log('🚀 Backend running on http://localhost:8000'));
