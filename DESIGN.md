# Session Transfer Browser Extension

## Goal
Develop a browser extension (Chrome & Firefox compatible) to securely export and import session cookies. This enables users to easily transfer logged-in sessions between browsers or PCs using a password-encrypted file.

## Tech Stack
- Vanilla HTML / CSS / JS (Lightweight, no build required)
- Manifest V3 (Chrome) & compatible with Firefox

## Key Features
1. **Scope Selection**: Export all cookies, or export only cookies for specific domains (e.g., `github.com, google.com`).
2. **End-to-End Encryption**: 
   - Uses Web Crypto API (`AES-GCM` encryption).
   - Password is never stored. It is hashed using `PBKDF2` to generate the encryption/decryption key.
   - The exported file is securely encrypted and cannot be read without the password.
3. **Export**: Retrieves cookies, encrypts them, and downloads them as a `.session` file.
4. **Import**: Reads a `.session` file, decrypts it using the user-provided password, and restores the cookies to the browser.

## File Structure
- `manifest.json`: Extension permissions and metadata.
- `popup.html`: The main UI of the extension.
- `popup.js`: UI interactions (handling clicks, reading file inputs).
- `crypto.js`: Contains all cryptography logic (encrypt, decrypt, key derivation).
- `cookies.js`: Logic to fetch, filter, and restore cookies.
- `styles.css`: Modern, clean styling for the popup.
- `icons/`: Extension icons.

## Permissions Required
- `cookies`: To read and set cookies.
- `downloads`: To trigger the download of the exported file.
- `host_permissions` (`<all_urls>`): To access cookies across all domains.

## Security Considerations
- The encryption key is derived freshly from the password input each time an action is performed.
- Cross-Site Scripting (XSS) protections enforce strict Content Security Policy (CSP).
- The exported file contains a random Initialization Vector (IV) and a Salt to ensure unique ciphertext even if the same password and cookies are used.
