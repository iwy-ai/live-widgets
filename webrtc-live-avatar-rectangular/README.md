# WebRTC Live Avatar Rectangular

A lightweight, standalone WebRTC video widget for displaying live avatar streams in a rectangular format. This component establishes a direct WebRTC connection to display real-time video and audio from an AI avatar agent.

## Features

- **Pure JavaScript**: No TypeScript, no build step required!
- **Pure WebRTC**: Direct peer-to-peer connection without requiring Pipecat or Daily.co dependencies
- **Minimal**: Standalone web component with no external framework requirements
- **Responsive**: Adapts to container size with flexible layout
- **Audio Control**: Built-in microphone mute/unmute functionality
- **Clean UI**: Modern, minimal interface with customizable styling
- **Hardcoded WebSocket**: Pre-configured WebSocket URL - no wrapper components needed!

## Installation

```bash
npm install @iwy/live-widgets
```

## Usage

### Simple HTML (Recommended)

The easiest way to use this component is to directly import the JavaScript file:

```html
<script type="module" src="./dist/src.js"></script>

<live-avatar 
  agentid="your-agent-id" 
  publicapikey="iwy_pk__your_api_key" 
  language="en">
</live-avatar>
```

### As ES Module

```html
<script type="module">
  import '@iwy/live-widgets/webrtc-rectangular';
</script>

<live-avatar 
  agentid="your-agent-id" 
  publicapikey="iwy_pk__your_api_key" 
  language="en">
</live-avatar>
```

### Via CDN

```html
<script src="https://unpkg.com/@iwy/live-widgets@latest/dist/webrtc-live-avatar-rectangular.min.js"></script>

<live-avatar 
  agentid="your-agent-id" 
  publicapikey="iwy_pk__your_api_key" 
  language="en">
</live-avatar>
```

### In React/Next.js

No need for wrapper components or monkey-patching! Just use it directly:

```jsx
'use client'

import { useEffect } from 'react'

export default function AvatarPage() {
  useEffect(() => {
    // Dynamically import the component
    import('@iwy/live-widgets/webrtc-rectangular')
  }, [])

  return (
    <div style={{ width: '400px', height: '400px' }}>
      <live-avatar 
        agentid="demo" 
        publicapikey="iwy_pk__your_api_key"
        language="en" 
      />
    </div>
  )
}
```

## Attributes

- **`agentid`** (required): The ID of the agent to connect to
- **`publicapikey`** (required): Your IWY API key for authentication and ICE server access
- **`language`** (optional): Language code (e.g., "en", "es") - defaults to "en"

## How It Works

### WebSocket Configuration

The component connects to `wss://iwy-ai--wr-start.modal.run/ws/{peerId}` by default, but the ICE trickle signaling is abstracted away inside the component itself.

### ICE Server Configuration

The component automatically fetches complete ICE server configuration from the IWY API using your public API key. This provides:

- **Time-limited TURN credentials** via Twilio for secure NAT traversal (1 hour TTL)
- **STUN servers** for peer discovery (Twilio + Google)
- **Automatic credential rotation** on each connection
- **Credentials never hardcoded** in your client-side code
- **Prefetching for low latency** - ICE servers are fetched when the component loads

#### How Prefetching Works

For optimal performance, ICE servers are **prefetched in the background** when the component loads:

1. Component loads → ICE servers are fetched immediately
2. User clicks "Connect" → Cached servers are used instantly (no API delay)
3. Servers are cached for 1 hour and automatically refreshed when expired

This eliminates the ~200-500ms API latency from the connection flow, providing instant WebRTC setup when users click connect.

**Important:** The connection will fail if ICE servers cannot be fetched from the API. Ensure your API key is valid and the endpoint is accessible. 

## Styling

The component uses Shadow DOM and can be styled via CSS custom properties:

```css
live-avatar {
  width: 800px;
  height: 600px;
  border-radius: 16px;
}
```

## License

MIT
