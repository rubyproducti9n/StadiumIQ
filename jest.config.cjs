module.exports = {
  testEnvironment: 'jsdom',
  transform: { '^.+\\.jsx?$': 'babel-jest' },
  moduleNameMapper: {
    '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },
  setupFilesAfterFramework: ['@testing-library/jest-dom'],
  collectCoverageFrom: ['src/**/*.{js,jsx}', '!src/main.jsx']
}
