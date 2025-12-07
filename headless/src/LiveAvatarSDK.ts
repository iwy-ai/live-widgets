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

import { PipecatClient, RTVIEvent } from '@pipecat-ai/client-js';
import { DailyTransport } from '@pipecat-ai/daily-transport';
import type {
  LiveAvatarConfig,
  LiveAvatarCallbacks,
  SessionResponse,
  ConnectionState,
} from './types';

/**
 * LiveAvatarSDK - Headless SDK for Pipecat-powered AI avatar interactions
 *
 * This class provides a framework-agnostic interface to manage real-time
 * video and audio connections with Pipecat AI agents. It handles:
 * - WebRTC connection management via Daily.co
 * - Audio/video track handling
 * - Microphone control
 * - Session lifecycle management
 *
 * @example
 * ```typescript
 * const avatar = new LiveAvatarSDK(
 *   { agentId: 'my-agent-id' },
 *   {
 *     onConnected: () => console.log('Connected!'),
 *   }
 * );
 *
 * await avatar.connect();
 * ```
 */
export class LiveAvatarSDK {
  // Configuration
  private config: LiveAvatarConfig;
  private callbacks: LiveAvatarCallbacks;

  // Pipecat client
  private client: PipecatClient | null = null;

  // State tracking
  private _connectionState: ConnectionState;
  private _isMicEnabled: boolean;
  private _currentError: Error | null = null;
  private _isDestroyed: boolean = false;

  // Track attachment state to prevent duplicate attachments (which cause AbortError)
  private attachedTracks = new Set<string>();

  // Session management
  private sessionPromise: Promise<SessionResponse> | null = null;
  private prefetchedSession: SessionResponse | null = null;

  /**
   * Creates a new LiveAvatarSDK instance
   *
   * @param config - Configuration options
   * @param callbacks - Event callbacks
   */
  constructor(config: LiveAvatarConfig, callbacks: LiveAvatarCallbacks = {}) {
    this.config = {
      enableMic: true,
      enableCam: false,
      warmStart: true,
      warmRestart: true,
      ...config,
    };
    this.callbacks = callbacks;
    this._connectionState = 'disconnected' as ConnectionState;
    this._isMicEnabled = this.config.enableMic ?? true;

    // Pre-fetch session if warm start is enabled
    if (this.config.warmStart) {
      this.preloadSession();
    }
  }

  /**
   * Current connection state
   */
  get connectionState(): ConnectionState {
    return this._connectionState;
  }

  /**
   * Whether currently connected
   */
  get isConnected(): boolean {
    return this._connectionState === 'connected';
  }

  /**
   * Whether currently connecting
   */
  get isConnecting(): boolean {
    return this._connectionState === 'connecting';
  }

  /**
   * Whether microphone is enabled
   */
  get isMicEnabled(): boolean {
    return this._isMicEnabled;
  }

  /**
   * Current error (if any)
   */
  get error(): Error | null {
    return this._currentError;
  }

