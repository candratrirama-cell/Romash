export default async function handler(req, res) {
    // Hanya izinkan metode POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { action, service, link, quantity, order } = req.body;
    
    // Konfigurasi API Hokto
    const API_KEY = '6b856fd3530faabf97cdf6399c32682e';
    const API_URL = 'https://hokto.my.id/produksi/smm/';

    // Susun parameter untuk dikirim ke API pusat
    const params = new URLSearchParams();
    params.append('key', API_KEY);
    params.append('action', action);
    
    if (service) params.append('service', service);
    if (link) params.append('link', link);
    if (quantity) params.append('quantity', quantity);
    if (order) params.append('order', order);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: params,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'Kesalahan Koneksi API' });
    }
}
