# Run the examples

WebRTC has strict security requirements. You cannot open HTML files directly in the browser via the `file://` protocol.

## Quick Start

### Option 1: Use a simple HTTP server (recommended for local testing)

```bash
cd /home/sve/iwy/live-widgets
python3 -m http.server 8000
```

Then open: http://localhost:8000/webrtc-live-avatar-http/examples/simple.html

### Option 2: Use the Vite dev server

If you have the dev server running:

```bash
npm run dev
```

Then open: http://localhost:5174/webrtc-live-avatar-http/examples/simple.html

## Important Notes

- **Pure JavaScript**: These examples use the standalone JavaScript file (`dist/src.js`) - no TypeScript compilation needed!
- **HTTP Signaling**: Uses HTTP POST to `https://iwy-ai--wr-http-start.modal.run/connect/{peerId}` - no WebSocket needed!
- **No ICE Trickle**: All ICE candidates are bundled in the offer/answer for simplified signaling
- **ICE Servers**: Automatically prefetched from `https://api.iwy.ai/v1/ice-servers` when component loads (includes both STUN and time-limited TURN credentials)
- **Low Latency**: ICE servers are cached for 1 hour, eliminating API latency from the connection flow
- **Required Attribute**: The `publicapikey` attribute is required for authentication and ICE server access
- **API Dependency**: Connection will fail if ICE servers cannot be fetched from the API - ensure valid API key and network access
- **Easy Configuration**: Simply edit the constants at the top of `dist/src.js` to use different endpoints
- **Security**: WebRTC with microphone access requires `http://localhost` at minimum (not `file://`)

## Examples

- `simple.html` - Minimal example showing basic usage
- `index.html` - Full example with styled interface

Both examples include the required `publicapikey` attribute for authentication.

## Quick Command

```bash
python3 -m http.server 8000
```

Then open:
- http://localhost:8000/webrtc-live-avatar-http/examples/index.html
- http://localhost:8000/webrtc-live-avatar-http/examples/simple.html