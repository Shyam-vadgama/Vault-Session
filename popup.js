/**
 * VaultSession - Main UI Controller
 * Manages view states, tab switching, and event orchestration.
 */
document.addEventListener("DOMContentLoaded", () => {
  // UI Element Selectors
  const viewLauncher = document.getElementById("view-launcher");
  const viewApp = document.getElementById("view-app");
  const btnLaunchFull = document.getElementById("btn-launch-full");
  
  const pwdInput = document.getElementById("password");
  const scopeRadios = document.getElementsByName("scope");
  const domainList = document.getElementById("domain-list");
  const btnExport = document.getElementById("btn-export");
  const btnImportTrigger = document.getElementById("btn-import-trigger");
  const btnVerify = document.getElementById("btn-verify");
  const fileImport = document.getElementById("file-import");
  const statusDiv = document.getElementById("status");
  const debugInput = document.getElementById("debug-input");
  const debugOutput = document.getElementById("debug-output");
  const debugContent = document.getElementById("debug-content");

  /**
   * INITIALIZATION: View Management
   * Detects if we are in a tiny popup or a full dashboard tab.
   */
  const isPopup = window.innerWidth <= 400;

  if (isPopup) {
    viewLauncher.classList.remove("hidden");
    viewApp.classList.add("hidden");
  } else {
    viewLauncher.classList.add("hidden");
    viewApp.classList.remove("hidden");
  }

  /**
   * LAUNCHER LOGIC
   * Transitions from popup to full dashboard tab.
   */
  btnLaunchFull.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
    window.close();
  });

  /**
   * TAB NAVIGATION
   */
  const tabs = document.querySelectorAll('.tab-btn');
  const sections = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      sections.forEach(s => s.classList.add('hidden'));
      tab.classList.add('active');
      const targetId = `section-${tab.id.split('-')[1]}`;
      document.getElementById(targetId).classList.remove('hidden');
    });
  });

  /**
   * STATUS FEEDBACK UTILITY
   */
  function showStatus(msg, isError = false) {
    statusDiv.textContent = msg;
    statusDiv.className = `status-msg ${isError ? "error" : "success"}`;
    setTimeout(() => { 
        if (statusDiv.textContent === msg) {
            statusDiv.textContent = ""; 
            statusDiv.className = "status-msg";
        }
    }, isError ? 10000 : 5000);
  }

  // Handle Domain List Visibility
  scopeRadios.forEach(radio => {
    radio.addEventListener("change", (e) => {
      domainList.classList.toggle("hidden", e.target.value !== "specific");
    });
  });

  /**
   * EXPORT LOGIC
   * Fetches cookies, encrypts them, and triggers a text-based download.
   */
  btnExport.addEventListener("click", async () => {
    const password = pwdInput.value;
    if (!password) return showStatus("Please set an encryption password first.", true);

    const scope = document.querySelector('input[name="scope"]:checked').value;
    let domains = [];
    if (scope === "specific") {
      domains = domainList.value.split(",").map(d => d.trim()).filter(d => d.length > 0);
      if (domains.length === 0) return showStatus("Enter at least one domain.", true);
    }

    try {
      showStatus("Scanning sessions...");
      const cookies = await cookiesHelper.getCookies(domains);
      if (cookies.length === 0) return showStatus("No active sessions found for this scope.", true);

      showStatus("Encrypting data locally...");
      const encryptedBase64 = await cryptoHelper.encryptData(JSON.stringify(cookies), password);
      
      showStatus("Generating .session file...");
      const blob = new Blob([encryptedBase64], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      
      const filename = `vault_${new Date().toISOString().slice(0,10)}.session`;
      
      // Use chrome.downloads with fallback
      if (typeof chrome !== "undefined" && chrome.downloads) {
        chrome.downloads.download({ url, filename, saveAs: true });
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
      }
      showStatus(`Exported ${cookies.length} sessions securely!`);
    } catch (e) {
      showStatus(`Export failed: ${e.message}`, true);
    }
  });

  /**
   * IMPORT LOGIC
   */
  btnImportTrigger.addEventListener("click", () => {
    if (!pwdInput.value) return showStatus("Enter your password above first.", true);
    fileImport.click();
  });

  fileImport.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const encryptedData = event.target.result.trim().replace(/\s/g, '');
      try {
        showStatus("Decrypting vault...");
        const decrypted = await cryptoHelper.decryptData(encryptedData, pwdInput.value);
        
        const cookies = JSON.parse(decrypted);
        showStatus(`Restoring ${cookies.length} sessions...`);
        const count = await cookiesHelper.restoreCookies(cookies);
        showStatus(`Success! Restored ${count} out of ${cookies.length} sessions.`);
      } catch (err) {
        showStatus("Import failed: Incorrect password or corrupted file.", true);
      } finally {
        fileImport.value = "";
      }
    };
    reader.readAsText(file);
  });

  /**
   * VERIFICATION LOGIC (Debug Tool)
   */
  btnVerify.addEventListener("click", async () => {
    const password = pwdInput.value;
    const rawData = debugInput.value.trim().replace(/\s/g, '');
    
    if (!password || !rawData) return showStatus("Enter password and paste data first.", true);

    try {
      showStatus("Verifying integrity...");
      const decrypted = await cryptoHelper.decryptData(rawData, password);
      const cookies = JSON.parse(decrypted);
      
      debugOutput.classList.remove("hidden");
      debugContent.textContent = JSON.stringify(cookies.slice(0, 2), null, 2) + `\n... (+ ${cookies.length - 2} more)`;
      showStatus("Decryption Success! Data is valid.");
    } catch (e) {
      showStatus(`Verification Failed: ${e.message}`, true);
      debugOutput.classList.add("hidden");
    }
  });
});