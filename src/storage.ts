const isChromeExtension =
  typeof chrome !== "undefined" &&
  !!chrome.storage?.local;

export const storage = {
  async get<T>(key: string, fallback: T): Promise<T> {
    if (isChromeExtension) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
          resolve(result[key] ?? fallback);
        });
      });
    }

    // web fallback
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  },

  async set<T>(key: string, value: T): Promise<void> {
    if (isChromeExtension) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, () => resolve());
      });
    }

    // web fallback
    localStorage.setItem(key, JSON.stringify(value));
  },
};
