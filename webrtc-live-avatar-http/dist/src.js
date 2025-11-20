/**
 * Live Avatar Web Component (HTTP Signaling)
 * A minimal, reusable web component for WebRTC video streaming with microphone control
 *
 * This version uses HTTP POST for signaling instead of WebSocket
 *
 * Usage:
 *   <live-avatar-http agentid="demo" publicapikey="iwy_pk__xxx" language="en"></live-avatar-http>
 *
 * Attributes:
 *   - agentid: Agent identifier (required)
 *   - publicapikey: IWY API key for authentication (required)
 *   - language: Language code (e.g., 'en')
 *
 * To customize the HTTP backend URL, edit the HTTP_BACKEND_URL constant below.
 */

// ============================================================================
// CONFIGURATION - Edit these to change API endpoints
// ============================================================================
const HTTP_BACKEND_URL = 'https://iwy-ai--wr-http-start.modal.run';
const ICE_SERVERS_URL = 'https://api.iwy.ai/v1/ice-servers';
// ============================================================================

class LiveAvatarElement extends HTMLElement {
    constructor() {
        super();
        this.pc = null;
        this.localStream = null;
        this.connectionActive = false;
        this.isMuted = false;
        this.shadow = this.attachShadow({ mode: 'open' });
        this.peerId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.cachedIceServers = null;
        this.iceServersFetchTime = null;
        this.iceServersTTL = 3600000; // 1 hour in milliseconds
    }
    connectedCallback() {
        this.render();
        this.setupEventListeners();
        // Prefetch ICE servers for faster connection
        this.prefetchIceServers();
    }
    disconnectedCallback() {
        this.disconnect();
    }
    render() {
        const agentId = this.getAttribute('agentid') || 'default';
        const publicApiKey = this.getAttribute('publicapikey');
        const language = this.getAttribute('language') || 'en';
        
        // Validate required attributes
        if (!publicApiKey) {
            console.error('[LiveAvatar] Error: publicapikey attribute is required');
            this.shadow.innerHTML = `
                <style>
                    .error {
                        color: #f44336;
                        padding: 20px;
                        text-align: center;
                        font-family: system-ui, -apple-system, sans-serif;
                    }
                </style>
                <div class="error">
                    <strong>Configuration Error:</strong><br>
                    The "publicapikey" attribute is required.<br>
                    Usage: &lt;live-avatar-http agentid="demo" publicapikey="iwy_pk__xxx" language="en"&gt;&lt;/live-avatar-http&gt;
                </div>
            `;
            return;
        }
        
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
    async prefetchIceServers() {
        // Prefetch ICE servers in the background for faster connection
        const publicApiKey = this.getAttribute('publicapikey');
        if (!publicApiKey) {
            return;
        }
        
        try {
            console.log('[LiveAvatar] Prefetching ICE servers for faster connection...');
            const iceServers = await this.fetchIceServers(publicApiKey);
            this.cachedIceServers = iceServers;
            this.iceServersFetchTime = Date.now();
            console.log('[LiveAvatar] ICE servers prefetched and cached:', iceServers.length, 'servers');
        } catch (error) {
            console.warn('[LiveAvatar] Failed to prefetch ICE servers (will retry on connect):', error.message);
        }
    }
    async fetchIceServers(publicApiKey) {
        const response = await fetch(ICE_SERVERS_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${publicApiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch ICE servers: API returned status ${response.status}`);
        }
        
        const data = await response.json();
        if (!data.iceServers || !Array.isArray(data.iceServers)) {
            throw new Error('Invalid response format: missing iceServers array');
        }
        
        // Process the ICE servers - ensure we use 'urls' field
        return data.iceServers.map(server => {
            const processed = {
                urls: server.urls || server.url // Handle both 'urls' and 'url' fields
            };
            if (server.username) {
                processed.username = server.username;
            }
            if (server.credential) {
                processed.credential = server.credential;
            }
            return processed;
        });
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
            await this.createPeerConnection();
            // Create and send offer via HTTP
            await this.createAndSendOfferHTTP();
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
            console.error('[LiveAvatar] Connection failed:', error);
            this.connectBtn.textContent = 'Connect';
            this.connectBtn.disabled = false;

            // Provide specific error message based on error type
            let errorMessage = 'Failed to connect.';
            if (error.message && error.message.includes('ICE servers')) {
                errorMessage = 'Failed to fetch ICE servers from API. Please check your API key and network connection.';
            } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage = 'Microphone access denied. Please grant microphone permissions and try again.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No microphone found. Please connect a microphone and try again.';
            } else if (error.message) {
                errorMessage = `Connection failed: ${error.message}`;
            }

            alert(errorMessage);
            await this.disconnect();
        }
    }
    async createPeerConnection() {
        const publicApiKey = this.getAttribute('publicapikey');
        let iceServers = [];
        
        // Check if we have cached ICE servers that are still valid
        const now = Date.now();
        const cacheAge = this.iceServersFetchTime ? now - this.iceServersFetchTime : Infinity;
        
        if (this.cachedIceServers && cacheAge < this.iceServersTTL) {
            // Use cached ICE servers (still valid)
            iceServers = this.cachedIceServers;
            const minutesRemaining = Math.floor((this.iceServersTTL - cacheAge) / 60000);
            console.log('[LiveAvatar] Using cached ICE servers (', minutesRemaining, 'min remaining validity)');
        } else {
            // Fetch fresh ICE servers (cache expired or missing)
            console.log('[LiveAvatar] Fetching fresh ICE servers from IWY API...');
            iceServers = await this.fetchIceServers(publicApiKey);
            
            // Update cache
            this.cachedIceServers = iceServers;
            this.iceServersFetchTime = Date.now();
            console.log('[LiveAvatar] Successfully fetched', iceServers.length, 'ICE servers from IWY API');
        }
        
        const config = { iceServers };
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
        // Monitor ICE candidates (for debugging)
        this.pc.onicecandidate = (event) => {
            if (event.candidate) {
                const c = event.candidate;
                console.log(`[LiveAvatar] 🔹 ICE candidate: ${c.type} ${c.protocol} ${c.address}:${c.port}`);
            } else {
                console.log('[LiveAvatar] 🔹 ICE candidate gathering complete (null candidate)');
            }
        };
        // Connection state changes
        this.pc.onconnectionstatechange = () => {
            const state = this.pc.connectionState;
            console.log(`[LiveAvatar] 🔄 Connection state: ${state}`);
            if (state === 'connected') {
                console.log('[LiveAvatar] 🎉 Connection ESTABLISHED!');
            } else if (state === 'failed') {
                console.log('[LiveAvatar] ❌ Connection FAILED');
                this.disconnect();
            } else if (state === 'closed') {
                console.log('[LiveAvatar] 🔌 Connection CLOSED');
                this.disconnect();
            }
        };
        this.pc.oniceconnectionstatechange = () => {
            console.log(`[LiveAvatar] 🧊 ICE connection state: ${this.pc.iceConnectionState}`);

            if (this.pc.iceConnectionState === 'connected' || this.pc.iceConnectionState === 'completed') {
                console.log('[LiveAvatar] ✅ ICE connection successful');
            } else if (this.pc.iceConnectionState === 'failed') {
                console.log('[LiveAvatar] ❌ ICE connection failed - check network/firewall');
            } else if (this.pc.iceConnectionState === 'disconnected') {
                console.log('[LiveAvatar] ⚠️ ICE connection disconnected');
            }
        };
        this.pc.onicegatheringstatechange = () => {
            console.log(`[LiveAvatar] 📡 ICE gathering state: ${this.pc.iceGatheringState}`);
        };
        this.pc.onsignalingstatechange = () => {
            console.log(`[LiveAvatar] 🔔 Signaling state: ${this.pc.signalingState}`);
        };
    }
    async createAndSendOfferHTTP() {
        if (!this.pc) return;

        console.log('[LiveAvatar] Creating offer...');
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        console.log('[LiveAvatar] ✅ Local description set');

        // Wait for ICE gathering with timeout (proceed after 1.5s max)
        console.log('[LiveAvatar] Gathering ICE candidates...');
        const gatheringStartTime = Date.now();
        await new Promise(resolve => {
            let resolved = false;

            // Set timeout to proceed after 1.5 seconds
            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    const elapsed = Date.now() - gatheringStartTime;
                    console.log(`[LiveAvatar] ⏱️ ICE gathering timeout after ${elapsed}ms - proceeding with available candidates`);
                    resolve();
                }
            }, 1500); // 1.5 seconds

            // Check if already complete
            if (this.pc.iceGatheringState === 'complete') {
                resolved = true;
                clearTimeout(timeout);
                const elapsed = Date.now() - gatheringStartTime;
                console.log(`[LiveAvatar] ✅ ICE gathering complete after ${elapsed}ms`);
                resolve();
            } else {
                // Wait for completion event
                const checkState = () => {
                    if (this.pc.iceGatheringState === 'complete' && !resolved) {
                        resolved = true;
                        clearTimeout(timeout);
                        const elapsed = Date.now() - gatheringStartTime;
                        console.log(`[LiveAvatar] ✅ ICE gathering complete after ${elapsed}ms`);
                        this.pc.removeEventListener('icegatheringstatechange', checkState);
                        resolve();
                    }
                };
                this.pc.addEventListener('icegatheringstatechange', checkState);
            }
        });
        console.log('[LiveAvatar] ✅ Proceeding with offer');

        // Log offer details
        console.log(`[LiveAvatar]    Offer SDP length: ${this.pc.localDescription.sdp.length} chars`);
        const offerCandidates = this.pc.localDescription.sdp.split('\n').filter(line => line.startsWith('a=candidate:')).length;
        console.log(`[LiveAvatar]    Offer has ${offerCandidates} ICE candidates`);

        // Log each candidate type
        const candidateTypes = {};
        this.pc.localDescription.sdp.split('\n')
            .filter(line => line.startsWith('a=candidate:'))
            .forEach(line => {
                const match = line.match(/typ\s+(\w+)/);
                if (match) {
                    const type = match[1];
                    candidateTypes[type] = (candidateTypes[type] || 0) + 1;
                }
            });
        console.log(`[LiveAvatar]    Candidate types:`, candidateTypes);

        // Send HTTP POST to server
        const connectUrl = `${HTTP_BACKEND_URL}/connect/${this.peerId}`;
        console.log(`[LiveAvatar] POST ${connectUrl}`);

        const response = await fetch(connectUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'offer',
                sdp: this.pc.localDescription.sdp
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error ${response.status}: ${errorText}`);
        }

        // Parse answer
        const answerJson = await response.json();
        console.log(`[LiveAvatar] ✅ Received answer from server`);
        console.log(`[LiveAvatar]    Answer type: ${answerJson.type}`);
        console.log(`[LiveAvatar]    Answer SDP length: ${answerJson.sdp ? answerJson.sdp.length : 0} chars`);

        // Count candidates in answer
        const answerCandidates = (answerJson.sdp || '').split('\n').filter(line => line.startsWith('a=candidate:')).length;
        console.log(`[LiveAvatar]    Answer has ${answerCandidates} ICE candidates`);

        // Set remote description
        console.log(`[LiveAvatar] Setting remote description...`);
        await this.pc.setRemoteDescription({
            type: answerJson.type,
            sdp: answerJson.sdp
        });
        console.log(`[LiveAvatar] ✅ Remote description set successfully`);

        // Log current state after setting remote description
        console.log(`[LiveAvatar]    Connection state: ${this.pc.connectionState}`);
        console.log(`[LiveAvatar]    ICE connection state: ${this.pc.iceConnectionState}`);
        console.log(`[LiveAvatar]    Signaling state: ${this.pc.signalingState}`);
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
customElements.define('live-avatar-http', LiveAvatarElement);

// Export for module usage
export { LiveAvatarElement };