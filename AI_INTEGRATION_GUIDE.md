# 🎙️ RozgarSetu AI Voice Profile Assistant Guide

This guide details how to set up, configure, and test the **Multilingual AI Voice Profile Assistant (Speech-to-Profile)** on both the Web Frontend and the Mobile App.

---

## ⚙️ Backend Configuration

The AI assistant utilizes the Google Gemini API (`gemini-1.5-flash`) for multi-lingual speech transcription and profile data extraction.

### Step 1: Get a Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Log in with your Google account.
3. Click on **Create API Key**.
4. Copy the API Key.

### Step 2: Configure Environment Variables
Open the `.env` file in the `rozgarSetu-Backend` folder and add your API Key at the bottom:
```env
# Google Gemini API Key
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 🛡️ Graceful Mock Fallback (For Development without API Key)
If `GEMINI_API_KEY` is not set, the backend runs a **Mock Parsing Engine** that uses simple rule-based heuristics. This allows you to test the complete button-clicking and field-filling flows even if you don't have internet access or a Gemini key!

---

## 💻 Testing the Web Frontend

1. Ensure the backend and frontend are running:
   ```bash
   # Backend
   cd rozgarSetu-Backend
   npm run dev

   # Web Frontend
   cd Frontend
   npm run dev
   ```
2. Log in as a worker on the web frontend.
3. Go to the **Create Profile** / **Worker Profile** setup screen (`/worker-profile`).
4. At the top of Step 0, click the **"Try Voice Setup"** button.
5. Tap the **Microphone** icon. Grant the browser microphone permission if prompted.
6. Speak your description. For example, in Hindi:
   > *"मेरा नाम हरीश कुमार है। मैं मुंबई का रहने वाला हूँ और मुझे ४ साल का वेल्डिंग का काम आता है।"*
7. Your spoken words will transcribe on the screen.
8. Click **"Auto-fill Profile Details"**.
9. The form will parse and auto-fill:
   - **Name**: हरीश कुमार
   - **City**: Mumbai
   - **Experience**: 4 years
   - **Skills**: Welder (checked automatically)

---

## 📱 Testing the Mobile App (WorkerApp)

1. Make sure your Expo development server is running:
   ```bash
   cd WorkerApp
   npx expo start
   ```
2. Log in as a worker. You will be taken to the profile onboarding steps.
3. On Step 0 (Name input), tap **"Use Voice"**.
4. **Testing Real Voice (on physical device or mic-enabled simulator):**
   - Press and hold the **Microphone** button.
   - Speak your description.
   - Release the button. The audio is recorded via `expo-av`, sent to the backend, and analyzed by Gemini.
5. **Testing Text Fallback (Highly recommended for emulators/simulators):**
   - Since emulators often don't have access to microphones or fail audio recording:
   - Paste a description in the **"OR TYPE DESCRIPTION FALLBACK"** box. E.g.:
     > *"मेरा नाम सुरेश कुमार है, मैं नोएडा में रहता हूँ और मुझे ५ साल का वेल्डिंग का अनुभव है।"*
   - Tap **"Auto-fill Details"**.
6. The app will parse the response and fill out the name, city, experience, and skills across all onboarding steps in one shot!
