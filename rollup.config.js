import terser from '@rollup/plugin-terser';

export default [
  // UMD build for CDN usage
  {
    input: 'live-avatar/dist/src.js',
    output: {
      file: 'dist/live-avatar.min.js',
      format: 'iife',
      name: 'LiveAvatar',
      banner: '/* @iwy/live-avatar v1.0.0 | MIT License | https://www.iwy.ai */'
    },
    plugins: [
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
  // ESM build
  {
    input: 'live-avatar/dist/src.js',
    output: {
      file: 'dist/live-avatar.esm.js',
      format: 'es',
      banner: '/* @iwy/live-avatar v1.0.0 | MIT License | https://www.iwy.ai */'
    }
  },
  // CommonJS build
  {
    input: 'live-avatar/dist/src.js',
    output: {
      file: 'dist/live-avatar.js',
      format: 'cjs',
      banner: '/* @iwy/live-avatar v1.0.0 | MIT License | https://www.iwy.ai */'
    }
  }
];