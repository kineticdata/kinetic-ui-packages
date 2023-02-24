// jest.config.js
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

module.exports = {
  testRegex: 'src/.*(_test|_spec|\\.test|\\.spec)\\.(js|jsx|vue|ts|tsx|mjs)$',
  setupFiles: ['./tests/setupTests.js'],
  setupFilesAfterEnv: ['./tests/setupMatchers.js'],
  snapshotSerializers: ['enzyme-to-json/serializer'],
  testEnvironment: 'jsdom',

  moduleNameMapper: {
    '@kineticdata/react': '<rootDir>/src/index',
    "^[./a-zA-Z0-9$_-]+\\.(png|svg)$": "<rootDir>/tests/utils/fileMock.js",
    "\\.(css|less)$": "<rootDir>/tests/utils/styleMock.js",
    "^lodash-es$": "lodash"
  },
};
