require('@testing-library/jest-dom');

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
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new MockHeaders(Object.entries(init.headers || {}));
    this.cookies = new MockCookies();
    this.ok = this.status >= 200 && this.status < 300;
  }

  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }

  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
  }

  // Add static json method like NextResponse
  static json(data, init = {}) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...init.headers,
      },
    });
  }
};

// Mock NextResponse to use our Response class
jest.mock('next/server', () => ({
  NextResponse: global.Response,
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
