# VaultSession 🛡️

**VaultSession** is a professional-grade, open-source browser extension designed to securely export and import browser sessions (cookies). It allows you to move your logged-in states between different browsers, computers, and even mobile devices without sharing passwords or sensitive data with any third-party servers.

## 🌟 Features

-   **Zero-Knowledge Encryption**: All data is encrypted locally using 256-bit AES-GCM. Your password is never stored and is used to derive a unique key via PBKDF2.
-   **Cross-Browser Support**: Works seamlessly on **Chrome**, **Brave**, **Edge**, and **Firefox**.
-   **Mobile Compatibility**: Export sessions from your PC and import them on Android browsers that support extensions (e.g., Kiwi Browser, Lemur Browser).
-   **Open Source & Private**: 100% local processing. Your cookies never leave your device unless they are encrypted in a `.session` file in your hand.
-   **Session Verification**: Built-in verification tool to test encrypted strings and passwords before importing.

---

## 🚀 How to Install

### On Desktop (Chrome, Brave, Edge, Opera)
1.  Download or clone this repository.
2.  Open your browser and navigate to `chrome://extensions/`.
3.  Enable **Developer Mode** (usually a toggle in the top right).
4.  Click **Load unpacked** and select the `VaultSession` folder.

### On Desktop (Firefox)
1.  Open Firefox and go to `about:debugging`.
2.  Click **This Firefox** on the left.
3.  Click **Load Temporary Add-on...** and select the `manifest.json` file from the folder.

### On Mobile (Android)
1.  Install a browser that supports Manifest V3 extensions, such as **Kiwi Browser** or **Lemur Browser**.
2.  Follow the "Chrome" installation steps within the mobile browser's extension settings.

---

## 📖 Tutorial: How to Use Proper

### 1. Launching the Dashboard
For security and stability, VaultSession operates in a **Full Dashboard** mode. 
-   Click the VaultSession icon in your toolbar.
-   Click **Open Dashboard**. This opens a stable tab that won't close while you are managing files.

### 2. Exporting Sessions (PC A)
1.  Enter a **Strong Password**. You will need this same password to import.
2.  Select your scope: **All Cookies** or **Specific Domains**.
3.  Click **Secure Export**. A `.session` file will be downloaded. This file is encrypted and safe to move.

### 3. Importing Sessions (PC B or Mobile)
1.  Transfer the `.session` file to the new device (via USB, Cloud, or Email—it's encrypted, so it's safe).
2.  Open the VaultSession Dashboard on the new device.
3.  Enter the **same password** used during export.
4.  Go to the **Import** tab and select your `.session` file.
5.  Refresh your target websites (e.g., GitHub, Gmail). You will now be logged in!

### 4. Verifying Data
If you aren't sure if a password is correct, use the **Verify** tab. Paste the content of the `.session` file into the box to see if the password successfully decrypts the data without actually importing anything into your browser.

---

## 🔒 Security Architecture

VaultSession uses the industry-standard **Web Crypto API**:
-   **Algorithm**: AES-256-GCM (Authenticated Encryption).
-   **Key Derivation**: PBKDF2 with SHA-256, 100,000 iterations, and a unique 16-byte random salt.
-   **Integrity**: AES-GCM provides built-in authentication tags to ensure the file hasn't been tampered with.

---

## 📄 License

This project is open-source and licensed under the **MIT License**. Your data is yours. We believe in a private, open web.

---

*Developed with ❤️ for the privacy community.*