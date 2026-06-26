# RozgarSetu Interview Guide

This document is a question-and-answer style summary of the RozgarSetu project. It explains the architecture, technology choices, data flow, AI prompting, database design, and why each major technology was used.

## 1. What is RozgarSetu?

RozgarSetu is a digital platform that connects blue-collar workers and contractors. It supports:
- worker and contractor registration,
- job creation and applications,
- real-time chat,
- AI-assisted voice/text parsing,
- OTP-based login,
- profile and rating management.

## 2. What are the main parts of the project?

1. Backend API: `rozgarSetu-Backend`
2. Web frontend: `Frontend`
3. Mobile worker app: `WorkerApp`

## 3. Why was Node.js and Express used for the backend?

- Node.js is a natural choice for JavaScript developers and keeps the full stack in one language.
- Express is lightweight, easy to structure, and flexible for REST APIs.
- This backend supports both HTTP routes and Socket.io real-time communication under the same server.

## 4. Why was React with Vite chosen for the web frontend?

- React is widely used and works well for component-based UI.
- Vite offers fast development startup, hot module replacement, and optimized production builds.
- Tailwind CSS is used for responsive styling and faster UI development.

## 5. Why was Expo/React Native used for the mobile worker app?

- Expo makes mobile development easier for React developers.
- React Native supports both Android and iOS from a single codebase.
- The app can reuse API patterns and design principles from the web frontend.

## 6. How is the database handled?

- The backend uses MongoDB through Mongoose.
- `config/db.js` connects to MongoDB using `MONGO_URI` and an optional `MONGO_DB_NAME`.
- MongoDB is a good fit because the project stores flexible user profiles, project postings, chat messages, and application state.

## 7. What are the main database models?

The project uses collections for:
- `User` — login, role, phone, name, rating.
- `WorkerProfile` — worker skills, location, saved jobs, experience.
- `Project` — contractor job postings, location, wage, facilities.
- `Message` — chat messages saved for real-time conversation history.
- `Rating` — feedback and scoring between users.
- `JobApplication` — applications from workers to projects.

## 8. How does authentication work?

- The backend uses OTP-based login via phone number.
- OTPs are generated and stored temporarily in memory in development.
- After OTP verification, the backend issues a JWT token using `jsonwebtoken`.
- Authenticated routes use middleware to verify the JWT token.

## 9. How is OTP delivered?

- The backend supports Twilio SMS integration.
- If Twilio is configured with `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER`, OTPs are sent by SMS.
- If Twilio is not configured, OTPs still work in development with a local fallback.

## 10. Why is Socket.io used?

- Socket.io enables real-time messaging between workers and contractors.
- `server.js` wraps Express in an HTTP server and attaches a Socket.io server.
- Users join chat rooms based on job IDs.
- Messages are saved to MongoDB and broadcast to the room.

## 11. How does the AI prompting work?

The project uses AI prompting in the backend to understand spoken or typed text for two main use cases:
- parsing worker profiles,
- parsing contractor project descriptions.

The backend code in `controllers/aiController.js` and `controllers/aiChatController.js` defines strong system prompts that:
- explain allowed skill values,
- require JSON-only responses,
- normalize locations and numeric fields,
- support Hindi, English, and mixed-language input.

## 12. What model does the AI use?

- The code is configured to use GROQ model endpoints.
- `GROQ_API_BASE` defaults to `https://api.groq.com/openai/v1`.
- `GROQ_MODEL` defaults to `llama-3.3-70b-versatile`.
- `GROQ_TRANSCRIPTION_MODEL` defaults to `whisper-large-v3-turbo`.

## 13. What is a system prompt in this project?

A system prompt is a set of instructions sent to the AI model before the user’s input. It limits the AI to:
- specific output format,
- allowed skill names,
- required fields,
- and deterministic parsing behavior.

This allows the backend to receive structured JSON from the AI instead of freeform text.

## 14. How does the local fallback parser work?

- If the GROQ API key is missing or AI fails, the backend uses rule-based parsing.
- This local parser inspects text for keywords, Hindi/English terms, digits, and simple patterns.
- It ensures the app still works without AI, although with less flexibility.

## 15. How does audio transcription work?

- The backend accepts uploaded audio files via Multer.
- It sends audio to the GROQ transcription model.
- The returned text is then parsed by the AI prompt to extract profile or project details.

## 16. Why is MongoDB a suitable database here?

- MongoDB handles semi-structured data well, which matches user profiles and job postings.
- It supports flexible schemas for evolving fields like skills, facilities, and preferences.
- It is easy to use with Node.js through Mongoose.

## 17. What is the architecture of the backend?

- `server.js` initializes Express, configures middleware, and connects to MongoDB.
- It mounts routes for auth, projects, workers, chat, ratings, and AI.
- It also starts Socket.io for real-time communication.
- Controller files contain the business logic.
- Route files bind endpoints to controller actions.

## 18. How is the frontend architecture organized?

- The web frontend uses React pages and components under `src/pages` and `src/components`.
- Routing is handled with `react-router-dom`.
- UI styling is based on Tailwind CSS.
- API calls are made with `axios`.
- Features include login, dashboard, job listings, profile screens, and chat.

## 19. How is the mobile app architecture organized?

- The mobile app is built with Expo and React Native.
- It uses React Navigation for screen flow.
- It uses `socket.io-client` for chat and `axios` for HTTP API calls.
- The app supports worker dashboards, job browsing, chat, and profile management.

## 20. Why use JavaScript/TypeScript across the stack?

- Using JavaScript on backend, web frontend, and mobile app improves developer productivity.
- It allows code reuse and consistent data handling.
- The team can maintain a unified language ecosystem.

## 21. How are AI-based search and chat responses handled?

- `controllers/aiChatController.js` turns natural queries into structured job search filters.
- It can use AI to extract location, skill set, wage range, and facilities.
- It retrieves matching jobs from MongoDB and uses a response-generation prompt to reply in plain language.
- There is a fallback if AI is unavailable: local extraction and template-based messaging.

## 22. What environment variables are required?

Common backend variables:
- `MONGO_URI` — MongoDB connection string.
- `MONGO_DB_NAME` — optional database name.
- `JWT_SECRET` — secret for signing tokens.
- `GROQ_API_KEY` — API key for AI services.
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` — for SMS OTP.

## 23. What are the main API endpoints?

- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`
- `GET /api/projects`
- `POST /api/projects`
- `POST /api/ai/parse-profile-text`
- `POST /api/ai/parse-project-text`
- `POST /api/ai/rozgar-mitra`
- `GET /api/chat/:jobId`

## 24. Why use Socket.io instead of polling?

- Socket.io provides instant message delivery.
- It reduces network overhead compared to constant polling.
- It handles room management and reconnection cleanly.

## 25. What is the most important design idea in this project?

The key idea is making blue-collar work accessible by combining:
- simple mobile/web UI,
- phone-based login,
- real-time chat,
- AI-assisted voice/text understanding,
- and a flexible backend built on MongoDB.

## 26. How would you explain the solution in one sentence?

RozgarSetu is a full-stack marketplace that connects workers and contractors using web, mobile, real-time chat, and AI-based language understanding to make job matching faster and easier.

---

### Notes for interviews

Use this document to answer questions clearly. Mention the use of AI prompting for structured data extraction, the fallback parser for reliability, and the combination of MongoDB, Express, React, and Expo for a consistent JavaScript/full-stack application.
