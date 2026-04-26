# 🧪 OTP Testing Guide

## Quick Start Testing

### Prerequisites
1. Backend running: `npm run dev` from `rozgarSetu-Backend/`
2. Test Phone Number: Any 10-digit Indian number starting with 6-9 (e.g., `9876543210`)

---

## ✅ Test 1: OTP Generation (Backend)

### Using Postman

1. **Open Postman** and create a new POST request
2. **URL:** `http://localhost:5000/api/auth/send-otp`
3. **Headers:** 
   ```
   Content-Type: application/json
   ```
4. **Body (raw JSON):**
   ```json
   {
     "phone": "9876543210"
   }
   ```
5. **Send** and check response:
   ```json
   {
     "success": true,
     "message": "OTP sent successfully",
     "otp": "123456"
   }
   ```
6. **Check backend console** - you'll see: `🔐 OTP for 9876543210: 123456`

---

## ✅ Test 2: OTP Verification (Backend)

### Using Postman

1. **Create new POST request**
2. **URL:** `http://localhost:5000/api/auth/verify-otp`
3. **Headers:**
   ```
   Content-Type: application/json
   ```
4. **Body (raw JSON):**
   ```json
   {
     "name": "Test User",
     "phone": "9876543210",
     "otp": "123456",
     "role": "worker"
   }
   ```
5. **Send** and check response:
   ```json
   {
     "success": true,
     "message": "Login successful",
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": {
       "id": "507f1f77bcf86cd799439011",
       "name": "Test User",
       "phone": "9876543210",
       "role": "worker"
     }
   }
   ```

---

## ✅ Test 3: Using Saved Token

### Get User Profile

1. **Create new GET request**
2. **URL:** `http://localhost:5000/api/auth/profile`
3. **Headers:**
   ```
   Content-Type: application/json
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   (Replace with token from Test 2)
4. **Send** and check response:
   ```json
   {
     "success": true,
     "user": {
       "_id": "507f1f77bcf86cd799439011",
       "name": "Test User",
       "phone": "9876543210",
       "role": "worker",
       "isVerified": true,
       "createdAt": "2024-04-25T10:30:00.000Z"
     }
   }
   ```

---

## ✅ Test 4: Frontend Web OTP Flow

### Step-by-Step

1. **Start Backend:**
   ```bash
   cd rozgarSetu-Backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd Frontend
   npm run dev
   ```

3. **Open Browser:** `http://localhost:5173`

4. **Navigate to Worker Login:**
   - Click on login option → Select Worker → Go to login

5. **Test OTP Flow:**

   **Step 1 - Enter Name:**
   - Type any name (e.g., "Raj Kumar")
   - Click "Next"

   **Step 2 - Enter Phone:**
   - Type 10-digit phone (e.g., "9876543210")
   - Click "Send OTP"
   - Check browser console (F12) for development OTP

   **Step 3 - Enter OTP:**
   - Enter the OTP you copied
   - Click "Verify OTP"
   - Should redirect to worker profile page

---

## ✅ Test 5: WorkerApp Mobile OTP Flow

### On Android Emulator

1. **Start Backend:**
   ```bash
   cd rozgarSetu-Backend
   npm run dev
   ```

2. **Update WorkerApp config:**
   ```bash
   # WorkerApp/.env.local should have:
   EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:5000/api
   EXPO_PUBLIC_API_HOST=10.0.2.2
   ```

3. **Start WorkerApp:**
   ```bash
   cd WorkerApp
   npm install  # if not already done
   npx expo start
   ```

4. **Press 'a'** to open Android emulator

5. **Test Language Selection:**
   - App should load Splash screen
   - Then show Language Selection screen
   - Select English or Hindi
   - Selection should persist on app restart

6. **Test OTP Flow:**

   **Step 1 - Enter Name:**
   - Type any name
   - Tap "Next"

   **Step 2 - Enter Phone:**
   - Type 10-digit phone
   - Tap "Send OTP"
   - Should see alert with message
   - Check app console for development OTP

   **Step 3 - Enter OTP:**
   - Enter the OTP
   - Tap "Verify OTP"
   - Should navigate to Profile Setup

---

## ✅ Test 6: Error Handling

### Test Invalid Phone

