<div align="center">

<img src="https://img.shields.io/badge/WebRTC-Powered-0078D4?style=for-the-badge&logo=webrtc&logoColor=white" alt="WebRTC"/>
<img src="https://img.shields.io/badge/Serverless-Zero%20Backend-00C853?style=for-the-badge" alt="Serverless"/>
<img src="https://img.shields.io/badge/Vanilla%20JS-No%20Framework-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="Vanilla JS"/>
<img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License"/>
<img src="https://img.shields.io/badge/GitHub%20Pages-Live-2EA043?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Pages"/>

<br/><br/>

# 🌊 SeaHub

### *Where Messages Go With the Tide*

**A cinematic, browser-only peer-to-peer chat experience — no servers, no storage, no trace.**

SeaHub connects two people directly through their browsers using WebRTC DataChannel with manual signaling. Messages, files, and voice notes flow peer-to-peer and vanish the moment you leave. No accounts. No databases. No backend. Just the ocean, and the two of you.

<br/>

[**🚀 Live Demo →**](https://n00rtahsin.github.io/SeaHub) &nbsp;&nbsp;|&nbsp;&nbsp; [**📖 How It Works**](#-how-it-works-step-by-step) &nbsp;&nbsp;|&nbsp;&nbsp; [**⚡ Run Locally**](#-run-locally)

<br/>

</div>

---

## ✨ What Is SeaHub?

SeaHub is a **100% browser-based, serverless chat application** built on the WebRTC standard. Instead of routing your messages through a central server, SeaHub establishes a **direct, encrypted connection** between two browsers — a true peer-to-peer link.

The philosophy is simple: **if you close the tab, it never happened.** No message history is written to disk. No server ever sees your content. Everything exists only in RAM for the duration of your session.

The experience is wrapped in a deeply immersive **ocean-themed UI** — animated water layers, a drifting boat, cinematic glassmorphism panels, and micro-animations that make every interaction feel alive.

---

## 🌟 Feature Highlights

### 🔗 Peer-to-Peer Connection
- **True P2P** via WebRTC `RTCPeerConnection` and `DataChannel`
- **Manual signaling** — no signaling server required; you share the connection payload yourself via any channel (copy-paste, email, DM)
- **Flexible payload parser** — accepts plain JSON, markdown-fenced JSON, legacy `kind` format, and alternate SDP key styles (`sdp`, `description`, `offer`, `answer`) to minimize copy-paste errors
- **Built-in Debug Panel** — live readout of PeerConnection state, ICE connection state, ICE gathering state, and DataChannel state for instant troubleshooting

### 💬 Messaging
- **Real-time text chat** over the DataChannel — zero server round-trips
- **Typing indicator** via a lightweight signaling packet sent as you type
- **Message delivery states** for every outgoing message:
  - ✉️ Sent
  - ✓ Delivered
  - ✓✓ Read

### 😊 Emoji
- **Inline emoji picker** with search — find and insert any emoji directly at your cursor position
- Accessible via a single toggle button in the chat toolbar

### 📁 File Transfer
- **Direct peer-to-peer file transfer** — files never touch a server
- **Drag-and-drop** zone plus standard file picker
- **Live transfer progress** indicator
- **Cancel** an in-progress transfer
- **Retry** the last transfer with one click
- Current per-transfer size guard: **12 MB**

### 🎙️ Voice Notes
- **Record audio** straight from the browser microphone using the `MediaRecorder` API
- **Local preview** before sending — listen back before committing
- **Peer transfer** via DataChannel — received as inline playable audio
- No external audio hosting or storage involved

### 🎨 Themes & Immersive UI
- **Three built-in themes:** Ocean · Sunset · Mint
- **Animated ocean background** with layered parallax water motion
- **Drifting boat** animation across the scene
- **Connection letter pop-up** animation when the DataChannel becomes ready
- **Glassmorphism** panels with backdrop blur and translucent surfaces
- **Pop and fade micro-interactions** on messages and UI elements
- **Reduced-motion fallback** — respects the `prefers-reduced-motion` OS setting for accessibility

### 🔒 Privacy & Ephemerality
- No registration, no login, no account
- No cookies used for chat persistence
- No database writes — ever
- No app-side message storage or server-side processing
- All session state is **runtime-only** — a page refresh wipes everything

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Structure** | HTML5 |
| **Styling** | CSS3 — custom animations, glassmorphism, responsive layout |
| **Logic** | Vanilla JavaScript (ES6+) — no frameworks, no build step |
| **Real-time P2P** | WebRTC `RTCPeerConnection` + `DataChannel` |
| **Media** | `MediaRecorder` API for voice notes |
| **STUN** | Google public STUN servers (`stun.l.google.com:19302`) |
| **Hosting** | GitHub Pages (static, zero backend) |

> **Why vanilla JS?** Keeping everything in plain HTML/CSS/JS means SeaHub requires no build pipeline, no `npm install`, and no framework. Anyone can read, fork, or host it with nothing more than a static file server.

---

## 🔁 How It Works (Step by Step)

SeaHub uses **manual WebRTC signaling** — you act as the "signaling channel" by copy-pasting connection payloads between the two peers. Here's the full flow:

### For the person creating the connection (Creator)

1. Open SeaHub and enter your display name
2. Click **Create Connection**
3. Click **Generate Offer** — an SDP offer JSON is generated
4. **Copy** the offer text
5. Send it to your peer through any external channel — a message app, email, whatever you like

### For the person joining (Joiner)

1. Open SeaHub and enter your display name
2. Click **Join Connection**
3. **Paste** the offer text you received
4. Click **Generate Answer** — an SDP answer JSON is generated
5. **Copy** the answer text
6. Send it back to the Creator

### Final step (Creator)

1. **Paste** the answer text you received
2. Click **Apply Answer**
3. Wait for the status badge to read **Chat ready** 🟢

Once connected, both sides can send messages, transfer files, and exchange voice notes in real time.

```
Creator                                   Joiner
   |                                         |
   |── Generate Offer ──────────────────────>|
   |         (share via any channel)         |
   |                                         |── Generate Answer
   |<──────────────────────── Answer ───────|
   |                                         |
   |── Apply Answer                          |
   |                                         |
   |======= WebRTC DataChannel Open ========|
   |        (direct P2P connection)          |
```

---

## 🗂 Project Structure

```
SeaHub/
├── index.html       # Application structure — all UI sections and layout
├── styles.css       # Theme system, layout, animations, responsive styles
├── app.js           # WebRTC signaling/chat logic, file/voice transfer, UI interactions
└── LICENSE          # MIT License
```

The entire application is three files. No dependencies to install. No bundler to configure.

---

## ⚡ Run Locally

Because SeaHub uses browser APIs — WebRTC, `MediaRecorder`, the Clipboard API — it must be served over `localhost` or a real HTTPS origin. Opening `index.html` directly as a `file://` URL will not work.

### Option A — Python (built-in, no install needed)

```bash
# Python 3
python -m http.server 5500

# Python 2
python -m SimpleHTTPServer 5500
```

Then open: **http://localhost:5500**

### Option B — Node.js (`serve`)

```bash
npx serve .
```

Open the URL printed in the terminal.

### Option C — VS Code Live Server

Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension, right-click `index.html`, and choose **Open with Live Server**.

---

## 🐛 Troubleshooting

### Answer generation shows nothing / is empty

- Make sure the pasted offer is **complete, unmodified JSON** — no extra text before or after it
- Confirm the app is running on `localhost` or HTTPS (not a `file://` URL)
- Regenerate a fresh offer/answer pair — do not reuse old session payloads

### Connection stays in "Disconnected" or "Connecting" state

- Open the **Connection Debug Panel** (built into SeaHub) and check the ICE and DataChannel states
- Make sure both peers exchanged the **latest** offer and answer from the same session
- Try on a different network — a mobile hotspot is a quick way to rule out local firewall issues
- Strict NAT / corporate firewalls may require a TURN relay (not included by design — see [Limitations](#️-limitations))

### Voice note does not record

- **Grant microphone permission** in your browser when prompted
- Use a modern browser (Chrome 90+, Firefox 90+, Safari 15+)
- Confirm you are on `localhost` or HTTPS — `MediaRecorder` is blocked on insecure origins

### File transfer stalls or fails

- Check that the file is under **12 MB**
- Use the **Retry** button to re-attempt
- If it continues to fail, check the DataChannel state in the Debug Panel

---

## ⚠️ Limitations

| Limitation | Notes |
|---|---|
| **No TURN server** | Direct P2P may fail behind strict NAT or firewalls. Adding a TURN relay would fix this but was excluded by design. |
| **12 MB file transfer cap** | Chunked DataChannel transfer; very large files may be unreliable across slow connections. |
| **No offline history** | All messages disappear on page reload — this is intentional. |
| **Two-party only** | SeaHub is designed for one-to-one connections. Multi-peer mesh is a potential future feature. |
| **Same-browser tab limit** | ICE candidates from the same machine can sometimes interfere; testing across two different devices or networks is more reliable. |

---

## 🔐 Privacy & Security Notes

- The **messaging path is direct P2P** after the WebRTC handshake — traffic does not route through any SeaHub server
- **No app-managed message storage** — SeaHub holds nothing on your behalf
- **No server-side processing** of any chat content
- Clipboard and microphone permissions are handled by the browser's own security context
- For the paranoid: WebRTC DataChannel traffic is **DTLS-encrypted** by the browser spec — it is not plaintext over the wire
- The manual signaling step (sharing the offer/answer) happens over whatever channel *you* choose — the security of that handshake is up to you

---

## 🗺 Roadmap / Potential Future Improvements

These are ideas noted in the codebase — not commitments:

- [ ] Optional TURN server toggle for hostile network environments
- [ ] End-to-end encrypted payload envelope on top of DataChannel (Signal-style)
- [ ] Better emoji semantic search (meaning-aware, not just text-match)
- [ ] Multi-peer room mode with mesh signaling UX
- [ ] Larger file transfer support via streaming chunks with backpressure
- [ ] QR-code-based offer/answer exchange for mobile pairing

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for full terms.

---

<div align="center">

**Built with 🌊 by [n00rtahsin](https://github.com/n00rtahsin)**

*No servers were harmed in the making of this chat app.*

[**Try SeaHub Live →**](https://n00rtahsin.github.io/SeaHub)

</div>
