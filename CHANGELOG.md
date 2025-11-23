## [1.9.1](https://github.com/iwy-ai/live-widgets/compare/v1.9.0...v1.9.1) (2025-11-23)


### Bug Fixes

* **Headless SDK**: Add console logging for session fetching and WebRTC room joining
* **Developer Experience**: Improve debugging visibility with 4 strategic console logs tracking initialization flow
* **Cold/Warm Start**: Better feedback on timing and success/failure of prefetch operations

### Technical Details

* Added console logs before/after session endpoint fetch
* Added console logs before/after WebRTC room connection
* Provides clear browser console feedback for debugging connection issues
* Helps identify whether issues are with session fetching or WebRTC connection

### Impact

- Better debugging experience for developers
- Clear visibility into warm-start vs cold-start behavior
- Easier troubleshooting of connection timing and failures

# [1.9.0](https://github.com/iwy-ai/live-widgets/compare/v1.8.0...v1.9.0) (2025-11-22)


### Features

* **Headless SDK Warm-Start**: Added `warmStart` configuration option to `LiveAvatarSDK` for pre-fetching session data
* **Performance**: Reduced connection latency for headless implementations by enabling session pre-loading
* **API Update**: `LiveAvatarConfig` interface now supports optional `warmStart` boolean property
* **SDK Improvements**: Enhanced state tracking and session management logic in the headless SDK

### Technical Details

* Updated `LiveAvatarSDK` constructor to initiate session prefetch when `warmStart: true`
* Added `prefetchedSession` state management to store early session data
* Modified `connect()` flow to prioritize cached session data
* Added verbose logging for warm-start lifecycle events

### Usage

```typescript
const avatar = new LiveAvatarSDK({
  agentId: 'your-agent-id',
  warmStart: true // Enable pre-fetching
});

// Connection will be faster as session is already loaded
await avatar.connect();
```

# [1.8.0](https://github.com/iwy-ai/live-widgets/compare/v1.7.0...v1.8.0) (2025-11-22)


### Features

* **Warm-Start Mode**: Add `warm-start` attribute to `iwy-corner-circular` for pre-fetching session data
* **Performance Optimization**: Session data fetched on component load, significantly reducing connection latency
* **Graceful Handling**: Automatic synchronization if user clicks before prefetch completes
* **Backward Compatible**: Feature is opt-in via `warm-start="true"` attribute, default behavior unchanged

### Technical Details

* New `warm-start` attribute (boolean, default: `false`)
* Pre-fetch logic in `_prefetchSession()` method
* Modified `_startCall()` to use cached session data when available
* Race condition handling: waits for prefetch promise if user clicks early
* Console logging for debugging prefetch operations

### Benefits

- **Reduced Latency**: Session already fetched when user clicks avatar
- **Better UX**: Near-instant room joining (no fetch delay)
- **Reliable**: Handles edge cases including early clicks and fetch failures
- **Safe**: Falls back to normal fetch if prefetch unavailable

### Usage

```html
<!-- Enable warm-start for faster connections -->
<iwy-corner-circular agentid="your-agent-id" warm-start="true"></iwy-corner-circular>

<!-- Or use boolean attribute syntax -->
<iwy-corner-circular agentid="your-agent-id" warm-start></iwy-corner-circular>
```

```tsx
// TypeScript/React
import '@iwy/live-widgets/corner-circular';
<iwy-corner-circular agentid="your-agent-id" warm-start={true}></iwy-corner-circular>
```

### How It Works

1. Component loads → Prefetch session from backend (if `warm-start="true"`)
2. Session data stored in memory
3. User clicks avatar → Use cached data (instant) or wait for prefetch (if still pending)
4. Join room and start conversation

# [1.7.0](https://github.com/iwy-ai/live-widgets/compare/v1.6.1...v1.7.0) (2025-11-22)


### Features

* **New Component**: Add `iwy-corner-circular` component - circular floating avatar bubble in bottom-right corner
* **Component Architecture**: Rebranded live-avatar to iwy-corner-circular with proper custom element registration
* **Build Pipeline**: Add iwy-corner-circular to rollup build configuration with UMD, ESM, and CommonJS outputs
* **NPM Distribution**: Enable dist file generation for iwy-corner-circular component
* **CDN Access**: Configure unpkg/jsdelivr CDN access for circular corner widget
* **Package Exports**: Add `./corner-circular` export path for TypeScript-friendly imports
* **Documentation**: Comprehensive README with usage examples for HTML, React, Vue, and Angular
* **Multi-language Support**: Built-in English and Norwegian UI text support

