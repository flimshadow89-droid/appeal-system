// ==========================================
// APPEAL SYSTEM - BACKEND SERVER
// Saves appeals as appeal1.js, appeal2.js, etc.
// WITH API KEY AUTHENTICATION + CORS FIX
// ==========================================

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// ⚠️ IMPORTANT: This must match the API_KEY in script.js
const API_KEY = 'ap-Je-48567nf-sl-476bdu84';

// ========== MIDDLEWARE (ORDER MATTERS!) ==========
// 1. CORS FIRST - must be before everything
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization'],
    exposedHeaders: ['Content-Type'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// 2. Parse JSON
app.use(express.json());

// 3. Log all requests (for debugging)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// API Key verification middleware
function verifyApiKey(req, res, next) {
    const providedKey = req.headers['x-api-key'];
    
    if (!providedKey) {
        return res.status(401).json({ 
            success: false, 
            message: 'API key is required' 
        });
    }
    
    if (providedKey !== API_KEY) {
        console.warn('⚠️ Invalid API key attempt:', providedKey);
        return res.status(403).json({ 
            success: false, 
            message: 'Invalid API key' 
        });
    }
    
    next();
}

// Create server-backend folder if it doesn't exist
const APPEALS_FOLDER = path.join(__dirname, 'server-backend');
if (!fs.existsSync(APPEALS_FOLDER)) {
    fs.mkdirSync(APPEALS_FOLDER);
    console.log('✅ Created server-backend folder');
}

// Health check endpoint (no auth needed)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Main appeal endpoint (WITH API KEY PROTECTION)
app.post('/api/appeal', verifyApiKey, (req, res) => {
    try {
        const appeal = req.body;
        
        // Validate required fields
        if (!appeal.username || !appeal.userId || !appeal.reason) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }

        // Find the next available appeal number
        let appealNumber = 1;
        let filePath;
        
        do {
            filePath = path.join(APPEALS_FOLDER, `appeal${appealNumber}.js`);
            appealNumber++;
        } while (fs.existsSync(filePath));

        // Format the data as a JavaScript module
        const fileContent = `// Appeal submitted on ${new Date().toLocaleString()}
module.exports = ${JSON.stringify(appeal, null, 2)};`;

        // Write the file
        fs.writeFileSync(filePath, fileContent, 'utf8');
        
        const fileName = path.basename(filePath);
        console.log(`✅ Appeal saved: ${fileName}`);
        console.log(`   User: ${appeal.username}`);
        console.log(`   Reason: ${appeal.reason.substring(0, 50)}...`);

        // Send success response
        res.json({ 
            success: true, 
            message: `Appeal saved as ${fileName}`,
            appealId: fileName.replace('.js', '')
        });

    } catch (error) {
        console.error('❌ Error saving appeal:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while saving appeal' 
        });
    }
});

// Optional: Get list of all appeals (WITH API KEY)
app.get('/api/appeals', verifyApiKey, (req, res) => {
    try {
        const files = fs.readdirSync(APPEALS_FOLDER)
            .filter(file => file.startsWith('appeal') && file.endsWith('.js'))
            .sort((a, b) => {
                const numA = parseInt(a.match(/\d+/)[0]);
                const numB = parseInt(b.match(/\d+/)[0]);
                return numA - numB;
            });

        res.json({ 
            success: true, 
            count: files.length,
            appeals: files 
        });
    } catch (error) {
        console.error('❌ Error listing appeals:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error reading appeals' 
        });
    }
});

// Optional: Get specific appeal (WITH API KEY)
app.get('/api/appeal/:id', verifyApiKey, (req, res) => {
    try {
        const appealId = req.params.id;
        const filePath = path.join(APPEALS_FOLDER, `${appealId}.js`);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ 
                success: false, 
                message: 'Appeal not found' 
            });
        }

        const appealData = require(filePath);
        res.json({ 
            success: true, 
            appeal: appealData 
        });
    } catch (error) {
        console.error('❌ Error reading appeal:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error reading appeal' 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 APPEAL SYSTEM SERVER RUNNING');
    console.log('='.repeat(50));
    console.log(`📡 Server URL: http://localhost:${PORT}`);
    console.log(`🔑 API Key: ${API_KEY}`);
    console.log(`📁 Appeals folder: ${APPEALS_FOLDER}`);
    console.log(`📋 Endpoints:`);
    console.log(`   POST   /api/appeal     - Submit new appeal (🔒 API Key Required)`);
    console.log(`   GET    /api/appeals    - List all appeals (🔒 API Key Required)`);
    console.log(`   GET    /api/appeal/:id - Get specific appeal (🔒 API Key Required)`);
    console.log(`   GET    /api/health     - Health check (No auth)`);
    console.log('='.repeat(50));
    console.log('✅ CORS enabled for all origins');
    console.log('='.repeat(50));
});