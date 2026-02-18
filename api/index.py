import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq

app = Flask(__name__)
CORS(app)

# Daftar API Key Romash AI (Hanya user yang punya key ini yang bisa akses)
VALID_KEYS = ["romash1ai", "romash0ai", "romash5ai", "romash3ai", "romash4ai"]

# Inisialisasi Groq (Vercel bakal ambil dari Environment Variables)
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def home(path):
    return jsonify({
        "status": "Online",
        "bot": "Romash AI Gen 2",
        "creator": "@maramadhona",
        "message": "Gunakan endpoint /chat untuk mengobrol"
    })

@app.route('/chat', methods=['POST'])
def chat():
    # 1. Cek API Key dari Header
    user_key = request.headers.get('Authorization')
    if user_key not in VALID_KEYS:
        return jsonify({"error": "API Key Romash AI Salah!"}), 401

    # 2. Ambil pesan dari Body
    data = request.json
    if not data or "pesan" not in data:
        return jsonify({"error": "Format JSON salah, gunakan field 'pesan'"}), 400
    
    pesan_user = data.get("pesan")

    try:
        # 3. Proses ke Llama 3 via Groq
        completion = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {
                    "role": "system", 
                    "content": "Kamu adalah Romash AI Gen 2 buatan @maramadhona. Jawab dengan cerdas, gaul, dan singkat."
                },
                {"role": "user", "content": pesan_user}
            ]
        )
        
        jawaban = completion.choices[0].message.content
        
        return jsonify({
            "status": "success",
            "hasil": jawaban,
            "develop_by": "@maramadhona"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Wajib untuk Vercel
def handler(event, context):
    return app(event, context)
