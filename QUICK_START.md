# ⚡ Quick Start - RozgarSetu

## Start Everything in 3 Terminal Windows

### Terminal 1 - Backend (Node.js)
```bash
cd rozgarSetu-Backend
npm install
npm run dev
```
✅ Backend ready at: `http://localhost:5000`

---

### Terminal 2 - Frontend (React Web)
```bash
cd Frontend
npm install
npm run dev
```
✅ Frontend ready at: `http://localhost:5173`

---

### Terminal 3 - WorkerApp (React Native)
```bash
cd WorkerApp
npm install
npx expo start
```
Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo app for physical device

✅ Mobile app ready in emulator/device

---

## 🧪 Test OTP (Immediate Testing)

### Using Frontend Web

1. Go to `http://localhost:5173`
2. Go to Worker Login
3. Enter any name (e.g., "Test User")
4. Enter phone: `9876543210`
5. Click "Send OTP"
6. Check backend console for: `🔐 OTP for 9876543210: 123456`
7. Copy the OTP and paste in frontend
8. Click "Verify OTP"
9. ✅ Success! You should see "Login successful!"

---

## 📱 Test Language Selection (WorkerApp)

1. Launch WorkerApp in emulator
2. See language selection screen (English/Hindi)
3. Select a language
4. Close and reopen app
5. ✅ Language is remembered!

---

## 📡 API Test with cURL

```bash
# 1. Send OTP
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210"}'

# 2. Copy OTP from response (dev mode)

# 3. Verify OTP
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test User",
    "phone":"9876543210",
    "otp":"123456",
    "role":"worker"
  }'

# 4. Get profile with token (copy token from previous response)
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🎯 What Works Now

| Feature | Status |
|---------|--------|
| Backend OTP | ✅ |
| Frontend Login | ✅ |
| WorkerApp Login | ✅ |
| Language Selection | ✅ |
| Token Management | ✅ |
| Error Handling | ✅ |

---

## 📖 Full Documentation

- **SETUP_GUIDE.md** - Complete setup and architecture
- **TESTING_GUIDE.md** - Detailed testing procedures
- **IMPLEMENTATION_SUMMARY.md** - What was fixed

---

## 🐛 Quick Fixes

**Backend not starting?**
```bash
cd rozgarSetu-Backend
npm install  # Install dependencies
npm run dev  # Start
```

**Frontend won't connect?**
- Check `Frontend/.env.local` has: `VITE_API_BASE_URL=http://localhost:5000/api`

**WorkerApp can't reach backend?**
- Android emulator: Use `10.0.2.2` (in `.env.local`)
- iOS simulator: Use `localhost`
- Physical device: Use your machine's local IP

---

**That's it! You're ready to go! 🚀**
