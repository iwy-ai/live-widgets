import React, { useRef, useState, useEffect } from 'react';
import { LiveAvatarSDK } from '@iwy/live-widgets/headless';
import type { ConnectionState } from '@iwy/live-widgets/headless';

/**
 * React example using LiveAvatarSDK
 *
 * This demonstrates how to integrate the headless SDK into a React component
 * with full control over the UI and styling.
 */
export default function CustomAvatar() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const avatarRef = useRef<LiveAvatarSDK | null>(null);

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize SDK
    const avatar = new LiveAvatarSDK(
      {
        agentId: 'demo', // Replace with your agent ID
        videoElement: videoRef.current || undefined,
        audioElement: audioRef.current || undefined,
      },
      {
        onConnecting: () => {
          setConnectionState('connecting');
          setError(null);
        },
        onConnected: () => {
          setConnectionState('connected');
        },
        onDisconnected: () => {
          setConnectionState('disconnected');
          setAudioLevel(0);
        },
        onError: (err) => {
          setError(err.message);
          setConnectionState('error');
        },
        onAudioLevel: (level) => {
          setAudioLevel(level);
        },
        onMicStateChange: (enabled) => {
          setIsMicEnabled(enabled);
        },
        onUserTranscript: (data) => {
          if (data.final) {
            console.log('User:', data.text);
          }
        },
        onBotTranscript: (data) => {
          console.log('Bot:', data.text);
        },
      }
    );

    avatarRef.current = avatar;

    // Cleanup on unmount
    return () => {
      avatar.destroy();
    };
  }, []);

  const handleConnect = async () => {
    try {
      await avatarRef.current?.connect();
    } catch (err) {
      console.error('Connection error:', err);
    }
  };

  const handleDisconnect = async () => {
    await avatarRef.current?.disconnect();
  };

  const handleToggleMic = () => {
    avatarRef.current?.toggleMic();
  };

  return (
    <div className="custom-avatar">
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="video-element"
        />
        <audio ref={audioRef} autoPlay />

        <div className={`status-badge ${connectionState}`}>
          {connectionState === 'connected' && '🟢 Connected'}
          {connectionState === 'connecting' && '🟡 Connecting...'}
          {connectionState === 'disconnected' && '⚫ Disconnected'}
          {connectionState === 'error' && '🔴 Error'}
        </div>
      </div>

      <div className="controls">
        <button
          onClick={handleConnect}
          disabled={connectionState === 'connected' || connectionState === 'connecting'}
          className="btn-primary"
        >
          {connectionState === 'connecting' ? 'Connecting...' : 'Start Call'}
        </button>

        <button
          onClick={handleDisconnect}
          disabled={connectionState !== 'connected'}
          className="btn-danger"
        >
          End Call
        </button>

        <button
          onClick={handleToggleMic}
          disabled={connectionState !== 'connected'}
          className={`btn-mic ${isMicEnabled ? 'active' : ''}`}
        >
          {isMicEnabled ? '🎤 Mute' : '🎤 Unmute'}
        </button>
      </div>

      <div className="audio-visualizer">
        <label>Microphone Level</label>
        <div className="audio-bar-container">
          <div
            className="audio-bar"
            style={{ width: `${audioLevel * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <style jsx>{`
        .custom-avatar {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .video-container {
          position: relative;
          width: 100%;
          height: 450px;
          background: #000;
        }

        .video-element {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .status-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          padding: 8px 16px;
          border-radius: 20px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          font-size: 14px;
          font-weight: 600;
        }

        .status-badge.connected {
          background: rgba(34, 197, 94, 0.9);
        }

        .status-badge.connecting {
          background: rgba(249, 115, 22, 0.9);
        }

        .status-badge.error {
          background: rgba(239, 68, 68, 0.9);
        }

        .controls {
          padding: 24px;
          display: flex;
          gap: 12px;
        }

        button {
          flex: 1;
          padding: 14px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-mic {
          background: #6b7280;
          color: white;
        }

        .btn-mic.active {
          background: #10b981;
        }

        .audio-visualizer {
          padding: 0 24px 24px;
        }

        .audio-visualizer label {
          display: block;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 8px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .audio-bar-container {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .audio-bar {
          height: 100%;
          background: linear-gradient(90deg, #10b981 0%, #059669 100%);
          transition: width 0.1s ease;
        }

        .error-message {
          margin: 0 24px 24px;
          padding: 12px;
          background: #fee2e2;
          border: 1px solid #ef4444;
          border-radius: 8px;
          color: #991b1b;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
