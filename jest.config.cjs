/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      { useESM: true, tsconfig: 'tsconfig.jest.json' },
    ],
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/app/$1',
  },
  roots: ['<rootDir>/app'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  setupFiles: [],
};
