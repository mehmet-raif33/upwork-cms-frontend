// Secure Storage System for Token Management
class SecureStorage {
  private readonly STORAGE_PREFIX = 'secure_';
  private readonly ENCRYPTION_KEY_NAME = 'enc_key';
  private readonly IV_LENGTH = 16;
  private encryptionKey: CryptoKey | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.checkSupport();
  }

  // Check if Web Crypto API is supported
  private checkSupport(): void {
    this.isSupported = typeof window !== 'undefined' && 
                      'crypto' in window && 
                      'subtle' in window.crypto &&
                      typeof localStorage !== 'undefined';
                      
    if (this.isSupported) {
      console.log('🔐 Secure Storage: Web Crypto API supported');
    } else {
      console.warn('⚠️ Secure Storage: Web Crypto API not supported, falling back to basic storage');
    }
  }

  // Generate or retrieve encryption key
  private async getEncryptionKey(): Promise<CryptoKey> {
    if (this.encryptionKey) {
      return this.encryptionKey;
    }

    try {
      // Try to load existing key from IndexedDB
      const existingKey = await this.loadKeyFromIndexedDB();
      if (existingKey) {
        this.encryptionKey = existingKey;
        return existingKey;
      }

      // Generate new key if none exists
      console.log('🔑 Generating new encryption key...');
      const key = await window.crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );

      // Store the key in IndexedDB
      await this.saveKeyToIndexedDB(key);
      
      this.encryptionKey = key;
      return key;
    } catch (error) {
      console.error('❌ Error generating encryption key:', error);
      throw new Error('Failed to initialize secure storage');
    }
  }

  // Save encryption key to IndexedDB
  private async saveKeyToIndexedDB(key: CryptoKey): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SecureStorage', 1);

      request.onerror = () => reject(request.error);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('keys')) {
          db.createObjectStore('keys');
        }
      };

      request.onsuccess = async () => {
        try {
          const db = request.result;
          const exportedKey = await window.crypto.subtle.exportKey('raw', key);
          
          const transaction = db.transaction(['keys'], 'readwrite');
          const store = transaction.objectStore('keys');
          
          store.put(exportedKey, this.ENCRYPTION_KEY_NAME);
          
          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
          
          transaction.onerror = () => reject(transaction.error);
        } catch (error) {
          reject(error);
        }
      };
    });
  }

  // Load encryption key from IndexedDB
  private async loadKeyFromIndexedDB(): Promise<CryptoKey | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SecureStorage', 1);

      request.onerror = () => reject(request.error);
      
      request.onupgradeneeded = () => {
        resolve(null); // DB doesn't exist yet
      };

      request.onsuccess = () => {
        const db = request.result;
        
        if (!db.objectStoreNames.contains('keys')) {
          db.close();
          resolve(null);
          return;
        }

        const transaction = db.transaction(['keys'], 'readonly');
        const store = transaction.objectStore('keys');
        const getRequest = store.get(this.ENCRYPTION_KEY_NAME);

        getRequest.onsuccess = async () => {
          try {
            if (getRequest.result) {
              const key = await window.crypto.subtle.importKey(
                'raw',
                getRequest.result,
                { name: 'AES-GCM' },
                true,
                ['encrypt', 'decrypt']
              );
              db.close();
              resolve(key);
            } else {
              db.close();
              resolve(null);
            }
          } catch (error) {
            db.close();
            reject(error);
          }
        };

        getRequest.onerror = () => {
          db.close();
          reject(getRequest.error);
        };
      };
    });
  }

  // Encrypt data
  private async encrypt(data: string): Promise<{ encrypted: string; iv: string }> {
    if (!this.isSupported) {
      // Fallback: basic base64 encoding (not secure, but better than plain text)
      return {
        encrypted: btoa(data),
        iv: ''
      };
    }

    try {
      const key = await this.getEncryptionKey();
      const iv = window.crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        dataBuffer
      );

      return {
        encrypted: this.arrayBufferToBase64(encrypted),
        iv: this.arrayBufferToBase64(iv.buffer)
      };
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt data
  private async decrypt(encryptedData: string, ivString: string): Promise<string> {
    if (!this.isSupported) {
      // Fallback: basic base64 decoding
      try {
        return atob(encryptedData);
      } catch {
        return encryptedData; // Return as-is if decoding fails
      }
    }

    try {
      const key = await this.getEncryptionKey();
      const iv = this.base64ToArrayBuffer(ivString);
      const encrypted = this.base64ToArrayBuffer(encryptedData);

      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Utility: Convert ArrayBuffer to Base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Utility: Convert Base64 to ArrayBuffer
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Generate storage key with integrity check
  private generateStorageKey(key: string): string {
    const timestamp = Date.now().toString();
    const hash = this.simpleHash(key + timestamp);
    return `${this.STORAGE_PREFIX}${key}_${hash}`;
  }

  // Simple hash function for integrity checking
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Secure set item
  async setItem(key: string, value: string, ttl?: number): Promise<void> {
    try {
      const data = {
        value,
        timestamp: Date.now(),
        ttl: ttl ? Date.now() + ttl : null,
        integrity: this.simpleHash(value)
      };

      const { encrypted, iv } = await this.encrypt(JSON.stringify(data));
      
      const storageData = {
        data: encrypted,
        iv,
        version: '1.0'
      };

      const storageKey = this.generateStorageKey(key);
      localStorage.setItem(storageKey, JSON.stringify(storageData));
      
      console.log(`🔐 Securely stored: ${key}`);
    } catch (error) {
      console.error('❌ Secure storage setItem failed:', error);
      throw error;
    }
  }

  // Secure get item
  async getItem(key: string): Promise<string | null> {
    try {
      // Find the storage key (it has a hash suffix)
      const keys = Object.keys(localStorage);
      const matchingKey = keys.find(k => k.startsWith(`${this.STORAGE_PREFIX}${key}_`));
      
      if (!matchingKey) {
        return null;
      }

      const storageDataString = localStorage.getItem(matchingKey);
      if (!storageDataString) {
        return null;
      }

      const storageData = JSON.parse(storageDataString);
      const decryptedString = await this.decrypt(storageData.data, storageData.iv);
      const data = JSON.parse(decryptedString);

      // Check TTL
      if (data.ttl && Date.now() > data.ttl) {
        console.log(`⏰ Secure storage item expired: ${key}`);
        await this.removeItem(key);
        return null;
      }

      // Check integrity
      if (data.integrity !== this.simpleHash(data.value)) {
        console.warn(`⚠️ Integrity check failed for: ${key}`);
        await this.removeItem(key);
        return null;
      }

      console.log(`🔓 Securely retrieved: ${key}`);
      return data.value;
    } catch (error) {
      console.error('❌ Secure storage getItem failed:', error);
      // Remove corrupted data
      await this.removeItem(key);
      return null;
    }
  }

  // Secure remove item
  async removeItem(key: string): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      const matchingKeys = keys.filter(k => k.startsWith(`${this.STORAGE_PREFIX}${key}_`));
      
      matchingKeys.forEach(k => localStorage.removeItem(k));
      
      if (matchingKeys.length > 0) {
        console.log(`🗑️ Securely removed: ${key}`);
      }
    } catch (error) {
      console.error('❌ Secure storage removeItem failed:', error);
    }
  }

  // Clear all secure storage
  async clear(): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      const secureKeys = keys.filter(k => k.startsWith(this.STORAGE_PREFIX));
      
      secureKeys.forEach(k => localStorage.removeItem(k));
      
      console.log(`🧹 Cleared ${secureKeys.length} secure storage items`);
    } catch (error) {
      console.error('❌ Secure storage clear failed:', error);
    }
  }

  // Get storage info
  getStorageInfo(): {
    isSupported: boolean;
    itemCount: number;
    totalSize: number;
    hasEncryptionKey: boolean;
  } {
    const keys = Object.keys(localStorage);
    const secureKeys = keys.filter(k => k.startsWith(this.STORAGE_PREFIX));
    
    const totalSize = secureKeys.reduce((size, key) => {
      const item = localStorage.getItem(key);
      return size + (item ? item.length : 0);
    }, 0);

    return {
      isSupported: this.isSupported,
      itemCount: secureKeys.length,
      totalSize,
      hasEncryptionKey: !!this.encryptionKey
    };
  }

  // Cleanup expired items
  async cleanup(): Promise<number> {
    let cleanedCount = 0;
    
    try {
      const keys = Object.keys(localStorage);
      const secureKeys = keys.filter(k => k.startsWith(this.STORAGE_PREFIX));
      
      for (const storageKey of secureKeys) {
        try {
          const storageDataString = localStorage.getItem(storageKey);
          if (!storageDataString) continue;

          const storageData = JSON.parse(storageDataString);
          const decryptedString = await this.decrypt(storageData.data, storageData.iv);
          const data = JSON.parse(decryptedString);

          if (data.ttl && Date.now() > data.ttl) {
            localStorage.removeItem(storageKey);
            cleanedCount++;
          }
        } catch {
          // Remove corrupted items
          localStorage.removeItem(storageKey);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} expired/corrupted items`);
      }
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }

    return cleanedCount;
  }
}

// Create singleton instance
export const secureStorage = new SecureStorage();

// Export convenience functions
export const secureSetItem = (key: string, value: string, ttl?: number) => 
  secureStorage.setItem(key, value, ttl);

export const secureGetItem = (key: string) => 
  secureStorage.getItem(key);

export const secureRemoveItem = (key: string) => 
  secureStorage.removeItem(key);

export const secureClear = () => 
  secureStorage.clear();

export const getSecureStorageInfo = () => 
  secureStorage.getStorageInfo();

export const cleanupSecureStorage = () => 
  secureStorage.cleanup();

export default secureStorage; 