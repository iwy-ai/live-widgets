
//      __                                    __    
//     /\_\  __  __  __  __  __         __   /\_\   
//     \/\ \/\ \/\ \/\ \/\ \/\ \      /'__`\ \/\ \  
//      \ \ \ \ \_/ \_/ \ \ \_\ \  __/\ \L\.\_\ \ \ 
//       \ \_\ \___x___/'\/`____ \/\_\ \__/.\_\\ \_\
//        \/_/\/__//__/   `/___/> \/_/\/__/\/_/ \/_/
//                           /\___/                 
//                           \/__/                  


// Copyright (c) 2025, iwy.ai
//
// SPDX-License-Identifier: MIT
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.


// -------------------------------------------------------------------------------------------------------
// We love contributions! Feel free to suggest improvements or give back to the project.
// -------------------------------------------------------------------------------------------------------


// Embeddable LiveAvatar widget (port from landing-video-chat component)
// Usage example (insert in host page):
//   <live-avatar agentid="YOUR_AGENT_ID"></live-avatar>
//   <script src="https://talk.iwy.ai/scripts/src.js" async></script>
//
// This script defines a custom element <live-avatar> which displays an AI avatar
// video chat bubble in the bottom-right corner of the page. Clicking the
// “Start Call” button will establish a Daily.co video session with the backend
// agent associated with the provided agentid attribute.

