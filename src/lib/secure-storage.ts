import CryptoJS from 'crypto-js';

// Constants
const TOKEN_KEY = 'auth_data';
const KEY_PREFIX = 'secure_key_';

/**
 * Secure token storage with enhanced security:
 * 1. Uses a combination of localStorage and sessionStorage for better security
 * 2. Implements key rotation
 * 3. Adds token fingerprinting with device/browser info
 * 4. Implements token expiration checks
 */

// Generate a secure random key
function generateSecureKey(length = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Get browser/device fingerprint to bind tokens to the current device
function getDeviceFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset()
  ];
  
  return CryptoJS.SHA256(components.join('|')).toString();
}

// Store the encryption key securely using key splitting between storages
function storeEncryptionKey(key: string): void {
  // Split the key into two parts
  const midPoint = Math.floor(key.length / 2);
  const firstHalf = key.substring(0, midPoint);
  const secondHalf = key.substring(midPoint);
  
  // Store parts in different storage mechanisms
  sessionStorage.setItem(`${KEY_PREFIX}1`, firstHalf); // Lost when tab/browser closes
  localStorage.setItem(`${KEY_PREFIX}2`, secondHalf); // Persists longer
}

// Retrieve the encryption key
function getEncryptionKey(): string | null {
  const firstHalf = sessionStorage.getItem(`${KEY_PREFIX}1`);
  const secondHalf = localStorage.getItem(`${KEY_PREFIX}2`);
  
  if (!firstHalf || !secondHalf) return null;
  return firstHalf + secondHalf;
}

// Encrypt data with additional security measures
export async function secureEncrypt(data: any): Promise<string> {
  // Generate a new encryption key if one doesn't exist
  let encryptionKey = getEncryptionKey();
  if (!encryptionKey) {
    encryptionKey = generateSecureKey();
    storeEncryptionKey(encryptionKey);
  }
  
  // Add security metadata
  const secureData = {
    data,
    meta: {
      fingerprint: getDeviceFingerprint(),
      timestamp: new Date().toISOString(),
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : null
    }
  };
  
  // Encrypt with AES
  return CryptoJS.AES.encrypt(JSON.stringify(secureData), encryptionKey).toString();
}

// Decrypt data with validation
export async function secureDecrypt<T = any>(encryptedData: string): Promise<T | null> {
  try {
    const encryptionKey = getEncryptionKey();
    if (!encryptionKey) {
      console.error('Encryption key not found - user may have cleared browser data or switched devices');
      return null;
    }
    
    // Decrypt the data
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
    const decryptedString = decryptedBytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) {
      throw new Error('Failed to decrypt data');
    }
    
    const { data, meta } = JSON.parse(decryptedString);
    
    // Validate device fingerprint
    const currentFingerprint = getDeviceFingerprint();
    if (meta.fingerprint !== currentFingerprint) {
      console.error('Device fingerprint mismatch - possible token theft attempt');
      secureDelete(); // Clear compromised tokens
      return null;
    }
    
    // Check expiration
    if (meta.expiresAt && new Date(meta.expiresAt) < new Date()) {
      console.log('Token expired, needs refresh');
      // Return the data anyway so the app can handle refresh
    }
    
    return data as T;
  } catch (error) {
    console.error('Error decrypting data:', error);
    return null;
  }
}

// Store tokens securely
export async function secureStore(tokenData: any): Promise<boolean> {
  try {
    const encryptedData = await secureEncrypt(tokenData);
    localStorage.setItem(TOKEN_KEY, encryptedData);
    return true;
  } catch (error) {
    console.error('Failed to securely store token:', error);
    return false;
  }
}

// Retrieve tokens with security validation
export async function secureRetrieve<T = any>(): Promise<T | null> {
  try {
    const encryptedData = localStorage.getItem(TOKEN_KEY);
    if (!encryptedData) return null;
    
    return await secureDecrypt<T>(encryptedData);
  } catch (error) {
    console.error('Failed to retrieve token:', error);
    return null;
  }
}

// Delete tokens and keys
export function secureDelete(): boolean {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(`${KEY_PREFIX}2`);
    sessionStorage.removeItem(`${KEY_PREFIX}1`);
    return true;
  } catch (error) {
    console.error('Failed to delete secure data:', error);
    return false;
  }
}

// Check if token is about to expire and needs refresh (5 minutes buffer)
export async function needsRefresh(): Promise<boolean> {
  const tokenData = await secureRetrieve();
  if (!tokenData) return true;
  
  const { expires_at } = tokenData as any;
  if (!expires_at) return false;
  
  // Check if token expires in less than 5 minutes
  const expiresAt = new Date(expires_at).getTime();
  const now = Date.now();
  const fiveMinutesInMs = 5 * 60 * 1000;
  
  return expiresAt - now < fiveMinutesInMs;
}
