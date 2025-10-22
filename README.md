# @iwy/live-widgets

Embeddable AI avatar and audio visualizer widgets for live conversations. This package allows you to easily embed interactive AI avatars and audio visualizations on any website with just a few lines of code.

## Components

This package provides three interactive components for Pipecat voice AI applications:

| Component | Description | Use Case |
|-----------|-------------|----------|
| **[live-avatar](./live-avatar/README.md)** | Circular floating bubble in bottom-right corner | Non-intrusive avatar widget similar to chat bubbles |
| **[live-avatar-rectangular](./live-avatar-rectangular/README.md)** | Rectangular video container that fills parent div | Embedded video chat experience in your page layout |
| **[audio-visualizer](./audio-visualizer/README.md)** | Audio-only WebGL plasma visualizer | Audio-first experiences without video streaming |

Click any component name above to view detailed documentation, usage examples, and configuration options.

## Quick Start

All components follow the same simple pattern: import the component and specify your `agentid` (required), along with any optional component-specific parameters.

### Installation

#### Via npm

```bash
npm install @iwy/live-widgets
```

#### Via CDN

```html
<!-- Example: Load the live-avatar component -->
<script src="https://unpkg.com/@iwy/live-widgets@1.2.0/dist/live-avatar.min.js"></script>
```

### Basic Usage Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <h1>Welcome</h1>

    <!-- Use the component with required agentid attribute -->
    <live-avatar agentid="your-agent-id"></live-avatar>

    <!-- Load the component script -->
    <script src="https://unpkg.com/@iwy/live-widgets@1.2.0/dist/live-avatar.min.js"></script>
</body>
</html>
```

### React/TypeScript

```tsx
import '@iwy/live-widgets';

function App() {
  return (
    <div>
      <live-avatar agentid="your-agent-id">
      </live-avatar>
    </div>
  );
}
```

**Note:** Each component may have additional optional attributes specific to its functionality. See the individual component documentation linked in the table above for complete configuration options.

## Features

- **Several Component Types** - Floating bubble, rectangular container, audio visualizer ...
- **Pipecat Integration** - Built-in support for Pipecat Client SDK with Daily transport
- **Easy Integration** - Web components work with any framework (React, Vue, Angular, etc.)
- **Responsive Design** - Components adapt to their containers
- **Real-time Audio** - Microphone visualization and audio reactivity
- **WebGL Effects** - Hardware-accelerated plasma visualization
- **Multi-language** - Built-in English and Norwegian support
- **Customizable** - Configure endpoints, styling, and behavior

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome/Edge | ✅ Full support (60+) |
| Firefox | ✅ Full support (63+) |
| Safari | ✅ Full support (12+, iOS 11+) |

**Requirements:**
- WebRTC
- Web Audio API
- WebGL 1.0+ (for audio-visualizer)

## Documentation

For detailed documentation on each component, see:

- **[Live Avatar](./live-avatar/README.md)** - Floating bubble widget
- **[Live Avatar Rectangular](./live-avatar-rectangular/README.md)** - Rectangular container widget
- **[Audio Visualizer](./audio-visualizer/README.md)** - Audio-only visualizer

## Development

```bash
# Clone repository
git clone https://github.com/iwy-ai/live-widgets.git
cd live-widgets

# Install dependencies
npm install

# Build all components
npm run build
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Links

- [Website](https://www.iwy.ai)
- [Issues](https://github.com/iwy-ai/live-widgets/issues)
- [Documentation](https://docs.iwy.ai)

## Support

For support and questions, visit [iwy.ai/contact](https://www.iwy.ai/contact)

## Credits

Built by [iwy.ai](https://www.iwy.ai) with:
- [Pipecat](https://github.com/pipecat-ai/pipecat)
- [Three.js](https://threejs.org/)
- [Daily.co](https://daily.co/)