  /**
   * Connect to the Pipecat session
   *
   * This will:
   * 1. Request a session from the backend
   * 2. Initialize the Pipecat client
   * 3. Connect to the Daily.co room
   * 4. Set up media tracks when bot joins
   *
   * @throws {Error} If connection fails
   */
  async connect(): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      console.warn('[iwy] Already connected or connecting');
      return;
    }

    this._connectionState = 'connecting' as ConnectionState;
    this._currentError = null;
    this.callbacks.onConnecting?.();

    try {
      // Request session from backend (or use pre-fetched)
      let session: SessionResponse;

      if (this.config.warmStart) {
        if (this.prefetchedSession) {
          console.log('[iwy] Warm start: Using pre-fetched session');
          session = this.prefetchedSession;
        } else if (this.sessionPromise) {
          console.log('[iwy] Warm start: Waiting for pre-fetch to complete');
          try {
            session = await this.sessionPromise;
          } catch (error) {
            console.warn('[iwy] Pre-fetched session failed, retrying fresh request');
            this.sessionPromise = null;
            this.prefetchedSession = null;
            session = await this.requestSession();
          }
        } else {
          console.warn('[iwy] Warm start enabled but no pre-fetch found, fetching now');
          session = await this.requestSession();
        }
      } else {
        session = await this.requestSession();
      }

      // Initialize Pipecat client
      this.client = new PipecatClient({
        transport: new DailyTransport({
          bufferLocalAudioUntilBotReady: true,
        }),
        enableMic: this.config.enableMic ?? true,
        enableCam: this.config.enableCam ?? false,
        callbacks: {
          onConnected: () => {
            this._connectionState = 'connected' as ConnectionState;
            this.callbacks.onConnected?.();
          },
          onDisconnected: () => {
            this.handleDisconnect();
          },
          onBotConnected: () => {
            this.callbacks.onBotConnected?.();
          },
          onBotReady: () => {
            this.setupMediaTracks();
            this.callbacks.onBotReady?.();
          },
          onUserTranscript: (data) => {
            this.callbacks.onUserTranscript?.({
              text: data.text,
              final: data.final,
              timestamp: data.timestamp as unknown as number | undefined,
            });
          },
          onBotTranscript: (data) => {
            this.callbacks.onBotTranscript?.({
              text: data.text,
              final: (data as any).final,
              timestamp: (data as any).timestamp,
            });
          },
          onError: (error) => {
            this.handleError(error instanceof Error ? error : new Error(String(error)));
          },
        },
      });

      // Set up track listeners
      this.setupTrackListeners();

      // Connect to Daily room
      console.log('[iwy] Connecting via WebRTC...');
      await this.client.connect({
        url: session.roomUrl,
        token: session.dailyToken,
      });
      console.log('[iwy] WebRTC connection established.');
    } catch (err) {
      this.handleError(err instanceof Error ? err : new Error('Connection failed'));
      throw err;
    }
  }

  /**
   * Disconnect from the session
   */
  async disconnect(): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.disconnect();
    } catch (err) {
      console.error('[iwy] Error during disconnect:', err);
    }

    this.cleanup();
  }

  /**
   * Toggle microphone on/off
   */
  toggleMic(): void {
    this.setMicEnabled(!this._isMicEnabled);
  }

  /**
   * Set microphone enabled state
   *
   * @param enabled - Whether to enable the microphone
   */
  setMicEnabled(enabled: boolean): void {
    if (!this.client) return;

    const tracks = this.client.tracks();
    if (tracks?.local?.audio) {
      tracks.local.audio.enabled = enabled;
      this._isMicEnabled = enabled;
      this.callbacks.onMicStateChange?.(enabled);
    }
  }

  /**
   * Attach a video element to display bot video
   *
   * @param element - HTMLVideoElement to attach video to
   */
  attachVideoElement(element: HTMLVideoElement): void {
    this.config.videoElement = element;

    // If already connected, attach current track
    if (this.client) {
      const tracks = this.client.tracks();
      if (tracks.bot?.video) {
        this.attachVideoTrack(tracks.bot.video, element);
      }
    }
  }

  /**
   * Attach an audio element to play bot audio
   *
   * @param element - HTMLAudioElement to attach audio to
   */
  attachAudioElement(element: HTMLAudioElement): void {
    this.config.audioElement = element;

    // If already connected, attach current track
    if (this.client) {
      const tracks = this.client.tracks();
      if (tracks.bot?.audio) {
        this.attachAudioTrack(tracks.bot.audio, element);
      }
    }
  }

  /**
   * Get current audio/video tracks
   */
  getTracks() {
    return this.client?.tracks() || null;
  }

  private static readonly SESSION_ENDPOINT = 'https://api.iwy.ai/v1/start-agent-session';

  /**
   * Request a session from the backend
   */
  private async requestSession(): Promise<SessionResponse> {
    console.log('[iwy] Requesting session from endpoint');
    const response = await fetch(LiveAvatarSDK.SESSION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentId: this.config.agentId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Session request failed: ${response.status} ${response.statusText}`);
    }

    const session = await response.json();
    console.log('[iwy] Session request completed');
    return session;
  }

  /**
   * Pre-fetch session for warm start
   */
  private preloadSession(): void {
    console.log('[iwy] Warm start: Pre-fetching session');
    this.sessionPromise = this.requestSession().then((session) => {
      console.log('[iwy] Warm start: Session pre-fetched successfully');
      this.prefetchedSession = session;
      return session;
    });
    // Prevent unhandled promise rejection warnings if connection isn't attempted
    this.sessionPromise.catch((err) => {
      console.debug('[iwy] Warm start session pre-fetch failed (will be retried on connect):', err);
      this.prefetchedSession = null;
    });
  }

  /**
   * Set up listeners for track start/stop events
   */
  private setupTrackListeners(): void {
    if (!this.client) return;

    this.client.on(RTVIEvent.TrackStarted, (track, participant) => {
      console.log(`[iwy] Track started: ${track.kind} from ${participant?.local ? 'local' : 'bot'}`);

      if (!participant?.local) {
        // Bot tracks
        if (track.kind === 'audio') {
          this.callbacks.onAudioTrack?.(track);
          if (this.config.audioElement) {
            this.attachAudioTrack(track, this.config.audioElement);
          }
        } else if (track.kind === 'video') {
          this.callbacks.onVideoTrack?.(track);
          if (this.config.videoElement) {
            this.attachVideoTrack(track, this.config.videoElement);
          }
        }
      } else if (participant?.local && track.kind === 'audio') {
        // Local audio track
        this.callbacks.onLocalAudioTrack?.(track);
      }
    });

    this.client.on(RTVIEvent.TrackStopped, (track, participant) => {
      console.log(`[iwy] Track stopped: ${track.kind} from ${participant?.name || 'unknown'}`);
    });
  }

  /**
   * Set up media tracks after bot is ready
   */
  private setupMediaTracks(): void {
    if (!this.client) return;

    const tracks = this.client.tracks();
    console.log('[iwy] Setting up media tracks:', {
      botAudio: !!tracks.bot?.audio,
      botVideo: !!tracks.bot?.video,
      localAudio: !!tracks.local?.audio,
    });

    // Bot audio
    if (tracks.bot?.audio) {
      this.callbacks.onAudioTrack?.(tracks.bot.audio);
      if (this.config.audioElement) {
        this.attachAudioTrack(tracks.bot.audio, this.config.audioElement);
      }
    }

    // Bot video
    if (tracks.bot?.video) {
      this.callbacks.onVideoTrack?.(tracks.bot.video);
      if (this.config.videoElement) {
        this.attachVideoTrack(tracks.bot.video, this.config.videoElement);
      }
    }

    // Local audio
    if (tracks.local?.audio) {
      this.callbacks.onLocalAudioTrack?.(tracks.local.audio);
    }
  }

  /**
   * Attach audio track to an audio element.
   * Prevents duplicate attachment which causes AbortError.
   */
  private attachAudioTrack(track: MediaStreamTrack, element: HTMLAudioElement): void {
    const trackKey = `audio-${track.id}`;
    if (this.attachedTracks.has(trackKey)) {
      console.debug('[iwy] Audio track already attached, skipping:', track.id);
      return;
    }
    this.attachedTracks.add(trackKey);

    element.srcObject = new MediaStream([track]);
    element.play().catch((err) => {
      console.error('[iwy] Error playing audio:', err);
    });
  }

  /**
   * Attach video track to a video element.
   * Prevents duplicate attachment which causes AbortError.
   */
  private attachVideoTrack(track: MediaStreamTrack, element: HTMLVideoElement): void {
    const trackKey = `video-${track.id}`;
    if (this.attachedTracks.has(trackKey)) {
      console.debug('[iwy] Video track already attached, skipping:', track.id);
      return;
    }
    this.attachedTracks.add(trackKey);

    element.srcObject = new MediaStream([track]);
    element.play().catch((err) => {
      console.error('[iwy] Error playing video:', err);
    });
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(): void {
    this._connectionState = 'disconnected' as ConnectionState;
    this.cleanup();
    this.callbacks.onDisconnected?.();

    // Pre-fetch session for next call if warm restart is enabled and SDK not destroyed
    if (this.config.warmRestart && !this._isDestroyed) {
      console.log('[iwy] Warm restart: Pre-fetching session for next call');
      this.preloadSession();
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    console.error('[iwy] LiveAvatarSDK error:', error);
    this._currentError = error;
    this._connectionState = 'error' as ConnectionState;
    this.callbacks.onError?.(error);
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    this.client = null;
    this._connectionState = 'disconnected' as ConnectionState;
    this.sessionPromise = null;
    this.prefetchedSession = null;
    this.attachedTracks.clear();
  }

  /**
   * Destroy the SDK instance and clean up all resources
   */
  destroy(): void {
    this._isDestroyed = true;
    this.disconnect();
    this.cleanup();
  }
}
