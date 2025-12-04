# Tiger-Ticket-App---Jalil-Kellen-Hayden - Tiger Tix 
Description:

TigerTix is an accessible, event-booking platform built using a microservices architecture.  
It supports traditional ticket purchasing, natural-language booking through an integrated LLM, and full voice interaction for visually impaired users (speech-to-text + text-to-speech).

This repository contains the **full system**, including frontend, backend microservices, database, CI/CD automation, and deployment configuration.

---

## Live Deployment  
Frontend (Vercel): 
Backend Services (Render):  
- Client Service:   
- Admin Service: 
- LLM Service: 

GitHub Repository: https://github.com/Jalilh1/Tiger-Ticket-App---Jalil-Kellen-Hayden

Demo Video (2 minutes): 

---

#  Project Overview

TigerTix enables users to:

Browse campus events  
- View event names, dates, and remaining ticket availability.

Register & Log In  
- Secure authentication using hashed passwords + JWT tokens.

Purchase tickets  
- Standard purchase flow via forms.  
- LLM-driven booking (e.g., “Book 2 tickets for the Concert”).

Voice Interaction (Accessibility Feature)  
- **SpeechRecognition API** → Convert user speech into text.  
- **Speech Synthesis API** → Read assistant responses aloud.  
- Built to support visually-impaired users per accessibility guidelines.

LLM Processing  
The LLM microservice parses natural language input to extract:  
- **intent** (view events, book tickets, greeting)  
- **event name**  
- **ticket quantity**

---

Tech Stack

**Frontend**
- React (Create React App)
- SpeechRecognition API (Web Speech API)
- Speech Synthesis API
- ARIA accessibility features

**Backend Microservices**
All Node.js + Express, each deployed independently.
- **Admin Service** – Event creation, update, delete
- **Client Service** – Retrieve events & process ticket purchases  
- **LLM Service** – Natural-language intent parsing + booking suggestions
- **Authentication Service (Sprint 3)** – JWT login/register, password hashing

 **Database**
- SQLite (shared across services)

**CI/CD**
- GitHub Actions  
  - Install dependencies  
  - Run regression tests (Jest + React Testing Library)  
  - Auto-deploy frontend (Vercel) & backend (Render/Railway)

---

# Architecture Summary

TigerTix uses a **microservice-oriented architecture**, where each service is independently deployed and communicates via REST APIs.

```
                              ┌──────────────────────────┐
                              │      Frontend (React)    │
                              │  - Displays events        │
                              │  - Buy tickets            │
                              │  - Chat assistant UI      |
                              │  - Voice input/output     │
                              └─────────────┬────────────┘
                                            │
              ┌─────────────────────────────┼─────────────────────────────┐
              │                             │                             │
┌─────────────────────────┐    ┌─────────────────────────┐    ┌──────────────────────────┐
│     LLM Service         │    │    Client Service        │    │   Authentication Service │
│  POST /api/llm/parse    │    │ GET /api/client/events   │    │ POST /auth/register      │
│  GET /api/llm/events    │    │ POST /api/client/purchase│    │ POST /auth/login         │
│  POST /confirm_booking  │    └──────────────┬───────────┘    └──────────────┬──────────┘
└──────────────┬──────────┘                   │                              │
               │                              │                              │
               └──────────────────────────────┼──────────────────────────────┘
                                              │
                                   ┌─────────────────────┐
                                   │ Shared SQLite DB    │
                                   │ events, purchases   │
                                   └─────────┬───────────┘
                                             │
                                ┌──────────────────────────┐
                                │      Admin Service       │
                                │ POST /api/admin/events   │
                                │ PUT/DELETE events        │
                                └──────────────────────────┘
```

---

Installation & Setup (Local Development)

**1. Clone the repository**
```bash
git clone https://github.com/Jalilh1/Tiger-Ticket-App---Jalil-Kellen-Hayden
cd Tiger-Ticket-App---Jalil-Kellen-Hayden
```

---

##  Frontend Setup (React)

cd fronntend
npm start

Runs on **http://localhost:3000**

---

Backend Setup (Microservices)

Open **each service folder** and install dependencies:

Admin Service  
```
cd backend/admin-service
node server.js
```

Client Service  
```
cd backend/client-service
node server.js
```

LLM Service  
```
cd backend/llm-service
node server.js
```

Authentication Service
```
cd backend/auth-service
node server.js
```

SQLite database file lives in:  
```
backend/shared-db/database.sqlite
```

---

# Environment Variables

Create a `.env` file in each microservice:

Example (Client Service)
```
PORT=5002
DB_PATH=../shared-db/database.sqlite
JWT_SECRET=your-secret-here
```

Example (Auth Service)
```
JWT_SECRET=your-secret-here
DB_PATH=../shared-db/database.sqlite
```

xample (Frontend – Vercel)
```
REACT_APP_CLIENT_BASE=https://your-client-service-url
REACT_APP_LLM_BASE=https://your-llm-service-url
REACT_APP_AUTH_BASE=https://your-auth-service-url
```

---

Running Regression Tests

TigerTix includes automated tests using **Jest** and **React Testing Library**.

Backend Tests
```
npm test
```

Frontend Tests
```
cd frontend
npm test
```
---

 CI/CD (GitHub Actions)

On **every push to main**, GitHub Actions will:

1. Install dependencies  
2. Run regression tests  
3. Deploy backend (Render/Railway)  
4. Deploy frontend (Vercel)

---

#Team Members
Jalil Harris - Student Developer
Kellen Grossenbacher - Student Developer
Hayden Lorenz - Student Developer

#Instructor
Dr. Julian Brinkley

#TA's
Colt Doster
Atik Enam

---

#License
MIT License

Copyright (c) 2025 Jalil Harris, Kellen Grossenbacher, Hayden Lorenze

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


---

#Final Notes
TigerTix is a fully deployed, voice-enabled, accessible event booking system built with modern microservice practices. This README includes everything needed for deployment, testing, and evaluation.
