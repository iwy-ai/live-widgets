# WebRTC Live Avatar Rectangular

A lightweight, standalone WebRTC video widget for displaying live avatar streams in a rectangular format. This component establishes a direct WebRTC connection to display real-time video and audio from an AI avatar agent.

## Features

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

### As ES Module

```html
<script type="module">
  import '@iwy/live-widgets/webrtc-rectangular';
</script>

<live-avatar agentid="your-agent-id" language="en"></live-avatar>
```

### Via CDN

```html
<script src="https://cdn.jsdelivr.net/npm/@iwy/live-widgets@latest/dist/webrtc-live-avatar-rectangular.min.js"></script>

<live-avatar agentid="your-agent-id" language="en"></live-avatar>
```

## Attributes

- `agentid`: The ID of the agent to connect to
- `language`: Language code (e.g., "en", "es")

## WebSocket Endpoint

The component expects a WebSocket server at `/ws/{peerId}` that handles WebRTC signaling with the following message types:

- `offer`: SDP offer from client
- `answer`: SDP answer from server
- `ice_candidate`: ICE candidate exchange

## Styling

The component uses Shadow DOM and can be styled via CSS custom properties:

```css
live-avatar {
  width: 800px;
  height: 600px;
  border-radius: 16px;
}
```

## Development

To run the example locally:

```bash
npm run dev
```

Then open `webrtc-live-avatar-rectangular/examples/index.html` in your browser.

## License

MIT
