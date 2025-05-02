// Initialize options page
function initializeOptions() {
  // Get initial stats
  chrome.runtime.sendMessage({ action: 'getStats' }, updateStats);
  
  // Setup ad blocking toggle
  const adToggle = document.getElementById('adBlockingToggle');
  chrome.storage.local.get(['adBlockingEnabled'], (result) => {
    adToggle.checked = result.adBlockingEnabled !== false;
  });
  
  adToggle.addEventListener('change', (e) => {
    chrome.runtime.sendMessage({
      action: 'toggleAdBlocking',
      enabled: e.target.checked
    });
  });
  
  // Setup analytics blocking toggle
  const analyticsToggle = document.getElementById('analyticsBlockingToggle');
  chrome.storage.local.get(['analyticsBlockingEnabled'], (result) => {
    analyticsToggle.checked = result.analyticsBlockingEnabled !== false;
  });
  
  analyticsToggle.addEventListener('change', (e) => {
    chrome.runtime.sendMessage({
      action: 'toggleAnalyticsBlocking',
      enabled: e.target.checked
    });
  });
  
  // Setup whitelist input and button
  const whitelistInput = document.getElementById('whitelistInput');
  const addDomainBtn = document.getElementById('addDomain');
  
  addDomainBtn.addEventListener('click', () => {
    const domain = whitelistInput.value.trim();
    if (domain) {
      chrome.runtime.sendMessage({
        action: 'addToWhitelist',
        domain
      }, () => {
        whitelistInput.value = '';
        chrome.runtime.sendMessage({ action: 'getStats' }, updateStats);
      });
    }
  });
  
  // Setup filter list controls
  setupFilterLists();
  
  // Update stats periodically
  setInterval(() => {
    chrome.runtime.sendMessage({ action: 'getStats' }, updateStats);
  }, 1000);
}

// Setup filter lists functionality
function setupFilterLists() {
  const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
  
  // Load existing settings
  chrome.storage.local.get(['filterLists'], (result) => {
    if (result.filterLists) {
      filterCheckboxes.forEach(checkbox => {
        checkbox.checked = result.filterLists[checkbox.name] !== false;
      });
    }
  });
  
  // Save setting changes
  filterCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      saveFilterSettings();
    });
  });
}

// Save filter settings
function saveFilterSettings() {
  const filterLists = {};
  document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
    filterLists[checkbox.name] = checkbox.checked;
  });
  
  chrome.storage.local.set({ filterLists });
  chrome.runtime.sendMessage({ action: 'updateFilterLists', filterLists });
}

// Update statistics and whitelist display
function updateStats(stats) {
  document.getElementById('totalBlocked').textContent = stats.blockedAds;
  document.getElementById('totalBlockedAnalytics').textContent = stats.blockedAnalytics;
  document.getElementById('whitelistedCount').textContent = stats.whitelistedDomains.length;
  
  const whitelist = document.getElementById('whitelist');
  whitelist.innerHTML = '';
  
  stats.whitelistedDomains.forEach(domain => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${domain}</span>
      <button class="remove-domain" data-domain="${domain}">Remove</button>
    `;
    whitelist.appendChild(li);
  });
  
  // Add event listeners to remove buttons
  document.querySelectorAll('.remove-domain').forEach(button => {
    button.addEventListener('click', (e) => {
      const domain = e.target.dataset.domain;
      chrome.runtime.sendMessage({
        action: 'removeFromWhitelist',
        domain
      }, () => {
        chrome.runtime.sendMessage({ action: 'getStats' }, updateStats);
      });
    });
  });
}

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeOptions); 