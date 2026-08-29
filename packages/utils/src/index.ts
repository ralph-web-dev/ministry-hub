import CryptoJS from 'crypto-js';

export const noop = () => {};

export const classNames = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

const DEFAULT_SECRET = 'ministryhub-secure-aes-gcm-key-2026';

/**
 * Encrypts data using AES-256 encryption.
 */
export function encryptPayload(data: any, secret: string = DEFAULT_SECRET): string {
  const plainText = typeof data === 'string' ? data : JSON.stringify(data);
  return CryptoJS.AES.encrypt(plainText, secret).toString();
}

/**
 * Decrypts data using AES-256 encryption.
 */
export function decryptPayload<T = any>(encryptedString: string, secret: string = DEFAULT_SECRET): T {
  const bytes = CryptoJS.AES.decrypt(encryptedString, secret);
  const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
  if (!decryptedText) {
    throw new Error('Failed to decrypt payload');
  }
  try {
    return JSON.parse(decryptedText) as T;
  } catch {
    return decryptedText as unknown as T;
  }
}
