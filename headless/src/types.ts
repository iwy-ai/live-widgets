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
 */
export interface LiveAvatarConfig {
  /**
   * Your Pipecat agent ID
   */
  agentId: string;

  /**
   * Video element to attach bot video stream to
   */
  videoElement?: HTMLVideoElement;

  /**
   * Audio element to attach bot audio stream to
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
   * Called when bot video track is available
   */
  onVideoTrack?: (track: MediaStreamTrack) => void;

  /**
   * Called when bot audio track is available
   */
  onAudioTrack?: (track: MediaStreamTrack) => void;

  /**
   * Called when local audio track is available
   */
  onLocalAudioTrack?: (track: MediaStreamTrack) => void;

  /**
   * Called with user transcript updates
   */
  onUserTranscript?: (data: TranscriptData) => void;

  /**
   * Called with bot transcript updates
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