### Technical Details

* Component element: `<iwy-corner-circular>`
* Build outputs: `dist/iwy-corner-circular.{min.js,esm.js,js}`
* Import path: `@iwy/live-widgets/corner-circular`
* CDN URLs:
  - `https://unpkg.com/@iwy/live-widgets@latest/dist/iwy-corner-circular.min.js`
  - `https://cdn.jsdelivr.net/npm/@iwy/live-widgets@latest/dist/iwy-corner-circular.min.js`

### Usage

```html
<!-- Via CDN -->
<script src="https://unpkg.com/@iwy/live-widgets@latest/dist/iwy-corner-circular.min.js"></script>
<iwy-corner-circular agentid="your-agent-id" language="en"></iwy-corner-circular>
```

```tsx
// Via npm (TypeScript)
import '@iwy/live-widgets/corner-circular';
<iwy-corner-circular agentid="your-agent-id" language="en"></iwy-corner-circular>
```

# [1.6.1](https://github.com/iwy-ai/live-widgets/compare/v1.6.0...v1.6.1) (2025-11-20)


### Bug Fixes

* **Build Pipeline**: Add HTTP widget to rollup build configuration and package.json exports
* **NPM Distribution**: Enable dist file generation for webrtc-live-avatar-http component
* **CDN Access**: Fix unpkg/jsdelivr CDN access for HTTP signaling widget

# [1.6.0](https://github.com/iwy-ai/live-widgets/compare/v1.5.0...v1.6.0) (2025-11-20)


### Features

* **WebRTC HTTP Signaling**: New alternative widget using HTTP POST for signaling instead of WebSocket
* **Simplified Signaling**: Single round-trip HTTP request/response for complete offer/answer exchange
* **No ICE Trickle**: All ICE candidates bundled in offer/answer for simplified signaling flow
* **Better Compatibility**: Improved firewall and proxy compatibility compared to WebSocket-based signaling
* **Reduced Overhead**: Stateless signaling with no persistent connection required
* **Easier Debugging**: Standard HTTP patterns for simplified troubleshooting
* **Same Features**: Maintains all functionality of rectangular widget (ICE prefetching, authentication, audio controls)

### Technical Details

* HTTP signaling endpoint: `https://iwy-ai--wr-http-start.modal.run`
* ICE gathering timeout: 1.5 seconds maximum before sending offer
* Component location: `webrtc-live-avatar-http/`
* Usage: Same `<live-avatar>` element with `agentid` and `publicapikey` attributes

### Why HTTP Signaling?

HTTP POST signaling provides several advantages over WebSocket for certain deployment scenarios:
- **Simpler infrastructure**: No need to maintain persistent WebSocket connections
- **Better proxy compatibility**: Works through HTTP proxies that may block WebSocket
- **Easier debugging**: Standard HTTP tools can capture and inspect signaling traffic
- **Lower latency**: Single round-trip vs. multiple WebSocket messages
- **Stateless**: No connection state to manage on the signaling layer

Choose HTTP signaling when you need maximum compatibility or simpler infrastructure. Choose WebSocket signaling (webrtc-live-avatar-rectangular) when you need ICE trickle or prefer persistent connections.

# [1.5.0](https://github.com/iwy-ai/live-widgets/compare/v1.4.0...v1.5.0) (2025-11-12)


### Features

* **WebRTC Widget**: Add mandatory `publicapikey` attribute for authentication and ICE server access
* **NAT Traversal**: Implement automatic ICE server prefetching from IWY API endpoint `/v1/ice-servers`
* **Performance**: Add ICE server caching with 1-hour TTL for low-latency connections
* **Reliability**: Integrate Twilio-powered time-limited TURN credentials for reliable NAT traversal
* **Error Handling**: Enhanced validation and error messages for API key and connection failures
* **Documentation**: Update all examples and README files with required `publicapikey` attribute

### Breaking Changes

* The `publicapikey` attribute is now **required** for the WebRTC Live Avatar component
* Connections will fail if ICE servers cannot be fetched from the IWY API
* Update your implementation: `<live-avatar agentid="demo" publicapikey="iwy_pk__xxx" language="en"></live-avatar>`

