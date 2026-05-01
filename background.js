// background.js - Service Worker compatible download handler
const isFirefox = typeof browser !== "undefined";
const api = isFirefox ? browser : chrome;

api.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "download_session") {
    const { encryptedData, filename } = message;
    
    try {
      let downloadUrl;
      
      // Service Workers do not have URL.createObjectURL
      if (typeof URL.createObjectURL === "function") {
        // Background script/page mode (Firefox)
        const binaryStr = atob(encryptedData);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "text/plain" });
        downloadUrl = URL.createObjectURL(blob);
      } else {
        // Service Worker mode (Chrome/Brave)
        // Use data URI which is supported in Service Workers for downloads
        downloadUrl = "data:text/plain;base64," + encryptedData;
      }
      
      console.log("Background: Starting download...");
      
      api.downloads.download({
        url: downloadUrl,
        filename: filename,
        saveAs: true
      }, (downloadId) => {
        // Clean up if it was a blob URL
        if (downloadUrl.startsWith("blob:") && typeof URL.revokeObjectURL === "function") {
          setTimeout(() => URL.revokeObjectURL(downloadUrl), 30000);
        }

        if (api.runtime.lastError) {
          console.error("Background Download Error:", api.runtime.lastError.message);
          sendResponse({ success: false, error: api.runtime.lastError.message });
        } else {
          sendResponse({ success: true, id: downloadId });
        }
      });
    } catch (err) {
      console.error("Background processing error:", err);
      sendResponse({ success: false, error: "Failed to process download: " + err.message });
    }
    
    return true; 
  }
});