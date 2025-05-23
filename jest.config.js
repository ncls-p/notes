const { pathsToModuleNameMapper } = require('ts-jest');
const tsconfig = require('./tsconfig.json');

// Ensure paths exist in tsconfig.compilerOptions before trying to access them
const tsconfigPaths =
  tsconfig.compilerOptions && tsconfig.compilerOptions.paths ? tsconfig.compilerOptions.paths : {};

const moduleNameMapperConfig = pathsToModuleNameMapper(tsconfigPaths, {
  // The prefix should be <rootDir>/ because baseUrl in tsconfig.json is effectively '.' (the root)
  // and paths like "@/*": ["./*"] are relative to that.
  prefix: '<rootDir>/',
});

console.log('Jest moduleNameMapper configuration:', moduleNameMapperConfig); // For debugging

module.exports = {
  projects: [
    // Configuration for React component tests
    {
      displayName: 'dom',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/__tests__/app/**/*.test.tsx'],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      transform: {
        '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
      },
      moduleNameMapper: {
        ...moduleNameMapperConfig,
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
          'jest-transform-stub',
      },
      setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
      transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$))'],
    },
    // Configuration for API route tests
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/__tests__/api/**/*.test.ts'],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      transform: {
        '^.+\\.(ts|tsx)$': [
          'ts-jest',
          {
            tsconfig: 'tsconfig.json',
            useESM: false,
          },
        ],
      },
      moduleNameMapper: {
        ...moduleNameMapperConfig,
      },
      setupFilesAfterEnv: ['<rootDir>/__tests__/setup-node.js'],
      transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$))'],
    },
  ],
  collectCoverageFrom: [
    'app/**/*.ts',
    'app/**/*.tsx',
    'lib/**/*.ts',
    'lib/**/*.tsx',
    '!app/**/*.d.ts',
    '!lib/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
};
