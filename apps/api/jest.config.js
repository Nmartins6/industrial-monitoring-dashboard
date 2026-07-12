export default {
  clearMocks: true,
  collectCoverageFrom: [
    '<rootDir>/.test-dist/src/**/*.js',
    '!<rootDir>/.test-dist/src/server.js',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageProvider: 'v8',
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/.test-dist/tests/**/*.test.js'],
  transform: {},
};
