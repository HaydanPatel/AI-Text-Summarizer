import os
import requests
import mysql.connector # Changed from pymongo
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv
from bs4 import BeautifulSoup
import docx
import PyPDF2
import io

# --- Setup ---
load_dotenv()
app = Flask(__name__)

# --- Database Connection (XAMPP/MySQL Method) ---
try:
    db = mysql.connector.connect(
        host=os.environ.get("DB_HOST"),
        user=os.environ.get("DB_USER"),
        password=os.environ.get("DB_PASSWORD"),
        database=os.environ.get("DB_NAME")
    )
    db_cursor = db.cursor(dictionary=True) # Use dictionary=True to get rows as dicts
    print("✅ MySQL Connection Successful!")
except mysql.connector.Error as err:
    print(f"❌ MySQL Connection Failed. Error: {err}")
    exit()

# --- Initialize Extensions ---
bcrypt = Bcrypt(app)
CORS(app)

# --- Helper Function for Hugging Face API ---
def query_huggingface(payload, model_name):
    API_URL = f"https://api-inference.huggingface.co/models/{model_name}"
    api_key = os.environ.get("HUGGINGFACE_API_KEY")
    if not api_key:
        raise RuntimeError("HUGGINGFACE_API_KEY not found in .env file.")
    
    headers = {"Authorization": f"Bearer {api_key}"}
    
    print(f"Querying model: {model_name}...")
    try:
        response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Hugging Face API Request Error: {e}")
        return {"error": "A network error occurred while contacting the AI model."}

# --- Text Extraction Helper Functions ---
def extract_text_from_file(file_storage):
    try:
        filename = file_storage.filename
        if filename.endswith('.docx'):
            doc = docx.Document(io.BytesIO(file_storage.read()))
            return "\n".join([para.text for para in doc.paragraphs])
        elif filename.endswith('.pdf'):
            reader = PyPDF2.PdfReader(io.BytesIO(file_storage.read()))
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            return text
        elif filename.endswith('.txt'):
            return file_storage.read().decode('utf-8')
    except Exception as e:
        print(f"Error extracting from file '{filename}': {e}")
    return None

# --- API ROUTES (Updated for MySQL) ---
@app.route("/api/signup", methods=['POST'])
def handle_signup():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"success": False, "message": "Missing required fields."}), 400
    
    # Check if user already exists
    db_cursor.execute("SELECT * FROM users WHERE email = %s", (data['email'],))
    existing_user = db_cursor.fetchone()
    
    if existing_user:
        return jsonify({"success": False, "message": "An account with this email already exists."}), 409
    
    # Insert new user
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    insert_query = "INSERT INTO users (username, email, password) VALUES (%s, %s, %s)"
    user_data = (data.get('username'), data['email'], hashed_password)
    db_cursor.execute(insert_query, user_data)
    db.commit() # Don't forget to commit the transaction!
    
    return jsonify({"success": True, "message": "Signup successful! You can now log in."})

@app.route("/api/login", methods=['POST'])
def handle_login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"success": False, "message": "Missing required fields."}), 400
    
    # Find the user
    db_cursor.execute("SELECT * FROM users WHERE email = %s", (data['email'],))
    user = db_cursor.fetchone()
    
    if user and bcrypt.check_password_hash(user['password'], data['password']):
        return jsonify({"success": True, "message": "Login successful!"})
        
    return jsonify({"success": False, "message": "Invalid email or password."}), 401

@app.route("/api/summarize", methods=['POST'])
def handle_summarize():
    print("\n--- Received /api/summarize request ---")
    try:
        text = request.form.get('text')
        file = request.files.get('file')
        
        input_text = ""
        if file and file.filename != '':
            print(f"Processing uploaded file: {file.filename}")
            input_text = extract_text_from_file(file)
        elif text:
            print("Processing text input...")
            input_text = text

        if not input_text or not input_text.strip():
            return jsonify({"success": False, "message": "Could not find or read any text from the provided source."}), 400

        target_format = request.form.get('format', 'paragraph')
        language = request.form.get('language', 'en')
        length = request.form.get('length', '2')

        length_map = {"1": (30, 80), "2": (80, 150), "3": (150, 300)}
        min_len, max_len = length_map.get(str(length), (80, 150))
        
        # 1. Summarization
        model_name = "facebook/bart-large-cnn"
        payload = {"inputs": input_text, "parameters": {"min_length": min_len, "max_length": max_len}}
        summary_response = query_huggingface(payload, model_name)
        
        print(f"Summarization response: {summary_response}")

        if isinstance(summary_response, dict) and summary_response.get('error'):
             if 'is currently loading' in summary_response.get('error', ''):
                return jsonify({"success": False, "message": "The AI model is starting up. Please try again in a moment."}), 503
             return jsonify({"success": False, "message": summary_response['error']}), 500

        if not (isinstance(summary_response, list) and summary_response and 'summary_text' in summary_response[0]):
             return jsonify({"success": False, "message": "Received an unexpected response from the AI model."}), 500

        summary = summary_response[0]['summary_text']
        
        # 2. Translation
        if language != "en":
            trans_model = f"Helsinki-NLP/opus-mt-en-{language}"
            trans_payload = {"inputs": summary}
            trans_response = query_huggingface(trans_payload, trans_model)
            if trans_response and isinstance(trans_response, list) and trans_response and 'translation_text' in trans_response[0]:
                summary = trans_response[0]['translation_text']
        
        # 3. Formatting
        if target_format == 'bullet_points':
            summary = "\n".join([f"• {sentence.strip()}" for sentence in summary.split('.') if sentence.strip()])
        elif target_format == 'one_liner':
            summary = summary.split('.')[0] + '.'
        elif target_format == 'academic':
            summary = f"An academic analysis of the provided text indicates that the central theme revolves around the following key points: {summary}"

        return jsonify({"success": True, "summary": summary, "keywords": ["AI", "Summary"]})

    except Exception as e:
        print(f"--- UNEXPECTED SERVER ERROR --- \n{e}")
        return jsonify({"success": False, "message": f"A server error occurred: {str(e)}"}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)