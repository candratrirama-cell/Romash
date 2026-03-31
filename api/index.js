const express = require('express');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const app = express();

app.use(express.json());

const JSON_BIN_ID = "69cbcdc8aaba882197af4bcc";
const MASTER_KEY = "$2a$10$go25lr52o.r3GKWOrNSUiO6Gdv52kcAcNS56vMiiIhlM5yX3X2ON6";

// Endpoint Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const response = await axios.get(`https://api.jsonbin.io/v3/b/${JSON_BIN_ID}`, {
            headers: { 'X-Master-Key': MASTER_KEY }
        });
        
        const userData = response.data.record.users.find(u => u.username === username);
        if (userData && bcrypt.compareSync(password, userData.password)) {
            res.json({ success: true, token: "AUTH_SUCCESS_SECRET" });
        } else {
            res.status(401).json({ success: false, message: "Invalid Credentials" });
        }
    } catch (e) {
        res.status(500).json({ error: "Database Error" });
    }
});

// Endpoint untuk Teruskan ke Termux
app.post('/api/send-otp', async (req, res) => {
    const { number, otp, termux_url } = req.body;
    try {
        // Meneruskan request ke alamat Termux (via Ngrok/Cloudflare)
        const result = await axios.post(`${termux_url}/send`, { number, otp });
        res.json(result.data);
    } catch (e) {
        res.status(500).json({ error: "Termux Offline atau URL Salah" });
    }
});

module.exports = app;
