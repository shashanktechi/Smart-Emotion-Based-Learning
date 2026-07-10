# 🧠 EmoLearn: Emotion-Adaptive Learning System 🚀

EmoLearn is an AI-powered, privacy-first, emotion-adaptive learning platform. By capturing the student's cognitive and emotional state in real-time through the webcam, the system dynamically shifts study content. 

*   🤔 **Confused or Frustrated?** EmoLearn simplifies the topic and offers gentle guidance.
*   😴 **Bored?** EmoLearn steps up the difficulty and challenges you.
*   😊 **Focused & Happy?** EmoLearn keeps the momentum going with advanced concepts.

---

## 🌟 Key Features

1.  **📸 Real-Time Computer Vision AI**:
    *   **Brow Furrow Index**: Detects forehead wrinkling (using Sobel gradients) to detect **confusion** and **frustration** 😤.
    *   **Mouth Aspect Ratio (MAR)**: Thresholds the inner mouth cavity to detect smiling (**happiness** 😊) and gasping (**surprise** 😮).
    *   **Eye Openness Contrast**: Measures eye activity to identify drooping eyes (**boredom** 😴).
    *   **Focused Baseline**: Identifies neutral, high-focus engagement 🎯.
2.  **💬 Talk-to-Talk AI Chatbot**: Built-in interactive AI assistant that responds directly to you based on your current emotional state.
3.  **📚 Multi-Category Course Library**: 30+ built-in courses spanning Java, Python, C, DSA, Web Dev, SQL, Machine Learning, and Career guidance.
4.  **🎓 Student & Admin Viewports**:
    *   **Student Panel**: Access learning modules, chat with the AI assistant, see recommended courses, and suggest/add new course modules.
    *   **Admin Panel**: Track system health, inspect real-time Recharts emotion distribution, manage users, modify user passwords, and download detailed CSV reports 📊.
5.  **🔒 Password Recovery (OTP)**: Secure, modern 2-step OTP verification flow via Gmail SMTP or local dev mode fallback.
6.  **🛡️ Privacy First**: No raw webcam frames are stored. Emotional states are aggregated into 1-minute statistics in MySQL.

---

## 🛠️ Tech Stack

*   **Frontend**: React.js ⚛️, Vite ⚡, Tailwind CSS 🎨, Recharts 📈, Lucide Icons 🌟, TanStack Query 🔄
*   **Backend API**: Node.js 🟢, Express, Sequelize ORM 🗄️, MySQL 🐬, Nodemailer ✉️
*   **ML Service**: Python 🐍, Flask 🌶️, OpenCV 👁️, NumPy 🔢

---

## 🚀 Installation & Setup

### 1. 🗄️ Database Setup
1.  Create a MySQL database named `college`.
2.  Configure credentials in `backend/.env` (use the provided `backend/.env.example` as a starting point):
    ```ini
    PORT=5000
    DB_HOST=localhost
    DB_NAME=college
    DB_USER=root
    DB_PASSWORD=YOUR_MYSQL_PASSWORD
    JWT_SECRET=your_jwt_secret_key
    EMAIL_USER=your_gmail_address@gmail.com
    EMAIL_PASS="your_gmail_app_password"
    ```

### 2. 🟢 Start backend API
```bash
cd backend
npm install
npm run dev
```
*(The system will automatically sync tables and seed initial adaptive modules into the database)*

### 3. 🐍 Start Flask ML API
1.  Configure `ml-service/.env` with your JWT Secret.
2.  Activate your virtual environment and start the Flask application (runs on port `8000`):
    ```bash
    cd ml-service
    # Windows PowerShell
    .\venv\Scripts\Activate.ps1
    python -m src.app
    ```

### 4. ⚡ Start React Frontend
1.  Configure `frontend/.env`:
    ```ini
    VITE_NODE_API_URL=http://localhost:5000/api
    VITE_FLASK_API_URL=http://localhost:8000
    ```
2.  Start the Vite dev server (runs on port `5173`):
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

---

## 👤 Admin Access & Setup

To access the administrator viewport and explore the advanced analytics features:

1.  Register a new account on the frontend signup page.
2.  Open your MySQL command-line or database client (e.g., phpMyAdmin, DBeaver, MySQL Workbench).
3.  Run the following SQL query to grant Administrator privileges to your account:
    ```sql
    UPDATE users SET role = 'admin' WHERE email = 'your_registered_email@example.com';
    ```
4.  Log out of the app and log back in. The system will automatically route you to the **Admin Dashboard**!

---

## 🛡️ License

This project is open-source and available under the MIT License.
