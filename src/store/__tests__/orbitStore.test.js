import { setPlace, initialize } from '../orbitStore';
import { getCurrentContext } from '../../engine/types';
import { STORAGE_KEYS } from '../../config/constants';

// Mock the storage module
jest.mock('../../services/storage.js', () => ({
  getAllItems: jest.fn(() => Promise.resolve([])),
  saveAllItems: jest.fn(() => Promise.resolve()),
  addItem: jest.fn(() => Promise.resolve()),
  updateItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  migrateToEncrypted: jest.fn(() => Promise.resolve()),
}));

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

describe('orbitStore place migration', () => {
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

  it('migrates old orbit_place key to orbit_context', async () => {
    // Set up old key
    localStorage.setItem('orbit_place', 'home');
    
    // Initialize store (which runs migration)
    await initialize();
    
    // Check that new key has the migrated value
    expect(localStorage.getItem(STORAGE_KEYS.CONTEXT)).toBe('home');
    // Check that old key was removed
    expect(localStorage.getItem('orbit_place')).toBeNull();
  });

  it('does not overwrite existing orbit_context value', async () => {
    // Set up both keys with different values
    localStorage.setItem('orbit_place', 'home');
    localStorage.setItem(STORAGE_KEYS.CONTEXT, 'work');
    
    // Initialize store (which runs migration)
    await initialize();
    
    // Check that new key was not overwritten
    expect(localStorage.getItem(STORAGE_KEYS.CONTEXT)).toBe('work');
    // Old key should still be present since migration didn't happen
    expect(localStorage.getItem('orbit_place')).toBe('home');
  });

  it('does nothing when old key does not exist', async () => {
    // Initialize store without old key
    await initialize();
    
    // Check that new key was not set
    expect(localStorage.getItem(STORAGE_KEYS.CONTEXT)).toBeNull();
  });
});
