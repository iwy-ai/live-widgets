# LiveAvatarSDK - Headless AI Avatar SDK

A framework-agnostic, headless SDK for building custom AI avatar interfaces with Pipecat. Build your own UI while we handle the WebRTC and Pipecat integration.

## Why Headless?

The existing `<live-avatar>` and `<live-avatar-rectangular>` web components provide complete, ready-to-use UI solutions. The **headless SDK** is for developers who want:

- ✅ **100% custom UI control** - Design your own buttons, layouts, and styles
- ✅ **Framework flexibility** - Works with React, Vue, Angular, Svelte, vanilla JS
- ✅ **Advanced integrations** - Build complex UIs with your existing design system
- ✅ **Full control** - Decide when to connect, what to show, how to animate

## When to Use What

| Component | Use Case | UI Control | Effort |
|-----------|----------|------------|--------|
| `<live-avatar>` | Quick floating bubble widget | None (pre-styled) | 1 line of HTML |
| `<live-avatar-rectangular>` | Embedded rectangle widget | None (pre-styled) | 1 line of HTML |
| **LiveAvatarSDK (Headless)** | Custom UI from scratch | 100% custom | Build your own |

## Installation

### Via npm

```bash
npm install @iwy/live-widgets
```

### Via CDN

```html
<script type="module">
  import { LiveAvatarSDK } from 'https://unpkg.com/@iwy/live-widgets@latest/dist/headless.esm.js';
</script>
```

## Quick Start

### Vanilla JavaScript

```javascript
import { LiveAvatarSDK } from '@iwy/live-widgets/headless';

// Get your video/audio elements
const videoEl = document.getElementById('my-video');
const audioEl = document.getElementById('my-audio');

// Create SDK instance
const avatar = new LiveAvatarSDK(
  {
    agentId: 'your-agent-id',
    videoElement: videoEl,
    audioElement: audioEl,
  },
  {
    onConnected: () => console.log('Connected!'),
  }
);

// Connect when your custom button is clicked
document.getElementById('connect-btn').addEventListener('click', () => {
  avatar.connect();
});

// Disconnect
document.getElementById('disconnect-btn').addEventListener('click', () => {
  avatar.disconnect();
});

// Toggle mic
document.getElementById('mic-btn').addEventListener('click', () => {
  avatar.toggleMic();
});
```

### React

```tsx
import { useRef, useState, useEffect } from 'react';
import { LiveAvatarSDK } from '@iwy/live-widgets/headless';

export default function CustomAvatar() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const avatarRef = useRef<LiveAvatarSDK | null>(null);

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const avatar = new LiveAvatarSDK(
      {
        agentId: 'your-agent-id',
        videoElement: videoRef.current || undefined,
        audioElement: audioRef.current || undefined,
      },
      {
        onConnected: () => setIsConnected(true),
        onDisconnected: () => setIsConnected(false),
      }
    );

    avatarRef.current = avatar;
    return () => avatar.destroy();
  }, []);

  return (
    <div className="my-custom-avatar">
      <video ref={videoRef} autoPlay playsInline muted />
      <audio ref={audioRef} autoPlay />

      <button onClick={() => avatarRef.current?.connect()}>
        Connect
      </button>

      <button onClick={() => avatarRef.current?.disconnect()}>
        Disconnect
      </button>
    </div>
  );
}
```

### Vue 3

```vue
<template>
  <div class="my-custom-avatar">
    <video ref="videoRef" autoplay playsinline muted />
    <audio ref="audioRef" autoplay />

    <button @click="handleConnect">Connect</button>
    <button @click="handleDisconnect">Disconnect</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { LiveAvatarSDK } from '@iwy/live-widgets/headless';

const videoRef = ref(null);
const audioRef = ref(null);

let avatar = null;

onMounted(() => {
  avatar = new LiveAvatarSDK(
    {
      agentId: 'your-agent-id',
      videoElement: videoRef.value,
      audioElement: audioRef.value,
    },
    {}
  );
});

onUnmounted(() => {
  avatar?.destroy();
});

const handleConnect = () => avatar?.connect();
const handleDisconnect = () => avatar?.disconnect();
</script>
```

## API Reference

### Constructor

```typescript
new LiveAvatarSDK(config: LiveAvatarConfig, callbacks?: LiveAvatarCallbacks)
```

### Configuration (`LiveAvatarConfig`)

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `agentId` | string | Yes | - | Your Pipecat agent ID |
| `videoElement` | HTMLVideoElement | No | - | Video element for bot video |
| `audioElement` | HTMLAudioElement | No | - | Audio element for bot audio |
| `enableMic` | boolean | No | `true` | Enable microphone by default |
| `enableCam` | boolean | No | `false` | Enable camera (if needed) |
| `warmStart` | boolean | No | `true` | Pre-fetch session on init for faster connection |

### Callbacks (`LiveAvatarCallbacks`)

