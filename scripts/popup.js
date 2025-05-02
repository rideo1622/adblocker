// Get current tab's domain
async function getCurrentDomain() {
  try {
    // Handle potential errors from chrome.tabs API
    const tabs = await new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        // Check for runtime error
        if (chrome.runtime.lastError) {
          console.warn('Tab query error:', chrome.runtime.lastError.message);
          resolve([]);
        } else {
          resolve(tabs);
        }
      });
    });
    
    // No tabs found
    if (!tabs || tabs.length === 0) {
      return null;
    }
    
    const tab = tabs[0];
    
    // Handle special chrome pages, new tabs, etc.
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:')) {
      return null;
    }
    
    return new URL(tab.url).hostname;
  } catch (error) {
    console.error('Error getting current domain:', error);
    return null;
  }
}

// Update statistics
function updateStats(stats) {
  if (!stats) {
    console.warn('No stats received');
    return;
  }
  
  document.getElementById('blockedAdsCount').textContent = stats.blockedAds || 0;
  document.getElementById('blockedAnalyticsCount').textContent = stats.blockedAnalytics || 0;
  
  const whitelist = document.getElementById('whitelist');
  whitelist.innerHTML = '';
  
  if (stats.whitelistedDomains && Array.isArray(stats.whitelistedDomains)) {
    stats.whitelistedDomains.forEach(domain => {
      const li = document.createElement('li');
      
      // Create domain text span
      const domainText = document.createElement('span');
      domainText.className = 'domain-text';
      domainText.textContent = domain;
      
      // Create remove button
      const removeBtn = document.createElement('span');
      removeBtn.className = 'remove-btn';
      removeBtn.textContent = '×'; // "×" is the multiplication sign (cross)
      removeBtn.title = 'Remove from whitelist';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event bubbling
        removeFromWhitelist(domain);
      });
      
      // Add elements to list item
      li.appendChild(domainText);
      li.appendChild(removeBtn);
      whitelist.appendChild(li);
    });
    
    // Update whitelist buttons based on the current site status
    updateWhitelistButtons(stats.whitelistedDomains);
  } else {
    updateWhitelistButtons([]);
  }
}

// Remove domain from whitelist
function removeFromWhitelist(domain) {
  if (!domain) return;
  
  chrome.runtime.sendMessage({
    action: 'removeFromWhitelist',
    domain
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn('Error removing from whitelist:', chrome.runtime.lastError.message);
      return;
    }
    
    // Update state immediately after change
    chrome.runtime.sendMessage({ action: 'getStats' }, (stats) => {
      if (chrome.runtime.lastError) {
        console.warn('Error getting updated stats:', chrome.runtime.lastError.message);
        return;
      }
      updateStats(stats);
    });
  });
}

// Update whitelist buttons
async function updateWhitelistButtons(whitelistedDomains) {
  const currentDomain = await getCurrentDomain();
  
  // Disable whitelist buttons if no valid domain
  const addToWhitelist = document.getElementById('addToWhitelist');
  const removeFromWhitelist = document.getElementById('removeFromWhitelist');
  const invalidDomainMessage = document.getElementById('invalid-domain-message');
  
  if (!currentDomain) {
    // We're on a special page that can't be whitelisted
    addToWhitelist.style.display = 'none';
    removeFromWhitelist.style.display = 'none';
    invalidDomainMessage.style.display = 'block';
    return;
  }
  
  invalidDomainMessage.style.display = 'none';
  const isWhitelisted = whitelistedDomains.includes(currentDomain);
  
  addToWhitelist.style.display = isWhitelisted ? 'none' : 'block';
  removeFromWhitelist.style.display = isWhitelisted ? 'block' : 'none';
}

// Initialize popup
async function initializePopup() {
  try {
    // Get initial stats
    chrome.runtime.sendMessage({ action: 'getStats' }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('Error getting stats:', chrome.runtime.lastError.message);
        return;
      }
      updateStats(response);
    });
    
    // Setup ad blocking toggle
    const toggle = document.getElementById('adBlockingToggle');
    chrome.storage.local.get(['adBlockingEnabled'], (result) => {
      if (chrome.runtime.lastError) {
        console.warn('Error getting ad blocking setting:', chrome.runtime.lastError.message);
        return;
      }
      toggle.checked = result.adBlockingEnabled !== false;
    });
    
    toggle.addEventListener('change', (e) => {
      chrome.runtime.sendMessage({
        action: 'toggleAdBlocking',
        enabled: e.target.checked
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Error toggling ad blocking:', chrome.runtime.lastError.message);
        }
      });
    });
    
    // Setup analytics blocking toggle
    const analyticsToggle = document.getElementById('analyticsBlockingToggle');
    chrome.storage.local.get(['analyticsBlockingEnabled'], (result) => {
      if (chrome.runtime.lastError) {
        console.warn('Error getting analytics blocking setting:', chrome.runtime.lastError.message);
        return;
      }
      analyticsToggle.checked = result.analyticsBlockingEnabled !== false;
    });
    
    analyticsToggle.addEventListener('change', (e) => {
      chrome.runtime.sendMessage({
        action: 'toggleAnalyticsBlocking',
        enabled: e.target.checked
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Error toggling analytics blocking:', chrome.runtime.lastError.message);
        }
      });
    });
    
    // Setup whitelist buttons
    const addToWhitelist = document.getElementById('addToWhitelist');
    const removeFromWhitelistBtn = document.getElementById('removeFromWhitelist');
    
    addToWhitelist.addEventListener('click', async () => {
      const domain = await getCurrentDomain();
      if (!domain) return; // Skip if no valid domain
      
      chrome.runtime.sendMessage({
        action: 'addToWhitelist',
        domain
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Error adding to whitelist:', chrome.runtime.lastError.message);
          return;
        }
        
        // Update state immediately after change, no need to reload the page
        chrome.runtime.sendMessage({ action: 'getStats' }, (stats) => {
          if (chrome.runtime.lastError) {
            console.warn('Error getting updated stats:', chrome.runtime.lastError.message);
            return;
          }
          updateStats(stats);
        });
      });
    });
    
    removeFromWhitelistBtn.addEventListener('click', async () => {
      const domain = await getCurrentDomain();
      if (!domain) return; // Skip if no valid domain
      
      removeFromWhitelist(domain);
    });
  } catch (error) {
    console.error('Error initializing popup:', error);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePopup);

// Update stats periodically
setInterval(() => {
  chrome.runtime.sendMessage({ action: 'getStats' }, (stats) => {
    if (chrome.runtime.lastError) {
      console.warn('Error getting periodic stats update:', chrome.runtime.lastError.message);
      return;
    }
    updateStats(stats);
  });
}, 1000); 