const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const BIN_ID = "69cbcdc8aaba882197af4bcc";
const MASTER_KEY = "$2a$10$go25lr52o.r3GKWOrNSUiO6Gdv52kcAcNS56vMiiIhlM5yX3X2ON6";
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// Endpoint Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const response = await axios.get(BASE_URL, { headers: { "X-Master-Key": MASTER_KEY } });
        const db = response.data.record;
        const user = db.users[username];
        
        if (user && user.password === password) {
            res.json({ status: true, balance: user.balance });
        } else {
            res.json({ status: false, msg: "Username/Password Salah" });
        }
    } catch (e) {
        res.status(500).json({ status: false, msg: "JSONBin Error" });
    }
});

// Endpoint Terima OTP
app.post('/api/receive-otp', async (req, res) => {
    const { otp } = req.body;
    try {
        const response = await axios.get(BASE_URL, { headers: { "X-Master-Key": MASTER_KEY } });
        let db = response.data.record;
        db.server.latest_otp = { code: otp, timestamp: Date.now() };
        
        await axios.put(BASE_URL, db, {
            headers: { "Content-Type": "application/json", "X-Master-Key": MASTER_KEY }
        });
        res.json({ status: true });
    } catch (e) { res.status(500).json({ status: false }); }
});

module.exports = app;