| Callback | Parameters | Description |
|----------|------------|-------------|
| `onConnecting` | `()` | Called when connection starts |
| `onConnected` | `()` | Called when connected |
| `onDisconnected` | `()` | Called when disconnected |
| `onBotConnected` | `()` | Called when bot joins |
| `onBotReady` | `()` | Called when bot is ready |
| `onError` | `(error: Error)` | Called on errors |
| `onVideoTrack` | `(track: MediaStreamTrack)` | Bot video track available |
| `onAudioTrack` | `(track: MediaStreamTrack)` | Bot audio track available |
| `onLocalAudioTrack` | `(track: MediaStreamTrack)` | Local audio track available |
| `onUserTranscript` | `(data: TranscriptData)` | User speech transcript |
| `onBotTranscript` | `(data: TranscriptData)` | Bot speech transcript |
| `onMicStateChange` | `(enabled: boolean)` | Microphone state changed |

### Methods

#### `connect(): Promise<void>`

Connect to the Pipecat session.

```typescript
await avatar.connect();
```

#### `disconnect(): Promise<void>`

Disconnect from the session.

```typescript
await avatar.disconnect();
```

#### `toggleMic(): void`

Toggle microphone on/off.

```typescript
avatar.toggleMic();
```

#### `setMicEnabled(enabled: boolean): void`

Set microphone state explicitly.

```typescript
avatar.setMicEnabled(true);  // Enable
avatar.setMicEnabled(false); // Disable
```

#### `attachVideoElement(element: HTMLVideoElement): void`

Attach or change video element dynamically.

```typescript
const newVideo = document.getElementById('another-video');
avatar.attachVideoElement(newVideo);
```

#### `attachAudioElement(element: HTMLAudioElement): void`

Attach or change audio element dynamically.

```typescript
const newAudio = document.getElementById('another-audio');
avatar.attachAudioElement(newAudio);
```

#### `getTracks()`

Get current media tracks.

```typescript
const tracks = avatar.getTracks();
console.log(tracks?.bot?.video); // Bot video track
console.log(tracks?.local?.audio); // Local audio track
```

#### `destroy(): void`

Clean up and destroy the SDK instance.

```typescript
avatar.destroy();
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `connectionState` | `ConnectionState` | Current connection state |
| `isConnected` | `boolean` | Whether connected |
| `isConnecting` | `boolean` | Whether connecting |
| `isMicEnabled` | `boolean` | Whether mic is enabled |
| `error` | `Error \| null` | Current error (if any) |

### Types

#### `ConnectionState`

```typescript
type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
```

#### `TranscriptData`

```typescript
interface TranscriptData {
  text: string;
  final?: boolean;
  timestamp?: number;
}
```

## Complete Examples

### Custom Dashboard

```javascript
import { LiveAvatarSDK } from '@iwy/live-widgets/headless';

const avatar = new LiveAvatarSDK(
  {
    agentId: 'your-agent-id',
  },
  {
    onConnecting: () => {
      updateStatus('Connecting...');
      showSpinner();
    },
    onConnected: () => {
      updateStatus('Connected');
      hideSpinner();
      enableControls();
    },
    onBotConnected: () => {
      console.log('Bot joined!');
      showBotIndicator();
    },
    onError: (error) => {
      updateStatus('Error: ' + error.message);
      showErrorNotification(error);
    },
    onUserTranscript: (data) => {
      if (data.final) {
        addTranscript('user', data.text);
      }
    },
    onBotTranscript: (data) => {
      addTranscript('bot', data.text);
    },
    onVideoTrack: (track) => {
      // Manually attach video if needed
      const video = document.getElementById('custom-video');
      video.srcObject = new MediaStream([track]);
      video.play();
    },
  }
);

// Your custom UI controls
document.getElementById('start').onclick = () => avatar.connect();
document.getElementById('stop').onclick = () => avatar.disconnect();
document.getElementById('mute').onclick = () => avatar.toggleMic();
```

### Multi-Agent Switcher

```javascript
import { LiveAvatarSDK } from '@iwy/live-widgets/headless';

let currentAvatar = null;

async function switchAgent(agentId) {
  // Disconnect current
  if (currentAvatar) {
    await currentAvatar.disconnect();
    currentAvatar.destroy();
  }

  // Create new connection
  currentAvatar = new LiveAvatarSDK(
    {
      agentId: agentId,
      videoElement: document.getElementById('video'),
      audioElement: document.getElementById('audio'),
    },
    {
      onConnected: () => {
        console.log(`Connected to agent: ${agentId}`);
      },
    }
  );

  await currentAvatar.connect();
}

// Switch between agents
document.getElementById('agent1-btn').onclick = () => switchAgent('agent-1');
document.getElementById('agent2-btn').onclick = () => switchAgent('agent-2');
```

## Advanced Features

### Media Handling

The SDK supports two approaches for handling bot video and audio. **Choose one approach** for clarity.

#### Mode 1: SDK-Managed (Recommended)

Pass `videoElement` and/or `audioElement` in the config. The SDK automatically attaches tracks when they become available.

```javascript
const avatar = new LiveAvatarSDK({
  agentId: 'your-agent-id',
  videoElement: document.getElementById('my-video'),
  audioElement: document.getElementById('my-audio'),
});

