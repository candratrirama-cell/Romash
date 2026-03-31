const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

// Izinkan akses dari browser (CORS)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

const HOKTO_KEY = "91b24c8aeb3d364a80742a847797553b";

// FIX ENDPOINT ORDER QRIS
app.post('/api/order', async (req, res) => {
    const { amount } = req.body;
    
    // Validasi minimal nominal Hokto biasanya 500 - 1000
    if (!amount || amount < 500) {
        return res.json({ status: false, msg: "Minimal Topup Rp 500" });
    }

    try {
        // Tembak API Hokto dengan format yang benar
        const response = await axios.get(`https://hokto.my.id/produksi/payment/?api=create_qris&amount=${amount}&apikey=${HOKTO_KEY}`);
        
        // Hokto biasanya mengembalikan data di response.data.result atau langsung data
        const resData = response.data;
        
        if (resData && (resData.qr_link || resData.qr_code)) {
            res.json({ 
                status: true, 
                qr: resData.qr_link || resData.qr_code, 
                msg: "QRIS Berhasil Dibuat" 
            });
        } else {
            res.json({ status: false, msg: "API Hokto tidak memberikan QR Link" });
        }
    } catch (e) {
        console.error("Hokto Error:", e.message);
        res.status(500).json({ status: false, msg: "Server Payment Down" });
    }
});

module.exports = app;
