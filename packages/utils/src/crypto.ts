// AES-256-GCM Encryption / Decryption Utilities
// Compatible with both Browser (Web Crypto API) and Node.js 18+ runtime

const DEFAULT_SECRET = 'ministryhub-secure-aes-gcm-key-2026';

function getCryptoSubtle(): SubtleCrypto {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle;
  }
  try {
    const nodeCrypto = require('crypto');
    return (nodeCrypto.webcrypto || nodeCrypto).subtle;
  } catch {
    throw new Error('Web Crypto API is not available in the current environment.');
  }
}

function getRandomValues(array: Uint8Array): Uint8Array {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    return window.crypto.getRandomValues(array);
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
    return globalThis.crypto.getRandomValues(array);
  }
  try {
    const nodeCrypto = require('crypto');
    return nodeCrypto.randomFillSync(array);
  } catch {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }
}

async function getDerivedKey(secret: string = DEFAULT_SECRET): Promise<CryptoKey> {
  const subtle = getCryptoSubtle();
  const encoder = new TextEncoder();
  const secretBuffer = encoder.encode(secret);
  const keyHash = await subtle.digest('SHA-256', secretBuffer);
  return subtle.importKey(
    'raw',
    keyHash,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function bufferToBase64(buffer: Uint8Array): string {
  if (typeof btoa !== 'undefined') {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } else if (typeof Buffer !== 'undefined') {
    return Buffer.from(buffer).toString('base64');
  }
  throw new Error('Base64 encoding not supported.');
}

function base64ToBuffer(base64: string): Uint8Array {
  if (typeof atob !== 'undefined') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } else if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  throw new Error('Base64 decoding not supported.');
}

/**
 * Encrypts an arbitrary object or string using AES-256-GCM.
 * Output is a Base64-encoded string combining the 12-byte IV and ciphertext+auth tag.
 */
export async function encryptPayload(data: any, secret: string = DEFAULT_SECRET): Promise<string> {
  const subtle = getCryptoSubtle();
  const key = await getDerivedKey(secret);
  const iv = getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const plainText = typeof data === 'string' ? data : JSON.stringify(data);
  const encodedData = encoder.encode(plainText);

  const encryptedBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    encodedData as BufferSource
  );

  const encryptedBytes = new Uint8Array(encryptedBuffer);
  const combined = new Uint8Array(iv.length + encryptedBytes.length);
  combined.set(iv, 0);
  combined.set(encryptedBytes, iv.length);

  return bufferToBase64(combined);
}

/**
 * Decrypts a Base64-encoded string produced by encryptPayload using AES-256-GCM.
 * Automatically parses JSON if applicable.
 */
export async function decryptPayload<T = any>(encryptedBase64: string, secret: string = DEFAULT_SECRET): Promise<T> {
  const subtle = getCryptoSubtle();
  const key = await getDerivedKey(secret);
  const combined = base64ToBuffer(encryptedBase64);

  if (combined.length < 13) {
    throw new Error('Invalid encrypted payload length.');
  }

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decryptedBuffer = await subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ciphertext as BufferSource
  );

  const decoder = new TextDecoder();
  const decryptedText = decoder.decode(decryptedBuffer);

  try {
    return JSON.parse(decryptedText) as T;
  } catch {
    return decryptedText as unknown as T;
  }
}
