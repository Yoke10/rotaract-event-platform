# Rotaract Event Platform

A complete Event Registration and Management Web Application for Rotaract clubs.

## Features
- **Public Portal**: View events, book tickets, mock payment flow.
- **Admin Portal**: Create/Edit events, Dashboard analytics, Export data to Excel.
- **QR Scanner**: Scan web-app for verifying tickets at the venue (supports multiple categories like Entry, Lunch).
- **Ticket Generation**: Unique QR for every ticket.

## Tech Stack
- Frontend: React (Vite), Tailwind CSS v4
- Backend: Firebase (Auth, Firestore, Storage)
- Functions: Firebase Cloud Functions (Node.js 20) for Payments & Email.

## Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase Project created in [Firebase Console](https://console.firebase.google.com/) with:
    - **Authentication**: Email/Password enabled.
    - **Firestore**: Database created (in Production mode).
    - **Storage**: Enabled.
    - **Functions**: Enhanced project (Pay-as-you-go Blaze plan required for external APIs like SendGrid/Paytm).

### 2. Frontend Setup
1.  Navigate to root directory.
2.  Install dependencies: `npm install`
3.  Create `.env` file based on `.env.example` (or use the one created):
    ```env
    VITE_FIREBASE_API_KEY=...
    VITE_FIREBASE_AUTH_DOMAIN=...
    VITE_FIREBASE_PROJECT_ID=...
    # ... other firebase config
    ```
4.  Run locally: `npm run dev`

### 3. Backend (Functions) Setup
1.  Navigate to `functions` directory: `cd functions`
2.  Install dependencies: `npm install`
3.  Deploy functions: `firebase deploy --only functions`
    - *Note: You need to login via `firebase login` first.*

### 4. Admin Access
- Sign up a new user via the app.
- For testing, use the email `admin@rotaract.com` to automatically get **Admin** privileges (logic in `src/context/AuthContext.jsx`).
- Alternatively, modify the user's role in Firestore `users` collection to `admin`.

### 5. Payment & Email Configuration
- **Paytm**: Set `PAYTM_MID` and `PAYTM_KEY` in Cloud Functions environment config.
- **Email**: Configure `nodemailer` in `functions/index.js` with your SMTP credentials (e.g., Gmail App Password or SendGrid).

## Project Structure
- `/src/pages`: Public and Admin pages.
- `/src/services`: Firebase and Logic services.
- `/functions`: Backend logic.

## Usage
- **Create Event**: Login as Admin -> Dashboard -> Create Event.
- **Book Ticket**: Go to Home -> Select Event -> Book -> Enter Details -> Pay.
- **Scan Ticket**: Login as Admin -> Dashboard -> Scanner URL (`/admin/scanner`) -> Select Category -> Scan.
