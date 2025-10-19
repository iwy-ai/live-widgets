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


// Embeddable AudioVisualizer widget with Pipecat integration and Plasma visualization
// Usage example (insert in host page):
//   <audio-visualizer agentid="YOUR_AGENT_ID"></audio-visualizer>
//   <script src="https://unpkg.com/@iwy/live-widgets@latest/dist/audio-visualizer.min.js" async></script>
//
// This script defines a custom element <audio-visualizer> which displays a WebGL plasma visualizer
// that reacts to audio input and fills its container div. Perfect for voice-only AI interactions.

import { PipecatClient, RTVIEvent } from '@pipecat-ai/client-js';
import { DailyTransport } from '@pipecat-ai/daily-transport';
import * as THREE from 'three';

(() => {
  // Endpoint that returns { roomUrl, dailyToken }
  const DEFAULT_SESSION_ENDPOINT = "https://api.iwy.ai/api/start-agent-session";

  /* -------------------------------------------------------------
   *  WebGL Plasma Visualizer
   * ------------------------------------------------------------- */
  class PlasmaVisualizer {
    constructor(container) {
      this.container = container;
      this.scene = new THREE.Scene();
      this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.container.appendChild(this.renderer.domElement);

      this.audioLevel = 0;
      this.time = 0;
      this.isAnimating = false;

      this._setupPlasmaShader();
      this._setupResizeObserver();
      this._updateSize();
    }

    _setupPlasmaShader() {
      const vertexShader = `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `;

      const fragmentShader = `
        uniform float time;
        uniform float audioLevel;
        uniform vec2 resolution;
        varying vec2 vUv;

        // Simplex noise function
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                             -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy) );
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
            + i.x + vec3(0.0, i1.x, 1.0 ));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m ;
          m = m*m ;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        void main() {
          vec2 uv = vUv;
          vec2 center = vec2(0.5, 0.5);
          vec2 p = uv - center;

          // Aspect ratio correction
          float aspect = resolution.x / resolution.y;
          p.x *= aspect;

          float dist = length(p);
          float angle = atan(p.y, p.x);

          // Animated plasma effect
          float t = time * 0.3;
          float audio = audioLevel * 2.0;

          // Multiple noise layers
          float n1 = snoise(uv * 3.0 + vec2(t, t * 0.5)) * 0.5 + 0.5;
          float n2 = snoise(uv * 5.0 - vec2(t * 0.7, t * 0.3)) * 0.5 + 0.5;
          float n3 = snoise(vec2(angle * 3.0, dist * 5.0 + t)) * 0.5 + 0.5;

          // Combine noise layers
          float plasma = n1 * 0.4 + n2 * 0.3 + n3 * 0.3;
          plasma += audio * 0.3;

          // Radial gradient for vignette
          float radial = 1.0 - smoothstep(0.0, 0.7, dist);

          // Animated rings
          float rings = sin(dist * 20.0 - t * 2.0 + audio * 5.0) * 0.5 + 0.5;
          rings *= radial;

          // Color palette (purple/pink/blue theme)
          vec3 color1 = vec3(0.5, 0.0, 0.8); // Purple
          vec3 color2 = vec3(0.8, 0.2, 0.7); // Pink
          vec3 color3 = vec3(0.2, 0.4, 0.9); // Blue

          vec3 finalColor = mix(color1, color2, plasma);
          finalColor = mix(finalColor, color3, rings * 0.5);

          // Add brightness based on audio
          finalColor *= (0.7 + audio * 0.6);

          // Apply radial gradient
          finalColor *= radial * 1.2;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `;

      const geometry = new THREE.PlaneGeometry(2, 2);
      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          time: { value: 0 },
          audioLevel: { value: 0 },
          resolution: { value: new THREE.Vector2() }
        }
      });

      this.plasma = new THREE.Mesh(geometry, material);
      this.scene.add(this.plasma);
    }

    _setupResizeObserver() {
      this.resizeObserver = new ResizeObserver(() => this._updateSize());
      this.resizeObserver.observe(this.container);
    }

    _updateSize() {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.renderer.setSize(width, height);
      this.plasma.material.uniforms.resolution.value.set(width, height);
    }

    start() {
      if (this.isAnimating) return;
      this.isAnimating = true;
      this._animate();
    }

    stop() {
      this.isAnimating = false;
    }

    setAudioLevel(level) {
      this.audioLevel = Math.min(level * 1.5, 1.0);
    }

    _animate() {
      if (!this.isAnimating) return;

      this.time += 0.016; // ~60fps
      this.plasma.material.uniforms.time.value = this.time;
      this.plasma.material.uniforms.audioLevel.value = this.audioLevel;

      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(() => this._animate());
    }

    dispose() {
      this.stop();
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }
      this.renderer.dispose();
      this.plasma.geometry.dispose();
      this.plasma.material.dispose();
    }
  }

  /* -------------------------------------------------------------
   *  <audio-visualizer> implementation with Pipecat
   * ------------------------------------------------------------- */
  class AudioVisualizer extends HTMLElement {
    constructor() {
      super();
      this._state = {
        connected: false,
        connecting: false,
      };
      this._pcClient = null;
      this._agentId = null;
      this._plasmaViz = null;

      // Audio analysis
      this._audioCtx = null;
      this._audioAnalyser = null;
      this._levelAnimationFrame = null;

      // Create shadow DOM
      this.attachShadow({ mode: "open" });
      this._root = document.createElement("div");
      this._root.className = "iwy-audio-viz-root";
      this.shadowRoot.appendChild(this._root);

      // Build static DOM
      this._buildStaticDom();
    }

    static get observedAttributes() {
      return ["agentid", "data-endpoint"];
    }

    attributeChangedCallback(name, _old, value) {
      if (name === "agentid") {
        this._agentId = value;
      }
      if (name === "data-endpoint") {
        this._sessionEndpoint = value;
      }
    }

    connectedCallback() {
      if (!this._agentId) this._agentId = this.getAttribute("agentid");
      this._sessionEndpoint = this.getAttribute("data-endpoint") || DEFAULT_SESSION_ENDPOINT;

      // Button listeners
      this._startBtn.addEventListener("click", () => this._startCall());
      this._endBtn.addEventListener("click", () => this._stopCall());

      // Initialize plasma visualizer
      this._plasmaViz = new PlasmaVisualizer(this._plasmaContainer);
      this._plasmaViz.start();
    }

    disconnectedCallback() {
      this._stopCall();
      if (this._plasmaViz) {
        this._plasmaViz.dispose();
        this._plasmaViz = null;
      }
    }

    _buildStaticDom() {
      const style = document.createElement("style");
      style.textContent = `
        * {
          box-sizing: border-box;
        }

        :host {
          display: block;
          width: 100%;
          height: 100%;
          min-height: 200px;
          font-family: system-ui, sans-serif;
        }

        .iwy-audio-viz-root {
          width: 100%;
          height: 100%;
        }

        .container {
          width: 100%;
          height: 100%;
          min-height: 200px;
          position: relative;
          border-radius: 0.75rem;
          overflow: hidden;
          border: 0.0625rem solid #e2e2e2;
          background: #000;
        }

        .plasma-container {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .plasma-container canvas {
          display: block;
          width: 100%;
          height: 100%;
        }

        .controls {
          position: absolute;
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 1rem;
          z-index: 10;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 2rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .start-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .start-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .start-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .end-btn {
          background: rgba(220, 38, 38, 0.9);
          color: white;
          display: none;
        }

        .end-btn:hover {
          background: rgba(220, 38, 38, 1);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
        }

        .end-btn.visible {
          display: flex;
        }

        .status {
          position: absolute;
          top: 1rem;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          display: none;
          z-index: 10;
        }

        .status.visible {
          display: block;
        }

        .spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `;
      this.shadowRoot.appendChild(style);

      // Main container
      this._container = document.createElement("div");
      this._container.className = "container";
      this._root.appendChild(this._container);

      // Plasma container
      this._plasmaContainer = document.createElement("div");
      this._plasmaContainer.className = "plasma-container";
      this._container.appendChild(this._plasmaContainer);

      // Controls
      const controls = document.createElement("div");
      controls.className = "controls";
      this._container.appendChild(controls);

      // Start button
      this._startBtn = document.createElement("button");
      this._startBtn.className = "btn start-btn";
      this._startBtn.innerHTML = `
        <span>Start Call</span>
      `;
      controls.appendChild(this._startBtn);

      // End button
      this._endBtn = document.createElement("button");
      this._endBtn.className = "btn end-btn";
      this._endBtn.innerHTML = `
        <span>End Call</span>
      `;
      controls.appendChild(this._endBtn);

      // Status display
      this._status = document.createElement("div");
      this._status.className = "status";
      this._container.appendChild(this._status);

      // Audio element (hidden)
      this._audio = document.createElement("audio");
      this._audio.setAttribute("autoplay", "");
      this._audio.style.display = "none";
      this._root.appendChild(this._audio);
    }

    _setStatus(msg, isLoading = false) {
      if (!msg) {
        this._status.classList.remove("visible");
        this._status.innerHTML = "";
      } else {
        this._status.classList.add("visible");
        this._status.innerHTML = isLoading
          ? `<div class="spinner"></div><span style="margin-left: 0.5rem">${msg}</span>`
          : msg;
      }
    }

    async _startCall() {
      if (this._state.connecting || this._state.connected) return;

      if (!this._agentId) {
        console.error("<audio-visualizer> missing agentid attribute");
        this._setStatus("Error: Missing agent ID", false);
        return;
      }

      this._setStatus("Connecting...", true);
      this._startBtn.disabled = true;
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

        // Initialize Pipecat client
        const pipecatConfig = {
          transport: new DailyTransport({
            bufferLocalAudioUntilBotReady: true,
          }),
          enableMic: true,
          enableCam: false,
          callbacks: {
            onConnected: () => {
              console.log("Pipecat connected");
              this._state.connected = true;
              this._state.connecting = false;
              this._setStatus("Connected", false);
              setTimeout(() => this._setStatus("", false), 2000);
            },
            onDisconnected: () => {
              console.log("Pipecat disconnected");
              this._handleDisconnected();
            },
            onBotConnected: (participant) => {
              console.log("Bot connected:", participant);
              this._startBtn.style.display = "none";
              this._endBtn.classList.add("visible");
            },
            onBotReady: (data) => {
              console.log("Bot ready:", data);
              this._setupMediaTracks();
            },
            onError: (error) => {
              console.error("Pipecat error:", error);
              this._setStatus("Error: " + error.message, false);
              this._resetUI();
            },
          },
        };

        this._pcClient = new PipecatClient(pipecatConfig);
        this._setupTrackListeners();

        await this._pcClient.connect({
          url: roomUrl,
          token: dailyToken,
        });
      } catch (err) {
        console.error(err);
        this._setStatus("Error: " + (err.message || "Connection failed"), false);
        this._resetUI();
      }
    }

    async _stopCall() {
      if (!this._state.connected || !this._pcClient) return;
      try {
        await this._pcClient.disconnect();
      } catch (_) {}
      this._cleanupCall();
      this._resetUI();
    }

    _setupMediaTracks() {
      if (!this._pcClient) return;
      const tracks = this._pcClient.tracks();

      if (tracks.bot?.audio) {
        this._setupAudioTrack(tracks.bot.audio);
      }
      if (tracks.local?.audio) {
        const stream = new MediaStream([tracks.local.audio]);
        this._startAudioVisualization(stream);
      }
    }

    _setupTrackListeners() {
      if (!this._pcClient) return;

      this._pcClient.on(RTVIEvent.TrackStarted, (track, participant) => {
        console.log(`Track started: ${track.kind} from ${participant?.local ? 'local' : 'bot'}`);

        if (!participant?.local) {
          if (track.kind === 'audio') {
            this._setupAudioTrack(track);
          }
        } else if (participant?.local && track.kind === 'audio') {
          const stream = new MediaStream([track]);
          this._startAudioVisualization(stream);
        }
      });

      this._pcClient.on(RTVIEvent.TrackStopped, (track, participant) => {
        console.log(`Track stopped: ${track.kind}`);
      });
    }

    _setupAudioTrack(track) {
      console.log('Setting up audio track');
      this._audio.srcObject = new MediaStream([track]);
      this._audio.play().catch((e) => console.error("Audio play error:", e));
    }

    _startAudioVisualization(stream) {
      try {
        if (!this._audioCtx) {
          this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        const source = this._audioCtx.createMediaStreamSource(stream);
        this._audioAnalyser = this._audioCtx.createAnalyser();
        this._audioAnalyser.fftSize = 256;
        source.connect(this._audioAnalyser);

        const dataArray = new Uint8Array(this._audioAnalyser.frequencyBinCount);

        const updateLevel = () => {
          if (!this._state.connected) return;

          this._audioAnalyser.getByteFrequencyData(dataArray);

          // Calculate average audio level
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length / 255; // Normalize to 0-1

          if (this._plasmaViz) {
            this._plasmaViz.setAudioLevel(average);
          }

          this._levelAnimationFrame = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      } catch (e) {
        console.error("Audio visualization error:", e);
      }
    }

    _stopAudioVisualization() {
      if (this._levelAnimationFrame) {
        cancelAnimationFrame(this._levelAnimationFrame);
        this._levelAnimationFrame = null;
      }
      if (this._audioCtx) {
        try { this._audioCtx.close(); } catch (_) {}
        this._audioCtx = null;
      }
      this._audioAnalyser = null;

      if (this._plasmaViz) {
        this._plasmaViz.setAudioLevel(0);
      }
    }

    _cleanupCall() {
      if (this._pcClient) {
        this._pcClient = null;
      }
      this._stopAudioVisualization();
      this._state.connected = false;
      this._state.connecting = false;
    }

    _handleDisconnected() {
      this._cleanupCall();
      this._resetUI();
    }

    _resetUI() {
      this._state.connecting = false;
      this._startBtn.disabled = false;
      this._startBtn.style.display = "flex";
      this._endBtn.classList.remove("visible");
      this._setStatus("", false);
    }
  }

  // Register element
  if (!customElements.get("audio-visualizer")) {
    customElements.define("audio-visualizer", AudioVisualizer);
  }
})();
