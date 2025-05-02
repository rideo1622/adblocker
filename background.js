// Ad blocking statistics and settings
let blockedAds = 0;
let blockedAnalytics = 0;
let whitelistedDomains = new Set();
let adBlockingEnabled = true;
let analyticsBlockingEnabled = true;
let smartBlockingEnabled = true;
let filterLists = {
  easyList: true,
  adGuard: true,
  easyPrivacy: true,
  googleAnalytics: true,
  facebookPixel: true,
  malwareDomains: true,
  socialMedia: true
};

// List of important services to avoid breaking site functionality
const criticalServiceKeywords = [
  'mail',
  'gmail',
  'outlook',
  'webmail',
  'cpanel',
  'dashboard',
  'admin',
  'wp-admin',
  'panel',
  'account',
  'console',
  'login'
];

// List of critical resources that websites might need to function properly
const criticalResources = [
  'analytics-purchase',
  'analytics-login',
  'account-analytics',
  'auth',
  'authentication',
  'login',
  'payment',
  'checkout',
  'user-account'
];

// Load whitelist from storage
chrome.storage.local.get('whitelistedDomains', (result) => {
  if (result && result.whitelistedDomains) {
    whitelistedDomains = new Set(result.whitelistedDomains);
  } else {
    // Default empty set already initialized
    chrome.storage.local.set({ whitelistedDomains: [] });
  }
});

// Load ad blocking settings from storage
chrome.storage.local.get(['adBlockingEnabled', 'analyticsBlockingEnabled', 'smartBlockingEnabled', 'blockedAds', 'blockedAnalytics', 'filterLists'], (result) => {
  if (result) {
    if (result.adBlockingEnabled !== undefined) {
      adBlockingEnabled = result.adBlockingEnabled;
    } else {
      chrome.storage.local.set({ adBlockingEnabled: true });
    }
    
    if (result.analyticsBlockingEnabled !== undefined) {
      analyticsBlockingEnabled = result.analyticsBlockingEnabled;
    } else {
      chrome.storage.local.set({ analyticsBlockingEnabled: true });
    }
    
    if (result.smartBlockingEnabled !== undefined) {
      smartBlockingEnabled = result.smartBlockingEnabled;
    } else {
      chrome.storage.local.set({ smartBlockingEnabled: true });
    }
    
    if (result.blockedAds !== undefined) {
      blockedAds = result.blockedAds;
    } else {
      chrome.storage.local.set({ blockedAds: 0 });
    }
    
    if (result.blockedAnalytics !== undefined) {
      blockedAnalytics = result.blockedAnalytics;
    } else {
      chrome.storage.local.set({ blockedAnalytics: 0 });
    }
    
    if (result.filterLists) {
      filterLists = { ...filterLists, ...result.filterLists };
    } else {
      chrome.storage.local.set({ filterLists });
    }
  } else {
    // Initialize storage with default values if nothing is stored
    chrome.storage.local.set({ 
      adBlockingEnabled, 
      analyticsBlockingEnabled, 
      smartBlockingEnabled,
      blockedAds, 
      blockedAnalytics,
      filterLists 
    });
  }
  
  updateRules();
});

