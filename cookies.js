/**
 * VaultSession - Professional Cookie Management Logic
 * Handles fetching from and restoring to the browser's cookie jar.
 */
const cookiesHelper = {
  /**
   * Retrieves cookies based on domain filters.
   * Includes partitioned cookies (CHIPS) if supported by the browser.
   * @param {string[]} domains - Optional list of domains to filter by.
   */
  async getCookies(domains) {
    return new Promise((resolve) => {
      const getOptions = {};
      
      // In modern browsers, we need to explicitly ask for partitioned cookies
      // by passing an empty partitionKey object.
      try {
        chrome.cookies.getAll({ partitionKey: {} }, (cookies) => {
          if (chrome.runtime.lastError) {
            // If the browser doesn't support partitionKey: {}, it will report an error
            chrome.cookies.getAll({}, (fallbackCookies) => resolve(fallbackCookies || []));
          } else {
            resolve(cookies || []);
          }
        });
      } catch (e) {
        // Fallback for very old browsers or non-compliant implementations
        chrome.cookies.getAll({}, (fallbackCookies) => resolve(fallbackCookies || []));
      }
    }).then(cookies => {
      if (!domains || domains.length === 0) {
        return cookies;
      }
      
      const filtered = cookies.filter(cookie => {
        return domains.some(domain => cookie.domain.includes(domain));
      });
      return filtered;
    });
  },

  /**
   * Restores a list of cookies into the browser.
   * Properly handles host-only cookies, __Host- prefixes, and partitioned cookies (CHIPS).
   * @param {Array} cookies - Array of cookie objects.
   */
  async restoreCookies(cookies) {
    let successCount = 0;
    const now = Math.floor(Date.now() / 1000);

    for (const cookie of cookies) {
      try {
        // 1. Validation: Skip expired cookies
        if (cookie.expirationDate && cookie.expirationDate < now) {
          continue;
        }

        // 2. URL Construction: Required for chrome.cookies.set
        // For host-only cookies, the domain must be omitted from the 'set' call,
        // and the URL must match the host exactly.
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
          httpOnly: cookie.httpOnly
        };

        // Handle SameSite: Omit if unspecified to let browser decide
        if (cookie.sameSite && cookie.sameSite !== "unspecified") {
          newCookie.sameSite = cookie.sameSite;
        }

        // Handle Domain: CRITICAL FIX
        // If domain starts with a dot, it's a domain cookie.
        // If it doesn't, it's a host-only cookie and the 'domain' property MUST be omitted.
        // Also, __Host- prefixed cookies MUST NOT have a domain property.
        const isHostPrefix = cookie.name.startsWith("__Host-");
        if (!cookie.hostOnly && !isHostPrefix && cookie.domain) {
          newCookie.domain = cookie.domain;
        }

        // Handle Expiration
        if (cookie.expirationDate) {
          newCookie.expirationDate = cookie.expirationDate;
        }
        
        // Handle Partition Key (CHIPS support for modern browsers)
        if (cookie.partitionKey) {
          newCookie.partitionKey = cookie.partitionKey;
        }

        // 4. Modern Browser Enforcement: SameSite=None requires Secure
        if (newCookie.sameSite === "no_restriction") {
          newCookie.secure = true;
        }
        
        await new Promise((resolve) => {
          chrome.cookies.set(newCookie, (result) => {
            if (chrome.runtime.lastError) {
              console.warn(`Failed to set cookie [${cookie.name}] for [${url}]:`, chrome.runtime.lastError.message);
            } else if (result) {
              successCount++;
            }
            resolve();
          });
        });
      } catch (e) {
        console.error("Cookie restoration error for cookie:", cookie.name, e);
      }
    }
    return successCount;
  }
};