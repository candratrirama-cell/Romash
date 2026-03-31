const admin = require("firebase-admin");
const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());

// --- CONFIG ---
const HOKTO_KEY = "91b24c8aeb3d364a80742a847797553b";
const serviceAccount = require("../serviceAccountKey.json");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://my-apibase-default-rtdb.asia-southeast1.firebasedatabase.app/"
    });
}
const db = admin.database();

// [ENDPOINT 1] Terima OTP dari Termux
app.post('/api/receive-otp', async (req, res) => {
    const { otp } = req.body;
    await db.ref('server/latest_otp').set({ code: otp, timestamp: Date.now() });
    res.json({ status: true });
});

// [ENDPOINT 2] Ambil Saldo & Data User
app.get('/api/user/:userId', async (req, res) => {
    const snap = await db.ref(`users/${req.params.userId}`).get();
    res.json(snap.val() || { balance: 0 });
});

// [ENDPOINT 3] Create QRIS (Top Up)
app.post('/api/order', async (req, res) => {
    const { userId, amount } = req.body;
    const inv = "otp" + Date.now();
    try {
        const response = await axios.post("https://hokto.my.id/produksi/payment/?api=create_qris", 
            { amount, partnerReferenceNo: inv }, 
            { headers: { 'X-API-KEY': HOKTO_KEY } }
        );
        await db.ref(`transactions/${inv}`).set({ userId, amount, status: 'PENDING' });
        res.json({ status: true, inv, qr: response.data });
    } catch (e) { res.json({ status: false }); }
});

// [ENDPOINT 4] Ambil OTP (Bayar Rp 10)
app.get('/api/get-otp', async (req, res) => {
    const { userId } = req.query;
    const [userSnap, otpSnap] = await Promise.all([
        db.ref(`users/${userId}`).get(),
        db.ref('server/latest_otp').get()
    ]);

    const balance = userSnap.val()?.balance || 0;
    if (balance < 10) return res.json({ status: false, msg: "Saldo Kurang" });

    if (otpSnap.exists() && (Date.now() - otpSnap.val().timestamp < 300000)) {
        await db.ref(`users/${userId}`).update({ balance: balance - 10 });
        res.json({ status: true, otp: otpSnap.val().code });
    } else {
        res.json({ status: false, msg: "OTP Belum Masuk" });
    }
});

module.exports = app;
