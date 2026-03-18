// Safejs/index.js - Created by @maramadhona
(function() {
    // 1. Langsung gembok layar biar putih (Anti-Scrape)
    document.documentElement.style.display = 'none';

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('gs_token');
    const ts = urlParams.get('ts');

    const now = Math.floor(Date.now() / 1000);
    // Kunci Rahasia: Harus sama dengan di verify.html
    const secretKey = btoa("MARA-SECURE-" + ts); 

    // 2. Cek apakah Token Valid & Masih Segar (60 Detik)
    if (token && ts && token === secretKey && (now - parseInt(ts)) < 60) {
        // LOLOS: Tampilkan isi web saat DOM siap
        window.addEventListener("DOMContentLoaded", () => {
            document.documentElement.style.display = 'block';
        });
    } else {
        // GAGAL: Titipkan alamat URL asal & lempar ke verify.html
        const currentUrl = btoa(window.location.href);
        window.location.href = "verify.html?from=" + currentUrl;
    }
})();
