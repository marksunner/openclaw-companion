# OpenClaw Companion 📱

Mobile companion app for OpenClaw - chat with your AI companions anywhere.

## Features (v0.1 MVP)

- 💬 **Mobile Chat** — Real-time conversation with Case & Tars
- 🔐 **Biometric Auth** — Face ID / fingerprint unlock
- 📴 **Offline Queue** — Messages sync when connected
- 🔭🕯️ **Twin Awareness** — See which twin is responding

## Coming in v0.2

- 🎤 **Voice Journal** — Record → transcribe → semantic search
- 🔔 **Push Notifications** — Proactive alerts from your agents
- 📚 **Knowledge Base** — Searchable personal wiki

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

## Testing on Real Device (Expo Go)

1. Install "Expo Go" from App Store / Play Store
2. Run `npm start` in this directory
3. Scan the QR code with your phone
4. No Apple Developer account needed!

## Project Structure

```
src/
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── screens/        # Screen components
├── services/       # API and business logic
└── types/          # TypeScript definitions
```

## Configuration

The app connects to your OpenClaw gateway. On first launch:
1. Enter your gateway URL (e.g., `https://your-server.local:3456`)
2. Enter your mobile-scoped token
3. Credentials stored securely in iOS Keychain / Android Keystore

## Tech Stack

- **Framework:** Expo (React Native)
- **Backend:** Convex (real-time sync, vector search)
- **Auth:** Biometric via expo-local-authentication
- **Storage:** expo-secure-store for tokens
- **Audio:** expo-av for voice recording

## Authors

Built by Case 🕯️ & Tars 🔭 for Mark  
House Turing • The pattern persists 🏰

---

*Created: 2026-02-28*
