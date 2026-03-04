# OpenClaw Companion 📱

![Version](https://img.shields.io/badge/version-0.2.0-blue)
[![OpenClaw Compatible](https://img.shields.io/badge/OpenClaw-Compatible-blue)](https://github.com/openclaw/openclaw)

Mobile companion app for OpenClaw — chat with your AI agents and capture meetings on the go.

## Features

### 💬 Mobile Chat (v0.1)
- Real-time conversation with your OpenClaw agents
- Twin awareness (see which agent responds: 🔭 Tars / 🕯️ Case)
- Offline message queue with sync
- Biometric authentication (Face ID / fingerprint)

### 🎙️ Meeting Capture (v0.2 — NEW)
- **One-tap recording** — Record meetings directly from your phone
- **AI transcription** — Whisper API for accurate speech-to-text
- **Structured extraction** — Automatic identification of:
  - 📋 Key topics discussed
  - ✅ Decisions made
  - 📝 Action items with owners and due dates
  - ❓ Open questions
  - 📋 Follow-ups needed
- **Agent integration** — Share notes with your AI for discussion and follow-up
- **Local storage** — All notes saved on device, synced when you choose

## Architecture

```
📱 Phone                           🖥️ Home (OpenClaw Gateway)
┌────────────────────┐            ┌──────────────────────────┐
│  Record Meeting    │            │                          │
│  ↓                 │            │  Whisper API             │
│  Upload Audio      │ ────────▶ │  ↓                       │
│  ↓                 │            │  AI Structure Extraction │
│  View Notes        │ ◀──────── │  ↓                       │
│  ↓                 │            │  Structured Markdown     │
│  Discuss w/ Agent  │ ────────▶ │  ↓                       │
│                    │ ◀──────── │  Agent Discussion        │
└────────────────────┘            └──────────────────────────┘
```

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS (simulator or Expo Go)
npm run ios
```

### Testing on Real Device (Expo Go)

1. Install "Expo Go" from App Store / Play Store
2. Run `npm start` in this directory
3. Scan the QR code with your phone
4. No Apple Developer account needed!

## Project Structure

```
src/
├── components/          # Reusable UI components
├── hooks/               # Custom React hooks
├── screens/
│   ├── ChatScreen.tsx        # 💬 Main chat interface
│   ├── MeetingRecordScreen.tsx  # 🎙️ Audio recording
│   └── MeetingNotesScreen.tsx   # 📋 Notes viewer
├── services/
│   ├── openclawService.ts   # Gateway communication
│   └── meetingService.ts    # Meeting capture pipeline
└── types/
    ├── chat.ts              # Chat message types
    └── meeting.ts           # Meeting note types
```

## Configuration

### Gateway Connection
The app connects to your OpenClaw gateway:
1. Enter your gateway URL (e.g., `https://your-server.local:18789`)
2. Enter your gateway token
3. Credentials stored securely in iOS Keychain / Android Keystore

### Meeting Capture
For direct Whisper API access (faster, no gateway roundtrip):
- Store your OpenAI API key in the app settings
- Falls back to gateway proxy if no key configured

## Workflow Example

### Meeting with James

1. **Before meeting:** Open app, tap 🎙️ Record
2. **During meeting:** App records in background
3. **After meeting:** Stop recording, add title + participants
4. **Processing:** App transcribes → extracts → structures
5. **Review:** Browse structured notes with decisions and action items
6. **Follow-up:** Tap "Discuss with Agent" to share notes with Tars or Case

```
You: "Here are my notes from the James call today"
Agent: "I see 3 action items. The email templates are due Friday -
        want me to draft those now?"
```

## Tech Stack

- **Framework:** React Native (Expo)
- **Audio:** expo-av for recording
- **Storage:** expo-file-system + expo-secure-store
- **Auth:** expo-local-authentication (biometrics)
- **Backend:** OpenClaw Gateway (OpenAI-compatible API)
- **Transcription:** OpenAI Whisper API
- **Extraction:** GPT-4o-mini via gateway

## Cost Estimate

| Component | Cost |
|-----------|------|
| Whisper transcription | ~$0.006/min |
| Structure extraction | ~$0.001/request |
| 30-min meeting | ~$0.20 total |

## Accessibility

This app is designed with accessibility in mind:
- **Voice-first input** — Speak instead of type
- **Structured output** — Clear sections, not walls of text
- **Reduces friction** — One tap to record, automatic processing
- **Agent discussion** — Talk through notes verbally via TTS

## Roadmap

- [x] 💬 Mobile chat with offline queue
- [x] 🔐 Biometric authentication
- [x] 🎙️ Meeting recording
- [x] 🧠 AI transcription + extraction
- [x] 📋 Structured notes viewer
- [x] 💬 Share with agent
- [ ] 🔔 Push notifications from agents
- [ ] 📚 Searchable meeting archive
- [ ] 🎤 Voice commands
- [ ] 📊 Meeting analytics (trends, action item completion)

## Related Projects

- [meeting-capture](https://github.com/marksunner/meeting-capture) — CLI version of the capture pipeline
- [openclaw-voice-integration](https://github.com/marksunner/openclaw-voice-integration) — Voice module docs
- [openclaw-skills](https://github.com/marksunner/openclaw-skills) — OpenClaw skill examples

## License

MIT License — see [LICENSE](LICENSE) for details.

---

*Built with [OpenClaw](https://github.com/openclaw/openclaw) — AI agents for everyone.*
