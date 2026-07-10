# 🌐 Smart Emotion-Based Learning - Deployment Guide

This guide walks you through deploying the entire stack online for **free** using **Aiven** (MySQL Database), **Render** (Node Backend & Python ML), and **Vercel** (React Frontend).

---

## 1. 🗄️ Step 1: Deploy MySQL Database (Aiven)

Since Render does not offer a free MySQL database, we use **Aiven** (which has a 100% free tier for MySQL).

1.  Go to [Aiven.io](https://aiven.io/) and sign up for a free account.
2.  Click **Create Service** → Select **MySQL** → Select the **Free Plan** (available in AWS regions like `eu-west-1` or `us-east-1`).
3.  Once the service starts (takes ~2 minutes), copy the **Connection Parameters**:
    *   **Host**: `mysql-...aivencloud.com`
    *   **Port**: `20000+` (usually)
    *   **User**: `avnadmin`
    *   **Password**: *[Provided in dashboard]*
    *   **Database**: `defaultdb`

---

## 2. 🟢 Step 2: Deploy Node.js Backend (Render)

1.  Go to [Render.com](https://render.com/) and sign up (connect your GitHub account).
2.  Click **New +** → Select **Web Service**.
3.  Select your repository `Smart-Emotion-Based-Learning`.
4.  Configure the service:
    *   **Name**: `emolearn-backend`
    *   **Root Directory**: `backend`
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node src/app.js`
5.  Scroll down to **Environment Variables** and add:
    *   `PORT` = `10000`
    *   `DB_HOST` = *[Your Aiven Host]*
    *   `DB_NAME` = `defaultdb`
    *   `DB_USER` = `avnadmin`
    *   `DB_PASSWORD` = *[Your Aiven Password]*
    *   `JWT_SECRET` = `choose-a-strong-random-key`
    *   `EMAIL_USER` = `todo70392@gmail.com`
    *   `EMAIL_PASS` = `zwfd gnht qjlu ryqu`
6.  Click **Deploy Web Service**. Render will build and launch your backend. Once complete, copy your Web Service URL (e.g. `https://emolearn-backend.onrender.com`).

---

## 3. 🐍 Step 3: Deploy Python ML Service (Render)

1.  On [Render.com](https://render.com/), click **New +** → **Web Service**.
2.  Select the same repository `Smart-Emotion-Based-Learning`.
3.  Configure the service:
    *   **Name**: `emolearn-ml`
    *   **Root Directory**: `ml-service`
    *   **Runtime**: `Python`
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `gunicorn --bind 0.0.0.0:$PORT src.app:app`
4.  Add the **Environment Variables**:
    *   `JWT_SECRET` = `[Must match backend JWT_SECRET]`
5.  Click **Deploy Web Service**. Render will automatically detect the Dockerfile/Python structure and deploy it. Copy the URL (e.g. `https://emolearn-ml.onrender.com`).

---

## 4. ⚡ Step 4: Deploy React Frontend (Vercel)

1.  Go to [Vercel.com](https://vercel.com/) and sign up with GitHub.
2.  Click **Add New...** → **Project**.
3.  Import the repository `Smart-Emotion-Based-Learning`.
4.  Configure the project settings:
    *   **Framework Preset**: `Vite`
    *   **Root Directory**: Click *Edit* and select **`frontend`**.
5.  Expand **Environment Variables** and add:
    *   `VITE_NODE_API_URL` = `https://emolearn-backend.onrender.com/api` (use your actual Render backend URL)
    *   `VITE_FLASK_API_URL` = `https://emolearn-ml.onrender.com` (use your actual Render ML URL)
6.  Click **Deploy**. Vercel will build and deploy the React interface in under a minute!

---

🎉 **Congratulations! Your AI-powered Smart Emotion-Based Learning application is now live and fully hosted online!**
