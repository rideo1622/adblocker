// CSS selectors for ad-containing elements
const adSelectors = [
  '.ad', 
  '.ads', 
  '.adsbygoogle',
  '.advertisement',
  '.advertising',
  '.advert',
  '.banner-ads',
  '.sponsor',
  '[id*="google_ads"]',
  '[id*="ad-"]',
  '[id*="ad_"]',
  '[id*="adv-"]',
  '[id*="adv_"]',
  '[class*="ad-"]',
  '[class*="ad_"]',
  '[class*="adv-"]',
  '[class*="adv_"]',
  '[data-ad]',
  'ins.adsbygoogle',
  'iframe[src*="googleads"]',
  'iframe[src*="doubleclick"]',
  'iframe[src*="ad."]',
  'iframe[src*="ads."]',
  'iframe[id*="google_ads"]',
  'div[id*="div-gpt-ad"]',
  'div[data-google-query-id]'
];

// CSS selectors for analytics tools and trackers
const analyticsSelectors = [
  'script[src*="google-analytics"]',
  'script[src*="googletagmanager"]',
  'script[src*="gtm.js"]',
  'script[src*="analytics"]',
  'script[src*="pixel"]',
  'script[src*="facebook"]',
  'script[src*="fb"]',
  'script[src*="hotjar"]',
  'script[src*="matomo"]',
  'script[src*="piwik"]',
  'script[src*="stats"]',
  'script[src*="track"]',
  'img[src*="facebook.com/tr"]',
  'img[src*="pixel"]'
];

let adBlockingEnabled = true;
let analyticsBlockingEnabled = true;

// Main ad blocking function
function blockAds() {
  try {
    const elements = document.querySelectorAll(adSelectors.join(', '));
    let count = 0;
    
    elements.forEach(element => {
      element.style.display = 'none';
      element.remove(); // Completely remove elements instead of just hiding them
      count++;
    });
    
    if (count > 0) {
      // Update the count of blocked ads in the background script
      chrome.runtime.sendMessage({
        action: 'countBlockedAds',
        count: count
      }, () => {
        if (chrome.runtime.lastError) {
          console.warn('Error counting blocked ads:', chrome.runtime.lastError.message);
        }
      });
    }
  } catch (error) {
    console.error('Error in blockAds:', error);
  }
}

// Analytics blocking function
function blockAnalytics() {
  try {
    const elements = document.querySelectorAll(analyticsSelectors.join(', '));
    let count = 0;
    
    elements.forEach(element => {
      // Empty analytics script content
      if (element.tagName === 'SCRIPT') {
        element.innerHTML = '';
        element.src = 'javascript:void(0)';
      } else {
        element.remove();
      }
      count++;
    });
    
    if (count > 0) {
      // Update the count of blocked analytics in the background script
      chrome.runtime.sendMessage({
        action: 'countBlockedAnalytics',
        count: count
      }, () => {
        if (chrome.runtime.lastError) {
          console.warn('Error counting blocked analytics:', chrome.runtime.lastError.message);
        }
      });
    }
    
    // Disable analytics functions in the page
    overrideAnalytics();
  } catch (error) {
    console.error('Error in blockAnalytics:', error);
  }
}

// Override analytics functions to prevent tracking
function overrideAnalytics() {
  if (analyticsBlockingEnabled) {
    // Google Analytics
    window.ga = function() {};
    window.gtag = function() {};
    window.__gaTracker = function() {};
    window.GoogleAnalyticsObject = undefined;
    
    // Facebook Pixel
    window.fbq = function() {};
    window._fbq = function() {};
    
    // Hotjar
    window.hj = function() {};
    window._hjSettings = undefined;
    
    // Matomo/Piwik
    window._paq = { push: function() {} };
    
    // General tracking prevention
    window.__insp = undefined;
    window.amplitude = undefined;
  }
}

// Observer to monitor DOM changes
function observeDOMChanges() {
  const observer = new MutationObserver((mutations) => {
    if (adBlockingEnabled) {
      blockAds();
    }
    if (analyticsBlockingEnabled) {
      blockAnalytics();
    }
  });
  
  observer.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true
  });
}

// Check if the current site is whitelisted
function checkIfWhitelisted() {
  try {
    const domain = window.location.hostname;
    
    chrome.runtime.sendMessage({ action: 'isWhitelisted', domain }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('Error checking whitelist:', chrome.runtime.lastError.message);
        return;
      }
      
      if (!response || !response.isWhitelisted) {
        // Apply ad blocking when the page loads if not whitelisted
        if (adBlockingEnabled) {
          blockAds();
        }
        if (analyticsBlockingEnabled) {
          blockAnalytics();
        }
        // Monitor DOM changes
        observeDOMChanges();
      }
    });
  } catch (error) {
    console.error('Error in checkIfWhitelisted:', error);
  }
}

// Check if ad blocking is active
chrome.runtime.sendMessage({ action: 'isEnabled' }, (response) => {
  if (chrome.runtime.lastError) {
    console.warn('Error checking if enabled:', chrome.runtime.lastError.message);
    return;
  }
  
  if (response) {
    adBlockingEnabled = response.enabled;
    analyticsBlockingEnabled = response.analyticsEnabled;
    checkIfWhitelisted();
  }
});

// Listen for messages (whitelist changes or on/off toggles)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === 'reloadAdBlocker') {
      adBlockingEnabled = request.enabled;
      if (adBlockingEnabled) {
        checkIfWhitelisted();
      }
      sendResponse({ success: true });
    }
    else if (request.action === 'reloadAnalyticsBlocker') {
      analyticsBlockingEnabled = request.analyticsEnabled;
      if (analyticsBlockingEnabled) {
        blockAnalytics();
      }
      sendResponse({ success: true });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
}); 