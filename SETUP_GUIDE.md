# RozgarSetu - Complete Setup & Integration Guide

## 🏗️ Project Architecture

```
RozgarSetu
├── rozgarSetu-Backend/          ← Node.js/Express API (Shared for all apps)
├── Frontend/                    ← React Web App (for Contractors)
├── WorkerApp/                   ← React Native App (for Workers with Expo)
└── myApp/                       ← React Native (Alternative mobile app)
```

## ✅ What Has Been Fixed

### 1. **Backend OTP Authentication** ✨
- ✅ Implemented in-memory OTP store (works without Twilio credentials)
- ✅ OTP validation with attempt limiting (max 3 attempts)
- ✅ OTP expiry time (10 minutes)
- ✅ Automatic user creation on first login
- ✅ JWT token generation for authenticated requests
- ✅ Support for both workers and contractors

### 2. **WorkerApp Language Selection** 🌍
- ✅ Fixed language persistence using AsyncStorage
- ✅ Proper initialization on app startup
- ✅ Language state properly tracked (hasSelectedLanguage flag)
- ✅ Automatic language loading from storage
- ✅ Shows language selection screen only on first launch

### 3. **OTP Flow Integration** 📱
- ✅ WorkerApp LoginScreen with complete OTP flow
- ✅ Frontend WorkerLogin with complete OTP flow
- ✅ Proper error handling and validation
- ✅ Loading states and user feedback

### 4. **API Client Setup** 🔌
- ✅ Axios-based API client for WorkerApp with:
  - Request interceptors for auth tokens
  - Response error handling
  - Automatic token attachment to requests
- ✅ Environment variables for API base URL configuration

---

## 🚀 How to Run the Project

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (running locally or cloud connection)
- npm or yarn
- Expo CLI (for WorkerApp)

### Step 1: Setup Backend

```bash
cd rozgarSetu-Backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Update .env with your values:
# MONGO_URI=mongodb://localhost:27017/rozgarsetu
# JWT_SECRET=your-super-secret-key

# Start the server
npm run dev
```

Backend runs on: **http://localhost:5000**

### Step 2: Setup Frontend (Contractor Website)

```bash
cd Frontend

# Install dependencies
npm install

# Create .env.local file (or check if already created)
# Should contain: VITE_API_BASE_URL=http://localhost:5000/api

# Start development server
npm run dev
```

Frontend runs on: **http://localhost:5173** (or similar)

### Step 3: Setup WorkerApp (Mobile)

```bash
cd WorkerApp

# Install dependencies
npm install

# Check .env.local file exists with:
# EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:5000/api  (for Android emulator)
# or your machine's local IP for physical device

# Start Expo
npx expo start

# Choose:
# - Press 'i' for iOS simulator
# - Press 'a' for Android emulator
# - Scan QR code with Expo app on physical device
```

---

## 🔐 OTP Authentication Flow

### Backend OTP Process

```
1. User enters phone number → POST /api/auth/send-otp
   ├─ Generates 6-digit OTP
   ├─ Stores with expiry (10 minutes)
   └─ Returns OTP in development mode

2. User enters OTP → POST /api/auth/verify-otp
   ├─ Validates OTP (max 3 attempts)
   ├─ Creates user if first time
   ├─ Creates worker profile for workers
   └─ Returns JWT token (valid 7 days)

3. Client stores token
   └─ Sends in Authorization header for authenticated requests
```

### Frontend (Web) OTP Flow

**File:** `Frontend/src/pages/WorkerLogin.tsx`

```
Step 1: Enter Name → setStep('name')
Step 2: Enter Phone → setStep('phone')
Step 3: Send OTP via POST /api/auth/send-otp
Step 4: Enter OTP → setStep('otp')
Step 5: Verify OTP via POST /api/auth/verify-otp
       ├─ Save token to localStorage
       └─ Redirect to /worker-profile
```

### WorkerApp (Mobile) OTP Flow

**File:** `WorkerApp/src/screens/LoginScreen.tsx`

```
Step 1: Enter Name → setStep('name')
Step 2: Enter Phone → setStep('phone')
Step 3: Send OTP via api.post('/auth/send-otp')
Step 4: Enter OTP → setStep('otp')
Step 5: Verify OTP via api.post('/auth/verify-otp')
       ├─ Save token to AsyncStorage
       └─ Navigate to ProfileSetup
```

