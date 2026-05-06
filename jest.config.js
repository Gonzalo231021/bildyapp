export default {
    testEnvironment: 'node',
    transform: {},
    testMatch: ['**/tests/**/*.test.js'],
    coverageDirectory: 'coverage',
    collectCoverageFrom: ['src/**/*.js'],
    moduleNameMapper: {
        '../utils/socket.js': '<rootDir>/src/__mocks__/socket.js',
    },
};
