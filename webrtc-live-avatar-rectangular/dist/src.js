/**
 * Live Avatar Web Component
 * A minimal, reusable web component for WebRTC video streaming with microphone control
 * 
 * This is the primary source file - no build step required!
 * 
 * Usage:
 *   <live-avatar agentid="demo" language="en"></live-avatar>
 * 
 * Attributes:
 *   - agentid: Agent identifier
 *   - language: Language code (e.g., 'en')
 * 
 * To customize the WebSocket URL, edit the WEBSOCKET_URL constant below.
 */

// ============================================================================
// CONFIGURATION - Edit this to change the WebSocket URL
// ============================================================================
const WEBSOCKET_URL = 'wss://iwy-ai--wr-start.modal.run/ws';
// ============================================================================

class LiveAvatarElement extends HTMLElement {
    constructor() {
        super();
        this.pc = null;
        this.ws = null;
        this.localStream = null;
        this.connectionActive = false;
        this.isMuted = false;
        this.shadow = this.attachShadow({ mode: 'open' });
        this.peerId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }
    disconnectedCallback() {
        this.disconnect();
    }
    render() {
        const agentId = this.getAttribute('agentid') || 'default';
        const language = this.getAttribute('language') || 'en';
        this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          position: relative;
        }

        .container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #000;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
        }

        .video-container {
          width: 100%;
          height: 100%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1a1a1a;
        }

        video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: #000;
        }

        video::-webkit-media-controls {
          display: none !important;
        }

        .controls {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 12px;
          z-index: 10;
        }

        button {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }

        button:active {
          transform: translateY(0);
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .connect-btn {
          background: #4caf50;
          color: white;
          min-width: 120px;
        }

        .connect-btn.connected {
          background: #f44336;
        }

        .mute-btn {
          background: white;
          color: #333;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .mute-btn.muted {
          background: #f44336;
          color: white;
        }

        .placeholder {
          position: absolute;
          color: #666;
          font-size: 16px;
          text-align: center;
        }
      </style>

      <div class="container">
        <div class="video-container">
          <video id="bot-video" autoplay playsinline></video>
          <audio id="bot-audio" autoplay></audio>
          <div class="placeholder" id="placeholder">Click Connect to start</div>
        </div>

        <div class="controls">
          <button class="connect-btn" id="connect-btn">Connect</button>
          <button class="mute-btn" id="mute-btn" disabled title="Mute/Unmute microphone">🎤</button>
        </div>
      </div>
    `;
        this.videoElement = this.shadow.getElementById('bot-video');
        this.audioElement = this.shadow.getElementById('bot-audio');
        this.connectBtn = this.shadow.getElementById('connect-btn');
        this.muteBtn = this.shadow.getElementById('mute-btn');
    }
    setupEventListeners() {
        this.connectBtn.addEventListener('click', () => this.toggleConnection());
        this.muteBtn.addEventListener('click', () => this.toggleMute());
    }
    async toggleConnection() {
        if (this.connectionActive) {
            await this.disconnect();
        }
        else {
            await this.connect();
        }
    }
    async connect() {
        try {
            this.connectBtn.disabled = true;
            this.connectBtn.textContent = 'Connecting...';
            // Get user media - audio only for input
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            });
            console.log('[LiveAvatar] Got local media with', this.localStream.getTracks().length, 'tracks');
            // Create peer connection
            this.createPeerConnection();
            // Connect WebSocket
            await this.connectWebSocket();
            // Send offer
            await this.createAndSendOffer();
            this.connectionActive = true;
            this.connectBtn.classList.add('connected');
            this.connectBtn.textContent = 'Disconnect';
            this.connectBtn.disabled = false;
            this.muteBtn.disabled = false;
            const placeholder = this.shadow.getElementById('placeholder');
            if (placeholder)
                placeholder.style.display = 'none';
        }
        catch (error) {
            console.error('Connection failed:', error);
            this.connectBtn.textContent = 'Connect';
            this.connectBtn.disabled = false;
            alert('Failed to connect. Please check your microphone permissions.');
            await this.disconnect();
        }
    }
    createPeerConnection() {
        const config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
            ]
        };
        this.pc = new RTCPeerConnection(config);
        // Add local tracks (audio only)
        if (this.localStream) {
            this.localStream.getTracks().forEach((track) => {
                this.pc.addTrack(track, this.localStream);
                console.log(`[LiveAvatar] Added local ${track.kind} track`);
            });
        }
        // Add transceiver to receive video from server (we're not sending video)
        // The audio transceiver is already created when we add our audio track above
        this.pc.addTransceiver('video', { direction: 'recvonly' });
        console.log('[LiveAvatar] Added video transceiver for receiving from server');
        // Handle incoming tracks
        this.pc.ontrack = (event) => {
            console.log(`[LiveAvatar] Received ${event.track.kind} track, readyState: ${event.track.readyState}`);
            console.log(`[LiveAvatar] Track ID: ${event.track.id}`);
            console.log(`[LiveAvatar] Streams:`, event.streams.length);
            if (event.track.kind === 'video') {
                console.log('[LiveAvatar] Setting video srcObject');
                this.videoElement.srcObject = event.streams[0];
                // Add loaded event listener
                this.videoElement.onloadedmetadata = () => {
                    console.log('[LiveAvatar] Video metadata loaded');
                    console.log(`[LiveAvatar] Video dimensions: ${this.videoElement.videoWidth}x${this.videoElement.videoHeight}`);
                };
                this.videoElement.onplay = () => {
                    console.log('[LiveAvatar] Video started playing');
                };
                // Ensure autoplay
                this.videoElement.play().catch(e => {
                    console.error('[LiveAvatar] Error playing video:', e);
                });
            }
            else if (event.track.kind === 'audio') {
                console.log('[LiveAvatar] Setting audio srcObject');
                this.audioElement.srcObject = event.streams[0];
                // Ensure autoplay
                this.audioElement.play().catch(e => {
                    console.error('[LiveAvatar] Error playing audio:', e);
                });
            }
        };
        // Handle ICE candidates
        this.pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendIceCandidate(event.candidate);
            }
        };
        // Connection state changes
        this.pc.onconnectionstatechange = () => {
            const state = this.pc.connectionState;
            console.log(`[LiveAvatar] Connection state: ${state}`);
            if (state === 'failed' || state === 'closed') {
                this.disconnect();
            }
        };
        this.pc.oniceconnectionstatechange = () => {
            console.log(`[LiveAvatar] ICE connection state: ${this.pc.iceConnectionState}`);
        };
        this.pc.onsignalingstatechange = () => {
            console.log(`[LiveAvatar] Signaling state: ${this.pc.signalingState}`);
        };
    }
    connectWebSocket() {
        return new Promise((resolve, reject) => {
            const wsUrl = `${WEBSOCKET_URL}/${this.peerId}`;
            console.log('[LiveAvatar] Connecting to:', wsUrl);
            
            this.ws = new WebSocket(wsUrl);
            this.ws.onopen = () => {
                console.log('[LiveAvatar] WebSocket connected');
                resolve();
            };
            this.ws.onerror = (error) => {
                console.error('[LiveAvatar] WebSocket error:', error);
                reject(error);
            };
            this.ws.onclose = () => {
                console.log('[LiveAvatar] WebSocket closed');
                if (this.connectionActive) {
                    this.disconnect();
                }
            };
            this.ws.onmessage = async (event) => {
                try {
                    const message = JSON.parse(event.data);
                    await this.handleSignalingMessage(message);
                }
                catch (error) {
                    console.error('Error handling message:', error);
                }
            };
        });
    }
    async handleSignalingMessage(message) {
        switch (message.type) {
            case 'answer':
                await this.handleAnswer(message);
                break;
            case 'ice_candidate':
                await this.handleIceCandidate(message);
                break;
        }
    }
    async createAndSendOffer() {
        if (!this.pc)
            return;
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        this.sendSignalingMessage({
            type: 'offer',
            sdp: this.pc.localDescription.sdp,
        });
    }
    async handleAnswer(message) {
        if (!this.pc)
            return;
        const answer = new RTCSessionDescription({
            type: 'answer',
            sdp: message.sdp,
        });
        await this.pc.setRemoteDescription(answer);
    }
    async handleIceCandidate(message) {
        if (!this.pc || !message.candidate)
            return;
        const candidate = new RTCIceCandidate({
            candidate: message.candidate.candidate_sdp,
            sdpMid: message.candidate.sdpMid,
            sdpMLineIndex: message.candidate.sdpMLineIndex,
        });
        if (this.pc.remoteDescription) {
            await this.pc.addIceCandidate(candidate);
        }
    }
    sendIceCandidate(candidate) {
        this.sendSignalingMessage({
            type: 'ice_candidate',
            candidate: {
                candidate_sdp: candidate.candidate,
                sdpMid: candidate.sdpMid,
                sdpMLineIndex: candidate.sdpMLineIndex,
            },
        });
    }
    sendSignalingMessage(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }
    toggleMute() {
        if (!this.localStream)
            return;
        this.localStream.getAudioTracks().forEach((track) => {
            track.enabled = !track.enabled;
        });
        this.isMuted = !this.isMuted;
        this.muteBtn.textContent = this.isMuted ? '🔇' : '🎤';
        this.muteBtn.classList.toggle('muted', this.isMuted);
    }
    async disconnect() {
        this.connectionActive = false;
        if (this.localStream) {
            this.localStream.getTracks().forEach((track) => track.stop());
            this.localStream = null;
        }
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.videoElement.srcObject = null;
        this.audioElement.srcObject = null;
        this.connectBtn.classList.remove('connected');
        this.connectBtn.textContent = 'Connect';
        this.connectBtn.disabled = false;
        this.muteBtn.disabled = true;
        this.muteBtn.textContent = '🎤';
        this.muteBtn.classList.remove('muted');
        const placeholder = this.shadow.getElementById('placeholder');
        if (placeholder)
            placeholder.style.display = 'block';
    }
}
// Define the custom element
customElements.define('live-avatar', LiveAvatarElement);

// Export for module usage
export { LiveAvatarElement };