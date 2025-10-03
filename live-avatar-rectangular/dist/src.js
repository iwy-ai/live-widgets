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


// Embeddable LiveAvatarRectangular widget with Pipecat integration
// Usage example (insert in host page):
//   <live-avatar-rectangular agentid="YOUR_AGENT_ID"></live-avatar-rectangular>
//   <script src="https://unpkg.com/@iwy/live-widgets@latest/dist/live-avatar-rectangular.min.js" async></script>
//
// This script defines a custom element <live-avatar-rectangular> which displays an AI avatar
// that fills its container div like an iframe. It provides a flexible, resizable video chat experience.

import { PipecatClient, RTVIEvent } from '@pipecat-ai/client-js';
import { DailyTransport } from '@pipecat-ai/daily-transport';

(() => {
  // Endpoint that returns { roomUrl, dailyToken }
  const DEFAULT_SESSION_ENDPOINT = "https://api.iwy.ai/api/start-agent-session";

  // Language configuration for prompt messages
  const LANGUAGE_CONFIG = {
    en: {
      listening: "Listening...",
      talkToInterrupt: "Talk to interrupt."
    },
    no: {
      listening: "Lytter...",
      talkToInterrupt: "Snakk for å avbryte."
    }
  };

  /* -------------------------------------------------------------
   *  <live-avatar-rectangular> implementation with Pipecat
   * ------------------------------------------------------------- */
  class LiveAvatarRectangular extends HTMLElement {
    constructor() {
      super();
      this._state = {
        connected: false,
        connecting: false,
        overlayVisible: true,
        overlayFadeOut: false,
      };
      this._pcClient = null; // Pipecat client
      this._agentId = null;
      this._language = "en"; // Default language
      this._promptTimeout = null;
      // Timeout handle for delayed placeholder fade-out
      this._fadeTimeout = null;
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

      // Build static DOM once
      this._buildStaticDom();
    }

    static get observedAttributes() {
      return ["agentid", "data-endpoint", "placeholder-src", "language"];
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
      if (name === "language") {
        this._language = value || "en";
        this._updatePromptMessages();
      }
    }

    connectedCallback() {
      // Apply defaults if attributes weren't present at construction
      if (!this._agentId) this._agentId = this.getAttribute("agentid");
      this._sessionEndpoint = this.getAttribute("data-endpoint") || DEFAULT_SESSION_ENDPOINT;
      this._language = this.getAttribute("language") || "en";

      // Button listeners
      this._endBtn.addEventListener("click", () => this._stopCall());

      // Play button click to start call
      this._playButton.addEventListener("click", (e) => {
        e.stopPropagation();
        if (this._state.connected || this._state.connecting) return;

        // Hide play overlay immediately on click
        this._playOverlay.classList.add("hidden");
        this._playOverlay.style.opacity = "0";

        this._setStatus("Connecting...", false);
        this._startCall();
      });

      // Menu button
      this._menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this._menu.classList.toggle("visible");
      });
      document.addEventListener("click", () => this._menu.classList.remove("visible"));
      this._addMenuLabel("iwy.ai");
      this._addMenuLink("Help", "https://www.iwy.ai/contact");
      this._addMenuLink("Privacy", "https://www.iwy.ai/privacy");
      this._addMenuLink("Terms", "https://www.iwy.ai/terms");
    }

    disconnectedCallback() {
      this._stopCall();
      this._endBtn.removeEventListener("click", this._stopCall);

      // Clean up prompt switching interval
      if (this._promptSwitchInterval) {
        clearInterval(this._promptSwitchInterval);
        this._promptSwitchInterval = null;
      }
    }

    /* ---------------------------------------------------------
     *  Internal helpers
     * --------------------------------------------------------- */

    _buildStaticDom() {
      // Styles (scoped to shadow DOM)
      const style = document.createElement("style");
      style.textContent = `
        * {
          box-sizing: border-box;
        }

        :host {
          display: block;
          width: 100%;
          height: 100%;
          min-height: 12.5rem;
          font-family: system-ui, sans-serif;
        }

        .iwy-avatar-root {
          width: 100%;
          height: 100%;
        }

        .container {
          width: 100%;
          height: 100%;
          min-height: 12.5rem;
          position: relative;
          border-radius: 0.75rem;
          overflow: hidden;
          border: 0.0625rem solid #e2e2e2;
          background: #000;
        }

        /* Top gradient shade */
        .container::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3rem; /* controls gradient height */
          background: linear-gradient(to bottom,
            rgba(0,0,0,0.65)  0%,
            rgba(0,0,0,0.45)  15%,
            rgba(0,0,0,0.25)  35%,
            rgba(0,0,0,0.1)   60%,
            rgba(0,0,0,0.02)  85%,
            rgba(0,0,0,0)     100%);
          pointer-events: none; /* allow interactions through */
          z-index: 1;
        }

        /* Bottom gradient shade */
        .container::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3rem; /* controls gradient height */
          background: linear-gradient(to top,
            rgba(0,0,0,0.65)  0%,
            rgba(0,0,0,0.45)  15%,
            rgba(0,0,0,0.25)  35%,
            rgba(0,0,0,0.1)   60%,
            rgba(0,0,0,0.02)  85%,
            rgba(0,0,0,0)     100%);
          pointer-events: none; /* allow interactions through */
        }

        .placeholder {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: opacity 2.25s ease;
        }
        .placeholder.fade-out {
          opacity: 0;
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
          bottom: 0.625rem;
          left: 0.625rem;
          display: none;
          gap: 0.5rem;
        }

        /* Play button overlay */
        .play-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
          z-index: 1002;
        }

        .container:hover .play-overlay:not(.hidden) {
          opacity: 1;
        }

        .play-overlay-blur {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
        }

        .play-button {
          position: relative;
          width: 5rem;
          height: 5rem;
          border-radius: 50%;
          background: transparent;
          border: 0.1875rem solid rgba(255, 255, 255, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          pointer-events: all;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .play-button:hover {
          transform: scale(1.1);
          border-color: rgba(255, 255, 255, 1);
        }

        .play-button::after {
          content: '';
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 0.75rem 0 0.75rem 1.25rem;
          border-color: transparent transparent transparent rgba(255, 255, 255, 0.9);
          margin-left: 0.25rem;
        }

        .play-button:hover::after {
          border-color: transparent transparent transparent rgba(255, 255, 255, 1);
        }

        .action-btn {
          position: absolute;
          width: 1.375rem;
          height: 1.375rem;
          background: rgba(0,0,0,0.75);
          color:#fff;
          border:none;
          border-radius:50%;
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
          z-index:1003;
          font-size:0.875rem;
        }
        .help-btn  { display:none; }

        .menu-btn {
          position: absolute;
          top: 0.75rem;
          left: 0.75rem;
          background: rgba(0,0,0,0.65);
          border: none;
          border-radius: 50%;
          cursor: pointer;
          width: 1.75rem;
          height: 1.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          z-index: 1003;
        }
        .menu-btn svg {
          width: 1rem;
          height: 1rem;
        }
        .menu {
          position: absolute;
          top: 2.25rem;
          left: 0.5rem;
          display: none;
          flex-direction: column;
          background:#fff;
          border:0.0625rem solid #e2e2e2;
          border-radius:0.5rem;
          box-shadow:0 0.25rem 0.75rem rgba(0,0,0,0.15);
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
        .menu .menu-label {
          padding:0.5rem 1rem;
          font-size:0.75rem;
          font-style:italic;
          color:#666;
          white-space:nowrap;
          pointer-events:none;
        }

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

        /* --- Call action icon buttons --- */
        .end-call-btn, .mic-btn {
          opacity: 0;
          transform: translateY(1.5rem);
          transition: opacity 2.6s ease, transform 2.6s ease;
          position: absolute;
          width: 3rem;
          height: 3rem;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          cursor: pointer;
          z-index: 1004;
        }
        .end-call-btn { background: #9b2c2c; right: 0.75rem; bottom: 0.375rem; }
        .end-call-btn:hover {
          filter: hue-rotate(-10deg) brightness(1.05);
        }
        .mic-btn { background:#300040; left: 0.75rem; bottom: 0.375rem; pointer-events:none; cursor:default; }
        .mic-btn img { filter: invert(1); }

        /* Fade-in when connected */
        .container.connected .end-call-btn,
        .container.connected .mic-btn {
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
          width: 3rem;
          height: 3rem;
          border: 0.0625rem solid rgba(255, 255, 255, 0.53);
          animation: micRingSpin1 4s linear infinite;
        }
        .mic-btn .ring-2 {
          width: 3.25rem;
          height: 3.25rem;
          border: 0.0625rem solid rgba(255, 255, 255, 0.51);
          animation: micRingSpin2 2s linear infinite reverse;
        }
        .mic-btn .ring-3 {
          width: 3.3125rem;
          height: 3.3125rem;
          border: 0.0625rem solid rgba(255, 255, 255, 0.51);
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
          bottom: 0.375rem;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.85rem;
          font-weight: 400;
          pointer-events: none;
          background: linear-gradient(90deg, #ffffff 0%,rgb(213, 213, 213) 50%, #ffffff 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 0 0.1875rem rgba(248,216,255,0.4);
          animation: shimmer 3s linear infinite;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 3s ease-in-out;
          z-index: 1004;
        }

        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .text-switch {
          animation: blurSwitch 1.3s ease-in-out;
        }
        @keyframes blurSwitch {
          0%   { filter: blur(0); opacity: 1; }
          50%  { filter: blur(0.25rem); opacity: 0; }
          100% { filter: blur(0); opacity: 1; }
        }
      `;
      this.shadowRoot.appendChild(promptStyle);

      // Audio level bar style
      const barStyle = document.createElement("style");
      barStyle.textContent = `
        .audio-bar {
          position: absolute;
          bottom: 0;
          left: 50%;
          height: 0.125rem;
          width: 80%;
          transform-origin: center;
          transform: translateX(-50%) scaleX(0.3); /* minimum 30% */
          background: rgba(255,255,255,0.9);
          box-shadow: 0 0 0.25rem rgba(255,255,255,0.7);
          opacity:0;
          transition: opacity 0.4s ease-out;
          z-index: 1005;
          pointer-events: none;
        }
      `;
      this.shadowRoot.appendChild(barStyle);

      // Bars spinner styles
      const barsSpinnerStyle = document.createElement("style");
      barsSpinnerStyle.textContent = `
        .bars-spinner {
          position: absolute;
          bottom: 1.25rem;
          left: 50%;
          transform: translateX(-50%);
          width: 1.5rem;
          height: 1.5rem;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 1006;
          pointer-events: none;
        }
        .bars-spinner.visible {
          opacity: 1;
        }
        .bars-spinner svg {
          filter: drop-shadow(0 0 0.125rem rgba(67, 39, 39, 0.8)) drop-shadow(0 0 0.25rem rgba(255, 255, 255, 0.6));
        }
        .spinner-bar {
          animation: spinner-bars-animation 1.4s linear infinite;
          animation-delay: -1.4s;
          fill: #ffffff;
        }
        .spinner-bars-2 {
          animation-delay: -1.15s;
        }
        .spinner-bars-3 {
          animation-delay: -0.9s;
        }
        @keyframes spinner-bars-animation {
          0% {
            y: 0.0625rem;
            height: 1.375rem;
            fill: #ffffff;
            opacity: 1;
          }
          25% {
            fill: #f0f0f0;
            opacity: 0.9;
          }
          50% {
            y: 0.1875rem;
            height: 1.125rem;
            fill: #888888;
            opacity: 0.7;
          }
          75% {
            fill: #333333;
            opacity: 0.4;
          }
          93.75% {
            y: 0.3125rem;
            height: 0.875rem;
            fill: #000000;
            opacity: 0.2;
          }
          100% {
            y: 0.0625rem;
            height: 1.375rem;
            fill: #ffffff;
            opacity: 1;
          }
        }
      `;
      this.shadowRoot.appendChild(barsSpinnerStyle);

      const actionAnimStyle = document.createElement("style");
      actionAnimStyle.textContent = `
        @keyframes fadeSlideUp {
          0%   { opacity: 0; transform: translateY(1.5rem); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .container.connected .end-call-btn,
        .container.connected .mic-btn {
          animation: fadeSlideUp 0.45s cubic-bezier(0.33, 1, 0.68, 1) forwards;
        }
      `;
      this.shadowRoot.appendChild(actionAnimStyle);

      // Main container
      this._container = document.createElement("div");
      this._container.className = "container";
      this._root.appendChild(this._container);

      // Horizontal audio level bar
      this._audioBar = document.createElement("div");
      this._audioBar.className = "audio-bar";
      this._container.appendChild(this._audioBar);

      // Bars spinner
      this._barsSpinner = document.createElement("div");
      this._barsSpinner.className = "bars-spinner";
      this._barsSpinner.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="1.5rem" height="1.5rem" viewBox="0 0 24 24">
          <title>Loading...</title>
          <rect
            class="spinner-bar"
            x="1"
            y="1"
            width="6"
            height="22"
            fill="currentColor"
          />
          <rect
            class="spinner-bar spinner-bars-2"
            x="9"
            y="1"
            width="6"
            height="22"
            fill="currentColor"
          />
          <rect
            class="spinner-bar spinner-bars-3"
            x="17"
            y="1"
            width="6"
            height="22"
            fill="currentColor"
          />
        </svg>
      `;
      this._container.appendChild(this._barsSpinner);

      // Placeholder (image or video based on placeholder-src attribute)
      this._createPlaceholder();
      this._container.appendChild(this._placeholder);

      // Play overlay (shown on hover before call starts)
      this._playOverlay = document.createElement("div");
      this._playOverlay.className = "play-overlay";

      const playBlur = document.createElement("div");
      playBlur.className = "play-overlay-blur";
      this._playOverlay.appendChild(playBlur);

      this._playButton = document.createElement("div");
      this._playButton.className = "play-button";
      this._playOverlay.appendChild(this._playButton);

      this._container.appendChild(this._playOverlay);

      // Video element
      this._video = document.createElement("video");
      this._video.setAttribute("playsinline", "");
      this._video.setAttribute("autoplay", "");
      this._video.muted = true; // video-only playback
      this._container.appendChild(this._video);

      // Audio element
      this._audio = document.createElement("audio");
      this._audio.setAttribute("autoplay", "");
      this._audio.style.display = "none";
      this._root.appendChild(this._audio);

      // End call circular icon button
      this._endBtn = document.createElement("button");
      this._endBtn.innerHTML = `<svg width="1.125rem" height="1.125rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92V23a2 2 0 0 1-2.18 2A19.78 19.78 0 0 1 1 4.18 2 2 0 0 1 3 2h6.09a1 1 0 0 1 1 .75l1.2 5.17a1 1 0 0 1-.29.95l-2.12 2.12a16 16 0 0 0 6.88 6.88l2.12-2.12a1 1 0 0 1 .95-.29l5.17 1.2a1 1 0 0 1 .75 1z"/></svg>`;
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
      this._container.appendChild(this._promptText);

      // Initialize prompt messages and set up switching
      this._updatePromptMessages();
      this._setupPromptSwitching();

      // Menu button (three dots icon)
      this._menuBtn = document.createElement("button");
      this._menuBtn.className = "menu-btn";
      this._menuBtn.innerHTML = `<svg width="1rem" height="1rem" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>`;
      this._container.appendChild(this._menuBtn);

      // Menu
      this._menu = document.createElement("div");
      this._menu.className = "menu";
      this._container.appendChild(this._menu);

      // Status display
      this._status = document.createElement("div");
      this._status.className = "status";
      this._container.appendChild(this._status);
    }

    _addMenuLabel(text) {
      const label = document.createElement("div");
      label.className = "menu-label";
      label.textContent = text;
      this._menu.appendChild(label);
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
        console.error("<live-avatar-rectangular> missing agentid attribute");
        return;
      }

      this._setStatus("", false);
      // Show bars spinner immediately
      this._barsSpinner.classList.add("visible");

      if (this._placeholder) {
        this._placeholder.classList.remove("fade-out");
        // Trigger single pulse animation (grey in & out)
        this._placeholder.classList.add("pulse-grey");
        // Clean up class after animation ends
        this._placeholder.addEventListener('animationend', () => {
          this._placeholder.classList.remove('pulse-grey');
        }, { once: true });
      }
      this._state.connecting = true;

      try {
        // Request session from backend
        const res = await fetch(this._sessionEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId: this._agentId }),
        });
        if (!res.ok) throw new Error(`Session request failed (${res.status})`);
        const { roomUrl, dailyToken } = await res.json();

        // Initialize Pipecat client with DailyTransport
        const pipecatConfig = {
          transport: new DailyTransport({
            bufferLocalAudioUntilBotReady: true, // Enable audio buffering
          }),
          enableMic: true,
          enableCam: false,
          callbacks: {
            onConnected: () => {
              console.log("Pipecat connected");
              this._state.connected = true;
              this._state.connecting = false;
            },
            onDisconnected: () => {
              console.log("Pipecat disconnected");
              this._handleDisconnected();
            },
            onBotConnected: (participant) => {
              console.log("Bot connected:", participant);
              // Hide spinner when bot joins
              this._barsSpinner.classList.remove("visible");

              // Show end call and mic buttons immediately when bot connects
              this._container.classList.add("connected");
              this._endBtn.style.display = "flex";
              this._micBtn.style.display = "flex";

              // Show text carousel with 4s delay and fade-in transition
              if (this._promptTimeout) clearTimeout(this._promptTimeout);
              this._promptText.style.transition = "opacity 0.4s ease-out";
              this._promptTimeout = setTimeout(() => {
                // Set the text content now (when session has started)
                this._promptText.textContent = this._promptMessages[0];
                this._promptText.style.display = "block";
                this._promptText.style.opacity = "1";
              }, 4000);

              // Show audio bar with 4s delay and fade-in transition
              if (this._barFadeTimeout) clearTimeout(this._barFadeTimeout);
              if (this._audioBar) {
                this._audioBar.style.transition = "opacity 0.4s ease-out";
                this._barFadeTimeout = setTimeout(() => {
                  this._audioBar.style.opacity = "1";
                }, 4000);
              }
            },
            onBotReady: (data) => {
              console.log("Bot ready:", data);
              this._setupMediaTracks();
            },
            onUserTranscript: (data) => {
              if (data.final) {
                console.log("User:", data.text);
              }
            },
            onBotTranscript: (data) => {
              console.log("Bot:", data.text);
            },
            onAudioBufferingStarted: () => {
              console.log("Audio buffering started");
              this._updateUIConnected();
            },
            onAudioBufferingStopped: () => {
              console.log("Audio buffering stopped");
            },
            onError: (error) => {
              console.error("Pipecat error:", error);
              this._setStatus("Error", true);
              this._barsSpinner.classList.remove("visible");
              this._resetConnectingState();
            },
          },
        };

        this._pcClient = new PipecatClient(pipecatConfig);
        this._setupTrackListeners();

        // Connect to the Daily room
        const connectParams = {
          url: roomUrl,
          token: dailyToken,
        };

        await this._pcClient.connect(connectParams);
      } catch (err) {
        console.error(err);
        this._setStatus(err.message || "Error", true);
        this._barsSpinner.classList.remove("visible");
        this._resetConnectingState();
      }
    }

    async _stopCall() {
      if (!this._state.connected || !this._pcClient) return;
      try {
        await this._pcClient.disconnect();
      } catch (_) {}
      this._cleanupCall();
      this._updateUIDisconnected();
    }

    _updateUIConnected() {
      this._video.classList.add("visible");
      // Remove grayscale and schedule fade-out after delay
      this._placeholder.classList.remove("grayscale");
      if (this._fadeTimeout) clearTimeout(this._fadeTimeout);
      this._fadeTimeout = setTimeout(() => {
        this._placeholder.classList.add("fade-out");
      }, 35000);

      this._container.classList.add("connected");
      this._endBtn.style.display = "flex";
      this._micBtn.style.display = "flex";

      if (this._promptTimeout) clearTimeout(this._promptTimeout);
      this._promptText.style.opacity = "0";
      this._promptText.style.display = "none";
      this._setStatus("", false);
    }

    _handleDisconnected() {
      this._cleanupCall();
      this._updateUIDisconnected();
    }

    _setupMediaTracks() {
      if (!this._pcClient) return;
      const tracks = this._pcClient.tracks();
      console.log('Available tracks:', {
        botAudio: !!tracks.bot?.audio,
        botVideo: !!tracks.bot?.video,
        localAudio: !!tracks.local?.audio
      });

      if (tracks.bot?.audio) {
        this._setupAudioTrack(tracks.bot.audio);
      }
      if (tracks.bot?.video) {
        this._setupVideoTrack(tracks.bot.video);
      }
      if (tracks.local?.audio) {
        const stream = new MediaStream([tracks.local.audio]);
        this._startMicLevelVisualization(stream);
      }
    }

    _setupTrackListeners() {
      if (!this._pcClient) return;

      // Listen for new tracks starting
      this._pcClient.on(RTVIEvent.TrackStarted, (track, participant) => {
        console.log(`Track started: ${track.kind} from ${participant?.local ? 'local' : 'bot'}`);

        // Handle bot tracks (audio/video)
        if (!participant?.local) {
          if (track.kind === 'audio') {
            this._setupAudioTrack(track);
          } else if (track.kind === 'video') {
            this._setupVideoTrack(track);
          }
        } else if (participant?.local && track.kind === 'audio') {
          // Handle local audio for mic visualization
          const stream = new MediaStream([track]);
          this._startMicLevelVisualization(stream);
        }
      });

      // Listen for tracks stopping
      this._pcClient.on(RTVIEvent.TrackStopped, (track, participant) => {
        console.log(`Track stopped: ${track.kind} from ${participant?.name || 'unknown'}`);
      });
    }

    _setupAudioTrack(track) {
      console.log('Setting up audio track');
      if (this._audio.srcObject && 'getAudioTracks' in this._audio.srcObject) {
        const oldTrack = this._audio.srcObject.getAudioTracks()[0];
        if (oldTrack?.id === track.id) return;
      }
      this._audio.srcObject = new MediaStream([track]);
      this._audio.play().catch((e) => console.error("Audio play error:", e));
    }

    _setupVideoTrack(track) {
      console.log('Setting up video track:', track);
      if (!this._video) {
        console.log('Video element not found');
        return;
      }

      if (this._video.srcObject && 'getVideoTracks' in this._video.srcObject) {
        const oldTrack = this._video.srcObject.getVideoTracks()[0];
        if (oldTrack?.id === track.id) {
          console.log('Video track already set');
          return;
        }
      }

      this._video.srcObject = new MediaStream([track]);
      this._video.classList.add("visible");
      console.log('Video track set, attempting to play');

      this._video.play()
        .then(() => console.log('Video playing successfully'))
        .catch((e) => console.error("Video play error:", e));
    }

    _cleanupCall() {
      if (this._pcClient) {
        this._pcClient = null;
        this._stopMicLevelVisualization();
      }
      this._state.connected = false;
      this._state.connecting = false;
    }

    _updateUIDisconnected() {
      this._video.classList.remove("visible");
      this._video.srcObject = null;
      this._barsSpinner.classList.remove("visible");
      this._placeholder.classList.remove("fade-out");
      this._placeholder.classList.remove("grayscale");
      if (this._fadeTimeout) { clearTimeout(this._fadeTimeout); this._fadeTimeout = null; }

      this._container.classList.remove("connected");
      this._playOverlay.classList.remove("hidden");
      this._endBtn.style.display = "none";
      if (this._micBtn) this._micBtn.style.display = "none";
      if (this._promptTimeout) { clearTimeout(this._promptTimeout); this._promptTimeout = null; }
      this._promptText.style.opacity = "0";
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
      // Show play overlay again if needed
      if (!this._state.connected) {
        this._playOverlay.classList.remove("hidden");
      }
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
        // Audio bar will be shown when bot participant joins
        if (this._barFadeTimeout) clearTimeout(this._barFadeTimeout);
        this._audioBar.style.opacity = "0";
        this._audioBar.style.transition = "opacity 0.4s ease-out";

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
            this._audioBar.style.transform = `${this._barBaseTransform} scaleX(${smoothBar})`;
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
        this._micBtn.style.transform = this._micBaseTransform || "";
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
        this._placeholder.src = "https://talk.iwy.ai/assets/plc_grey_purple_2_loop.webp";
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
        this._placeholder.src = "https://talk.iwy.ai/assets/plc_grey_purple_2_loop.webp";
      }
    }

    /* ---------------------------------------------------------
     *  Language and prompt message helpers
     * --------------------------------------------------------- */
    _updatePromptMessages() {
      const config = LANGUAGE_CONFIG[this._language] || LANGUAGE_CONFIG.en;
      this._promptMessages = [config.listening, config.talkToInterrupt];

      // Update current text only if session is connected (don't show text before session starts)
      if (this._promptText && this._state.connected) {
        this._promptText.textContent = this._promptMessages[0];
      }
    }

    _setupPromptSwitching() {
      if (this._promptSwitchInterval) {
        clearInterval(this._promptSwitchInterval);
      }

      let promptIdx = 0;
      this._promptSwitchInterval = setInterval(() => {
        if (!this._promptMessages || !this._state.connected) return;

        // trigger blur animation
        this._promptText.classList.add("text-switch");
        setTimeout(() => {
          promptIdx = (promptIdx + 1) % this._promptMessages.length;
          this._promptText.textContent = this._promptMessages[promptIdx];
          this._promptText.classList.remove("text-switch");
        }, 400);
      }, 9000);
    }
  }

  // Register element once
  if (!customElements.get("live-avatar-rectangular")) {
    customElements.define("live-avatar-rectangular", LiveAvatarRectangular);
  }
})();
