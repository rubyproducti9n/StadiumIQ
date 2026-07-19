# StadiumIQ ⚽ — FIFA World Cup 2026 Smart Stadium Assistant

## Problem Statement
FIFA World Cup 2026 spans 3 countries, 16 cities, 48 teams.
Fans speak 40+ languages, arrive at unfamiliar stadiums,
and have no unified AI assistant to help them navigate the experience.

## Solution
StadiumIQ is a GenAI-powered fan companion that:
- Answers any fan question in their native language
- Provides real-time crowd intelligence and stadium context
- Works at zero cost using Gemini 2.5 Flash free tier

## GenAI Usage (mandatory)
- Model: gemini-2.5-flash-preview-05-20
- Use cases: Q&A, translation, sentiment tagging, match summaries
- Prompt strategy: crowd context injection per query

## How It Works
1. Users select their persona (Fan or Staff/Volunteer) and their stadium.
2. They ask questions in any language via the chat interface.
3. StadiumIQ uses Gemini AI to understand the question and generate a relevant, context-aware response.
4. Crowd data from Firebase Realtime Database is injected into every AI prompt so responses reflect live stadium conditions.
5. The map panel shows the selected stadium with gate markers using Leaflet.js + OpenStreetMap.
6. The crowd dashboard visualizes section fill levels, gate wait times, and food court status.
7. The accessibility panel highlights accessible facilities and encourages users to mention their needs in chat for personalized guidance.

## Google Services Used
- **Gemini 3.5 Flash API** — Core AI brain. Handles multilingual input/output, navigation Q&A, crowd interpretation, and operational recommendations.
- **Firebase Realtime Database** — Stores and serves live crowd data per stadium. Falls back to mock data for demo purposes.
- **Firebase Hosting** — Hosts the deployed web app (free Spark plan).

## Tech Stack
- React 18 + Vite
- Tailwind CSS
- Leaflet.js + OpenStreetMap (free, no API key)
- Firebase JS SDK v9 (modular)
- Jest + React Testing Library

## How to Run Locally

1. Clone the repository
2. Run: npm install
3. Copy .env.example to .env and fill in your API keys (see API Keys section below)
4. Run: npm run dev
5. Open: http://localhost:5173

## API Keys Required
- VITE_GEMINI_API_KEY — Get from Google AI Studio (free): https://aistudio.google.com/app/apikey
- VITE_FIREBASE_API_KEY and others — Get from Firebase Console: https://console.firebase.google.com

## How to Run Tests
npm test

## Assumptions
- Crowd data is simulated via Firebase Realtime Database with mock values for demo.
- Three FIFA 2026 US venues are included: MetLife Stadium (NJ), AT&T Stadium (TX), SoFi Stadium (CA).
- Map directions open in OpenStreetMap in a new tab (no Google Maps API required).
- Multilingual support is handled natively by Gemini — no separate translation API needed.
- The app is designed for demo/evaluation use and not production scale.

## Architecture
User → React UI → useAssistant hook → Gemini API (AI response) + Firebase (crowd data) → UI update

## GCP & Monetization

### Google Cloud Platform (GCP)
StadiumIQ is built directly on top of Google Cloud Platform services via the Firebase Console:
1. **Firestore Database:** Configured and hosted within GCP. Live crowd data updates are fully synced to matching Firestore document paths (`match/{matchId}/crowd/live`).
2. **Google Analytics 4:** Integrated Google Analytics 4 via the Firebase SDK to log custom events directly to GCP:
   - `match_viewed`: Fired when a fan switches stadiums or views a new match.
   - `question_asked`: Fired on every query to log visitor engagement.
   - `language_detected`: Logged when the app automatically identifies or falls back to a user's language.
   - `crowd_data_loaded`: Logged when live statistics are updated.
3. **Cloud Logging:** All Gemini API interactions and application processes are fully traceable. Detailed serverless function logs and API call traces are available via the **GCP Console > Logs Explorer**.

### Monetization (Google Ads)
StadiumIQ monetizes the fan Q&A flow with non-intrusive banner advertising:
- **Google AdSense:** Google AdSense is integrated via `index.html` (currently using the `ca-pub-0000000000000000` test client).
- **Banner Ads:** Rendered below the main navigation header to monetize fan traffic while keeping the core navigation and dashboard clean and readable.
