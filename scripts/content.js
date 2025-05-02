// CSS selectors for ad-containing elements (carefully selected)
// Note: This list targets common and obvious ad patterns with minimal risk of breaking site functionality
const adSelectors = [
  '.adsbygoogle', // Google Adsense
  'div[id^="google_ads_"]', // Google Ads
  'div[id*="gpt-ad"]', // Google Publisher Tags
  'div[data-google-query-id]', // Google Search ads
  'div[data-ad-unit-path]', // Google Ads
  'div[data-ad-format]',
  'div[data-ad-client]',
  'div[data-ad-slot]',
  'ins.adsbygoogle', // Google Adsense
  'a[href*="/adclick."]', // Ad click redirects
  'a[href*="googleadservices.com/pagead/aclk"]', // Google Ad redirects
  'a[href*="doubleclick.net/ddm/clk"]', // DoubleClick redirects
  'div[aria-label*="Ad"]', // Accessibility label "Ad"
  'div[aria-label*="Sponsored"]', // Accessibility label "Sponsored"
  '.ad-banner',
  '.advertisement',
  '.banner-ad',
  '.google-ad',
  '.sponsored-link',
  'div[class*=" ad-"]', // Classes containing " ad-" (more specific)
  'div[id*="-ad-"]', // IDs containing "-ad-"
  'iframe[src*="googleads.g.doubleclick.net"]', // Ad iframes
  'iframe[src*="googlesyndication.com"]', // Ad iframes
  'iframe[src*="adnxs.com"]', // Ad iframes
  'iframe[name^="google_ads_"]', // Ad iframe names
  '#tads > .ads-ad', // Legacy Google search ads
  '#bottomads > .ads-ad' // Legacy Google search ads
];

// CSS selectors for analytics tools and trackers
// Note: Using neutralizeAnalyticsFunctions is generally safer than hiding scripts.
// Hiding pixels is usually safe for site functionality.
const analyticsSelectors = [
  // Primarily for tracking pixels (images, iframes)
  'img[src*="google-analytics.com/collect"]',
  'img[src*="facebook.com/tr"]',
  'img[src*="pixel"]', // Generic pixel images (be cautious)
  'img[width="1"][height="1"]', // 1x1 pixel images (typically trackers)
  'iframe[src*="googletagmanager.com/ns.html"]', // GTM iframe
  'iframe[src*="matomo.php"]', // Matomo iframe
  'iframe[height="1"][width="1"]' // 1x1 pixel iframes
];

// Function to neutralize analytics scripts (safer than removing them)
function neutralizeAnalyticsFunctions() {
    try {
        // Neutralize common analytics global variables
        Object.defineProperties(window, {
            'ga': { value: () => {}, writable: false },
            'gtag': { value: () => {}, writable: false },
            '_gaq': { value: { push: () => {} }, writable: false },
            'fbq': { value: () => {}, writable: false },
            '_fbq': { value: () => {}, writable: false },
            'analytics': { value: { track: () => {}, page: () => {} }, writable: false },
            'hj': { value: () => {}, writable: false },
            '_hsq': { value: { push: () => {} }, writable: false },
            'dataLayer': { value: { push: () => {} }, writable: false },
            'amplitude': { value: { getInstance: () => ({ logEvent: () => {} }) }, writable: false },
            'mixpanel': { value: { track: () => {}, identify: () => {} }, writable: false },
            'Piwik': { value: { getTracker: () => ({ trackPageView: () => {}, trackEvent: () => {} }) }, writable: false },
            'Matomo': { value: { getTracker: () => ({ trackPageView: () => {}, trackEvent: () => {} }) }, writable: false },
        });
        // console.log('[AdBlocker Simplified] Analytics functions neutralized.');
    } catch (error) {
        // console.warn('[AdBlocker Simplified] Error neutralizing analytics functions:', error);
    }
}

let adBlockingEnabled = true;
let analyticsBlockingEnabled = true;
let isWhitelisted = false;

// Block ads (Simplified approach)
function blockAds() {
  // Only run if site is not whitelisted
  if (isWhitelisted || !adBlockingEnabled) return 0;

  let count = 0;
  try {
    const elements = document.querySelectorAll(adSelectors.join(', '));
    elements.forEach(element => {
      // Simply hide the element
      if (element.style.display !== 'none') {
        element.style.setProperty('display', 'none', 'important');
        element.style.setProperty('visibility', 'hidden', 'important'); // Extra safety
        // Setting dimensions to zero can sometimes break layouts, display:none is often sufficient
        // element.style.setProperty('width', '0', 'important');
        // element.style.setProperty('height', '0', 'important');
        element.style.setProperty('pointer-events', 'none', 'important');
        count++;
      }
    });

    if (count > 0) {
      // console.log(`[AdBlocker Simplified] Hid ${count} ad elements.`);
      chrome.runtime.sendMessage({ action: 'countBlockedAds', count: count })
            .catch(() => { /* Fail silently */ });
    }
  } catch (error) {
    // console.warn('[AdBlocker Simplified] Error hiding ad elements:', error);
  }
  return count;
}

