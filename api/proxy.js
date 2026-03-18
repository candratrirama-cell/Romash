export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { targetUrl, body } = req.body;

    try {
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G960F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Mobile Safari/537.36',
                'Referer': 'https://www.google.com/'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json().catch(() => ({ status: "No JSON response" }));
        res.status(200).json({ success: response.ok, data });
    } catch (error) {
        res.status(500).json({ error: "System Error", message: error.message });
    }
}
