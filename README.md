# StadiumIQ ⚽ — FIFA World Cup 2026 Smart Stadium Assistant

## Chosen Vertical
Fan Navigation + Multilingual Assistance + Crowd Management + Accessibility Support

## Hackathon Submission Description
StadiumIQ is a serverless, zero-cost web assistant designed to optimize stadium operations and fan experience for the FIFA World Cup 2026. 

Powered by **Gemini 2.5 Flash** and **GCP/Firestore**, StadiumIQ injects live, real-time crowd data (managed via automated API polling or manual CSV/JSON uploads) directly into the LLM context. This enables context-aware Q&A, crowd density updates, facility locations, and dynamic match summaries. 

The app features native multilingual support. It handles smart language detection and translation dynamically, defaulting to a custom selection dropdown (EN, ES, FR, AR, PT, DE) in case of detection failures. 

To ensure production-grade stability, StadiumIQ implements robust edge-case handling:
- **Exponential backoff retry** for Gemini API rate limits (429)
- **Local keyword boundary checks** to block off-topic queries, saving API resources
- **Auto-flags** for missing match data (`⚠️ Live data unavailable`)

Google Analytics 4 logs custom GCP signals (`match_viewed`, `question_asked`, `language_detected`, `crowd_data_loaded`), making all activities traceable via GCP Logs Explorer. The UI incorporates Leaflet.js maps for interactive venue navigation and integrates Google AdSense banners for immediate monetization.

StadiumIQ eliminates navigation stress, unites international fans in their native languages, and transforms stadium entry from a bottleneck into a seamless experience.

## Persona
International fans, venue staff, and volunteers attending or working at FIFA World Cup 2026 stadiums in the USA.

## Problem Statement Alignment
StadiumIQ is a GenAI-powered web assistant that enhances the stadium experience for fans and improves operational efficiency for staff. It uses Google Gemini AI to provide real-time navigation, crowd awareness, multilingual support, and accessibility guidance — directly addressing the FIFA World Cup 2026 challenge verticals.

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
