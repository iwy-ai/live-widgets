import terser from '@rollup/plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default [
  // UMD build for CDN usage (with Pipecat bundled)
  {
    input: 'live-avatar/dist/src.js',
    output: {
      file: 'dist/live-avatar.min.js',
      format: 'iife',
      name: 'LiveAvatar',
      banner: '/* @iwy/live-avatar v1.4.0 | MIT License | https://www.iwy.ai */'
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      terser({
        compress: {
          drop_console: false // Keep console logs for debugging
        },
        format: {
          comments: /^!/
        }
      })
    ]
  },
  // ESM build (with Pipecat bundled)
  {
    input: 'live-avatar/dist/src.js',
    output: {
      file: 'dist/live-avatar.esm.js',
      format: 'es',
      banner: '/* @iwy/live-avatar v1.4.0 | MIT License | https://www.iwy.ai */'
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs()
    ]
  },
  // CommonJS build (with Pipecat bundled)
  {
    input: 'live-avatar/dist/src.js',
    output: {
      file: 'dist/live-avatar.js',
      format: 'cjs',
      banner: '/* @iwy/live-avatar v1.4.0 | MIT License | https://www.iwy.ai */',
      exports: 'auto'
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs()
    ]
  },
  // Rectangular variant - UMD build for CDN usage (with Pipecat bundled)
  {
    input: 'live-avatar-rectangular/dist/src.js',
    output: {
      file: 'dist/live-avatar-rectangular.min.js',
      format: 'iife',
      name: 'LiveAvatarRectangular',
      banner: '/* @iwy/live-avatar-rectangular v1.4.0 | MIT License | https://www.iwy.ai */'
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      terser({
        compress: {
          drop_console: false // Keep console logs for debugging
        },
        format: {
          comments: /^!/
        }
      })
    ]
  },
  // Rectangular variant - ESM build (with Pipecat bundled)
  {
    input: 'live-avatar-rectangular/dist/src.js',
    output: {
      file: 'dist/live-avatar-rectangular.esm.js',
      format: 'es',
      banner: '/* @iwy/live-avatar-rectangular v1.4.0 | MIT License | https://www.iwy.ai */'
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs()
    ]
  },
  // Rectangular variant - CommonJS build (with Pipecat bundled)
  {
    input: 'live-avatar-rectangular/dist/src.js',
    output: {
      file: 'dist/live-avatar-rectangular.js',
      format: 'cjs',
      banner: '/* @iwy/live-avatar-rectangular v1.4.0 | MIT License | https://www.iwy.ai */',
      exports: 'auto'
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs()
    ]
  },
  // WebRTC Live Avatar Rectangular - UMD build for CDN usage
  {
    input: 'webrtc-live-avatar-rectangular/dist/src.js',
    output: {
      file: 'dist/webrtc-live-avatar-rectangular.min.js',
      format: 'iife',
      name: 'WebRTCLiveAvatarRectangular',
      banner: '/* @iwy/webrtc-live-avatar-rectangular v1.4.0 | MIT License | https://www.iwy.ai */'
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      terser({
        compress: {
          drop_console: false
        },
        format: {
          comments: /^!/
        }
      })
    ]
  },
  // WebRTC Live Avatar Rectangular - ESM build
  {
    input: 'webrtc-live-avatar-rectangular/dist/src.js',
    output: {
      file: 'dist/webrtc-live-avatar-rectangular.esm.js',
      format: 'es',
      banner: '/* @iwy/webrtc-live-avatar-rectangular v1.4.0 | MIT License | https://www.iwy.ai */'
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs()
    ]
  },
  // WebRTC Live Avatar Rectangular - CommonJS build
  {
    input: 'webrtc-live-avatar-rectangular/dist/src.js',
    output: {
      file: 'dist/webrtc-live-avatar-rectangular.js',
      format: 'cjs',
      banner: '/* @iwy/webrtc-live-avatar-rectangular v1.4.0 | MIT License | https://www.iwy.ai */',
      exports: 'auto'
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs()
    ]
  },
  // Audio Visualizer - UMD build for CDN usage (with Pipecat and Three.js bundled)
  {
    input: 'audio-visualizer/dist/src.js',
    output: {
      file: 'dist/audio-visualizer.min.js',
      format: 'iife',
      name: 'AudioVisualizer',
      banner: '/* @iwy/audio-visualizer v1.4.0 | MIT License | https://www.iwy.ai */'
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      terser({
        compress: {
          drop_console: false
        },
        format: {
          comments: /^!/
        }
      })
    ]
  },
  // Audio Visualizer - ESM build (with Pipecat and Three.js bundled)
  {
    input: 'audio-visualizer/dist/src.js',
    output: {
      file: 'dist/audio-visualizer.esm.js',
      format: 'es',
      banner: '/* @iwy/audio-visualizer v1.4.0 | MIT License | https://www.iwy.ai */'
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs()
    ]
  },
  // Audio Visualizer - CommonJS build (with Pipecat and Three.js bundled)
  {
    input: 'audio-visualizer/dist/src.js',
    output: {
      file: 'dist/audio-visualizer.js',
      format: 'cjs',
      banner: '/* @iwy/audio-visualizer v1.4.0 | MIT License | https://www.iwy.ai */',
      exports: 'auto'
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs()
    ]
  },
  // WebRTC Live Avatar HTTP - UMD build for CDN usage
  {
    input: 'webrtc-live-avatar-http/dist/src.js',
    output: {
      file: 'dist/webrtc-live-avatar-http.min.js',
      format: 'iife',
      name: 'WebRTCLiveAvatarHTTP',
      banner: '/* @iwy/webrtc-live-avatar-http v1.6.1 | MIT License | https://www.iwy.ai */'
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      terser({
        compress: {
          drop_console: false
        },
        format: {
          comments: /^!/
        }
      })
    ]
  },
  // WebRTC Live Avatar HTTP - ESM build
  {
    input: 'webrtc-live-avatar-http/dist/src.js',
    output: {
      file: 'dist/webrtc-live-avatar-http.esm.js',
      format: 'es',
      banner: '/* @iwy/webrtc-live-avatar-http v1.6.1 | MIT License | https://www.iwy.ai */'
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs()
    ]
  },
  // WebRTC Live Avatar HTTP - CommonJS build
  {
    input: 'webrtc-live-avatar-http/dist/src.js',
    output: {
      file: 'dist/webrtc-live-avatar-http.js',
      format: 'cjs',
      banner: '/* @iwy/webrtc-live-avatar-http v1.6.1 | MIT License | https://www.iwy.ai */',
      exports: 'auto'
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs()
    ]
  },
  // Headless SDK - UMD build for CDN usage
  {
    input: 'headless/src/index.ts',
    output: {
      file: 'dist/headless.min.js',
      format: 'iife',
      name: 'LiveAvatarHeadless',
      banner: '/* @iwy/live-widgets-headless v1.4.0 | MIT License | https://www.iwy.ai */'
    },
    plugins: [
      typescript({
        tsconfig: 'headless/tsconfig.json',
        compilerOptions: {
          declaration: false,
          declarationDir: undefined
        },
        exclude: ['headless/examples/**/*']
      }),
      resolve({
        browser: true,
        preferBuiltins: false,
        extensions: ['.ts', '.js']
      }),
      commonjs(),
      terser({
        compress: {
          drop_console: false
        },
        format: {
          comments: /^!/
        }
      })
    ]
  },
  // Headless SDK - ESM build
  {
    input: 'headless/src/index.ts',
    output: {
      file: 'dist/headless.esm.js',
      format: 'es',
      banner: '/* @iwy/live-widgets-headless v1.4.0 | MIT License | https://www.iwy.ai */'
    },
    plugins: [
      typescript({
        tsconfig: 'headless/tsconfig.json',
        declaration: true,
        declarationDir: 'dist/types',
        exclude: ['headless/examples/**/*']
      }),
      resolve({
        browser: true,
        preferBuiltins: false,
        extensions: ['.ts', '.js']
      }),
      commonjs()
    ]
  },
  // Headless SDK - CommonJS build
  {
    input: 'headless/src/index.ts',
    output: {
      file: 'dist/headless.js',
      format: 'cjs',
      banner: '/* @iwy/live-widgets-headless v1.4.0 | MIT License | https://www.iwy.ai */',
      exports: 'auto'
    },
    plugins: [
      typescript({
        tsconfig: 'headless/tsconfig.json',
        compilerOptions: {
          declaration: false,
          declarationDir: undefined
        },
        exclude: ['headless/examples/**/*']
      }),
      resolve({
        browser: true,
        preferBuiltins: false,
        extensions: ['.ts', '.js']
      }),
      commonjs()
    ]
  }
];