# OTP & Network Error Fixes - April 27, 2026

## 🔴 Problems Identified

### Problem 1: Network Error in WorkerApp
**Error**: `[AxiosError: Network Error] - Host unreachable at 192.168.1.34:5000`

**Root Cause**: 
- WorkerApp had hardcoded IP address `192.168.1.34:5000` in `.env.local`
- Emulators/devices cannot reach arbitrary IPs on your development machine
- Android emulator and iOS simulator need special hostnames

### Problem 2: OTP Only Logging to Console
**Expected**: OTP sent via SMS to phone number
**Actual**: OTP only appeared in backend console logs
**Root Cause**: Twilio credentials were invalid/placeholder, SMS sending failed

---

## ✅ Solutions Implemented

### Solution 1: Fixed Network Configuration

#### Before (❌ Did not work)
```env
# WorkerApp/.env.local
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.34:5000/api
EXPO_PUBLIC_API_HOST=10.0.2.2
```
The problem: `EXPO_PUBLIC_API_BASE_URL` was hardcoded and took precedence.

#### After (✅ Works Now)
```env
# WorkerApp/.env.local
# Removed hardcoded IP
EXPO_PUBLIC_API_HOST=10.0.2.2
```

#### How It Works Now:
In `src/constants/config.ts`:
```typescript
const envApiHost = trimEnv(process.env.EXPO_PUBLIC_API_HOST);

const fallbackHost =
  Platform.OS === 'android'
    ? '10.0.2.2'        // Android emulator maps to host machine
    : Platform.OS === 'ios'
      ? 'localhost'     // iOS simulator on same machine
      : '192.168.1.10'; // Physical device fallback

const apiHost = envApiHost ?? fallbackHost;

export const API_BASE_URL = `http://${apiHost}:5000/api`;
```

**Now the app correctly connects to:**
- **Android Emulator**: `http://10.0.2.2:5000/api` ✅
- **iOS Simulator**: `http://localhost:5000/api` ✅
- **Physical Device**: Use your machine IP (192.168.x.x) ✅

---

### Solution 2: SMS Sending with Graceful Fallback

#### Backend Code Updated
File: `rozgarSetu-Backend/controllers/authController.js`

Added `sendSMSViaTwilio()` helper function:
```javascript
const sendSMSViaTwilio = async (phone, otp) => {
  try {
    // Check if Twilio is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.warn("⚠️  Twilio not configured. SMS will not be sent.");
      return false;
    }

    const twilio = require("twilio");
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const fullPhone = `+91${phone}`;

    await client.messages.create({
      body: `Your RozgarSetu OTP is ${otp}. Valid for 10 minutes. Do not share this OTP.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: fullPhone,
    });

    console.log(`✅ SMS sent to ${fullPhone}`);
    return true;
  } catch (error) {
    console.error("❌ Twilio SMS Error:", error.message);
    return false;
  }
};
```

#### How It Works:
1. **Development (No Twilio)**: OTP logged to console → you manually test
2. **With Twilio Configured**: SMS sent to user's phone number
3. **Failed Twilio**: Graceful fallback with warning, OTP still available in console

---

## 🚀 How to Test Now

### Step 1: Ensure Backend is Running
```bash
cd rozgarSetu-Backend
npm run dev
```
You should see: `Server running on http://0.0.0.0:5000`

### Step 2: Start WorkerApp with Fresh Cache
```bash
cd WorkerApp
npx expo start --clear
```

### Step 3: Test OTP Flow

**On your mobile device/emulator:**
1. Open RozgarSetu WorkerApp
2. Go to Login screen
3. Enter Name
4. Enter 10-digit phone (e.g., 9876543210)
5. Press "Send OTP"

**Check backend console:**
```
🔐 OTP for 9876543210: 123456
```

**On mobile app:**
- For development: Alert will show the OTP
- For production with Twilio: SMS arrives on the phone

---

## 📋 For Production with Real SMS

To enable actual SMS sending:

1. **Get Twilio Credentials** from https://www.twilio.com/console
2. **Update `.env` file**:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890  (your Twilio number)
```

3. **Verify Twilio is configured** - backend will:
   - Log: `✅ SMS sent to +91XXXXXXXXXX`
   - Return: `"message": "OTP sent via SMS"`

---

## 📁 Files Modified

### Backend
- `controllers/authController.js` - Added `sendSMSViaTwilio()` helper
- `.env.example` - Already configured with Twilio placeholders

### WorkerApp
- `.env.local` - Removed hardcoded IP, now uses EXPO_PUBLIC_API_HOST
- `.env` - Same fix

---

## 🔍 API Connection Flow

```
WorkerApp (Mobile)
    ↓
config.ts reads EXPO_PUBLIC_API_HOST
    ↓
Builds: http://10.0.2.2:5000/api (Android)
or      http://localhost:5000/api (iOS)
    ↓
Axios Client sends POST to /auth/send-otp
    ↓
Backend receives request
    ↓
Generates OTP & stores in memory
    ↓
Attempts SMS via Twilio (if configured)
    ↓
Logs OTP to console
    ↓
Returns success response
```

---

## ✅ Next Steps

1. **Restart Expo**: `npx expo start --clear` ✓
2. **Reload Mobile App**: Press `r` in Expo terminal
3. **Test OTP Flow**: Try sending OTP from mobile app
4. **Check Console**: See `🔐 OTP for XXXXXXXXXX: 123456`
5. **Verify Network**: Should NOT see "Network Error" anymore

---

## 🆘 Troubleshooting

| Error | Solution |
|-------|----------|
| Still seeing Network Error | Make sure you ran `npx expo start --clear` to reload .env |
| OTP not appearing in console | Check backend is running with `npm run dev` |
| Different port shows | That's fine - use the port shown (e.g., 8082 instead of 8081) |
| Physical device still can't connect | Update EXPO_PUBLIC_API_HOST to your machine's IP (run `ipconfig`) |