# [1.4.0](https://github.com/iwy-ai/live-widgets/compare/v1.3.3...v1.4.0) (2025-10-28)


### Features

* Add headless SDK for framework-agnostic integration with complete TypeScript support
* Introduce LiveAvatarSDK class providing programmatic control over avatar lifecycle and state management
* Enable React, Vue, and vanilla JavaScript implementations through unified SDK interface

# [1.3.3](https://github.com/iwy-ai/live-widgets/compare/v1.3.2...v1.3.3) (2025-10-23)


### Features

* add audio-visualizer component ([a837f45](https://github.com/iwy-ai/live-widgets/commit/a837f451ad3a1d34392d01dce099912291e4ff46))
* add webrtc rectangular widget ([cf40a6a](https://github.com/iwy-ai/live-widgets/commit/cf40a6ac7529157f5a9006a5244a834170ae03b8))

# [1.3.2](https://github.com/iwy-ai/live-widgets/compare/v1.3.1...v1.3.2) (2025-10-23)

## What Changed?

The WebRTC Live Avatar component has been refactored to eliminate the TypeScript dependency and hardcode the WebSocket URL. This means:

1. **No more TypeScript**: `dist/src.js` is now the primary source file
2. **No build step required**: Use the JavaScript file directly
3. **WebSocket URL is hardcoded**: No need for wrapper components or monkey-patching
4. **Simpler integration**: Works out of the box in any framework

# [1.3.1](https://github.com/iwy-ai/live-widgets/compare/v1.3.0...v1.3.1) (2025-10-23)

### Features

* Add WebRTC based rectangular widget.


# [1.3.0](https://github.com/iwy-ai/live-widgets/compare/v1.2.0...v1.3.0) (2025-10-22)

### Features

* Migrate backend from api.iwy.ai/api/[endpoint] -> api.iwy.ai/v1/[endpoint]


# [1.2.0](https://github.com/iwy-ai/live-widgets/compare/v1.1.0...v1.2.0) (2025-10-19)


### Features

* Add audio-visualizer component with WebGL plasma visualization
* Organize all components into dedicated folders with individual READMEs and examples
* Streamline main README with component comparison table and unified documentation

# [1.1.0](https://github.com/iwy-ai/live-widgets/compare/v1.0.0...v1.1.0) (2025-10-03)


### Bug Fixes

* "Listening..." not unintentionally displayed ([be084b0](https://github.com/iwy-ai/live-widgets/commit/be084b0031aa2f70424f125d0f5a4fc2e04ece9a))
* improve top & bottom shadow gradient ([2cf56d7](https://github.com/iwy-ai/live-widgets/commit/2cf56d751f5dc8726a8cebd985003049a16a30a4))
* tweak ui: dropdown + bottom shadow ([4fb376f](https://github.com/iwy-ai/live-widgets/commit/4fb376fd0743126b806a46d5fe597241fd0c3bd6))


### Features

* add back buttons: "end call" and mic ([6af796e](https://github.com/iwy-ai/live-widgets/commit/6af796e7ec7dc041d050a6ddbffe1f6cc54046ad))
* added on-hover start call ([aa33d33](https://github.com/iwy-ai/live-widgets/commit/aa33d33a6ff4329f0877f691809310d7e27cd91f))

# 1.0.0 (2025-10-03)


### Bug Fixes

* convert update-versions.js to ES modules and add CI workflow ([22e3d1c](https://github.com/iwy-ai/live-widgets/commit/22e3d1c4d0ea3ee6eae6edcf39dff8cba35288c2))
* test.html local site ([fe91c8a](https://github.com/iwy-ai/live-widgets/commit/fe91c8af7b61ce0527d4acbc1cfd60ef4127fe48))


### Features

* add parameter: language="no" {"en", "no"} ([a968826](https://github.com/iwy-ai/live-widgets/commit/a9688268209b5ec94be01595292a9f79cbde137b))
* add place-holder image argument (optional) ([e8dbb9b](https://github.com/iwy-ai/live-widgets/commit/e8dbb9b01206edd82f930493f7f3a528262f6459))
* add semantic-release automation ([20cf98e](https://github.com/iwy-ai/live-widgets/commit/20cf98ea17061e663e8cbc916b60059ee55668e8))
* setup npm package ([e7f345a](https://github.com/iwy-ai/live-widgets/commit/e7f345a60dbfe35d2982be5c880095fbbb914387))
