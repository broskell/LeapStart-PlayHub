# 🎮 PlayHub – Campus Game Planner

<div align="center">
  <img src="assets/playhub_html_logo.png" alt="PlayHub Logo" width="200"/>

  **The ultimate game booking platform for LST students**

  [🚀 Live Demo](https://playhub-lst.vercel.app) • [📖 Documentation](#-features) • [🐛 Report Bug](https://github.com/broskell/playhub/issues)

  [![Made with Love](https://img.shields.io/badge/Made%20with-❤️-red)](https://github.com/broskell/playhub)
  [![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://playhub-lst.vercel.app)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## 📖 Overview

**PlayHub** is a modern, web-based game booking platform designed specifically for students at **LST (Loyola School of Technology)**. It streamlines the process of booking and managing gaming sessions for popular indoor games, making campus recreation more organized and accessible.

### 🎯 What Makes PlayHub Special?

- 📅 **Smart Scheduling** – Visual calendar with 15-minute slot intervals
- 🤖 **AI-Powered Booking** – Meet Honey, your intelligent booking assistant
- 👥 **Social Gaming** – Challenge other players and track rivalries
- 🔐 **Secure & Fast** – Firebase-backed authentication and real-time updates
- 📱 **Responsive Design** – Works seamlessly on desktop and mobile

---

## ✨ Features

### 🎮 Game Booking System

PlayHub currently supports four popular games with more on the way:

| Game | Status | Slots Available |
|------|--------|-----------------|
| ⚽ Foosball | ✅ Active | 09:00 - 17:30 |
| 🎯 Carrom | ✅ Active | 09:00 - 17:30 |
| ♟️ Chess | ✅ Active | 09:00 - 17:30 |
| 🃏 UNO | ✅ Active | 09:00 - 17:30 |
| 🏓 Table Tennis | 🔜 Coming Soon | - |
| 🎱 8-Ball Pool | 🔜 Coming Soon | - |

### 📅 Smart Schedule Management

- **Daily View** – See all available slots from 09:00 to 17:30
- **15-Minute Intervals** – Flexible booking with granular time slots
- **Visual Indicators:**
  - ✅ **Green** – Available slots
  - 🔒 **Gray** – Booked by others
  - ⭐ **Yellow** – Your bookings
  - 🚫 **Red** – Class time blocks (non-bookable)

### 🚫 Smart Booking Rules

PlayHub enforces fair play with intelligent restrictions:

- **Class Time Protection:**
  - 🚫 11:00 – 13:00 (Lunch & Classes)
  - 🚫 14:00 – 15:00 (Afternoon Classes)
- **Fair Usage Policy:**
  - Maximum **2 consecutive slots** per user per game per day
  - Prevents monopolization and ensures everyone gets a chance

### 👥 Challenge System

Turn your gaming sessions into competitive events:

- **Challenge Players** – Send challenges to anyone with a booking
- **Track Status** – Monitor pending, accepted, and declined challenges
- **Real-time Updates** – Get instant notifications via Firestore
- **Social Gaming** – Build rivalries and friendships

### 🤖 Honey – Your AI Booking Assistant

Meet **Honey**, PlayHub's intelligent assistant powered by Groq LLM:

#### Natural Language Booking

Talk to Honey like you would a friend:

```
"Book foosball tomorrow at 4:15 PM"
"Cancel my chess booking today at 3:00"
"Suggest some slots for carrom after classes"
"When is foosball available on Friday?"
```

#### What Honey Can Do

- 📝 **Book Slots** – Make reservations using natural language
- ❌ **Cancel Bookings** – Remove your existing bookings
- 💡 **Smart Suggestions** – Get recommendations for available times
- ℹ️ **Information** – Ask about rules, availability, and more

#### How Honey Works

1. **You speak** – Type your request in natural language
2. **Honey understands** – AI processes your intent via Groq API
3. **Action executed** – Booking/cancellation happens automatically
4. **Confirmation sent** – You get instant feedback

---

## 📸 Screenshots

### 🔐 Login Page

<div align="center">
  <img src="assets/playhub_login_screenshot.png" alt="PlayHub Login Page" width="800"/>
  <p><em>Clean and modern login interface with Firebase authentication</em></p>
</div>

### 📊 Dashboard

<div align="center">
  <img src="assets/playhub_dashboard_screenshot.png" alt="PlayHub Dashboard" width="800"/>
  <p><em>Interactive schedule grid showing real-time availability</em></p>
</div>

### 🤖 Honey AI Assistant

<div align="center">
  <img src="assets/playhub_honey_screenshot.png" alt="Honey AI Assistant" width="400"/>
  <p><em>Chat with Honey to book, cancel, or get suggestions</em></p>
</div>

---

## 🏗️ Architecture

### Technology Overview

```
┌─────────────────────────────────────────────┐
│           Frontend (Static SPA)              │
│  HTML5 + CSS3 + Vanilla JavaScript          │
└──────────────┬──────────────────────────────┘
               │
               ├──────────────┐
               │              │
      ┌────────▼────────┐    ┌▼───────────────────┐
      │  Firebase Auth  │    │ Firestore Database │
      │   & Hosting     │    │  (Real-time NoSQL) │
      └─────────────────┘    └────────────────────┘
               │
               │
      ┌────────▼────────────────────────────┐
      │   Vercel Serverless Functions       │
      │   /api/honey-assistant.js           │
      │   (Groq LLM Integration)            │
      └─────────────────────────────────────┘
```

### Frontend Components

| File | Purpose |
|------|---------|
| `index.html` | Landing/login page |
| `login.css` | Login page styling |
| `login.js` | Login logic |
| `playhub.html` | Main dashboard |
| `playhub.css` | Dashboard styling |
| `playhub.js` | Booking logic, schedule rendering, Honey integration |
| `firebase-init.js` | Firebase configuration |
| `auth.js` | Authentication flow |

### Backend Services

#### Firebase Firestore Collections

**1. Users Collection**
```javascript
{
  uid: "user-firebase-id",
  displayName: "Student Name",
  email: "student@example.com",
  photoURL: "https://...",
  createdAt: Timestamp
}
```

**2. Bookings Collection**
```javascript
{
  uid: "user-id",
  displayName: "Student Name",
  game: "Foosball",
  date: "2025-12-05",
  slot: "09:15",
  createdAt: Timestamp
}
```

**3. Challenges Collection**
```javascript
{
  fromUid: "challenger-id",
  fromName: "Challenger Name",
  toUid: "owner-id",
  toName: "Slot Owner",
  game: "Foosball",
  date: "2025-12-05",
  slot: "09:15",
  status: "pending", // pending | accepted | declined
  createdAt: Timestamp
}
```

#### Honey AI API Endpoint

**Endpoint:** `POST /api/honey-assistant`

**Request:**
```json
{
  "message": "Book foosball tomorrow at 4pm",
  "today": "2025-12-04",
  "currentGame": "Foosball",
  "currentDate": "2025-12-05",
  "displayName": "Student Name",
  "history": []
}
```

**Response:**
```json
{
  "reply": "Sure! I've booked Foosball for tomorrow at 16:00.",
  "action": "book",
  "game": "Foosball",
  "date": "2025-12-05",
  "time": "16:00",
  "suggestions": []
}
```

---

## 🛠️ Tech Stack

<div align="center">

| Category | Technologies |
|----------|-------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| **Authentication** | Firebase Authentication |
| **Database** | Firebase Firestore (NoSQL) |
| **Hosting** | Vercel (Static + Serverless) |
| **AI/LLM** | Groq API (LLaMA 3.1) |
| **Serverless** | Vercel Functions |
| **Design** | Custom CSS, Responsive Design |

</div>

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js** (v14 or higher)
- ✅ **Firebase Account** (free tier works)
- ✅ **Vercel Account** (for deployment)
- ✅ **Groq API Key** (for Honey AI)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/broskell/playhub.git
cd playhub
```

### 2️⃣ Firebase Setup

#### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add Project"**
3. Follow the setup wizard

#### Enable Required Services

1. **Authentication:**
   - Navigate to **Authentication** → **Sign-in method**
   - Enable **Google** or **Email/Password**

2. **Firestore Database:**
   - Navigate to **Firestore Database**
   - Click **"Create Database"**
   - Start in **production mode**

3. **Get Configuration:**
   - Go to **Project Settings** → **General**
   - Under "Your apps", select **Web**
   - Copy the configuration object

#### Configure Firebase in Your App

Update `firebase-init.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
```

### 3️⃣ Groq API Setup (Honey AI)

#### Get Your API Key

1. Sign up at [Groq Console](https://console.groq.com/)
2. Create a new API key
3. Copy the key (starts with `gsk_...`)

#### Configure Environment Variables

**For Local Development:**

Create `.env.local`:
```
GROQ_API_KEY=your_groq_api_key_here
```

**For Vercel Deployment:**

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - **Name:** `GROQ_API_KEY`
   - **Value:** Your Groq API key

### 4️⃣ Project Structure

```
playhub/
├── api/
│   └── honey-assistant.js      # Vercel serverless function
├── assets/
│   ├── bgless_sign.png
│   ├── html_logo.png
│   ├── playhub_html_logo.png
│   └── *.png
├── index.html                  # Login page
├── login.css                   # Login styles
├── login.js                    # Login logic
├── playhub.html                # Dashboard
├── playhub.css                 # Dashboard styles
├── playhub.js                  # Main app logic
├── firebase-init.js            # Firebase config
├── auth.js                     # Auth routing
└── README.md                   # This file
```

### 5️⃣ Run Locally

#### Option A: VS Code Live Server

1. Open the project in VS Code
2. Install **Live Server** extension
3. Right-click `index.html` → **Open with Live Server**
4. Navigate to `http://127.0.0.1:5500/`

#### Option B: Simple HTTP Server

```bash
# Using npx
npx serve .

# Or using Python
python -m http.server 8000
```

Then open `http://localhost:3000/` (or specified port)

#### Option C: Vercel Dev (with local functions)

```bash
npm install -g vercel
vercel dev
```

This will run both the static site and the `/api/honey-assistant` function locally.

---

## 🌐 Deployment

### Deploy to Vercel

#### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

#### 2. Import to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Other
   - **Build Command:** (leave empty)
   - **Output Directory:** `.`
   - **Install Command:** (leave empty)

#### 3. Add Environment Variables

In Vercel Dashboard:
- Go to **Settings** → **Environment Variables**
- Add: `GROQ_API_KEY` = `your_groq_api_key`

#### 4. Deploy

Click **"Deploy"** and wait for the build to complete.

Your app will be live at: `https://your-project.vercel.app`

---

## 🔒 Security Best Practices

### Firestore Security Rules

Add these rules in Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can read all user profiles
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Bookings
    match /bookings/{bookingId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                               request.auth.uid == resource.data.uid;
    }
    
    // Challenges
    match /challenges/{challengeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null &&
        (request.auth.uid == resource.data.fromUid ||
         request.auth.uid == resource.data.toUid);
      allow delete: if request.auth != null &&
        request.auth.uid == resource.data.fromUid;
    }
  }
}
```

### API Key Management

⚠️ **NEVER commit API keys to GitHub!**

✅ **Do:**
- Use environment variables for all secrets
- Add `.env*` to `.gitignore`
- Rotate keys if accidentally exposed
- Use Vercel's environment variable system

❌ **Don't:**
- Hard-code API keys in source files
- Commit `.env` files
- Share keys in public channels

---

## 📊 Current Status & Roadmap

### ✅ Completed Features

- [x] Multi-user booking system with Firebase
- [x] Real-time schedule grid with Firestore
- [x] Challenge system between players
- [x] AI assistant (Honey) with Groq integration
- [x] Responsive design for mobile and desktop
- [x] Smart booking rules and validation
- [x] Firebase authentication with Google Sign-In

### 🔮 Upcoming Features

| Feature | Priority | Status |
|---------|----------|--------|
| 💬 Challenge Chat | High | Planning |
| 🏆 Leaderboards | Medium | Planning |
| ⚙️ Admin Dashboard | High | In Progress |
| 📱 PWA Support | Medium | Planning |
| 🔔 Push Notifications | Low | Planning |
| 📊 Usage Analytics | Medium | Planning |
| 🏓 Table Tennis Booking | High | Coming Soon |
| 🎱 8-Ball Pool Booking | High | Coming Soon |

---

## 🤝 Contributing

We love contributions! Here's how you can help:

### Ways to Contribute

- 🐛 **Report bugs** – Found an issue? [Open an issue](https://github.com/broskell/playhub/issues)
- 💡 **Suggest features** – Have an idea? We'd love to hear it!
- 📝 **Improve docs** – Help make our documentation better
- 🔧 **Submit PRs** – Fix bugs or add features
- ⭐ **Star the repo** – Show your support!

### Development Process

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit** your changes
   ```bash
   git commit -m "Add some AmazingFeature"
   ```
4. **Push** to the branch
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open** a Pull Request

### Code Style Guidelines

- Use **ES6+** JavaScript features
- Follow **consistent indentation** (2 spaces)
- Add **comments** for complex logic
- Test **thoroughly** before submitting

---

## 📄 License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Saathvik Kellampalli

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

## 👨‍💻 Author

<div align="center">

### Saathvik Kellampalli

[![GitHub](https://img.shields.io/badge/GitHub-@broskell-181717?style=for-the-badge&logo=github)](https://github.com/broskell)
[![Portfolio](https://img.shields.io/badge/Portfolio-Visit-FF5722?style=for-the-badge&logo=google-chrome&logoColor=white)](https://your-portfolio.com](https://saathvikkellampalli.vercel.app/))

**Full Stack Developer | AI Enthusiast | Student at LST**

</div>

PlayHub is a personal project exploring modern web development, Firebase, serverless architecture, and LLM-powered interfaces.

---

## 🙏 Acknowledgments

Special thanks to:

- **LST Community** – For inspiration and feedback
- **Firebase** – For robust backend infrastructure
- **Vercel** – For seamless deployment
- **Groq** – For lightning-fast AI inference
- **Open Source Community** – For tools and inspiration

---

## 📞 Support & Contact

### Need Help?

- 🐛 **Bug Reports:** [GitHub Issues](https://github.com/broskell/playhub/issues)
- 💬 **Questions:** [GitHub Discussions](https://github.com/broskell/playhub/discussions)
- 📧 **Email:** saathvik@example.com
- 🌐 **Live App:** [playhub-lst.vercel.app](https://playhub-lst.vercel.app)

### Found a Bug?

Please include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots (if applicable)
5. Browser and OS information

---

## 📈 Stats

<div align="center">

![GitHub stars](https://img.shields.io/github/stars/broskell/playhub?style=social)
![GitHub forks](https://img.shields.io/github/forks/broskell/playhub?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/broskell/playhub?style=social)

</div>

---

<div align="center">

**[⬆ Back to Top](#-playhub--campus-game-planner)**

Made with ❤️ for the LST community

[Website](https://playhub-lst.vercel.app) • [GitHub](https://github.com/broskell/playhub) • [Issues](https://github.com/broskell/playhub/issues)

© 2025 Saathvik Kellampalli. All rights reserved.

</div>
