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

/**
 * Configuration options for LiveAvatarSDK
 *
 * ## Media Handling
 *
 * There are two approaches for handling video/audio:
 *
 * **1. SDK-managed (recommended):** Pass `videoElement` and/or `audioElement`.
 * The SDK will automatically attach tracks when they become available.
 *
 * **2. Manual:** Don't pass elements, handle attachment in `onVideoTrack`/`onAudioTrack` callbacks.
 *
 * You can use both approaches together - the SDK prevents duplicate attachment.
 * However, for clarity, it's recommended to choose one approach.
 *
 * @example SDK-managed
 * ```typescript
 * const avatar = new LiveAvatarSDK({
 *   agentId: 'demo',
 *   videoElement: document.getElementById('video'),
 *   audioElement: document.getElementById('audio'),
 * });
 * ```
 *
 * @example Manual handling
 * ```typescript
 * const avatar = new LiveAvatarSDK(
 *   { agentId: 'demo' },
 *   {
 *     onVideoTrack: (track) => {
 *       myVideo.srcObject = new MediaStream([track]);
 *       myVideo.play();
 *     },
 *   }
 * );
 * ```
 */
export interface LiveAvatarConfig {
  /**
   * Your Pipecat agent ID
   */
  agentId: string;

  /**
   * Video element to attach bot video stream to.
   *
   * If provided, the SDK will automatically attach the bot's video track
   * to this element when it becomes available.
   *
   * @see LiveAvatarCallbacks.onVideoTrack for manual handling
   */
  videoElement?: HTMLVideoElement;

  /**
   * Audio element to attach bot audio stream to.
   *
   * If provided, the SDK will automatically attach the bot's audio track
   * to this element when it becomes available.
   *
   * @see LiveAvatarCallbacks.onAudioTrack for manual handling
   */
  audioElement?: HTMLAudioElement;

  /**
   * Enable microphone by default
   * @default true
   */
  enableMic?: boolean;

  /**
   * Enable camera (if needed for local video)
   * @default false
   */
  enableCam?: boolean;

  /**
   * Pre-fetch session on initialization for faster connection
   * @default true
   */
  warmStart?: boolean;

  /**
   * Pre-fetch a new session after each call ends for faster reconnection.
   *
   * When enabled, the SDK automatically requests a new session from the backend
   * immediately after a call disconnects. This ensures the next `connect()` call
   * will be fast, as the session is already prepared.
   *
   * This is separate from `warmStart` which only pre-fetches on initialization.
   * Use both together for optimal performance across the entire session lifecycle.
   *
   * @default true
   *
   * @example
   * ```typescript
   * // Both enabled (recommended for best UX)
   * const avatar = new LiveAvatarSDK({
   *   agentId: 'demo',
   *   warmStart: true,      // Pre-fetch on init
   *   warmRestart: true,    // Pre-fetch after each call ends
   * });
   *
   * // Disable if you don't expect multiple calls per session
   * const avatar = new LiveAvatarSDK({
   *   agentId: 'demo',
   *   warmRestart: false,   // Don't pre-fetch after disconnect
   * });
   * ```
   */
  warmRestart?: boolean;
}

/**
 * Callback functions for LiveAvatarSDK events
 */
export interface LiveAvatarCallbacks {
  /**
   * Called when successfully connected to the session
   */
  onConnected?: () => void;

  /**
   * Called when disconnected from the session
   */
  onDisconnected?: () => void;

  /**
   * Called when connection is starting
   */
  onConnecting?: () => void;

  /**
   * Called when bot participant joins the call
   */
  onBotConnected?: () => void;

  /**
   * Called when bot is ready to receive audio
   */
  onBotReady?: () => void;

  /**
   * Called when an error occurs
   */
  onError?: (error: Error) => void;

  /**
   * Called when bot video track is available.
   *
   * **Use cases:**
   * - **Notification only:** If you provided `videoElement` in config, the SDK handles attachment.
   *   Use this callback for logging, analytics, or UI updates.
   * - **Manual handling:** If you didn't provide `videoElement`, use this to attach the track yourself:
   *   ```typescript
   *   onVideoTrack: (track) => {
   *     myVideo.srcObject = new MediaStream([track]);
   *     myVideo.play().catch(console.error);
   *   }
   *   ```
   *
   * @see LiveAvatarConfig.videoElement for automatic attachment
   */
  onVideoTrack?: (track: MediaStreamTrack) => void;

  /**
   * Called when bot audio track is available.
   *
   * **Use cases:**
   * - **Notification only:** If you provided `audioElement` in config, the SDK handles attachment.
   *   Use this callback for logging, analytics, or UI updates.
   * - **Manual handling:** If you didn't provide `audioElement`, use this to attach the track yourself:
   *   ```typescript
   *   onAudioTrack: (track) => {
   *     myAudio.srcObject = new MediaStream([track]);
   *     myAudio.play().catch(console.error);
   *   }
   *   ```
   *
   * @see LiveAvatarConfig.audioElement for automatic attachment
   */
  onAudioTrack?: (track: MediaStreamTrack) => void;

  /**
   * Called when local audio track (user's microphone) is available.
   *
   * Useful for audio visualization or debugging.
   */
  onLocalAudioTrack?: (track: MediaStreamTrack) => void;

  /**
   * Called with user transcript updates (speech-to-text from user's microphone)
   */
  onUserTranscript?: (data: TranscriptData) => void;

  /**
   * Called with bot transcript updates (text-to-speech output from bot)
   */
  onBotTranscript?: (data: TranscriptData) => void;

  /**
   * Called when microphone state changes
   */
  onMicStateChange?: (enabled: boolean) => void;
}

/**
 * Transcript data from speech recognition
 */
export interface TranscriptData {
  /**
   * Transcript text
   */
  text: string;

  /**
   * Whether this is a final transcript (vs interim)
   */
  final?: boolean;

  /**
   * Timestamp of the transcript
   */
  timestamp?: number;
}

/**
 * Session response from backend
 */
export interface SessionResponse {
  /**
   * Daily.co room URL
   */
  roomUrl: string;

  /**
   * Daily.co authentication token
   */
  dailyToken: string;
}

/**
 * Connection state
 */
export enum ConnectionState {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  Error = 'error',
}