// Block analytics (Simplified approach)
function blockAnalytics() {
  // Only run if site is not whitelisted and analytics blocking is enabled
  if (isWhitelisted || !analyticsBlockingEnabled) return 0;

  let count = 0;
  try {
    // 1. Neutralize analytics functions (safest method)
    neutralizeAnalyticsFunctions();
    count++; // Count neutralization as one operation

    // 2. Only hide tracking pixels (img, iframe)
    const elements = document.querySelectorAll(analyticsSelectors.join(', '));
    elements.forEach(element => {
       // Only hide elements likely to be tracking pixels
       if (element.tagName === 'IMG' || element.tagName === 'IFRAME' || element.tagName === 'PICTURE') {
           if (element.style.display !== 'none') {
               element.style.setProperty('display', 'none', 'important');
               element.style.setProperty('visibility', 'hidden', 'important');
               element.style.setProperty('width', '0', 'important'); // Usually safe for pixels
               element.style.setProperty('height', '0', 'important');
               element.style.setProperty('position', 'absolute', 'important');
               element.style.setProperty('pointer-events', 'none', 'important');
               count++;
           }
       }
       // Note: It's better to neutralize analytics scripts than hide them in the DOM
    });

    if (count > 0) {
      // console.log(`[AdBlocker Simplified] Blocked/neutralized ${count} analytics elements/scripts.`);
      chrome.runtime.sendMessage({ action: 'countBlockedAnalytics', count: count })
            .catch(() => { /* Fail silently */ });
    }
  } catch (error) {
    // console.warn('[AdBlocker Simplified] Error blocking analytics:', error);
  }
  return count;
}

// Performance-friendly DOM observer (Simplified)
function observeDOMChanges() {
  try {
    let adCheckTimeout = null;
    let analyticsCheckTimeout = null;
    const CHECK_DELAY = 350; // Slightly longer delay for better performance

    const observer = new MutationObserver((mutations) => {
      // Simple check: If nodes were added, schedule a delayed scan
      // This could be further optimized, but simplicity is prioritized
      let nodeAdded = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
           nodeAdded = true;
           break;
        }
      }

      if (nodeAdded) {
          if (adBlockingEnabled && !isWhitelisted) {
             clearTimeout(adCheckTimeout);
             adCheckTimeout = setTimeout(blockAds, CHECK_DELAY);
          }
          if (analyticsBlockingEnabled && !isWhitelisted) {
             clearTimeout(analyticsCheckTimeout);
             // Analytics function neutralization is usually sufficient on initial load,
             // but can be called again for dynamically loaded content. Also applies to pixels.
             analyticsCheckTimeout = setTimeout(blockAnalytics, CHECK_DELAY);
          }
      }
    });

    // Start the observer
    const observeTarget = document.documentElement || document.body;
    if (observeTarget) {
        observer.observe(observeTarget, {
            childList: true,
            subtree: true
        });
    }

    // Run initial scan after DOM is loaded
    const runInitialScan = () => {
        if (adBlockingEnabled) blockAds();
        if (analyticsBlockingEnabled) blockAnalytics();
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runInitialScan);
    } else {
      runInitialScan();
    }

  } catch (error) {
    // console.error('[AdBlocker Simplified] Error setting up MutationObserver:', error);
  }
}

// Check initial state and start observer
function initializeBlocking() {
    chrome.runtime.sendMessage({ action: 'getInitialState' })
        .then(response => {
            if (response) {
                adBlockingEnabled = response.adBlockingEnabled;
                analyticsBlockingEnabled = response.analyticsBlockingEnabled;
                isWhitelisted = response.isWhitelisted;
                // console.log(`[AdBlocker Simplified] Initial State: Ads=${adBlockingEnabled}, Analytics=${analyticsBlockingEnabled}, Whitelisted=${isWhitelisted}`);
                observeDOMChanges(); // Only start observer after getting initial state
            } else {
                // console.warn('[AdBlocker Simplified] Did not receive initial state. Using defaults.');
                observeDOMChanges(); // Start observer with defaults
            }
        })
        .catch(error => {
            // console.error('[AdBlocker Simplified] Error getting initial state:', error);
            observeDOMChanges(); // Try to start observer even in error case
        });
}

initializeBlocking();

// Listen for messages (whitelist changes or on/off toggles)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateState') {
        let stateChanged = false;
        let runScan = false; // Run scan not only when state changes but also when blocking is enabled

        if (request.adBlockingEnabled !== undefined && adBlockingEnabled !== request.adBlockingEnabled) {
            adBlockingEnabled = request.adBlockingEnabled;
            stateChanged = true;
            if(adBlockingEnabled) runScan = true; // Run scan if blocking was enabled
        }
        if (request.analyticsBlockingEnabled !== undefined && analyticsBlockingEnabled !== request.analyticsBlockingEnabled) {
            analyticsBlockingEnabled = request.analyticsBlockingEnabled;
            stateChanged = true;
            if(analyticsBlockingEnabled) runScan = true; // Run scan if blocking was enabled
        }
        if (request.isWhitelisted !== undefined && isWhitelisted !== request.isWhitelisted) {
            isWhitelisted = request.isWhitelisted;
            stateChanged = true;
            if(!isWhitelisted) runScan = true; // Run scan if site was removed from whitelist
        }

        if (stateChanged) {
            // console.log(`[AdBlocker Simplified] State Updated: Ads=${adBlockingEnabled}, Analytics=${analyticsBlockingEnabled}, Whitelisted=${isWhitelisted}`);
            // If not whitelisted and relevant blocking is enabled and scan is needed
            if (runScan && !isWhitelisted) {
                if(adBlockingEnabled) setTimeout(blockAds, 50); // Trigger scan with short delay
                if(analyticsBlockingEnabled) setTimeout(blockAnalytics, 50);
            }
            // If site was whitelisted or blocking was disabled, hidden elements should be shown again.
            // This requires more complex logic (e.g., tracking hidden elements).
            // For now, this part is not implemented, page refresh is required.
        }
        sendResponse({ success: true });
        return true; // Indicate async response
    }
    // May handle other message types or return false
    return false;
});