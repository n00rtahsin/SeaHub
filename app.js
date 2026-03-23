(() => {
  const ICE = { iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }] };
  const MAX_TRANSFER_BYTES = 12 * 1024 * 1024;
  const CHUNK_SIZE = 16 * 1024;

  const EMOJIS = [
    "😀", "😂", "😍", "🥹", "❤️", "🔥", "🌊", "🎉", "👍", "🙏", "🤝", "💫", "🌙", "✨", "😎", "😭", "🙌", "😴", "🤍", "💙",
    "🍀", "🍕", "☕", "📷", "🎵", "🎮", "🚀", "🌈", "🫶", "💬", "🧠", "🎁", "📎", "🎧", "🐬", "🐳", "🏝️", "🌅", "⭐", "🥳"
  ];

  const el = {
    nameInput: document.getElementById("nameInput"),
    createModeBtn: document.getElementById("createModeBtn"),
    joinModeBtn: document.getElementById("joinModeBtn"),
    status: document.getElementById("status"),
    secureNote: document.getElementById("secureNote"),
    themeSelect: document.getElementById("themeSelect"),

    createPanel: document.getElementById("createPanel"),
    joinPanel: document.getElementById("joinPanel"),

    makeOfferBtn: document.getElementById("makeOfferBtn"),
    offerOut: document.getElementById("offerOut"),
    copyOfferBtn: document.getElementById("copyOfferBtn"),
    answerIn: document.getElementById("answerIn"),
    applyAnswerBtn: document.getElementById("applyAnswerBtn"),

    offerIn: document.getElementById("offerIn"),
    makeAnswerBtn: document.getElementById("makeAnswerBtn"),
    answerOut: document.getElementById("answerOut"),
    copyAnswerBtn: document.getElementById("copyAnswerBtn"),

    peerName: document.getElementById("peerName"),
    presenceBadge: document.getElementById("presenceBadge"),
    typingIndicator: document.getElementById("typingIndicator"),

    messages: document.getElementById("messages"),
    chatForm: document.getElementById("chatForm"),
    msgInput: document.getElementById("msgInput"),
    sendBtn: document.getElementById("sendBtn"),

    emojiToggleBtn: document.getElementById("emojiToggleBtn"),
    emojiPanel: document.getElementById("emojiPanel"),
    emojiSearch: document.getElementById("emojiSearch"),
    emojiList: document.getElementById("emojiList"),

    fileInput: document.getElementById("fileInput"),
    sendFileBtn: document.getElementById("sendFileBtn"),
    retryTransferBtn: document.getElementById("retryTransferBtn"),
    cancelTransferBtn: document.getElementById("cancelTransferBtn"),
    dropZone: document.getElementById("dropZone"),
    fileStatus: document.getElementById("fileStatus"),

    dbgPcState: document.getElementById("dbgPcState"),
    dbgIceConn: document.getElementById("dbgIceConn"),
    dbgIceGather: document.getElementById("dbgIceGather"),
    dbgDcState: document.getElementById("dbgDcState"),

    letterPopup: document.getElementById("letterPopup"),
    letterText: document.getElementById("letterText"),
    closeLetterBtn: document.getElementById("closeLetterBtn"),

    startRecordBtn: document.getElementById("startRecordBtn"),
    stopRecordBtn: document.getElementById("stopRecordBtn"),
    sendVoiceBtn: document.getElementById("sendVoiceBtn"),
    voicePreview: document.getElementById("voicePreview")
  };

  const state = {
    mode: "create",
    name: "",
    peerName: "",
    pc: null,
    dc: null,
    incomingTransfer: null,
    typingHideTimer: null,
    lastTypingSentAt: 0,
    droppedFile: null,
    recorder: null,
    recorderStream: null,
    recorderChunks: [],
    pendingVoiceBlob: null,
    outgoingTransfer: null,
    transferCancelRequested: false,
    lastTransfer: null,
    localMsgStateById: new Map(),
    pendingReadIds: new Set(),
    debugTimer: null,
    letterTimer: null
  };

  function setStatus(text) {
    el.status.textContent = `Status: ${text}`;
  }

  function updateDebug() {
    const pc = state.pc;
    const dc = state.dc;
    el.dbgPcState.textContent = pc ? pc.connectionState : "none";
    el.dbgIceConn.textContent = pc ? pc.iceConnectionState : "none";
    el.dbgIceGather.textContent = pc ? pc.iceGatheringState : "none";
    el.dbgDcState.textContent = dc ? dc.readyState : "none";
  }

  function setPresence(online) {
    el.presenceBadge.classList.toggle("online", online);
    el.presenceBadge.classList.toggle("offline", !online);
    el.presenceBadge.textContent = online ? "Online" : "Offline";
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function formatBytes(bytes) {
    if (!bytes || bytes < 1024) return `${bytes || 0} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }

  function requireName() {
    const value = el.nameInput.value.trim();
    if (!value) {
      setStatus("Enter your name first");
      el.nameInput.focus();
      return false;
    }
    state.name = value;
    return true;
  }

  function setMode(mode) {
    state.mode = mode;
    el.createPanel.hidden = mode !== "create";
    el.joinPanel.hidden = mode !== "join";
    setStatus(mode === "create" ? "Creator mode" : "Joiner mode");
  }

  function setChatEnabled(enabled) {
    el.msgInput.disabled = !enabled;
    el.sendBtn.disabled = !enabled;
    el.fileInput.disabled = !enabled;
    el.sendFileBtn.disabled = !enabled;
    el.dropZone.setAttribute("aria-disabled", String(!enabled));
    el.startRecordBtn.disabled = !enabled;
    el.stopRecordBtn.disabled = true;
    el.sendVoiceBtn.disabled = !enabled || !state.pendingVoiceBlob;
    el.retryTransferBtn.disabled = !enabled || !state.lastTransfer;
    el.cancelTransferBtn.disabled = !enabled || !state.outgoingTransfer;
  }

  function resetPeerVisual() {
    el.peerName.textContent = "Not connected";
    setPresence(false);
    el.typingIndicator.hidden = true;
  }

  function closeConnection() {
    if (state.dc) {
      try {
        state.dc.close();
      } catch {
        // Ignore close error.
      }
      state.dc = null;
    }

    if (state.pc) {
      try {
        state.pc.close();
      } catch {
        // Ignore close error.
      }
      state.pc = null;
    }

    state.incomingTransfer = null;
    state.transferCancelRequested = false;
    state.outgoingTransfer = null;
    setChatEnabled(false);
    resetPeerVisual();
    hideLetter();
    updateDebug();
  }

  function createPc(isCreator) {
    closeConnection();
    const pc = new RTCPeerConnection(ICE);
    state.pc = pc;

    pc.oniceconnectionstatechange = () => {
      const s = pc.iceConnectionState;
      if (s === "connected" || s === "completed") {
        setStatus("Connected");
        setPresence(true);
      }
      if (s === "failed" || s === "disconnected" || s === "closed") {
        setStatus("Disconnected");
        setPresence(false);
        setChatEnabled(false);
      }
      updateDebug();
    };

    pc.onconnectionstatechange = updateDebug;
    pc.onicegatheringstatechange = updateDebug;

    if (isCreator) {
      bindChannel(pc.createDataChannel("chat"));
    } else {
      pc.ondatachannel = (event) => bindChannel(event.channel);
    }
  }

  function bindChannel(channel) {
    state.dc = channel;
    channel.binaryType = "arraybuffer";

    channel.onopen = () => {
      setStatus("Chat ready");
      setPresence(true);
      setChatEnabled(true);
      sendPacket({ type: "intro", name: state.name });
      showConnectionLetter();
      updateDebug();
    };

    channel.onclose = () => {
      setStatus("Channel closed");
      setPresence(false);
      setChatEnabled(false);
      updateDebug();
    };

    channel.onerror = () => {
      setStatus("Channel error");
      updateDebug();
    };

    channel.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        handleIncomingChunk(event.data);
        return;
      }

      let packet;
      try {
        packet = JSON.parse(event.data);
      } catch {
        return;
      }

      if (packet.type === "intro") {
        state.peerName = packet.name || "Peer";
        el.peerName.textContent = state.peerName;
        setPresence(true);
        return;
      }

      if (packet.type === "typing") {
        showTyping(packet.name || state.peerName || "Peer");
        return;
      }

      if (packet.type === "msg") {
        const msgId = packet.id || `msg-${Date.now()}`;
        addTextMessage(packet.name || state.peerName || "Peer", packet.text, false, packet.ts || Date.now(), msgId);
        sendPacket({ type: "ack-delivered", id: msgId });
        if (document.hidden) {
          state.pendingReadIds.add(msgId);
        } else {
          sendPacket({ type: "ack-read", id: msgId });
        }
        return;
      }

      if (packet.type === "ack-delivered") {
        setLocalMessageState(packet.id, "Delivered");
        return;
      }

      if (packet.type === "ack-read") {
        setLocalMessageState(packet.id, "Read");
        return;
      }

      if (packet.type === "file-meta") {
        state.incomingTransfer = {
          kind: packet.kind || "file",
          name: packet.name || "file",
          size: Number(packet.size) || 0,
          mime: packet.mime || "application/octet-stream",
          received: 0,
          chunks: []
        };
        el.fileStatus.textContent = `Receiving ${state.incomingTransfer.name}... 0%`;
        return;
      }

      if (packet.type === "file-end") {
        finalizeIncomingTransfer();
        return;
      }

      if (packet.type === "file-cancel") {
        state.incomingTransfer = null;
        el.fileStatus.textContent = "Incoming transfer canceled by peer.";
      }
    };
  }

  function sendPacket(packet) {
    if (!state.dc || state.dc.readyState !== "open") return;
    state.dc.send(JSON.stringify(packet));
  }

  function addMessageContainer(mine, id) {
    const container = document.createElement("div");
    container.className = `msg${mine ? " me" : ""}`;
    if (id) container.dataset.msgId = id;

    const head = document.createElement("div");
    head.className = "msg-head";

    const author = document.createElement("span");
    author.className = "msg-author";

    const time = document.createElement("span");
    time.className = "msg-time";

    const right = document.createElement("div");
    right.style.display = "inline-flex";
    right.style.alignItems = "baseline";

    const stateNode = document.createElement("span");
    stateNode.className = "msg-state";
    stateNode.hidden = !mine;
    if (mine) stateNode.textContent = "Sent";

    right.appendChild(time);
    right.appendChild(stateNode);

    head.appendChild(author);
    head.appendChild(right);
    container.appendChild(head);

    return { container, author, time, stateNode };
  }

  function addTextMessage(authorName, text, mine, ts, id) {
    const entry = addMessageContainer(mine, id);
    entry.author.textContent = authorName;
    entry.time.textContent = formatTime(ts);

    const body = document.createElement("div");
    body.className = "msg-text";
    body.textContent = text;

    entry.container.appendChild(body);
    el.messages.appendChild(entry.container);
    el.messages.scrollTop = el.messages.scrollHeight;

    if (mine && id) {
      state.localMsgStateById.set(id, entry.stateNode);
    }
  }

  function addFileMessage(authorName, label, url, mine, ts, isVoice) {
    const entry = addMessageContainer(mine);
    entry.author.textContent = authorName;
    entry.time.textContent = formatTime(ts);

    if (isVoice) {
      const note = document.createElement("div");
      note.className = "msg-text";
      note.textContent = label;
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.src = url;
      entry.container.appendChild(note);
      entry.container.appendChild(audio);
    } else {
      const link = document.createElement("a");
      link.className = "msg-link";
      link.href = url;
      link.download = label;
      link.textContent = `Download: ${label}`;
      entry.container.appendChild(link);
    }

    el.messages.appendChild(entry.container);
    el.messages.scrollTop = el.messages.scrollHeight;
  }

  function setLocalMessageState(id, value) {
    if (!id) return;
    const node = state.localMsgStateById.get(id);
    if (!node) return;
    node.textContent = value;
  }

  function handleIncomingChunk(buffer) {
    if (!state.incomingTransfer) return;
    state.incomingTransfer.chunks.push(buffer);
    state.incomingTransfer.received += buffer.byteLength;
    const total = state.incomingTransfer.size || 1;
    const pct = Math.min(100, Math.round((state.incomingTransfer.received / total) * 100));
    el.fileStatus.textContent = `Receiving ${state.incomingTransfer.name}... ${pct}%`;
  }

  function finalizeIncomingTransfer() {
    if (!state.incomingTransfer) return;
    const t = state.incomingTransfer;
    const blob = new Blob(t.chunks, { type: t.mime });
    const url = URL.createObjectURL(blob);
    const author = state.peerName || "Peer";

    if (t.kind === "voice") {
      addFileMessage(author, `Voice note (${formatBytes(t.size)})`, url, false, Date.now(), true);
    } else {
      addFileMessage(author, `${t.name} (${formatBytes(t.size)})`, url, false, Date.now(), false);
    }

    el.fileStatus.textContent = `Received: ${t.name}`;
    state.incomingTransfer = null;
  }

  function parsePayload(text, expectedType) {
    const source = String(text || "").trim();
    if (!source) throw new Error("Payload is empty");

    const cleaned = source
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let obj;
    try {
      obj = JSON.parse(cleaned);
    } catch {
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start >= 0 && end > start) {
        obj = JSON.parse(cleaned.slice(start, end + 1));
      } else {
        throw new Error("Payload is not valid JSON");
      }
    }

    if (!obj || typeof obj !== "object") {
      throw new Error("Invalid payload object");
    }

    const inferredTypeFromKind = typeof obj.kind === "string"
      ? (obj.kind.toLowerCase().includes("offer") ? "offer" : obj.kind.toLowerCase().includes("answer") ? "answer" : "")
      : "";

    const payloadType = String(obj.type || inferredTypeFromKind || "").toLowerCase();
    if (payloadType && payloadType !== expectedType) {
      throw new Error(`Expected ${expectedType} payload`);
    }

    const rawSdp = obj.sdp || obj.description || obj.offer || obj.answer;
    if (!rawSdp) {
      throw new Error("Invalid payload: missing SDP");
    }

    let sdp;
    if (typeof rawSdp === "string") {
      sdp = {
        type: expectedType,
        sdp: rawSdp
      };
    } else {
      sdp = {
        type: rawSdp.type || payloadType || expectedType,
        sdp: rawSdp.sdp
      };
    }

    if (!sdp.sdp || typeof sdp.sdp !== "string") {
      throw new Error("Invalid payload: malformed SDP");
    }

    return {
      type: expectedType,
      name: obj.name || obj.from || "",
      sdp
    };
  }

  function waitIceComplete(pc, timeoutMs = 9000) {
    return new Promise((resolve) => {
      if (pc.iceGatheringState === "complete") {
        resolve();
        return;
      }

      const onChange = () => {
        if (pc.iceGatheringState === "complete") {
          pc.removeEventListener("icegatheringstatechange", onChange);
          resolve();
        }
      };

      pc.addEventListener("icegatheringstatechange", onChange);
      setTimeout(() => {
        pc.removeEventListener("icegatheringstatechange", onChange);
        resolve();
      }, timeoutMs);
    });
  }

  async function copyText(text) {
    if (!text) {
      setStatus("Nothing to copy yet");
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const temp = document.createElement("textarea");
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        temp.remove();
      }
      setStatus("Copied");
    } catch {
      setStatus("Copy failed. Copy manually");
    }
  }

  async function generateOffer() {
    if (!requireName()) return;
    if (!window.RTCPeerConnection) {
      setStatus("WebRTC not supported in this browser");
      return;
    }

    try {
      setStatus("Creating offer...");
      createPc(true);
      const offer = await state.pc.createOffer();
      await state.pc.setLocalDescription(offer);
      await waitIceComplete(state.pc);

      const payload = {
        type: "offer",
        name: state.name,
        sdp: state.pc.localDescription
      };
      el.offerOut.value = JSON.stringify(payload);
      setStatus("Offer ready. Send it to peer");
    } catch (err) {
      setStatus(`Offer failed: ${err.message || "unknown error"}`);
    }
  }

  async function applyAnswer() {
    if (!state.pc || !state.pc.localDescription) {
      setStatus("Create offer first");
      return;
    }

    try {
      const parsed = parsePayload(el.answerIn.value.trim(), "answer");
      state.peerName = parsed.name || "Peer";
      el.peerName.textContent = state.peerName;
      await state.pc.setRemoteDescription(parsed.sdp);
      setStatus("Answer applied. Waiting for data channel...");
    } catch (err) {
      setStatus(`Apply answer failed: ${err.message || "invalid input"}`);
    }
  }

  async function generateAnswer() {
    if (!requireName()) return;
    if (!window.RTCPeerConnection) {
      setStatus("WebRTC not supported in this browser");
      return;
    }

    try {
      const parsed = parsePayload(el.offerIn.value.trim(), "offer");
      state.peerName = parsed.name || "Peer";
      el.peerName.textContent = state.peerName;

      setStatus("Creating answer...");
      createPc(false);
      await state.pc.setRemoteDescription(parsed.sdp);
      const answer = await state.pc.createAnswer();
      await state.pc.setLocalDescription(answer);
      await waitIceComplete(state.pc);

      const payload = {
        type: "answer",
        name: state.name,
        sdp: state.pc.localDescription
      };
      el.answerOut.value = JSON.stringify(payload);
      setStatus("Answer ready. Send it back");
    } catch (err) {
      setStatus(`Answer failed: ${err.message || "unknown error"}`);
    }
  }

  function sendTypingSignal() {
    if (!state.dc || state.dc.readyState !== "open") return;
    const now = Date.now();
    if (now - state.lastTypingSentAt < 400) return;
    state.lastTypingSentAt = now;
    sendPacket({ type: "typing", name: state.name });
  }

  function showTyping(peer) {
    el.typingIndicator.textContent = `${peer} is typing...`;
    el.typingIndicator.hidden = false;
    clearTimeout(state.typingHideTimer);
    state.typingHideTimer = setTimeout(() => {
      el.typingIndicator.hidden = true;
    }, 1200);
  }

  function sendMessage(event) {
    event.preventDefault();
    const text = el.msgInput.value.trim();
    if (!text) return;
    if (!state.dc || state.dc.readyState !== "open") {
      setStatus("Not connected");
      return;
    }

    const ts = Date.now();
    sendPacket({ type: "msg", name: state.name, text, ts });
    addTextMessage(state.name, text, true, ts);
    el.msgInput.value = "";
  }

  async function sendBlobTransfer(blob, fileName, kind) {
    if (!state.dc || state.dc.readyState !== "open") {
      setStatus("Not connected");
      return;
    }

    if (blob.size > MAX_TRANSFER_BYTES) {
      setStatus("File too large. Limit is 12 MB");
      return;
    }

    const mime = blob.type || "application/octet-stream";
    sendPacket({ type: "file-meta", kind, name: fileName, size: blob.size, mime });

    state.transferCancelRequested = false;
    state.outgoingTransfer = { name: fileName, size: blob.size, kind };
    el.cancelTransferBtn.disabled = false;
    el.retryTransferBtn.disabled = true;

    let offset = 0;
    while (offset < blob.size) {
      if (state.transferCancelRequested) {
        sendPacket({ type: "file-cancel" });
        state.outgoingTransfer = null;
        el.cancelTransferBtn.disabled = true;
        el.retryTransferBtn.disabled = false;
        el.fileStatus.textContent = `Canceled: ${fileName}`;
        return;
      }
      const chunk = await blob.slice(offset, offset + CHUNK_SIZE).arrayBuffer();
      state.dc.send(chunk);
      offset += chunk.byteLength;
      const pct = Math.min(100, Math.round((offset / blob.size) * 100));
      el.fileStatus.textContent = `Sending ${fileName}... ${pct}%`;
    }

    sendPacket({ type: "file-end" });
    state.outgoingTransfer = null;
    el.cancelTransferBtn.disabled = true;
    const localUrl = URL.createObjectURL(blob);
    if (kind === "voice") {
      addFileMessage(state.name, `Voice note (${formatBytes(blob.size)})`, localUrl, true, Date.now(), true);
    } else {
      addFileMessage(state.name, `${fileName} (${formatBytes(blob.size)})`, localUrl, true, Date.now(), false);
    }
    el.fileStatus.textContent = `Sent: ${fileName}`;
    state.lastTransfer = { blob, fileName, kind };
    el.retryTransferBtn.disabled = false;
  }

  async function sendFile() {
    const file = state.droppedFile || (el.fileInput.files && el.fileInput.files[0]);
    if (!file) {
      setStatus("Choose or drop a file first");
      return;
    }

    try {
      await sendBlobTransfer(file, file.name || "file", "file");
      state.droppedFile = null;
      el.fileInput.value = "";
      el.dropZone.textContent = "Drop file here or click to choose";
    } catch (err) {
      setStatus(`File send failed: ${err.message || "unknown error"}`);
    }
  }

  function cancelTransfer() {
    if (!state.outgoingTransfer) return;
    state.transferCancelRequested = true;
  }

  async function retryLastTransfer() {
    if (!state.lastTransfer) {
      setStatus("No previous transfer to retry");
      return;
    }
    try {
      await sendBlobTransfer(state.lastTransfer.blob, state.lastTransfer.fileName, state.lastTransfer.kind);
    } catch (err) {
      setStatus(`Retry failed: ${err.message || "unknown error"}`);
    }
  }

  async function startVoiceRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus("Voice recording not supported in this browser");
      return;
    }

    try {
      state.recorderStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.recorderChunks = [];
      state.recorder = new MediaRecorder(state.recorderStream);

      state.recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          state.recorderChunks.push(event.data);
        }
      };

      state.recorder.onstop = () => {
        state.pendingVoiceBlob = new Blob(state.recorderChunks, { type: "audio/webm" });
        const url = URL.createObjectURL(state.pendingVoiceBlob);
        el.voicePreview.src = url;
        el.voicePreview.hidden = false;
        el.sendVoiceBtn.disabled = false;
        el.startRecordBtn.disabled = false;
        el.stopRecordBtn.disabled = true;

        if (state.recorderStream) {
          state.recorderStream.getTracks().forEach((track) => track.stop());
          state.recorderStream = null;
        }
      };

      state.recorder.start();
      setStatus("Recording voice...");
      el.startRecordBtn.disabled = true;
      el.stopRecordBtn.disabled = false;
      el.sendVoiceBtn.disabled = true;
    } catch {
      setStatus("Microphone access denied or unavailable");
    }
  }

  function stopVoiceRecording() {
    if (!state.recorder || state.recorder.state !== "recording") return;
    state.recorder.stop();
    setStatus("Voice note ready to send");
  }

  async function sendVoiceNote() {
    if (!state.pendingVoiceBlob) {
      setStatus("Record a voice note first");
      return;
    }

    const name = `voice-${Date.now()}.webm`;
    try {
      await sendBlobTransfer(state.pendingVoiceBlob, name, "voice");
      state.lastTransfer = { blob: state.pendingVoiceBlob, fileName: name, kind: "voice" };
      state.pendingVoiceBlob = null;
      el.voicePreview.hidden = true;
      el.voicePreview.removeAttribute("src");
      el.sendVoiceBtn.disabled = true;
    } catch (err) {
      setStatus(`Voice send failed: ${err.message || "unknown error"}`);
    }
  }

  function openEmojiPanel() {
    el.emojiPanel.hidden = !el.emojiPanel.hidden;
    if (!el.emojiPanel.hidden) {
      el.emojiSearch.focus();
      renderEmojiList(el.emojiSearch.value.trim());
    }
  }

  function insertEmoji(emoji) {
    if (el.msgInput.disabled) return;
    const input = el.msgInput;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    input.value = input.value.slice(0, start) + emoji + input.value.slice(end);
    const pos = start + emoji.length;
    input.setSelectionRange(pos, pos);
    input.focus();
  }

  function renderEmojiList(query) {
    const q = query.toLowerCase();
    const filtered = EMOJIS.filter((emoji) => emoji.toLowerCase().includes(q));

    el.emojiList.innerHTML = "";
    filtered.forEach((emoji) => {
      const btn = document.createElement("button");
      btn.className = "emoji-btn";
      btn.type = "button";
      btn.textContent = emoji;
      btn.addEventListener("click", () => insertEmoji(emoji));
      el.emojiList.appendChild(btn);
    });
  }

  function setDroppedFile(file) {
    state.droppedFile = file || null;
    if (file) {
      el.dropZone.textContent = `Selected: ${file.name} (${formatBytes(file.size)})`;
    } else {
      el.dropZone.textContent = "Drop file here or click to choose";
    }
  }

  function initDropZone() {
    const highlight = (on) => el.dropZone.classList.toggle("active", on);

    ["dragenter", "dragover"].forEach((name) => {
      el.dropZone.addEventListener(name, (event) => {
        event.preventDefault();
        if (el.fileInput.disabled) return;
        highlight(true);
      });
    });

    ["dragleave", "drop"].forEach((name) => {
      el.dropZone.addEventListener(name, (event) => {
        event.preventDefault();
        highlight(false);
      });
    });

    el.dropZone.addEventListener("drop", (event) => {
      if (el.fileInput.disabled) return;
      const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      if (!file) return;
      setDroppedFile(file);
    });

    el.dropZone.addEventListener("click", () => {
      if (!el.fileInput.disabled) el.fileInput.click();
    });

    el.dropZone.addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.key === " ") && !el.fileInput.disabled) {
        event.preventDefault();
        el.fileInput.click();
      }
    });
  }

  function applyTheme(theme) {
    document.body.setAttribute("data-theme", theme);
  }

  function hideLetter() {
    if (!el.letterPopup) return;
    el.letterPopup.hidden = true;
    clearTimeout(state.letterTimer);
    state.letterTimer = null;
  }

  function showConnectionLetter() {
    if (!el.letterPopup || !el.letterText) return;
    const local = state.name || "You";
    const peer = state.peerName || "your peer";
    el.letterText.textContent = `${local} and ${peer} are now connected. Start sharing whispers.`;
    el.letterPopup.hidden = false;
    clearTimeout(state.letterTimer);
    state.letterTimer = setTimeout(() => {
      hideLetter();
    }, 4800);
  }

  function flushPendingReadReceipts() {
    if (document.hidden || !state.dc || state.dc.readyState !== "open") return;
    state.pendingReadIds.forEach((id) => {
      sendPacket({ type: "ack-read", id });
    });
    state.pendingReadIds.clear();
  }

  function init() {
    el.createModeBtn.addEventListener("click", () => setMode("create"));
    el.joinModeBtn.addEventListener("click", () => setMode("join"));
    el.makeOfferBtn.addEventListener("click", generateOffer);
    el.copyOfferBtn.addEventListener("click", () => copyText(el.offerOut.value));
    el.applyAnswerBtn.addEventListener("click", applyAnswer);

    el.makeAnswerBtn.addEventListener("click", generateAnswer);
    el.copyAnswerBtn.addEventListener("click", () => copyText(el.answerOut.value));

    el.chatForm.addEventListener("submit", sendMessage);
    el.msgInput.addEventListener("input", () => {
      if (el.msgInput.value.trim()) {
        sendTypingSignal();
      }
    });

    el.emojiToggleBtn.addEventListener("click", openEmojiPanel);
    el.emojiSearch.addEventListener("input", () => renderEmojiList(el.emojiSearch.value.trim()));

    el.fileInput.addEventListener("change", () => {
      const f = el.fileInput.files && el.fileInput.files[0];
      setDroppedFile(f || null);
    });

    el.sendFileBtn.addEventListener("click", sendFile);
    el.cancelTransferBtn.addEventListener("click", cancelTransfer);
    el.retryTransferBtn.addEventListener("click", retryLastTransfer);
    initDropZone();

    el.startRecordBtn.addEventListener("click", startVoiceRecording);
    el.stopRecordBtn.addEventListener("click", stopVoiceRecording);
    el.sendVoiceBtn.addEventListener("click", sendVoiceNote);

    el.themeSelect.addEventListener("change", () => applyTheme(el.themeSelect.value));
    applyTheme("ocean");

    renderEmojiList("");

    if (!window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
      el.secureNote.hidden = false;
      el.secureNote.textContent = "Open this page on https:// or localhost. WebRTC may fail on insecure contexts.";
    }

    setMode("create");
    setStatus("Idle");
    setChatEnabled(false);
    resetPeerVisual();
    hideLetter();
    updateDebug();
    state.debugTimer = setInterval(updateDebug, 1000);

    document.addEventListener("visibilitychange", flushPendingReadReceipts);
    el.closeLetterBtn.addEventListener("click", hideLetter);
    el.letterPopup.addEventListener("click", (event) => {
      if (event.target === el.letterPopup) hideLetter();
    });
    window.addEventListener("beforeunload", closeConnection);
  }

  init();
})();
