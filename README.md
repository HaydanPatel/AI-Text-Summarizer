# AI-Powered Text Summarization Web App

A full-stack web application that allows users to upload documents (DOCX, PDF, TXT) and receive summaries or translations using Hugging Face models. The backend is built with Flask and handles user authentication with bcrypt and a MySQL database.

---

### **Features**

* **User Management:** Secure user registration and login with bcrypt password hashing.
* **File Uploads:** Supports `.docx`, `.pdf`, and `.txt` file formats for text extraction.
* **AI Summarization:** Integrates with the Hugging Face API to perform text summarization.
* **Text Translation:** Capable of translating the extracted text into different languages.
* **Configurable Output:** Users can specify summary length and format.
* **RESTful API:** CORS-enabled endpoints for seamless frontend integration.

---

### **Tech Stack**

* **Backend:** Python, Flask
* **Database:** MySQL
* **Authentication:** bcrypt
* **AI Models:** Hugging Face API
* **Frontend:** Vanilla HTML, CSS, JavaScript

---

### **Setup and Installation**

1.  Clone the repository:
    ```bash
    git clone [https://github.com/HaydanPatel/AI-Text-Summarizer.git](https://github.com/HaydanPatel/AI-Text-Summarizer.git)
    ```
2.  Navigate to the project directory:
    ```bash
    cd AI-Text-Summarizer
    ```
3.  Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Create a `.env` file and add your database credentials and API keys:
    ```
    DB_USER='your_db_user'
    DB_PASSWORD='your_db_pass'
    HUGGING_FACE_API_KEY='your_api_key'
    ```
5.  Run the Flask server:
    ```bash
    python main.py
    ```
