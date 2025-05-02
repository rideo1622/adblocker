// Available languages
const availableLanguages = {
  'en': 'English',
  'tr': 'Türkçe'
};

// Translations
const translations = {
  "en": {
    "title": "Ad Blocker",
    "stats": "Statistics",
    "blocked": "Blocked Ads:",
    "blockedAnalytics": "Blocked Analytics:",
    "totalBlocked": "Total Blocked Ads",
    "totalBlockedAnalytics": "Total Blocked Analytics",
    "enableAdBlocking": "Enable Ad Blocking",
    "enableAnalyticsBlocking": "Block Analytics",
    "enableSmartBlocking": "Smart Blocking (Prevent Broken Sites)",
    "fixBrokenSite": "Fix Broken Site",
    "addToWhitelist": "Add Current Site to Whitelist",
    "removeFromWhitelist": "Remove Current Site from Whitelist",
    "whitelist": "Whitelisted Sites",
    "whitelistedSites": "Whitelisted Sites",
    "options": "Options",
    "optionsTitle": "Ad Blocker Options",
    "generalSettings": "General Settings",
    "filterLists": "Filter Lists",
    "detailedStats": "Detailed Statistics",
    "whitelistManagement": "Whitelist Management",
    "domainPlaceholder": "Enter domain (e.g. example.com)",
    "addDomain": "Add to Whitelist",
    "invalidDomain": "Cannot modify whitelist on this page.",
    "add": "Add",
    "easyList": "EasyList",
    "easyPrivacy": "EasyPrivacy",
    "malwareDomains": "Malware Domains",
    "socialMedia": "Social Media Filters",
    "version": "Version 1.0",
    "adFilters": "Ad Filters",
    "privacyFilters": "Privacy Filters",
    "otherFilters": "Other Filters",
    "adGuard": "AdGuard Base",
    "googleAnalytics": "Google Analytics",
    "facebookPixel": "Facebook Pixel"
  },
  "tr": {
    "title": "Reklam Engelleyici",
    "stats": "İstatistikler",
    "blocked": "Engellenen Reklamlar:",
    "blockedAnalytics": "Engellenen Analizler:",
    "totalBlocked": "Toplam Engellenen Reklamlar",
    "totalBlockedAnalytics": "Toplam Engellenen Analizler",
    "enableAdBlocking": "Reklam Engellemeyi Aç",
    "enableAnalyticsBlocking": "Analiz Araçlarını Engelle",
    "enableSmartBlocking": "Akıllı Engelleme (Site Bozulmalarını Önle)",
    "fixBrokenSite": "Bozuk Siteyi Düzelt",
    "addToWhitelist": "Mevcut Siteyi Güvenilir Listeye Ekle",
    "removeFromWhitelist": "Mevcut Siteyi Güvenilir Listeden Çıkar",
    "whitelist": "Güvenilir Siteler",
    "whitelistedSites": "Güvenilir Siteler",
    "options": "Ayarlar",
    "optionsTitle": "Reklam Engelleyici Ayarları",
    "generalSettings": "Genel Ayarlar",
    "filterLists": "Filtre Listeleri",
    "detailedStats": "Detaylı İstatistikler",
    "whitelistManagement": "Güvenilir Site Yönetimi",
    "domainPlaceholder": "Domain girin (ör. example.com)",
    "addDomain": "Güvenilir Listeye Ekle",
    "invalidDomain": "Bu sayfada güvenilir liste değiştirilemez.",
    "add": "Ekle",
    "easyList": "EasyList",
    "easyPrivacy": "EasyPrivacy",
    "malwareDomains": "Zararlı Domain'ler",
    "socialMedia": "Sosyal Medya Filtreleri",
    "version": "Sürüm 1.0",
    "adFilters": "Reklam Filtreleri",
    "privacyFilters": "Gizlilik Filtreleri",
    "otherFilters": "Diğer Filtreler",
    "adGuard": "AdGuard Temel",
    "googleAnalytics": "Google Analytics",
    "facebookPixel": "Facebook Pixel"
  }
};

// Get browser language
function getBrowserLanguage() {
  return navigator.language.split('-')[0]; // Get only the language part from something like 'en-US' or 'tr-TR'
}

// Get the appropriate translation pack
function getTranslations() {
  const lang = getBrowserLanguage();
  return translations[lang] || translations["en"]; // Fallback to English if language not supported
}

// Localize UI text
function localizeUI() {
  const translations = getTranslations();
  const elements = document.querySelectorAll('[data-i18n]');
  
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[key]) {
      element.textContent = translations[key];
      
      // Special case for input placeholder attributes
      if (element.placeholder) {
        element.placeholder = translations[key];
      }
    }
  });
}

// Apply translations when the page loads
document.addEventListener('DOMContentLoaded', localizeUI); 