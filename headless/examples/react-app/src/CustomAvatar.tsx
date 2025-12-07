import { useRef, useState, useEffect } from 'react';
// Import from local dist
import { LiveAvatarSDK } from '../../../../dist/headless.esm.js';
import type { ConnectionState } from '../../../../dist/headless.esm.js';

export default function CustomAvatar() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const avatarRef = useRef<LiveAvatarSDK | null>(null);

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<Array<{role: string, text: string}>>([]);

  useEffect(() => {
    const avatar = new LiveAvatarSDK(
      {
        agentId: 'demo', // Replace with your agent ID
        videoElement: videoRef.current || undefined,
        audioElement: audioRef.current || undefined,
        enableMic: true,
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
        },
        onError: (err) => {
          setError(err.message);
          setConnectionState('error');
        },
        onMicStateChange: (enabled) => {
          setIsMicEnabled(enabled);
        },
        onUserTranscript: (data) => {
          if (data.final) {
            setTranscripts(prev => [...prev, {role: 'user', text: data.text}]);
          }
        },
        onBotTranscript: (data) => {
          setTranscripts(prev => [...prev, {role: 'bot', text: data.text}]);
        },
      }
    );

    avatarRef.current = avatar;
    return () => avatar.destroy();
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
    <div style={styles.container}>
      <div style={styles.videoContainer}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={styles.video}
        />
        <audio ref={audioRef} autoPlay />

        <div style={{
          ...styles.statusBadge,
          background: connectionState === 'connected' ? 'rgba(34, 197, 94, 0.9)' :
                     connectionState === 'connecting' ? 'rgba(249, 115, 22, 0.9)' :
                     connectionState === 'error' ? 'rgba(239, 68, 68, 0.9)' :
                     'rgba(0, 0, 0, 0.7)'
        }}>
          {connectionState === 'connected' && 'Connected'}
          {connectionState === 'connecting' && 'Connecting...'}
          {connectionState === 'disconnected' && 'Disconnected'}
          {connectionState === 'error' && 'Error'}
        </div>
      </div>

      <div style={styles.controls}>
        <button
          onClick={handleConnect}
          disabled={connectionState === 'connected' || connectionState === 'connecting'}
          style={{
            ...styles.button,
            ...styles.btnPrimary,
            opacity: (connectionState === 'connected' || connectionState === 'connecting') ? 0.5 : 1
          }}
        >
          {connectionState === 'connecting' ? 'Connecting...' : 'Start Call'}
        </button>

        <button
          onClick={handleDisconnect}
          disabled={connectionState !== 'connected'}
          style={{
            ...styles.button,
            ...styles.btnDanger,
            opacity: connectionState !== 'connected' ? 0.5 : 1
          }}
        >
          End Call
        </button>

        <button
          onClick={handleToggleMic}
          disabled={connectionState !== 'connected'}
          style={{
            ...styles.button,
            background: isMicEnabled ? '#10b981' : '#6b7280',
            opacity: connectionState !== 'connected' ? 0.5 : 1
          }}
        >
          {isMicEnabled ? 'Mic On' : 'Mic Off'}
        </button>
      </div>

      <div style={styles.transcript}>
        <div style={styles.transcriptLabel}>Live Transcript</div>
        {transcripts.map((t, i) => (
          <div key={i} style={{
            ...styles.transcriptLine,
            background: t.role === 'user' ? '#dbeafe' : '#dcfce7',
            color: t.role === 'user' ? '#1e40af' : '#166534'
          }}>
            {t.role === 'user' ? 'You' : 'Bot'}: {t.text}
          </div>
        ))}
      </div>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 800,
    margin: '20px auto',
    background: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    height: 450,
    background: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    padding: '8px 16px',
    borderRadius: 20,
    color: 'white',
    fontSize: 14,
    fontWeight: 600,
  },
  controls: {
    padding: 24,
    display: 'flex',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: '14px 24px',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    color: 'white',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  btnDanger: {
    background: '#ef4444',
  },
  transcript: {
    margin: '0 24px 24px',
    padding: 16,
    background: '#f9fafb',
    borderRadius: 8,
    maxHeight: 200,
    overflowY: 'auto' as const,
  },
  transcriptLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  },
  transcriptLine: {
    marginBottom: 8,
    padding: 8,
    borderRadius: 4,
    fontSize: 14,
  },
  error: {
    margin: '0 24px 24px',
    padding: 12,
    background: '#fee2e2',
    border: '1px solid #ef4444',
    borderRadius: 8,
    color: '#991b1b',
    fontSize: 14,
  },
};