---

## 🌍 Language Selection Flow

### WorkerApp Language Selection

**File:** `WorkerApp/src/contexts/LanguageContext.tsx`

```
1. App Starts
   ├─ LanguageProvider initializes
   ├─ Loads language from AsyncStorage
   └─ Sets isLanguageReady = true

2. RootNavigator checks:
   ├─ If isLanguageReady && hasSelectedLanguage
   │  └─ Show Login screen
   └─ Otherwise
      └─ Show Language Selection screen

3. User selects language
   ├─ Saves to AsyncStorage
   └─ Navigates to Login
```

### Language Persistence

- **Storage Key:** `rozgarsetu-worker-lang`
- **Default Language:** English (`en`)
- **Supported Languages:** English (`en`), Hindi (`hi`)
- **Storage Type:** AsyncStorage (mobile) / localStorage (web)

---

## 📡 API Endpoints

### Authentication Routes

| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/api/auth/send-otp` | POST | `{ phone: "9876543210" }` | `{ success, message, otp? }` |
| `/api/auth/verify-otp` | POST | `{ name, phone, otp, role }` | `{ success, token, user }` |
| `/api/auth/profile` | GET | Header: `Authorization: Bearer <token>` | `{ success, user }` |
| `/api/auth/profile` | PUT | `{ name, email, company, ... }` | `{ success, user }` |

### Example: Send OTP

```javascript
// Frontend (Web)
const response = await axios.post('http://localhost:5000/api/auth/send-otp', {
  phone: '9876543210'
});
// Response: { success: true, message: "OTP sent...", otp: "123456" (dev only) }
```

### Example: Verify OTP

```javascript
// WorkerApp (Mobile)
const response = await api.post('/auth/verify-otp', {
  name: 'John Doe',
  phone: '9876543210',
  otp: '123456',
  role: 'worker'
});
// Response: { success: true, token: "jwt_token_here", user: {...} }
```

---

## 🔗 Frontend to Backend Connection

### How Frontend Connects to Backend

**File:** `Frontend/.env.local`
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

**File:** `Frontend/src/pages/WorkerLogin.tsx`
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

// Send OTP
await axios.post(`${API_BASE_URL}/auth/send-otp`, { phone })

// Verify OTP
await axios.post(`${API_BASE_URL}/auth/verify-otp`, { name, phone, otp, role: 'worker' })
```

---

## 🔗 WorkerApp to Backend Connection

### How WorkerApp Connects to Backend

**File:** `WorkerApp/src/constants/config.ts`
```typescript
export const API_BASE_URL = envApiBaseUrl ?? `http://${apiHost}:5000/api`

// For Android emulator: http://10.0.2.2:5000/api
// For iOS simulator: http://localhost:5000/api
// For physical device: http://<YOUR_IP>:5000/api
```

**File:** `WorkerApp/src/api/client.ts`
```typescript
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

// Includes request interceptor for auth token
// Includes response interceptor for error handling
```

**Usage in Components:**
```typescript
// Send OTP
const response = await api.post('/auth/send-otp', { phone })

// Verify OTP
const response = await api.post('/auth/verify-otp', { name, phone, otp, role: 'worker' })
```

---

## 🔑 Token Management

### Token Storage

| Platform | Storage | Key |
|----------|---------|-----|
| Frontend (Web) | localStorage | `rozgarsetu-token` |
| WorkerApp (Mobile) | AsyncStorage | `rozgarsetu-worker-token` |

### Token Usage

**Frontend (Web):**
```typescript
// Save token
localStorage.setItem('rozgarsetu-token', response.data.token)

// Use in requests
axios.post(url, data, {
  headers: { Authorization: `Bearer ${token}` }
})
```

**WorkerApp (Mobile):**
```typescript
// Save token
await AsyncStorage.setItem(TOKEN_KEY, nextToken)

// Automatically added by API interceptor
// No manual header management needed
```

---

## 🐛 Testing OTP Flow

### Using Postman or cURL

```bash
# 1. Send OTP
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210"}'

# Response (dev mode):
# { "success": true, "message": "OTP sent successfully", "otp": "123456" }

