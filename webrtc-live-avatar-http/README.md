# WebRTC Live Avatar (HTTP Signaling)

A lightweight, standalone WebRTC video widget for displaying live avatar streams in a rectangular format. This component uses **HTTP POST for signaling** instead of WebSocket, providing a simpler alternative without ICE trickle.

## Features

- **Pure JavaScript**: No TypeScript, no build step required!
- **HTTP Signaling**: Uses simple HTTP POST requests instead of WebSocket
- **No ICE Trickle**: All ICE candidates bundled in offer/answer for simplified signaling
- **Pure WebRTC**: Direct peer-to-peer connection without requiring Pipecat or Daily.co dependencies
- **Minimal**: Standalone web component with no external framework requirements
- **Responsive**: Adapts to container size with flexible layout
- **Audio Control**: Built-in microphone mute/unmute functionality
- **Clean UI**: Modern, minimal interface with customizable styling

## Installation

```bash
npm install @iwy/live-widgets
```

## Usage

### Simple HTML (Recommended)

The easiest way to use this component is to directly import the JavaScript file:

```html
<script type="module" src="./dist/src.js"></script>

<live-avatar-http
  agentid="your-agent-id"
  publicapikey="iwy_pk__your_api_key"
  language="en">
</live-avatar-http>
```

### As ES Module

```html
<script type="module">
  import '@iwy/live-widgets/webrtc-http';
</script>

<live-avatar-http
  agentid="your-agent-id"
  publicapikey="iwy_pk__your_api_key"
  language="en">
</live-avatar-http>
```

### Via CDN

```html
<script src="https://unpkg.com/@iwy/live-widgets@latest/dist/webrtc-live-avatar-http.min.js"></script>

<live-avatar-http
  agentid="your-agent-id"
  publicapikey="iwy_pk__your_api_key"
  language="en">
</live-avatar-http>
```

### In React/Next.js

No need for wrapper components or monkey-patching! Just use it directly:

```jsx
'use client'

import { useEffect } from 'react'

export default function AvatarPage() {
  useEffect(() => {
    // Dynamically import the component
    import('@iwy/live-widgets/webrtc-http')
  }, [])

  return (
    <div style={{ width: '400px', height: '400px' }}>
      <live-avatar-http
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

### HTTP Signaling

The component uses HTTP POST for signaling instead of WebSocket:

1. **Offer Creation**: The client creates an offer and waits for ICE gathering to complete (up to 1.5 seconds)
2. **HTTP POST**: The complete offer (with all ICE candidates) is sent via POST to `https://iwy-ai--wr-http-start.modal.run/connect/{peerId}`
3. **Answer Response**: The server responds with the complete answer (including all ICE candidates) in the HTTP response
4. **Connection Establishment**: WebRTC peer connection is established using the exchanged SDP

**Benefits over WebSocket + ICE Trickle:**
- Simpler implementation - no persistent connection needed
- Easier to debug - standard HTTP request/response
- Better compatibility with proxies and firewalls
- Reduced overhead - single round trip for signaling

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
live-avatar-http {
  width: 800px;
  height: 600px;
  border-radius: 16px;
}
```

## License

MIT
