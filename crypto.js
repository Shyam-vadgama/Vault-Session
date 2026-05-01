/**
 * VaultSession - Advanced Cryptography Helper
 * Utilizes Web Crypto API (AES-GCM 256-bit) with PBKDF2 Key Derivation.
 */
const cryptoHelper = {
  /**
   * Encodes Uint8Array to Base64 safely.
   */
  uint8ToBase64(uint8Array) {
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  },

  /**
   * Decodes Base64 to Uint8Array safely.
   */
  base64ToUint8(base64String) {
    const binaryString = atob(base64String);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  },

  /**
   * Derives a cryptographic key from a user password.
   * Uses PBKDF2 with SHA-256 and 100,000 iterations.
   */
  async deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );
    
    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  },

  /**
   * Encrypts plaintext string using AES-GCM.
   */
  async encryptData(dataStr, password) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKey(password, salt);
    
    const enc = new TextEncoder();
    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      enc.encode(dataStr)
    );
    
    const encryptedArray = new Uint8Array(encryptedContent);
    const result = new Uint8Array(salt.length + iv.length + encryptedArray.length);
    result.set(salt, 0);
    result.set(iv, 16);
    result.set(encryptedArray, 28);
    
    return this.uint8ToBase64(result);
  },

  /**
   * Decrypts ciphertext Base64 using AES-GCM and password.
   */
  async decryptData(base64Str, password) {
    const bytes = this.base64ToUint8(base64Str);

    if (bytes.length < 28) {
      throw new Error("Corrupted data: payload too short.");
    }
      
    const salt = bytes.slice(0, 16);
    const iv = bytes.slice(16, 28);
    const data = bytes.slice(28);
    
    const key = await this.deriveKey(password, salt);
    
    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      data
    );
    
    const dec = new TextDecoder();
    return dec.decode(decryptedContent);
  }
};