// Check if URL belongs to a critical service
function isCriticalService(url) {
  if (!url) return false;
  
  const urlLower = url.toLowerCase();
  
  // Check for critical keywords
  for (const keyword of criticalServiceKeywords) {
    if (urlLower.includes(keyword.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

// Check if a resource is critical for site functionality
function isCriticalResource(url) {
  if (!url) return false;
  
  const urlLower = url.toLowerCase();
  
  // Check if it contains critical resource keywords
  for (const resource of criticalResources) {
    if (urlLower.includes(resource.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

// Automatically whitelist domains when we detect critical functionality being blocked
function smartBlockingDetection(details) {
  // Only proceed if both ad blocking and analytics blocking are enabled and smart blocking is turned on
  if (!adBlockingEnabled && !analyticsBlockingEnabled || !smartBlockingEnabled) return;
  
  try {
    // Skip if the URL isn't valid or if it's not a blocked request
    if (!details || !details.url || details.type !== 'xmlhttprequest') return;
    
    const url = new URL(details.url);
    const resourceUrl = details.url.toLowerCase();
    const tabUrl = details.initiator || details.documentUrl || '';
    
    if (!tabUrl) return;
    
    const tabDomain = new URL(tabUrl).hostname;
    
    // Skip if the domain is already whitelisted
    if (whitelistedDomains.has(tabDomain)) return;
    
    // Check if this is a critical resource being blocked
    if (isCriticalResource(resourceUrl) || 
        (resourceUrl.includes('analytics') && resourceUrl.includes('purchase')) ||
        (resourceUrl.includes('auth') && resourceUrl.includes('user'))) {
        
      console.log(`Critical resource blocked on ${tabDomain}: ${resourceUrl}`);
      
      // Automatically whitelist the domain
      whitelistedDomains.add(tabDomain);
      chrome.storage.local.set({ 
        whitelistedDomains: Array.from(whitelistedDomains) 
      });
      
      // Notify content scripts
      notifyWhitelistChanged();
      
      // Show notification to user
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/ad-blocker.png',
        title: 'Website Auto-Whitelisted',
        message: `${tabDomain} has been whitelisted to prevent functionality issues.`
      });
    }
  } catch (error) {
    console.error('Error in smart blocking detection:', error);
  }
}

// Manage Declarative Net Request rules
function updateRules() {
  // If both ad blocking and analytics blocking are disabled, disable all rules
  if (!adBlockingEnabled && !analyticsBlockingEnabled) {
    chrome.declarativeNetRequest.updateEnabledRulesets({
      disableRulesetIds: ["ruleset_1"]
    });
    return;
  } 
  
  // Otherwise, enable the ruleset
  chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: ["ruleset_1"]
  });
}

// Update rules when the extension is launched
updateRules();

// Setup web request listeners for smart blocking detection
function setupSmartBlockingListeners() {
  // We need to use webRequest API to detect blocked resources
  chrome.webRequest.onErrorOccurred.addListener(
    (details) => {
      // Check if this was blocked by our extension
      if (details.error === 'net::ERR_BLOCKED_BY_CLIENT') {
        smartBlockingDetection(details);
      }
    },
    { urls: ['<all_urls>'] }
  );
}

// Initialize smart blocking detection
setupSmartBlockingListeners();

// Send message to content scripts when ad blocking status changes
function notifyContentScripts(message) {
  chrome.tabs.query({}, (tabs) => {
    if (chrome.runtime.lastError) {
      console.warn('Error querying tabs:', chrome.runtime.lastError.message);
      return;
    }
    
    tabs.forEach(tab => {
      // Only send to web pages, not to chrome:// or other special pages
      if (tab.url && tab.url.startsWith('http')) {
        chrome.tabs.sendMessage(tab.id, message).catch((error) => {
          // Silently fail if the message can't be sent (content script might not be loaded yet)
          console.debug(`Could not send message to tab ${tab.id}: ${error ? error.message : 'Unknown error'}`);
        });
      }
    });
  });
}

// Notify content scripts about whitelist changes
function notifyWhitelistChanged() {
  notifyContentScripts({
    action: 'whitelistStatusChanged'
  });
}

// Listen for messages from popup and options pages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Get statistics information
  if (request.action === "getStats") {
    sendResponse({ 
      blockedAds,
      blockedAnalytics,
      whitelistedDomains: Array.from(whitelistedDomains)
    });
    return false; // Synchronous response
  } 
  
  // Get initial state for content scripts
  else if (request.action === "getInitialState") {
    const domain = request.domain || (sender && sender.tab && new URL(sender.tab.url).hostname);
    
    // Send current state to content script
    sendResponse({
      adBlockingEnabled: adBlockingEnabled,
      analyticsBlockingEnabled: analyticsBlockingEnabled,
      smartBlockingEnabled: smartBlockingEnabled,
      isWhitelisted: domain ? whitelistedDomains.has(domain) : false
    });
    return false; // Synchronous response
  }
  
  // Toggle ad blocking on/off
  else if (request.action === "toggleAdBlocking") {
    adBlockingEnabled = request.enabled;
    chrome.storage.local.set({ adBlockingEnabled });
    updateRules();
    notifyContentScripts({ 
      action: 'reloadAdBlocker', 
      enabled: adBlockingEnabled 
    });
    sendResponse({ success: true });
    return false; // Synchronous response
  } 
  
  // Toggle analytics blocking on/off
  else if (request.action === "toggleAnalyticsBlocking") {
    analyticsBlockingEnabled = request.enabled;
    chrome.storage.local.set({ analyticsBlockingEnabled });
    updateRules();
    notifyContentScripts({
      action: 'reloadAnalyticsBlocker',
      analyticsEnabled: analyticsBlockingEnabled
    });
    sendResponse({ success: true });
    return false; // Synchronous response
  } 
  
  // Toggle smart blocking on/off
  else if (request.action === "toggleSmartBlocking") {
    smartBlockingEnabled = request.enabled;
    chrome.storage.local.set({ smartBlockingEnabled });
    sendResponse({ success: true });
    return false; // Synchronous response
  }
  
  // Update filter list settings
  else if (request.action === "updateFilterLists") {
    filterLists = { ...filterLists, ...request.filterLists };
    chrome.storage.local.set({ filterLists });
    updateRules();
    sendResponse({ success: true });
    return false; // Synchronous response
  }
  
  // Add a domain to whitelist
  else if (request.action === "addToWhitelist") {
    const domain = request.domain;
    if (domain && typeof domain === 'string') {
      whitelistedDomains.add(domain);
      chrome.storage.local.set({ 
        whitelistedDomains: Array.from(whitelistedDomains) 
      });
      
      // Notify content scripts
      notifyWhitelistChanged();
      
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Invalid domain' });
    }
    return false; // Synchronous response
  } 
  
  // Remove a domain from whitelist
  else if (request.action === "removeFromWhitelist") {
    const domain = request.domain;
    if (domain && typeof domain === 'string') {
      whitelistedDomains.delete(domain);
      chrome.storage.local.set({ 
        whitelistedDomains: Array.from(whitelistedDomains) 
      });
      
      // Notify content scripts
      notifyWhitelistChanged();
      
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Invalid domain' });
    }
    return false; // Synchronous response
  }
  
  // Check if a domain is whitelisted
  else if (request.action === "isWhitelisted") {
    const domain = request.domain;
    if (domain && typeof domain === 'string') {
      const isInWhitelist = whitelistedDomains.has(domain);
      
      sendResponse({ 
        isWhitelisted: isInWhitelist
      });
    } else {
      sendResponse({ 
        isWhitelisted: false,
        error: 'Invalid domain'
      });
    }
    return false; // Synchronous response
  }
  
  // Check if ad blocking is enabled
  else if (request.action === "isEnabled") {
    sendResponse({ 
      enabled: adBlockingEnabled,
      analyticsEnabled: analyticsBlockingEnabled
    });
    return false; // Synchronous response
  }
  
  // Count blocked ads
  else if (request.action === "countBlockedAds") {
    if (request.count && Number.isInteger(request.count)) {
      blockedAds += request.count;
      chrome.storage.local.set({ blockedAds });
    }
    sendResponse({ success: true });
    return false; // Synchronous response
  }
  
  // Count blocked analytics
  else if (request.action === "countBlockedAnalytics") {
    if (request.count && Number.isInteger(request.count)) {
      blockedAnalytics += request.count;
      chrome.storage.local.set({ blockedAnalytics });
    }
    sendResponse({ success: true });
    return false; // Synchronous response
  }
  
  // Default response for unhandled messages
  return false;
}); 