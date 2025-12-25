import { setPlace } from '../orbitStore';
import { getCurrentContext } from '../../engine/types';

function createStorageMock() {
  let store = {};
  return {
    getItem: jest.fn((key) => (key in store ? store[key] : null)),
    setItem: jest.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
}

describe('orbitStore setPlace', () => {
  beforeEach(() => {
    global.localStorage = createStorageMock();
    global.sessionStorage = createStorageMock();
    global.navigator = { userAgent: 'jest' };
    global.crypto = { randomUUID: jest.fn(() => 'test-uuid') };
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  it('stores place for current context', () => {
    setPlace('work');
    const context = getCurrentContext();

    expect(context.place).toBe('work');
  });
});
