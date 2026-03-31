const axios = require('axios');
const BIN_ID = "69cbcdc8aaba882197af4bcc";
const M_KEY = "$2a$10$go25lr52o.r3GKWOrNSUiO6Gdv52kcAcNS56vMiiIhlM5yX3X2ON6";

module.exports = async (req, res) => {
    const { apikey, number, otp } = req.body;
    try {
        const { data } = await axios.get(`https://api.jsonbin.io/v3/b/${BIN_ID}`, { headers: {'X-Master-Key': M_KEY} });
        const user = data.record.users.find(u => u.apikey === apikey);
        const termux = data.record.config.termux_url;

        if (!user || user.status !== 'active') return res.status(401).json({ status: false, msg: "API Key Invalid" });

        await axios.post(`${termux}/send`, { number, message: `[GoR 1.1] OTP: ${otp}` });
        res.json({ status: true, msg: "OTP Sent" });
    } catch (e) {
        res.status(500).json({ status: false, msg: "Termux Offline/Error" });
    }
};
