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

// This file is for Jest Node.js environment setup.
// You can add other global Node.js-specific configurations or mocks here if needed.
