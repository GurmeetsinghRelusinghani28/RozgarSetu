# RozgarSetu Worker App

This folder contains a React Native worker-side app built with Expo and wired to the same backend routes already used in the web frontend.

## Included worker flows

- Language selection
- OTP login
- Worker profile creation/edit
- Worker dashboard
- Job listing with apply/save actions
- Worker profile view
- Help center
- Skill tips
- Earnings screen

## Backend endpoints used

- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`
- `GET /api/worker/profile`
- `POST /api/worker/profile`
- `GET /api/worker/dashboard`
- `POST /api/worker/dashboard/save/:projectId`
- `POST /api/worker/dashboard/apply/:projectId`
- `GET /api/projects`

## Setup

1. Open this folder:

```powershell
cd c:\RozgarSetu\WorkerApp
```

2. Install dependencies:

```powershell
npm install
```

3. Set the backend URL for your environment.

Important:
- Android emulator should usually use `10.0.2.2`
- iOS simulator can use `localhost`
- A physical phone must use your computer's LAN IP, for example `192.168.1.10`

Recommended:

```powershell
cd c:\RozgarSetu\WorkerApp
copy .env.example .env
```

Then set:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:5000/api
```

If you do not set `.env`, the app will try to auto-detect the Expo dev host first, then fall back to emulator-safe defaults.

4. Start Expo:

```powershell
npm start
```

## Notes

- The machine path `rozgarSetu-Backend` was not present in this workspace, so the app is connected using the API contracts visible in your web frontend.
- Some worker web pages still use mock data today, especially support/earnings style screens. Those remain mobile-ready but are currently local-data screens too.
