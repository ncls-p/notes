require('@testing-library/jest-dom');

// Set essential environment variables for API tests
process.env.JWT_SECRET = 'test-jwt-secret-for-api-tests';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret-for-api-tests';
process.env.NODE_ENV = 'test';

// Polyfill globals needed for Next.js API routes testing
const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Create a proper Headers implementation
class MockHeaders extends Map {
  set(name, value) {
    return super.set(name.toLowerCase(), value);
  }

  get(name) {
    return super.get(name.toLowerCase());
  }

  has(name) {
    return super.has(name.toLowerCase());
  }

  delete(name) {
    return super.delete(name.toLowerCase());
  }
}

// Mock cookies functionality
class MockCookies {
  constructor() {
    this._cookies = new Map();
  }

  set(name, value, options = {}) {
    this._cookies.set(name, { value, ...options });
    return this;
  }

  get(name) {
    return this._cookies.get(name);
  }

  delete(name) {
    this._cookies.delete(name);
    return this;
  }

  has(name) {
    return this._cookies.has(name);
  }

  clear() {
    this._cookies.clear();
    return this;
  }
}

// Mock Request and Response for Next.js API routes
global.Request = class Request {
  constructor(input, init = {}) {
    this.url = typeof input === 'string' ? input : input.url;
    this.method = init.method || 'GET';
    this.headers = new MockHeaders(Object.entries(init.headers || {}));
    this.body = init.body;
    this._json = null;
  }

  async json() {
    if (this._json !== null) return this._json;
    if (typeof this.body === 'string') {
      this._json = JSON.parse(this.body);
    } else {
      this._json = this.body;
    }
    return this._json;
  }
};

global.Response = class Response {
  constructor(body = null, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || '';
    this.headers = new MockHeaders(Object.entries(init.headers || {}));
    this.ok = this.status >= 200 && this.status < 300;
    this.redirected = false;
    this.type = 'basic';
    this.url = '';
    this.cookies = new MockCookies();
  }

  async json() {
    if (typeof this.body === 'string') {
      return JSON.parse(this.body);
    }
    return this.body;
  }

  async text() {
    if (typeof this.body === 'object') {
      return JSON.stringify(this.body);
    }
    return String(this.body);
  }
};

// Mock NextResponse that extends our Response
const MockNextResponse = class NextResponse extends global.Response {
  constructor(body, init) {
    super(body, init);
  }

  static json(data, init = {}) {
    const response = new MockNextResponse(data, init);
    response.headers.set('content-type', 'application/json');
    return response;
  }
};

// Replace NextResponse with our mock for testing
jest.doMock('next/server', () => ({
  NextResponse: MockNextResponse,
  NextRequest: global.Request,
}));

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';

// Mock fetch if not available
if (!global.fetch) {
  global.fetch = jest.fn();
}

// Setup for Node.js test environment
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// Mock PrismaClient globally for all Node.js tests
jest.mock('@prisma/client', () => {
  const mockUser = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockNote = {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockFolder = {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockPermission = {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: mockUser,
      note: mockNote,
      folder: mockFolder,
      permission: mockPermission,
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $transaction: jest.fn(),
    })),
  };
});

// Mock jsonwebtoken globally
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  TokenExpiredError: class TokenExpiredError extends Error {
    name = 'TokenExpiredError';
    constructor(message, expiredAt) {
      super(message);
      this.expiredAt = expiredAt;
    }
  },
  JsonWebTokenError: class JsonWebTokenError extends Error {
    name = 'JsonWebTokenError';
  },
}));

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
  headers: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

// Configure Zod to use its actual implementation for tests
// This ensures that schema.parse() throws real ZodErrors.
const actualZod = jest.requireActual('zod');

jest.mock('zod', () => {
  // We want to use the actual Zod implementation for 'z' and 'ZodError'
  // to ensure that validation logic and instanceof checks work correctly.
  // Other parts of Zod that might be less critical for tests could be mocked
  // if they caused issues, but usually, using actualZod entirely is safest for validation testing.
  return actualZod;
});

// This file is for Jest Node.js environment setup.
// You can add other global Node.js-specific configurations or mocks here if needed.
