// api/process.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, service, link, quantity } = req.body;
  const API_KEY = process.env.SMM_API_KEY; // Diambil dari environment variable Vercel
  const API_URL = 'https://hokto.my.id/produksi/smm/';

  // Menyiapkan data untuk dikirim ke API Hokto
  const params = new URLSearchParams();
  params.append('key', API_KEY);
  params.append('action', action);
  if (service) params.append('service', service);
  if (link) params.append('link', link);
  if (quantity) params.append('quantity', quantity);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: params,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
}
