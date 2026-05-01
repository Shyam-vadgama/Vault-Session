/**
 * VaultSession - Professional Cookie Management Logic
 * Handles fetching from and restoring to the browser's cookie jar.
 */
const cookiesHelper = {
  /**
   * Retrieves cookies based on domain filters.
   * @param {string[]} domains - Optional list of domains to filter by.
   */
  async getCookies(domains) {
    return new Promise((resolve, reject) => {
      chrome.cookies.getAll({}, (cookies) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        
        if (!domains || domains.length === 0) {
          return resolve(cookies);
        }
        
        const filtered = cookies.filter(cookie => {
          return domains.some(domain => cookie.domain.includes(domain));
        });
        resolve(filtered);
      });
    });
  },

  /**
   * Restores a list of cookies into the browser.
   * Handles SameSite, Secure flags, and domain formatting for Chromium/Firefox.
   * @param {Array} cookies - Array of cookie objects.
   */
  async restoreCookies(cookies) {
    let successCount = 0;
    const now = Math.floor(Date.now() / 1000);

    for (const cookie of cookies) {
      // 1. Validation: Skip expired cookies
      if (cookie.expirationDate && cookie.expirationDate < now) {
        continue;
      }

      // 2. URL Construction: Required for chrome.cookies.set
      const protocol = cookie.secure ? "https://" : "http://";
      let domainForUrl = cookie.domain;
      if (domainForUrl.startsWith('.')) {
        domainForUrl = domainForUrl.substring(1);
      }
      const url = `${protocol}${domainForUrl}${cookie.path}`;
      
      // 3. Object Construction
      const newCookie = {
        url: url,
        name: cookie.name,
        value: cookie.value,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite
      };

      if (cookie.domain) newCookie.domain = cookie.domain;
      if (cookie.expirationDate) newCookie.expirationDate = cookie.expirationDate;
      
      // 4. Modern Browser Enforcement: SameSite=None requires Secure
      if (newCookie.sameSite === "no_restriction") {
        newCookie.secure = true;
      }
      
      try {
        await new Promise((resolve) => {
          chrome.cookies.set(newCookie, (result) => {
            if (!chrome.runtime.lastError && result) {
              successCount++;
            }
            resolve();
          });
        });
      } catch (e) {
        console.error("Cookie restoration error:", e);
      }
    }
    return successCount;
  }
};