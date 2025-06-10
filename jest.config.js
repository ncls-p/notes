// Manual module name mapper configuration to handle @/* paths
const moduleNameMapperConfig = {
  "^@/(.*)$": "<rootDir>/$1",
};

export default {
  projects: [
    // Configuration for React component tests
    {
      displayName: "dom",
      testEnvironment: "jsdom",
      testMatch: [
        "<rootDir>/__tests__/app/**/*.test.tsx",
        "<rootDir>/__tests__/contexts/**/*.test.tsx",
        "<rootDir>/__tests__/components/**/*.test.tsx",
      ],
      moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
      transform: {
        "^.+\\.(ts|tsx|js|jsx)$": [
          "babel-jest",
          { configFile: "./babel.jest.config.js" },
        ],
      },
      moduleNameMapper: {
        ...moduleNameMapperConfig,
        "\\.(css|less|scss|sass)$": "identity-obj-proxy",
        "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
          "jest-transform-stub",
      },
      setupFilesAfterEnv: ["<rootDir>/__tests__/setup.js"],
      transformIgnorePatterns: [
        "node_modules/(?!(react-markdown|remark-gfm|rehype-sanitize|rehype-highlight|devlop|hast-util-.*|mdast-util-.*|micromark.*|unist-.*|vfile.*|comma-separated-tokens|space-separated-tokens|property-information|web-namespaces|estree-util-.*|unified|bail|trough|.*\\.mjs$))",
      ],
    },
    // Configuration for API route tests and server-side logic
    {
      displayName: "node",
      testEnvironment: "node",
      testMatch: [
        "<rootDir>/__tests__/api/**/*.test.ts",
        "<rootDir>/__tests__/lib/**/*.test.ts",
      ],
      moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
      transform: {
        "^.+\\.(ts|tsx)$": [
          "ts-jest",
          {
            tsconfig: "tsconfig.json",
            useESM: false,
          },
        ],
      },
      moduleNameMapper: {
        ...moduleNameMapperConfig,
      },
      setupFilesAfterEnv: ["<rootDir>/__tests__/setup-node.js"],
      transformIgnorePatterns: ["node_modules/(?!(.*\\.mjs$))"],
    },
  ],
  collectCoverageFrom: [
    "app/**/*.ts",
    "app/**/*.tsx",
    "lib/**/*.ts",
    "lib/**/*.tsx",
    "!app/**/*.d.ts",
    "!lib/**/*.d.ts",
  ],
  coverageDirectory: "coverage",
};