**Request:**
```json
{
  "phone": "123"
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid phone number. Please enter a valid 10-digit Indian mobile number."
}
```

---

### Test Invalid OTP

**Request:**
```json
{
  "name": "Test User",
  "phone": "9876543210",
  "otp": "000000",
  "role": "worker"
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid OTP. 3 attempts remaining."
}
```

---

### Test OTP Expiry

1. Send OTP to a phone
2. Wait 10+ minutes
3. Try to verify
4. **Expected Response:**
```json
{
  "success": false,
  "message": "OTP expired or invalid. Please request a new OTP."
}
```

---

### Test Too Many Attempts

1. Send OTP to a phone
2. Try wrong OTP 3 times
3. **After 3rd attempt:**
```json
{
  "success": false,
  "message": "Too many failed attempts. Please request a new OTP."
}
```

---

## ✅ Test 7: User Creation & Duplicate Login

### First Login (User Creation)

**Request:**
```json
{
  "name": "New Worker",
  "phone": "9876543210",
  "otp": "123456",
  "role": "worker"
}
```

**Response:** User created with worker profile

---

### Second Login (Existing User)

**Request (different OTP):**
```json
{
  "name": "New Worker",
  "phone": "9876543210",
  "otp": "654321",
  "role": "worker"
}
```

**Response:** Existing user logged in (no duplicate created)

---

## 🔍 Debugging Tips

### Check Backend OTP in Console

```bash
# You'll see:
🔐 OTP for 9876543210: 123456
```

### Enable Network Inspection (Frontend)

1. Open DevTools (F12)
2. Go to Network tab
3. Perform OTP action
4. Click on request to see:
   - Request payload
   - Response data
   - Headers

### Enable Network Inspection (WorkerApp)

1. Open Expo DevTools
2. Go to Network tab
3. Perform OTP action
4. Check request/response

### Backend Logs

Watch terminal where backend is running:
```
✅ Language loaded from storage: en
📝 No language selected yet
🔐 OTP for 9876543210: 123456
```

---

## 📊 Test Scenarios

| Scenario | Expected Result | Status |
|----------|-----------------|--------|
| Send OTP with valid phone | OTP generated, stored | ✅ |
| Send OTP with invalid phone | Error message | ✅ |
| Verify with correct OTP | User logged in, token returned | ✅ |
| Verify with wrong OTP | Error + attempts remaining | ✅ |
| Verify after 3 wrong attempts | OTP invalidated, new request required | ✅ |
| Verify after 10 minutes | OTP expired error | ✅ |
| First login with new phone | User and profile created | ✅ |
| Second login with same phone | Existing user logged in | ✅ |
| Language selection persists | App remembers language on restart | ✅ |
| Frontend OTP flow | Complete flow works | ✅ |
| WorkerApp OTP flow | Complete flow works | ✅ |

---

## 🎯 Common Issues & Fixes

### Issue: "Cannot POST /api/auth/send-otp"

**Cause:** Backend not running or wrong URL  
**Fix:**
```bash
cd rozgarSetu-Backend
npm run dev
```

---

### Issue: "ECONNREFUSED" in frontend/app

**Cause:** Wrong API URL  
**Fix:** Check `.env.local` file:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

### Issue: "OTP sent successfully" but app crashes

**Cause:** Missing error handling  
**Fix:** Check browser console for full error

---

### Issue: WorkerApp can't reach backend

**Cause:** Wrong host for emulator  
**Fix:** Use `10.0.2.2` for Android, `localhost` for iOS

---

## ✨ Success Criteria

Your setup is working correctly when:

- ✅ Backend sends OTP without errors
- ✅ Backend verifies OTP and returns token
- ✅ Frontend can send and verify OTP
- ✅ WorkerApp can send and verify OTP
- ✅ Language selection persists in WorkerApp
- ✅ Token stored correctly in browser/app storage
- ✅ User profile API works with token
- ✅ Error messages display appropriately

---

## 📞 Still Having Issues?

Check these in order:

1. **Backend running?** → Check port 5000
2. **Database connected?** → Check MongoDB connection
3. **Correct API URL?** → Check .env files
4. **Valid phone format?** → 10 digits starting with 6-9
5. **Token saved properly?** → Check localStorage/AsyncStorage
6. **Console errors?** → Share full error message

---

**Happy Testing! 🚀**
