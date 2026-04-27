import { defineConfig } from 'vite';
import obfuscator from 'vite-plugin-javascript-obfuscator';

export default defineConfig(({ command }) => ({
  base: './',
  publicDir: 'src/assets',
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    host: true,
  },
  preview: {
    host: true,
  },
  build: {
    sourcemap: false,
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: undefined,
        codeSplitting: false,
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  plugins:
    command === 'build'
      ? [
          obfuscator({
            include: ['src/**/*.ts', 'src/**/*.js'],
            apply: 'build',
            options: {
              compact: true,
              controlFlowFlattening: true,
              controlFlowFlatteningThreshold: 0.5,
              deadCodeInjection: true,
              deadCodeInjectionThreshold: 0.2,
              debugProtection: false,
              disableConsoleOutput: false,
              identifierNamesGenerator: 'hexadecimal',
              selfDefending: false,
              simplify: true,
              splitStrings: true,
              splitStringsChunkLength: 10,
              stringArray: true,
              stringArrayCallsTransform: true,
              stringArrayShuffle: true,
              stringArrayThreshold: 0.75,
              transformObjectKeys: true,
              unicodeEscapeSequence: true,
            },
          }),
        ]
      : [],
}));