// That's it! SDK handles track attachment automatically
await avatar.connect();
```

#### Mode 2: Manual Control

Don't pass elements in config. Handle track attachment yourself via callbacks.

```javascript
const avatar = new LiveAvatarSDK(
  { agentId: 'your-agent-id' },
  {
    onVideoTrack: (track) => {
      const video = document.getElementById('my-video');
      video.srcObject = new MediaStream([track]);
      video.play().catch(console.error);
    },
    onAudioTrack: (track) => {
      const audio = document.getElementById('my-audio');
      audio.srcObject = new MediaStream([track]);
      audio.play().catch(console.error);
    },
  }
);

await avatar.connect();
```

> **Note:** The SDK internally prevents duplicate track attachment, so mixing modes won't cause errors. However, choosing one approach makes your code clearer.

### Warm-Start (Faster Connections)

By default, `warmStart` is enabled which pre-fetches the session from the backend immediately when the SDK is initialized. This reduces the latency when `connect()` is called.

```javascript
const avatar = new LiveAvatarSDK({
  agentId: 'your-agent-id',
  // warmStart: true is the default - session is pre-fetched automatically
});

// When user clicks connect, connection will be faster as session is already ready
await avatar.connect();

// To disable warm start:
const avatar = new LiveAvatarSDK({
  agentId: 'your-agent-id',
  warmStart: false, // Disable pre-fetching
});
```

### Attaching Elements Dynamically

```javascript
const avatar = new LiveAvatarSDK({ agentId: 'demo' });

// Later, attach elements
avatar.attachVideoElement(document.getElementById('video-1'));

// Switch to different element
avatar.attachVideoElement(document.getElementById('video-2'));
```

### Conditional Connection

```javascript
const avatar = new LiveAvatarSDK(
  { agentId: 'demo' },
  {
    onBotReady: async () => {
      // Wait for bot to be ready before showing UI
      document.getElementById('loading').style.display = 'none';
      document.getElementById('avatar-ui').style.display = 'block';
    },
  }
);

// Only connect after user grants permissions
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(() => avatar.connect())
  .catch((err) => console.error('Mic permission denied'));
```

## TypeScript Support

The SDK is fully typed with TypeScript:

```typescript
import { LiveAvatarSDK, LiveAvatarConfig, LiveAvatarCallbacks, ConnectionState } from '@iwy/live-widgets/headless';

const config: LiveAvatarConfig = {
  agentId: 'demo',
  enableMic: true,
};

const callbacks: LiveAvatarCallbacks = {
  onConnected: () => console.log('Connected'),
};

const avatar = new LiveAvatarSDK(config, callbacks);
```

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome/Edge | ✅ Full |
| Firefox | ✅ Full |
| Safari | ✅ Full (iOS 11+) |

**Requirements:**
- WebRTC
- ES2020+

## Troubleshooting

### Video not showing

Make sure you attach the video element and call `play()`:

```javascript
const avatar = new LiveAvatarSDK({
  agentId: 'demo',
  videoElement: document.getElementById('my-video'),
});
```

Or handle it manually:

```javascript
const avatar = new LiveAvatarSDK(
  { agentId: 'demo' },
  {
    onVideoTrack: (track) => {
      const video = document.getElementById('my-video');
      video.srcObject = new MediaStream([track]);
      video.play();
    },
  }
);
```

### Audio not playing

Ensure you have an audio element and it's set to autoplay:

```html
<audio id="my-audio" autoplay></audio>
```

```javascript
const avatar = new LiveAvatarSDK({
  agentId: 'demo',
  audioElement: document.getElementById('my-audio'),
});
```

### Microphone not working

Check browser permissions and HTTPS:

```javascript
// Request mic permission first
await navigator.mediaDevices.getUserMedia({ audio: true });

// Then connect
await avatar.connect();
```

## Examples

See the [examples directory](./examples) for complete working examples:

- [Vanilla JS](./examples/vanilla-js.html) - Complete HTML example
- [React](./examples/react-example.tsx) - React component
- [Vue](./examples/vue-example.vue) - Vue 3 component

## Links

- [Main Documentation](https://docs.iwy.ai)
- [GitHub Repository](https://github.com/iwy-ai/live-widgets)
- [Issues](https://github.com/iwy-ai/live-widgets/issues)
- [Website](https://www.iwy.ai)

## License

MIT License - see [LICENSE](../LICENSE) file

## Credits

Built by [iwy.ai](https://www.iwy.ai) with:
- [Pipecat](https://github.com/pipecat-ai/pipecat)
- [Daily.co](https://daily.co/)
