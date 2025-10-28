<template>
  <div class="custom-avatar">
    <div class="video-container">
      <video
        ref="videoRef"
        autoplay
        playsinline
        muted
        class="video-element"
      />
      <audio ref="audioRef" autoplay />

      <div :class="['status-badge', connectionState]">
        <span v-if="connectionState === 'connected'">🟢 Connected</span>
        <span v-else-if="connectionState === 'connecting'">🟡 Connecting...</span>
        <span v-else-if="connectionState === 'disconnected'">⚫ Disconnected</span>
        <span v-else-if="connectionState === 'error'">🔴 Error</span>
      </div>
    </div>

    <div class="controls">
      <button
        @click="handleConnect"
        :disabled="connectionState === 'connected' || connectionState === 'connecting'"
        class="btn-primary"
      >
        {{ connectionState === 'connecting' ? 'Connecting...' : 'Start Call' }}
      </button>

      <button
        @click="handleDisconnect"
        :disabled="connectionState !== 'connected'"
        class="btn-danger"
      >
        End Call
      </button>

      <button
        @click="handleToggleMic"
        :disabled="connectionState !== 'connected'"
        :class="['btn-mic', { active: isMicEnabled }]"
      >
        {{ isMicEnabled ? '🎤 Mute' : '🎤 Unmute' }}
      </button>
    </div>

    <div class="audio-visualizer">
      <label>Microphone Level</label>
      <div class="audio-bar-container">
        <div
          class="audio-bar"
          :style="{ width: `${audioLevel * 100}%` }"
        />
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { LiveAvatarSDK } from '@iwy/live-widgets/headless';
import type { ConnectionState } from '@iwy/live-widgets/headless';

/**
 * Vue 3 example using LiveAvatarSDK
 *
 * This demonstrates how to integrate the headless SDK into a Vue component
 * with full control over the UI and styling.
 */

const videoRef = ref<HTMLVideoElement | null>(null);
const audioRef = ref<HTMLAudioElement | null>(null);

const connectionState = ref<ConnectionState>('disconnected');
const isMicEnabled = ref(true);
const audioLevel = ref(0);
const error = ref<string | null>(null);

let avatar: LiveAvatarSDK | null = null;

onMounted(() => {
  // Initialize SDK
  avatar = new LiveAvatarSDK(
    {
      agentId: 'demo', // Replace with your agent ID
      videoElement: videoRef.value || undefined,
      audioElement: audioRef.value || undefined,
    },
    {
      onConnecting: () => {
        connectionState.value = 'connecting';
        error.value = null;
      },
      onConnected: () => {
        connectionState.value = 'connected';
      },
      onDisconnected: () => {
        connectionState.value = 'disconnected';
        audioLevel.value = 0;
      },
      onError: (err) => {
        error.value = err.message;
        connectionState.value = 'error';
      },
      onAudioLevel: (level) => {
        audioLevel.value = level;
      },
      onMicStateChange: (enabled) => {
        isMicEnabled.value = enabled;
      },
      onUserTranscript: (data) => {
        if (data.final) {
          console.log('User:', data.text);
        }
      },
      onBotTranscript: (data) => {
        console.log('Bot:', data.text);
      },
    }
  );
});

onUnmounted(() => {
  avatar?.destroy();
});

const handleConnect = async () => {
  try {
    await avatar?.connect();
  } catch (err) {
    console.error('Connection error:', err);
  }
};

const handleDisconnect = async () => {
  await avatar?.disconnect();
};

const handleToggleMic = () => {
  avatar?.toggleMic();
};
</script>

<style scoped>
.custom-avatar {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.video-container {
  position: relative;
  width: 100%;
  height: 450px;
  background: #000;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  padding: 8px 16px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 14px;
  font-weight: 600;
}

.status-badge.connected {
  background: rgba(34, 197, 94, 0.9);
}

.status-badge.connecting {
  background: rgba(249, 115, 22, 0.9);
}

.status-badge.error {
  background: rgba(239, 68, 68, 0.9);
}

.controls {
  padding: 24px;
  display: flex;
  gap: 12px;
}

button {
  flex: 1;
  padding: 14px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-mic {
  background: #6b7280;
  color: white;
}

.btn-mic.active {
  background: #10b981;
}

.audio-visualizer {
  padding: 0 24px 24px;
}

.audio-visualizer label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
  font-weight: 600;
  text-transform: uppercase;
}

.audio-bar-container {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.audio-bar {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  transition: width 0.1s ease;
}

.error-message {
  margin: 0 24px 24px;
  padding: 12px;
  background: #fee2e2;
  border: 1px solid #ef4444;
  border-radius: 8px;
  color: #991b1b;
  font-size: 14px;
}
</style>