(() => {
    const DAILY_JS_SRC = "https://unpkg.com/@daily-co/daily-js";
    // Endpoint that returns { roomUrl, dailyToken }
    // This mirrors the logic in landing-video-chat.tsx which calls a relative
    // endpoint. We default to the iwy.ai hosted endpoint but allow override via
    // data-endpoint attribute.
    
    const DEFAULT_SESSION_ENDPOINT = "https://api.iwy.ai/api/start-agent-session";
  
    /* -------------------------------------------------------------
     *  <live-avatar> implementation
     * ------------------------------------------------------------- */
    class LiveAvatar extends HTMLElement {
      constructor() {
        super();
        this._state = {
          connected: false,
          connecting: false,
          overlayVisible: true,
          overlayFadeOut: false,
        };
        this._call = null; // Daily callObject
        this._agentId = null;
        this._promptTimeout = null;
          // Timeout handle for delayed placeholder fade-out
          this._fadeTimeout = null;
          // Timeout for applying grayscale after expansion
          this._grayscaleTimeout = null;
          // Timeout to remove grayscale (fade back to color)
          this._colorTimeout = null;
  
          // --- Mic level visualization fields ---
          this._audioCtx = null;
          this._audioAnalyser = null;
          this._audioLevelData = null;
          this._levelAnimationFrame = null;
  
        // Create shadow DOM & root container
        this.attachShadow({ mode: "open" });
        this._root = document.createElement("div");
        this._root.className = "iwy-avatar-root";
        this.shadowRoot.appendChild(this._root);
  
        // Load Daily.js (singleton)
        this._dailyReady = LiveAvatar.loadDaily();
  
        // Build static DOM once
        this._buildStaticDom();
      }
  
      static get observedAttributes() {
        return ["agentid", "data-endpoint", "placeholder-src"];
      }
  
      attributeChangedCallback(name, _old, value) {
        if (name === "agentid") {
          this._agentId = value;
        }
        if (name === "data-endpoint") {
          this._sessionEndpoint = value;
        }
        if (name === "placeholder-src") {
          this._updatePlaceholder();
        }
      }
  
      connectedCallback() {
        // Apply defaults if attributes weren’t present at construction
        if (!this._agentId) this._agentId = this.getAttribute("agentid");
        this._sessionEndpoint = this.getAttribute("data-endpoint") || DEFAULT_SESSION_ENDPOINT;
  
        // Button listeners
        this._startBtn.addEventListener("click", () => this._startCall());
        this._endBtn.addEventListener("click", () => this._stopCall());
    // Click anywhere on collapsed circle to start call (ignore close button)
    this._container.addEventListener("click", (ev) => {
      if (this._container.classList.contains("expanded")) return; // already expanded/connected
      if (ev.target === this._closeBtn) return; // ignore close button
  
      // Immediately expand UI while waiting for connection
      this._container.classList.add("expanded");
      // keep placeholder visible until video loads
      this._closeBtn.style.display = "none";
      this._setStatus("Connecting...", false);
  
      this._startCall();
    });
  
    // Close button click hides widget
    this._closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.style.display = "none";
    });
  
        // (Help menu removed)
        this._menuBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this._menu.classList.toggle("visible");
        });
        document.addEventListener("click", () => this._menu.classList.remove("visible"));
        this._addMenuLink("Help", "https://www.iwy.ai/contact");
        this._addMenuLink("Privacy", "https://www.iwy.ai/privacy");
        this._addMenuLink("Terms", "https://www.iwy.ai/terms");
      }
  
      disconnectedCallback() {
        this._stopCall();
        this._startBtn.removeEventListener("click", this._startCall);
        this._endBtn.removeEventListener("click", this._stopCall);
      }
  
      /* ---------------------------------------------------------
       *  Internal helpers
       * --------------------------------------------------------- */
  
      _buildStaticDom() {
        // Styles (scoped to shadow DOM)
        const style = document.createElement("style");
        style.textContent = `
          :host {
            position: fixed;
            bottom: 1.5rem;
            right: 1.5rem;
            z-index: 9999;
            font-family: system-ui, sans-serif;
          }
  
          /* Scale down widget on mobile */
          @media (max-width: 600px) {
            :host {
              transform: scale(0.7);
              transform-origin: bottom right;
            }
          }
  
          .container {
            width: 140px;
            overflow: visible; /* allow action buttons to spill over slightly */
            height: 140px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            transition: width 0.7s ease, height 0.7s ease, transform 0.3s ease;
            border-radius: 50%; /* perfectly circular when collapsed */
            overflow: hidden;
            border: 1px solid #e2e2e2;
          }
          .container:not(.expanded):hover {
            transform: scale(1.05);
          }
          .container.expanded {
            width: 360px;
            height: 360px;
            border-radius: 0.75rem; /* revert to rounded square */
          }
          /* Bottom gradient shade when expanded */
          .container.expanded::after {
            content: "";
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 80px; /* controls gradient height */
            background: linear-gradient(to top,
              rgba(0,0,0,0.8)   0%,
              rgba(0,0,0,0.75) 10%,
              rgba(0,0,0,0.55) 25%,
              rgba(0,0,0,0.25) 55%,
              rgba(0,0,0,0)    100%);
            pointer-events: none; /* allow interactions through */
          }
          .placeholder {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: opacity 2.25s ease, transform 0.6s ease;
            transform-origin: center;
          }
          .placeholder.fade-out {
            opacity: 0;
          }
          /* Grayscale filter applied while connecting */
          .placeholder.grayscale {
            filter: grayscale(1);
            transition: filter 3s ease;
          }
          /* Pulse greyscale animation: fade to grey then back to color */
          @keyframes greyPulse {
            0%   { filter: grayscale(0); }
            45%  { filter: grayscale(1); }
            55%  { filter: grayscale(1); }
            100% { filter: grayscale(0); }
          }
          .placeholder.pulse-grey {
            animation: greyPulse 6s ease forwards;
          }
          }
          /* Zoom into background placeholder slightly when widget is collapsed, idk you seem to need both of these same classes */
          .container:not(.expanded) .placeholder {
            transform: scale(1); 
          }
          .container:not(.expanded) .placeholder {
            transform: translate(-14%,-11%) scale(1.25);
            transform-origin: top left;     /* so translate is predictable */
          }
          /* Reset zoom when expanded */
          .container.expanded .placeholder {
            transform: scale(1);
          }
          video {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: none;
          }
          video.visible {
            display: block;
          }
          .controls {
            position: absolute;
            bottom: 10px;
            left: 10px;
            display: none;
            gap: 0.5rem;
          }
          .container.expanded .controls { display: flex; }
          .btn {
            padding: 0.15rem 1.4rem; /* slimmer height, wider width */
            font-size: 0.85rem;      /* slightly smaller text */
            font-weight: 400;
            border: none;
            border-radius: 9999px;
            cursor: pointer;
            transition: background-color 0.2s;
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
          }
          .btn.primary { background:#300040; color:#fff; }
          .btn.primary:hover { background:#1e0024; }
          .btn.danger { background:#c53030; color:#fff; }
          .btn.danger:hover { background:#9b2c2c; }
          .action-btn {
            position: absolute;
            width: 22px;
            height: 22px;
            background: rgba(0,0,0,0.75);
            color:#fff;
            border:none;
            border-radius:50%;
            display:flex;
            align-items:center;
            justify-content:center;
            cursor:pointer;
            z-index:1003;
            font-size:14px;
          }
          .close-btn { top:12px; right:12px; transition: transform 0.15s ease; }
          .help-btn  { display:none; }
  
          .menu-btn {
            position: absolute;
            top: 0;
            left: 0;
            transform: translate(-50%,-50%);
            
            background: rgba(0,0,0,0.65);
            border: none;
            border-radius: 50%;
            cursor: pointer;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            z-index: 1003;
          }
          .menu-btn svg {
            width: 18px;
            height: 18px;
          }
          .menu {
            position: absolute;
            top: 2.25rem;
            left: 0.5rem;
            display: none;
            flex-direction: column;
            background:#fff;
            border:1px solid #e2e2e2;
            border-radius:0.5rem;
            box-shadow:0 4px 12px rgba(0,0,0,0.15);
            overflow:hidden;
          }
          .menu.visible { display:flex; }
          .menu a {
            padding:0.5rem 1rem;
            text-decoration:none;
            color:#300040;
            font-size:0.75rem;
            white-space:nowrap;
          }
          .menu a:hover { background:#f3f3f3; }
          .status {
            position:absolute;
            bottom:3rem;
            left:50%;
            transform:translateX(-50%);
            background:#e53e3e;
            color:#fff;
            padding:0.25rem 0.5rem;
            border-radius:0.25rem;
            font-size:0.7rem;
            display:none;
          }
          /* --- Call action icon buttons (visible only in expanded view) --- */
          .end-call-btn, .mic-btn {
            opacity: 0;
            transform: translateY(24px);
            transition: opacity 2.6s ease, transform 2.6s ease;
            position: absolute;
            width: 40px;
            height: 40px;
            border: none;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            cursor: pointer;
            z-index: 1004;
          }
          .end-call-btn { background: #9b2c2c; right: 12px; bottom: 6px; }
          .end-call-btn:hover {
            filter: hue-rotate(-10deg) brightness(1.05);
          }
          .mic-btn      { background:#300040; left: 12px;  bottom: 6px; pointer-events:none; cursor:default; }
          /* invert colors of pattern inside mic button */
          .mic-btn img { filter: invert(1); }
          /* Hide icon buttons when widget is collapsed */
          .container:not(.expanded) .end-call-btn,
          .container:not(.expanded) .end-call-btn,
          .container:not(.expanded) .mic-btn {
            opacity: 0;
            pointer-events: none;
          }
          /* Fade-in when expanded */
          .container.expanded .end-call-btn,
          .container.expanded .mic-btn {
            opacity: 1;
            transform: translateY(0);
            animation: fadeSlideUp 0.6s ease forwards;
          }
        `;
        this.shadowRoot.appendChild(style);
        // Additional dynamic style for microphone activity rings
        const ringStyle = document.createElement("style");
        ringStyle.textContent = `
          .mic-btn { overflow: visible; }
          .mic-btn .mic-ring {
            position: absolute;
            top: 50%;
            left: 50%;
            transform-origin: center;
            transform: translate(-50%, -50%);
            border-radius: 50%;
            pointer-events: none;
          }
          .mic-btn .ring-1 {
            width: 40px;
            height: 40px;
            border: 1px solid rgba(255, 255, 255, 0.53);
            animation: micRingSpin1 4s linear infinite;
          }
          .mic-btn .ring-2 {
            width: 44px;
            height: 44px;
            border: 1px solid rgba(255, 255, 255, 0.51);
            animation: micRingSpin2 2s linear infinite reverse;
          }
          .mic-btn .ring-3 {
            width: 45px;
            height: 45px;
            border: 1px solid rgba(255, 255, 255, 0.51);
            animation: micRingSpin3 3s linear infinite;
          }
          @keyframes micRingSpin1 {
            0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
            50% { transform: translate(-50%, -50%) rotate(180deg) scale(1.1); }
            100% { transform: translate(-50%, -50%) rotate(360deg) scale(1); }
          }
          @keyframes micRingSpin2 {
            0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
            50% { transform: translate(-50%, -50%) rotate(180deg) scale(0.9); }
            100% { transform: translate(-50%, -50%) rotate(360deg) scale(1); }
          }
          @keyframes micRingSpin3 {
            0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
            50% { transform: translate(-50%, -50%) rotate(180deg) scale(1.15); }
            100% { transform: translate(-50%, -50%) rotate(360deg) scale(1); }
          }
        `;
        this.shadowRoot.appendChild(ringStyle);
        // Style for shimmering instruction text
        const promptStyle = document.createElement("style");
        promptStyle.textContent = `
          /* Prompt shimmering instruction text */
          .prompt-text {
            position: absolute;
            bottom: 6px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 0.85rem;
            font-weight: 400;
            pointer-events: none;
            background: linear-gradient(90deg, #ffffff 0%,rgb(213, 213, 213) 50%, #ffffff 100%);
            background-size: 200% 100%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 0 3px rgba(248,216,255,0.4);
            animation: shimmer 3s linear infinite;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 3s ease-in-out;
            z-index: 1004;
            }
          .container:not(.expanded) .prompt-text { opacity:0 !important; pointer-events:none; transition:none; animation:none !important; display:none !important; }
  
          @keyframes shimmer {
            0%   { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          .text-switch {
            animation: blurSwitch 1.3s ease-in-out;
          }
          @keyframes blurSwitch {
            0%   { filter: blur(0px); opacity: 1; }
            50%  { filter: blur(4px); opacity: 0; }
            100% { filter: blur(0px); opacity: 1; }
          }
        `;
        this.shadowRoot.appendChild(promptStyle);
        // Additional style: rotate close button on hover when collapsed
              // Additional override style for action button entrance animation
        const barStyle = document.createElement("style");
        barStyle.textContent = `
          .audio-bar {
            position: absolute;
            bottom: 0;
            left: 50%;
            height: 2px;
            width: 80%;
            transform-origin: center;
            transform: translateX(-50%) scaleX(0.3); /* minimum 30% */
            background: rgba(255,255,255,0.9);
            box-shadow: 0 0 4px rgba(255,255,255,0.7);
            opacity:0;
            transition: opacity 0.4s ease-out;
            z-index: 1005;
            pointer-events: none;
          }
        `;
        this.shadowRoot.appendChild(barStyle);
  
        const actionAnimStyle = document.createElement("style");
        actionAnimStyle.textContent = `
          @keyframes fadeSlideUp {
            0%   { opacity: 0; transform: translateY(24px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .container.expanded .end-call-btn,
          .container.expanded .mic-btn {
            animation: fadeSlideUp 0.45s cubic-bezier(0.33, 1, 0.68, 1) forwards;
          }
        `;
        this.shadowRoot.appendChild(actionAnimStyle);
  
        const closeRotateStyle = document.createElement("style");
        closeRotateStyle.textContent = `
          .close-btn:hover {
            transform: translate(0px,-0px) rotate(90deg) !important;
          }
        `;
        this.shadowRoot.appendChild(closeRotateStyle);
  
        // Main container
        this._container = document.createElement("div");
        this._container.className = "container";
        this._root.appendChild(this._container);
  
        // Horizontal audio level bar
        this._audioBar = document.createElement("div");
        this._audioBar.className = "audio-bar";
        this._container.appendChild(this._audioBar);
  
        // Placeholder (image or video based on placeholder-src attribute)
        this._createPlaceholder();
        this._container.appendChild(this._placeholder);
  
        // Video element
        this._video = document.createElement("video");
        this._video.setAttribute("playsinline", "");
        this._video.muted = true; // video-only playback
        this._container.appendChild(this._video);
  
        // Audio element
        this._audio = document.createElement("audio");
        this._audio.style.display = "none";
        this._root.appendChild(this._audio);
  
        // Controls
        this._controls = document.createElement("div");
        this._controls.className = "controls";
        this._container.appendChild(this._controls);
  
        this._startBtn = document.createElement("button");
        this._startBtn.textContent = "Start Call";
        this._startBtn.className = "btn primary";
        this._startBtn.style.display = "none"; // hidden in collapsed view (we start via container click)
        this._controls.appendChild(this._startBtn);
  
        // End call circular icon button
        this._endBtn = document.createElement("button");
        this._endBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92V23a2 2 0 0 1-2.18 2A19.78 19.78 0 0 1 1 4.18 2 2 0 0 1 3 2h6.09a1 1 0 0 1 1 .75l1.2 5.17a1 1 0 0 1-.29.95l-2.12 2.12a16 16 0 0 0 6.88 6.88l2.12-2.12a1 1 0 0 1 .95-.29l5.17 1.2a1 1 0 0 1 .75 1z"/></svg>`;
        this._endBtn.style.display = "none";
        this._endBtn.className = "end-call-btn";
        this._container.appendChild(this._endBtn);
  
        // Microphone indicator icon button
        this._micBtn = document.createElement("button");
        this._micBtn.innerHTML = `<img src="https://talk.iwy.ai/media/circular-pattern.png" alt="pattern" style="width:100%;height:100%;object-fit:contain;" />`;
        this._micBtn.style.display = "none";
        this._micBtn.className = "mic-btn";
        this._container.appendChild(this._micBtn);
        // Add animated rings around the mic button to indicate active listening
        ["ring-1", "ring-2", "ring-3"].forEach((cls) => {
          const ring = document.createElement("span");
          ring.className = `mic-ring ${cls}`;
          this._micBtn.appendChild(ring);
        });
  
        // Instruction shimmering text between mic and end buttons
        this._promptText = document.createElement("span");
        this._promptText.className = "prompt-text";
        this._promptText.textContent = "Listening...";
        this._container.appendChild(this._promptText);
  
        // Switch between messages every 9 seconds with blur transition
        const promptMessages = ["Listening...", "Talk to interrupt."];
        let promptIdx = 0;
        setInterval(() => {
          // trigger blur animation
          this._promptText.classList.add("text-switch");
          setTimeout(() => {
            promptIdx = (promptIdx + 1) % promptMessages.length;
            this._promptText.textContent = promptMessages[promptIdx];
            this._promptText.classList.remove("text-switch");
          }, 400);
        }, 9000); // switc
  
        // Close (×) button – only visible when collapsed
        this._closeBtn = document.createElement("button");
        this._closeBtn.textContent = "✕";
        this._closeBtn.className = "action-btn close-btn";
        this._root.appendChild(this._closeBtn);
  
        // Help button
        this._helpBtn = document.createElement("button");
        this._helpBtn.textContent = "✕";
        this._helpBtn.style.cssText = "position:absolute;top:0;right:0;transform: translate(50%,-50%);background:rgba(0,0,0,0.7);color:#fff;border:none;border-radius:50%;width:20px;height:20px;font-size:13px;line-height:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index: 1003;";
  
        // Menu button (three dots)
        this._menuBtn = document.createElement("button");
        this._menuBtn.className = "action-btn help-btn";
        // subtle question mark inside a circle icon
        this._menuBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
        this._root.appendChild(this._menuBtn);
        // Move menuBtn to be the first child (upper left), closeBtn stays upper right
        this._container.insertBefore(this._menuBtn, this._container.firstChild);
  
        // Menu
        this._menu = document.createElement("div");
        this._menu.className = "menu";
        this._container.appendChild(this._menu);
  
        // Status display
        this._status = document.createElement("div");
        this._status.className = "status";
        this._container.appendChild(this._status);
      }
  
      _addMenuLink(text, href) {
        const link = document.createElement("a");
        link.href = href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = text;
        this._menu.appendChild(link);
      }
  
      async _startCall() {
    if (this._state.connecting || this._state.connected) return;
  
  
  
        if (!this._agentId) {
          console.error("<live-avatar> missing agentid attribute");
          return;
        }
  
        this._setStatus("", false);
        // Schedule grayscale effect after container expansion (700ms)
        if (this._grayscaleTimeout) clearTimeout(this._grayscaleTimeout);
        if (this._placeholder) {
          this._placeholder.classList.remove("fade-out");
          this._placeholder.classList.remove("grayscale");
          // Trigger single pulse animation (grey in & out)
          this._placeholder.classList.add("pulse-grey");
          // Clean up class after animation ends
          this._placeholder.addEventListener('animationend', () => {
            this._placeholder.classList.remove('pulse-grey');
          }, { once: true });
        }
        this._state.connecting = true;
        this._startBtn.disabled = true;
  
        try {
          await this._dailyReady;
          if (!window.Daily) throw new Error("Daily JS failed to load");
  
          // Request session from backend
          const res = await fetch(this._sessionEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ agentId: this._agentId }),
          });
          if (!res.ok) throw new Error(`Session request failed (${res.status})`);
          const { roomUrl, dailyToken } = await res.json();
  
          // Create/Reuse call object
          this._call = window.Daily.createCallObject();
          this._call.setLocalVideo(false);
  
          // Bind events
          this._call.on("joined-meeting", (e) => this._handleJoined(e));
          this._call.on("left-meeting", () => this._handleLeft());
          this._call.on("participant-joined", (e) => this._handleParticipant(e));
          this._call.on("participant-updated", (e) => this._handleParticipant(e));
          this._call.on("participant-left", (e) => this._handleParticipantLeft(e));
          this._call.on("error", (e) => this._handleError(e));
  
          // Join room – only include token if non-null/defined
          const joinArgs = dailyToken ? { url: roomUrl, token: dailyToken } : { url: roomUrl };
          await this._call.join(joinArgs);
        } catch (err) {
          console.error(err);
          this._setStatus(err.message || "Error", true);
          this._resetConnectingState();
        }
      }
  
      async _stopCall() {
        if (!this._state.connected || !this._call) return;
        try {
          await this._call.leave();
        } catch (_) {}
        this._cleanupCall();
        this._updateUIDisconnected();
      }
  
      _handleJoined(event) {
        this._state.connected = true;
        this._state.connecting = false;
        this._video.classList.add("visible");
        // Remove grayscale (fade back to color) and schedule fade-out after delay
        if (this._grayscaleTimeout) { clearTimeout(this._grayscaleTimeout); this._grayscaleTimeout = null; }
        this._placeholder.classList.remove("grayscale");
        if (this._fadeTimeout) clearTimeout(this._fadeTimeout);
        this._fadeTimeout = setTimeout(() => {
          this._placeholder.classList.add("fade-out");
        }, 15000);
        this._container.classList.add("expanded");
        this._closeBtn.style.display = "none";
        this._startBtn.style.display = "none";
        this._endBtn.style.display = "flex";
        this._micBtn.style.display = "flex";
  
        // Begin mic button adaptive scaling based on local audio level
        const localAudio = event.participants.local.tracks.audio;
        if (localAudio && localAudio.persistentTrack) {
          const stream = new MediaStream([localAudio.persistentTrack]);
          this._startMicLevelVisualization(stream);
        }
        if (this._promptTimeout) clearTimeout(this._promptTimeout);
    this._promptText.style.opacity = "0";
    this._promptText.style.display = "none";
    this._promptTimeout = setTimeout(() => {
      this._promptText.style.display = "block";
      this._promptText.style.opacity = "1";
    }, 4000);
        this._setStatus("", false);
  
        const tracks = event.participants.local.tracks;
        Object.entries(tracks).forEach(([type, info]) => {
          if (info.persistentTrack) this._startOrUpdateTrack(type, info, "local");
        });
      }
  
      _handleLeft() {
        this._cleanupCall();
        this._updateUIDisconnected();
      }
  
      _handleError(ev) {
        console.error("DAILY ERROR", ev.error || ev);
        this._setStatus("Call error", true);
        this._cleanupCall();
        this._updateUIDisconnected();
      }
  
      _handleParticipant(ev) {
        const p = ev.participant;
        if (p.local) return; // ignore local updates here
        const tracks = p.tracks;
        Object.entries(tracks).forEach(([type, info]) => {
          if (info.persistentTrack) this._startOrUpdateTrack(type, info, p.session_id);
        });
      }
  
      _handleParticipantLeft(ev) {
        const trackTypes = ["video", "audio"];
        trackTypes.forEach((type) => {
          const el = type === "video" ? this._video : this._audio;
          if (el) el.srcObject = null;
        });
      }
  
      _startOrUpdateTrack(trackType, trackInfo, participantId) {
        const el = trackType === "video" ? this._video : this._audio;
        if (!el) return;
        if (trackType === "audio" && participantId === "local") return; // skip local audio
        if (trackType === "video" && participantId === "local") return; // skip local video display
  
        const needsUpdate = !el.srcObject || !el.srcObject.getTracks().includes(trackInfo.persistentTrack);
        if (needsUpdate) {
          el.srcObject = new MediaStream([trackInfo.persistentTrack]);
          el.onloadedmetadata = () => el.play().catch((e) => console.error("play error", e));
          // If this is an incoming audio track and visualization not yet active, start it
          if (trackType === "audio" && !this._levelAnimationFrame) {
            this._startMicLevelVisualization(el.srcObject);
          }
        }
      }
  
      _cleanupCall() {
        if (this._call) {
          this._call.destroy();
          this._call = null;
          this._stopMicLevelVisualization();
        }
        this._state.connected = false;
        this._state.connecting = false;
      }
  
      _updateUIDisconnected() {
        this._video.classList.remove("visible");
        this._video.srcObject = null;
        this._placeholder.classList.remove("fade-out");
    this._placeholder.classList.remove("grayscale");
    if (this._grayscaleTimeout) { clearTimeout(this._grayscaleTimeout); this._grayscaleTimeout = null; }
    if (this._fadeTimeout) { clearTimeout(this._fadeTimeout); this._fadeTimeout = null; }
        this._container.classList.remove("expanded");
        this._closeBtn.style.display = "block";
        this._startBtn.style.display = "none";
        this._startBtn.disabled = false;
        this._startBtn.textContent = "Start Call";
        this._endBtn.style.display = "none";
        if (this._micBtn) this._micBtn.style.display = "none";
        if (this._promptTimeout) { clearTimeout(this._promptTimeout); this._promptTimeout = null; }
    this._promptText.style.opacity = "0"; // Hide prompt text
    this._promptText.style.display = "none";
        this._setStatus("", false);
      }
  
      _setStatus(msg, isError) {
        if (!msg) {
          this._status.style.display = "none";
          this._status.textContent = "";
        } else {
          this._status.style.display = "block";
          this._status.textContent = msg;
          this._status.style.background = isError ? "#e53e3e" : "#3182ce";
        }
      }
  
      _resetConnectingState() {
        this._state.connecting = false;
        this._startBtn.disabled = false;
        this._startBtn.textContent = "Start Call";
      }
  
      /* ---------------------------------------------------------
       *  Microphone level visualization
       * --------------------------------------------------------- */
      _startMicLevelVisualization(stream) {
        try {
          if (!this._micBtn) return;
          if (!this._audioCtx) {
            this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          }
          const source = this._audioCtx.createMediaStreamSource(stream);
          this._audioAnalyser = this._audioCtx.createAnalyser();
  
          // Stop entrance animation so our transforms are not overridden
          this._micBtn.style.animation = "none";
          // Prepare audio bar fade-in after delay
          if (this._barFadeTimeout) clearTimeout(this._barFadeTimeout);
          this._audioBar.style.opacity = "0";
          this._audioBar.style.transition = "opacity 0.4s ease-out";
          this._barFadeTimeout = setTimeout(() => {
            if (this._audioBar) this._audioBar.style.opacity = "1";
          }, 1000);
  
          // Capture original transform to preserve translateY or other effects
          this._micBaseTransform = window.getComputedStyle(this._micBtn).transform;
          this._barBaseTransform = "translateX(-50%)";
          if (this._micBaseTransform === "none") this._micBaseTransform = "";
          this._audioAnalyser.fftSize = 32;
          source.connect(this._audioAnalyser);
          const data = new Uint8Array(this._audioAnalyser.fftSize);
  
          const update = () => {
            this._audioAnalyser.getByteTimeDomainData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) {
              const v = (data[i] - 128) / 128;
              sum += v * v;
            }
            const rms = Math.sqrt(sum / data.length); // 0..1
            // Use linear interpolation for smoother transitions
            const targetScale = 1 - Math.min(rms * 3.0, 0.8); // shrink up to 80%
            // Use previous scale value for smoothing
            if (!this._prevScale) this._prevScale = 1;
            const lerp = (a,b,t) => a + (b - a) * t;
            const scale = lerp(this._prevScale, targetScale, 0.35);
            this._prevScale = scale;
            this._micBtn.style.transform = `${this._micBaseTransform} scale(${scale})`;
            if (this._audioBar) {
              const minScale = 0.3;
              const barScale = Math.min(rms * 4, 1);
              if (!this._prevBarScale) this._prevBarScale = minScale;
              const rawScale = minScale + (1 - minScale) * barScale;
              const smoothBar = lerp(this._prevBarScale, rawScale, 0.25);
              this._prevBarScale = smoothBar;
              this._audioBar.style.transform = `${this._barBaseTransform} scaleX(${smoothBar})`; // transform independent of opacity
            }
            this._levelAnimationFrame = requestAnimationFrame(update);
          };
          update();
         } catch (e) {
           console.error("mic viz error", e);
         }
      }
  
      _stopMicLevelVisualization() {
        if (this._levelAnimationFrame) {
          cancelAnimationFrame(this._levelAnimationFrame);
          this._levelAnimationFrame = null;
        }
        if (this._audioBar) {
          this._audioBar.style.transform = `${this._barBaseTransform} scaleX(0.3)`;
          this._audioBar.style.opacity = "0";
          if (this._barFadeTimeout) { clearTimeout(this._barFadeTimeout); this._barFadeTimeout = null; }
          this._prevBarScale = null;
        }
        if (this._micBtn) {
          this._micBtn.style.transform = this._micBaseTransform || ""; // reset
        }
        if (this._audioCtx) {
          try { this._audioCtx.close(); } catch (_) {}
          this._audioCtx = null;
        }
        this._audioAnalyser = null;
      }
  
      /* ---------------------------------------------------------
       *  Placeholder management
       * --------------------------------------------------------- */
      _createPlaceholder() {
        const placeholderSrc = this.getAttribute("placeholder-src");
        
        if (placeholderSrc) {
          // Use image for custom placeholder
          this._placeholder = document.createElement("img");
          this._placeholder.src = placeholderSrc;
          this._placeholder.alt = "AI agent";
        } else {
          // Use default webp image as fallback
          this._placeholder = document.createElement("img");
          this._placeholder.src = "https://talk.iwy.ai/assets/demo-character.webp";
          this._placeholder.alt = "AI agent";
        }
        
        this._placeholder.className = "placeholder";
      }

      _updatePlaceholder() {
        if (!this._placeholder) return;
        
        const placeholderSrc = this.getAttribute("placeholder-src");
        
        if (placeholderSrc) {
          // Switch to image if not already
          if (this._placeholder.tagName !== "IMG") {
            const oldPlaceholder = this._placeholder;
            this._placeholder = document.createElement("img");
            this._placeholder.className = "placeholder";
            this._placeholder.alt = "AI agent";
            this._container.replaceChild(this._placeholder, oldPlaceholder);
          }
          this._placeholder.src = placeholderSrc;
        } else {
          // Use default webp image
          if (this._placeholder.tagName !== "IMG") {
            const oldPlaceholder = this._placeholder;
            this._placeholder = document.createElement("img");
            this._placeholder.className = "placeholder";
            this._placeholder.alt = "AI agent";
            this._container.replaceChild(this._placeholder, oldPlaceholder);
          }
          this._placeholder.src = "https://talk.iwy.ai/assets/demo-character.webp";
        }
      }

      /* ---------------------------------------------------------
       *  Static helpers
       * --------------------------------------------------------- */
      static loadDaily() {
        if (window.Daily) return Promise.resolve();
        if (LiveAvatar._dailyPromise) return LiveAvatar._dailyPromise;

        LiveAvatar._dailyPromise = new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = DAILY_JS_SRC;
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
        return LiveAvatar._dailyPromise;
      }
    }
  
    // Register element once
    if (!customElements.get("live-avatar")) {
      customElements.define("live-avatar", LiveAvatar);
    }
  })();
  