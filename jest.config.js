export default {
    testEnvironment: 'node',
    transform: {},
    testMatch: ['**/tests/**/*.test.js'],
    coverageDirectory: 'coverage',
    collectCoverageFrom: ['src/**/*.js'],
    moduleNameMapper: {
        'express-async-errors': '<rootDir>/src/__mocks__/express-async-errors.js',
        '../utils/socket.js': '<rootDir>/src/__mocks__/socket.js',
    },
};
