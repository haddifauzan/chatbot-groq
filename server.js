import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import chatHandler from './api/chat.js';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend files
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.post('/api/chat', (req, res) => chatHandler(req, res));

// Start local server
app.listen(PORT, () => {
    console.log(`\n🚀 ChatterBot Local Server running at http://localhost:${PORT}`);
    console.log(`🔑 GROQ_API_KEY status: ${process.env.GROQ_API_KEY ? 'Loaded ✅' : 'Missing ⚠️ (Check your .env file)'}\n`);
});
