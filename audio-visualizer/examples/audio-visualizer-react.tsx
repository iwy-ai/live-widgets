/**
 * Audio Visualizer - React/TypeScript Example
 *
 * This example shows how to use the audio-visualizer component in a React application.
 * The component is a web component, so it works seamlessly with React.
 */

import React, { useEffect, useRef } from 'react';
import '@iwy/live-widgets/audio-visualizer';

// Extend JSX to recognize the custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'audio-visualizer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          agentid: string;
          'data-endpoint'?: string;
        },
        HTMLElement
      >;
    }
  }
}

interface AudioVisualizerProps {
  agentId: string;
  endpoint?: string;
  className?: string;
}

/**
 * Simple wrapper component for the audio visualizer
 */
export function AudioVisualizer({
  agentId,
  endpoint = 'https://api.iwy.ai/v1/start-agent-session',
  className
}: AudioVisualizerProps) {
  return (
    <audio-visualizer
      agentid={agentId}
      data-endpoint={endpoint}
      className={className}
    />
  );
}

/**
 * Example usage in a React component
 */
export function AudioVisualizerDemo() {
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '800px',
        height: '500px',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)'
      }}>
        <AudioVisualizer agentId="demo" />
      </div>

      <div style={{
        marginTop: '40px',
        textAlign: 'center',
        color: 'white',
        maxWidth: '600px'
      }}>
        <h1 style={{ marginBottom: '16px' }}>Audio Visualizer</h1>
        <p style={{ opacity: 0.9, lineHeight: 1.6 }}>
          A WebGL-powered plasma visualizer that reacts to audio input in real-time.
          Built for voice AI applications with Pipecat integration.
        </p>
      </div>
    </div>
  );
}

/**
 * Advanced example with state management
 */
export function AudioVisualizerAdvanced() {
  const visualizerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // You can access the custom element and listen to events if needed
    const element = visualizerRef.current;

    if (element) {
      console.log('Audio visualizer mounted:', element);

      // Add any custom event listeners here
      // element.addEventListener('customEvent', handler);
    }

    return () => {
      // Cleanup
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <audio-visualizer
        ref={visualizerRef as any}
        agentid="demo"
        data-endpoint="https://api.iwy.ai/v1/start-agent-session"
      />
    </div>
  );
}

/**
 * Next.js example (handles SSR)
 */
export function AudioVisualizerNextJS({ agentId }: { agentId: string }) {
  const [mounted, setMounted] = React.useState(false);

  // Only render on client side to avoid SSR issues
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{
        width: '100%',
        height: '500px',
        background: '#000',
        borderRadius: '12px'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <audio-visualizer agentid={agentId} />
    </div>
  );
}

export default AudioVisualizer;