# 2. Verify OTP (use the OTP from response)
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "name":"John Doe",
    "phone":"9876543210",
    "otp":"123456",
    "role":"worker"
  }'

# Response:
# {
#   "success": true,
#   "message": "Login successful",
#   "token": "eyJhbGciOiJIUzI1NiIs...",
#   "user": { "id": "...", "name": "John Doe", "phone": "9876543210", "role": "worker" }
# }
```

---

## 📋 Troubleshooting

### Issue: "OTP expired or invalid"
**Solution:** 
- OTP expires after 10 minutes
- Request a new OTP
- Check server console for generated OTP (dev mode)

### Issue: "Too many failed attempts"
**Solution:**
- User exceeded 3 OTP attempts
- Must request a new OTP
- Previous OTP is invalid

### Issue: Backend returns "Invalid token"
**Solution:**
- Token might have expired (valid 7 days)
- Must login again to get new token
- Check JWT_SECRET matches in .env

### Issue: WorkerApp can't reach backend
**Solution:**
- Android Emulator: Use `10.0.2.2` as host (not localhost)
- iOS Simulator: Use `localhost`
- Physical Device: Use your machine's local IP (e.g., `192.168.x.x`)
- Update `.env.local` with correct address

### Issue: Frontend can't reach backend
**Solution:**
- Check `VITE_API_BASE_URL` in `.env.local`
- Ensure backend is running on port 5000
- Check CORS is enabled in backend

---

## 📱 Mobile Device Testing

### To test WorkerApp on physical device:

1. **Get your machine's IP:**
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. **Update `WorkerApp/.env.local`:**
   ```env
   EXPO_PUBLIC_API_BASE_URL=http://192.168.1.5:5000/api
   EXPO_PUBLIC_API_HOST=192.168.1.5
   ```

3. **Ensure device is on same network as your machine**

4. **Start Expo and scan QR code:**
   ```bash
   npx expo start
   # Scan QR code with Expo app
   ```

---

## 🎯 Next Steps

1. **Configure MongoDB:** Update `MONGO_URI` in backend `.env`
2. **Add SMS Integration:** Replace OTP storage with Twilio when ready
3. **Setup Contractor Routes:** Implement contractor login and dashboard
4. **Add Password Protection:** For contractor sign-ups
5. **Setup Image Uploads:** For worker and contractor profiles
6. **Implement Real-time Features:** Using Socket.io or similar

---

## 📚 File Structure Reference

```
rozgarSetu-Backend/
├── controllers/authController.js      ← OTP & Auth logic
├── middleware/authMiddleware.js        ← Token validation
├── models/User.js                      ← User schema
├── routes/authRoutes.js                ← Auth endpoints
├── config/
│   ├── db.js                           ← MongoDB connection
│   └── twilio.js                       ← Twilio config
└── .env.example                        ← Environment template

Frontend/
├── src/
│   ├── pages/WorkerLogin.tsx           ← OTP login flow
│   ├── contexts/LanguageContext.tsx    ← Language state
│   └── App.tsx                         ← Main app
└── .env.local                          ← API configuration

WorkerApp/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx             ← OTP login
│   │   └── LanguageSelectionScreen.tsx ← Language selection
│   ├── contexts/
│   │   ├── AuthContext.tsx             ← Auth state
│   │   └── LanguageContext.tsx         ← Language state
│   ├── api/client.ts                   ← API client
│   ├── navigation/RootNavigator.tsx    ← App routing
│   └── constants/config.ts             ← API config
└── .env.local                          ← API configuration
```

---

## ✨ Summary

**Everything is now connected and working:**

✅ Backend OTP system (no Twilio needed in development)  
✅ WorkerApp language selection persists on app restart  
✅ Frontend and WorkerApp both can authenticate via OTP  
✅ API clients configured with proper error handling  
✅ Token management for both web and mobile  
✅ Complete integration between all three parts  

**To start development:**
```bash
# Terminal 1 - Backend
cd rozgarSetu-Backend && npm run dev

# Terminal 2 - Frontend
cd Frontend && npm run dev

# Terminal 3 - WorkerApp
cd WorkerApp && npx expo start
```

🎉 **Your RozgarSetu app is ready to use!**
