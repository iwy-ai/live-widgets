import terser from '@rollup/plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
  // UMD build for CDN usage (with Pipecat bundled)
  {
    input: 'live-avatar/dist/src.js',
    output: {
      file: 'dist/live-avatar.min.js',
      format: 'iife',
      name: 'LiveAvatar',
      banner: '/* @iwy/live-avatar v1.0.0 | MIT License | https://www.iwy.ai */'
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
      banner: '/* @iwy/live-avatar v1.0.0 | MIT License | https://www.iwy.ai */'
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
      banner: '/* @iwy/live-avatar v1.0.0 | MIT License | https://www.iwy.ai */',
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
      banner: '/* @iwy/live-avatar-rectangular v1.0.0 | MIT License | https://www.iwy.ai */'
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
      banner: '/* @iwy/live-avatar-rectangular v1.0.0 | MIT License | https://www.iwy.ai */'
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
      banner: '/* @iwy/live-avatar-rectangular v1.0.0 | MIT License | https://www.iwy.ai */',
      exports: 'auto'
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs()
    ]
  }
];