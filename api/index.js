const express = require('express');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const app = express();

app.use(express.json());

const JSON_BIN_ID = "69cbcdc8aaba882197af4bcc";
const MASTER_KEY = "$2a$10$go25lr52o.r3GKWOrNSUiO6Gdv52kcAcNS56vMiiIhlM5yX3X2ON6";

// Fungsi Helper Ambil Data
async function getDb() {
    const res = await axios.get(`https://api.jsonbin.io/v3/b/${JSON_BIN_ID}`, {
        headers: { 'X-Master-Key': MASTER_KEY }
    });
    return res.data.record.users;
}

// 1. ENDPOINT UNTUK DEVELOPER (Public)
// Method: POST | URL: /api/otp
app.post('/api/otp', async (req, res) => {
    const { apikey, number, message } = req.body;
    const users = await getDb();
    
    // Validasi API Key
    const user = users.find(u => u.apikey === apikey);
    if (!user) return res.status(401).json({ status: false, msg: "Invalid API Key" });

    try {
        // Teruskan ke Termux milik user tersebut
        const target = `${user.termux_url}/send`;
        await axios.post(target, { number, message });
        
        res.json({ status: true, msg: "OTP Sent Successfully" });
    } catch (e) {
        res.status(500).json({ status: false, msg: "Termux Offline" });
    }
});

// 2. ENDPOINT LOGIN DASHBOARD
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const users = await getDb();
    const user = users.find(u => u.username === username);

    if (user && bcrypt.compareSync(password, user.password)) {
        res.json({ success: true, apikey: user.apikey });
    } else {
        res.status(401).json({ success: false });
    }
});

module.exports = app;
