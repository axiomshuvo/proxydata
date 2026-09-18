# ProxyData — Hostinger Deployment Guide

This guide provides the exact steps to deploy ProxyData to Hostinger's Node.js environment.

## 1. Preparing Hostinger

1. Log in to your Hostinger hPanel.
2. Go to **Advanced** > **Node.js**.
3. Create a new Node.js application:
   - **Node.js Version:** `20.x` or higher.
   - **Application Mode:** `Production`.
   - **Application Root:** `/public_html` (or whatever folder you prefer).
   - **Application URL:** `yourdomain.com`.
   - **Application Startup File:** Leave empty or set to `npm start` (Hostinger auto-detects `npm start` if left empty, or if using `output: standalone`, set it to `.next/standalone/server.js` — but `npm start` is the easiest).

## 2. Environment Variables

In the Hostinger Node.js panel, you will see a section for Environment Variables. Add **ALL** of these exactly as they appear in your local `.env` file:

```env
# MongoDB (Ensure it ends in /proxydata)
MONGODB_URI="mongodb+srv://..."

# Security (Generate a random string for this)
BETTER_AUTH_SECRET="your-random-secret"
BETTER_AUTH_URL="https://yourdomain.com"

# Google Auth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# SMTP Email
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT="465"
SMTP_USER="no-reply@yourdomain.com"
SMTP_PASS="your-email-password"
ADMIN_RECEIVER_EMAIL="techshuvo@gmail.com"

# DataImpulse API
DATAIMPULSE_API_LOGIN="your-dataimpulse-email"
DATAIMPULSE_API_PASSWORD="your-dataimpulse-password"

# Admin Route Security (generate a RANDOM path per deploy — NEVER reuse a
# value that appears in git history, chat logs, or old client bundles)
ADMIN_PATH="/ops-x7q2m9zt"
MASTER_ADMIN_EMAIL="you@yourdomain.com"
```

## 3. Uploading Code (Git Connect)

The easiest way to deploy is using **Git** directly in Hostinger:
1. Push your local code to a private GitHub repository.
2. In Hostinger hPanel, go to **Advanced** > **GIT**.
3. Connect your GitHub repository.
4. Set the branch to `main`.
5. Click **Deploy**.

*(Alternatively, you can compress your files into a `.zip` (excluding `node_modules` and `.next`) and upload it via File Manager, then extract it).*

## 4. Build & Start Commands

Once the files are on Hostinger, you must install dependencies and build the app.

1. SSH into your Hostinger server (or use the built-in terminal).
2. Navigate to your app directory (e.g., `cd public_html`).
3. Run the following commands:

```bash
# 1. Install dependencies
npm install

# 2. Build the Next.js app
npm run build
```

4. Go back to the Hostinger Node.js control panel and click **START / RESTART**.

## 5. First-Time Setup Verification

Once the app is running on your live domain:
1. Go to `https://yourdomain.com/user/sign-in` and log in with Google using `techshuvo@gmail.com`.
2. Because this matches `MASTER_ADMIN_EMAIL`, the system will automatically bootstrap your account with `ROLE_ADMIN`.
3. Go to `https://yourdomain.com/<ADMIN_PATH>`. You should be granted access.
4. Create a dummy transaction and approve it to verify the DataImpulse API connects from the live server.
