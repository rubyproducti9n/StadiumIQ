module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }]
  ],
  plugins: [
    ['babel-plugin-transform-define', {
      'import.meta.env': {
        VITE_GEMINI_API_KEY: 'mock-key',
        VITE_CROWD_API_URL: 'http://mock-api.com',
        VITE_CROWD_API_KEY: 'api-key'
      }
    }]
  ]
}
