# Sea Whisper

A cinematic, browser-only peer-to-peer chat experience built with WebRTC DataChannel and manual signaling.

Sea Whisper is designed to feel intimate and expressive while staying fully serverless for messaging. Two users connect directly, exchange temporary messages/files/voice notes in memory, and everything disappears on refresh.

## Highlights

- Direct browser-to-browser chat over WebRTC DataChannel
- Manual offer/answer exchange (no signaling server)
- Ephemeral session model: no database, no login, no message persistence
- Animated premium UI with glassmorphism, ocean motion, drifting boat, and connection letter pop-up
- Emoji picker, typing indicator, delivery/read markers
- File transfer with drag-and-drop, retry, and cancel
- Voice note recording, preview, and peer transfer
- Built-in connection debug panel for troubleshooting

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript
- WebRTC RTCPeerConnection + DataChannel
- STUN: Google public STUN servers

## Core Product Principles

- No backend API
- No database
- No authentication
- No global presence discovery
- No offline history
- No cookies for chat persistence

All chat state is runtime-only and vanishes when the page reloads.

## Project Structure

- `index.html`: application structure and UI sections
- `styles.css`: theme system, layout, animations, responsive styles
- `app.js`: WebRTC signaling/chat logic, file/voice transfer, UI interactions
- `LICENSE`: repository license

## Features

### Connection and Presence

- Create mode: generate offer and share it manually
- Join mode: paste offer and generate answer manually
- Apply answer on creator side to establish peer link
- Presence badge updates to Online/Offline from real connection state
- Connection letter pop-up animation appears when channel becomes ready

### Messaging

- Real-time text chat via DataChannel
- Typing indicator (lightweight signaling packet)
- Delivery states for outgoing messages:
  - Sent
  - Delivered
  - Read

### Emoji

- Toggle emoji panel
- Search and insert emoji into input at cursor position

### File Transfer

- Send files directly peer-to-peer
- Drag-and-drop zone and file picker
- Transfer progress status
- Cancel transfer in progress
- Retry last transfer
- Current size guard: 12 MB per transfer

### Voice Notes

- Record with browser microphone (MediaRecorder)
- Local preview before send
- Send as DataChannel transfer
- Receive and play inline audio

### Themes and Motion

- Theme switcher: Ocean, Sunset, Mint
- Animated ocean background layers
- Drifting boat animation
- Pop and fade micro-interactions
- Reduced-motion fallback support

## How It Works

### 1) Creator

1. Enter display name
2. Click Create Connection
3. Click Generate Offer
4. Copy the generated offer text
5. Share offer text to peer (any external channel)

### 2) Joiner

1. Enter display name
2. Click Join Connection
3. Paste offer text
4. Click Generate Answer
5. Copy generated answer text
6. Send answer text back to creator

### 3) Creator Final Step

1. Paste received answer
2. Click Apply Answer
3. Wait for status to become Chat ready

Once connected, both peers can chat, share files, and send voice notes.

## Local Run

Because this app uses browser APIs (WebRTC/Media APIs/Clipboard), use localhost or HTTPS.

### Option A: Python

```bash
python -m http.server 5500
```

Open:

```text
http://localhost:5500
```

### Option B: Node (serve)

```bash
npx serve .
```

Then open the local URL printed in terminal.

## Signaling Payload Compatibility

The parser accepts multiple practical payload shapes and sanitizes pasted input, including:

- Plain JSON
- JSON wrapped in markdown code fences
- Legacy payload styles using `kind`
- Alternate SDP key forms (`sdp`, `description`, `offer`, `answer`)

This improves interoperability and reduces copy/paste errors.

## Debug Panel

The built-in Connection Debug panel surfaces live values:

- PeerConnection state
- ICE connection state
- ICE gathering state
- DataChannel state

Use it to quickly diagnose where the handshake or channel lifecycle is failing.

## Limitations

- No TURN server configured
- Some NAT/firewall combinations may prevent direct P2P connection
- Session data is intentionally temporary and non-persistent
- File transfer is chunked but still subject to network/browser constraints

If two users cannot connect reliably across strict networks, a TURN relay is typically required (not included by design).

## Privacy and Security Notes

- Messaging path is peer-to-peer after connection
- No app-managed message storage
- No server-side chat processing in this project
- Clipboard and microphone permissions depend on browser security context

## Troubleshooting

### Answer generation shows nothing

- Ensure pasted offer is complete JSON
- Remove accidental extra text before/after JSON
- Confirm app is running on localhost or HTTPS
- Regenerate a fresh offer and answer pair (do not reuse old session text)

### Connection stays disconnected

- Check debug panel ICE/DataChannel states
- Ensure both users exchanged latest offer/answer
- Retry on different network (mobile hotspot test is useful)
- Firewall/NAT may require TURN in real-world hostile networks

### Voice note does not record

- Grant microphone permission
- Use supported browser (modern Chromium/Firefox/Safari)
- Verify secure context (localhost or HTTPS)

## Development Notes

This project intentionally keeps logic in vanilla JS for portability and simple static hosting.

Potential future improvements:

- Optional TURN support toggle
- Better emoji semantic search
- End-to-end encrypted payload envelope on top of DataChannel
- Multi-peer room mode with mesh signaling UX

## License

See the LICENSE file in this repository.
