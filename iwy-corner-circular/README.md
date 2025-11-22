# iwy-corner-circular Component

A circular AI avatar widget that appears as a floating bubble in the bottom-right corner of your page. Built for Pipecat voice AI applications with video streaming support.

## Features

- **Video Avatar** - Real-time video streaming from AI agent
- **Interactive UI** - Expandable circular bubble with overlay controls
- **Audio Level Visualization** - Real-time microphone input visualization
- **Multi-language Support** - Built-in English and Norwegian language options
- **Easy Integration** - Simple web component that auto-positions
- **Pipecat Ready** - Built-in support for Pipecat Client SDK with Daily transport
- **Responsive** - Auto-positioned floating bubble design

## What Makes It Different

**iwy-corner-circular vs Other Components:**
- **iwy-corner-circular** (this component): Circular floating bubble in bottom-right corner with video
- **live-avatar-rectangular**: Rectangular container with video that fills its parent div
- **audio-visualizer**: Audio-only component with WebGL plasma visualization (no video)

Choose this component if you want a **non-intrusive floating avatar** that appears in the corner of your page, similar to a chat widget.

## Installation

### Via npm

```bash
npm install @iwy/live-widgets
```

### Via CDN

```html
<!-- unpkg -->
<script src="https://unpkg.com/@iwy/live-widgets@latest/dist/iwy-corner-circular.min.js"></script>

<!-- jsdelivr -->
<script src="https://cdn.jsdelivr.net/npm/@iwy/live-widgets@latest/dist/iwy-corner-circular.min.js"></script>
```

## Quick Start

### HTML

```html
<!DOCTYPE html>
<html>
<head>
    <title>iwy-corner-circular Demo</title>
</head>
<body>
    <h1>My Website</h1>
    <p>The avatar will appear in the bottom-right corner.</p>

    <iwy-corner-circular agentid="your-agent-id"></iwy-corner-circular>

    <script src="https://unpkg.com/@iwy/live-widgets@latest/dist/iwy-corner-circular.min.js"></script>
</body>
</html>
```

### React/TypeScript

```tsx
import '@iwy/live-widgets/corner-circular';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'iwy-corner-circular': {
        agentid: string;
        'data-endpoint'?: string;
        language?: 'en' | 'no';
      };
    }
  }
}

function App() {
  return (
    <div>
      <h1>My App</h1>
      <iwy-corner-circular agentid="your-agent-id" language="en"></iwy-corner-circular>
    </div>
  );
}
```

### Vue

```vue
<template>
  <div>
    <h1>My App</h1>
    <iwy-corner-circular agentid="your-agent-id" language="en"></iwy-corner-circular>
  </div>
</template>

<script setup>
import '@iwy/live-widgets/corner-circular';
</script>
```

### Angular

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@iwy/live-widgets/corner-circular';

@Component({
  selector: 'app-root',
  template: `
    <h1>My App</h1>
    <iwy-corner-circular agentid="your-agent-id" language="en"></iwy-corner-circular>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent {}
```

## Configuration

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `agentid` | string | Yes | - | Your Pipecat agent ID |
| `data-endpoint` | string | No | `https://api.iwy.ai/v1/start-agent-session` | Custom session endpoint |
| `language` | string | No | `en` | Language for UI text (`en` or `no`) |

Languages currently supported: `en` and `no`

## How It Works

- **Floating Bubble**: Component positions itself as a fixed circular bubble in the bottom-right corner
- **Video Stream**: Displays real-time video from the Pipecat AI agent via WebRTC
- **Expandable UI**: Click to expand and show controls (Start Call, End Call, Mic Toggle)
- **Audio Visualization**: Real-time microphone level visualization with Web Audio API
- **Pipecat Integration**: Connects via DailyTransport (Daily.co) for WebRTC streaming
- **Multi-language**: Supports English and Norwegian UI text

## Styling

The component is self-positioning and requires no parent styling. It creates a fixed-position circular bubble in the bottom-right corner of the viewport.

If you need custom positioning, you can override the CSS via:

```css
iwy-corner-circular {
  /* Override default positioning if needed */
}
```

## Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome/Edge | ✅ Full |
| Firefox | ✅ Full |
| Safari | ✅ Full (iOS 11+) |

**Requirements:**
- WebRTC
- Web Audio API
- Shadow DOM

## Development

```bash
# Clone repository
git clone https://github.com/iwy-ai/live-widgets.git
cd live-widgets

# Install dependencies
npm install

# Build
npm run build
```

## Examples

See the `examples/` directory for integration examples.

## Technical Details

- **Architecture**: Web Component with Shadow DOM
- **Video**: WebRTC video element with Pipecat/Daily.co transport
- **Audio**: Web Audio API with AnalyserNode for mic level visualization
- **Bundle Size**: ~160KB (minified), includes Pipecat Client SDK and Daily transport

## License

MIT License - see LICENSE file

## Links

- [Website](https://www.iwy.ai)
- [Issues](https://github.com/iwy-ai/live-widgets/issues)
- [Documentation](https://docs.iwy.ai)

## Credits

Built by [iwy.ai](https://www.iwy.ai) with:
- [Pipecat](https://github.com/pipecat-ai/pipecat)
- [Daily.co](https://daily.co/)
