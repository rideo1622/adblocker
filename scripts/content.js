// CSS selectors for ad-containing elements (Daha dikkatli seçilmiş olabilir)
// Not: Bu liste, işlevselliği bozma riski en düşük, yaygın ve belirgin reklam kalıplarını hedeflemelidir.
const adSelectors = [
  '.adsbygoogle', // Google Adsense
  'div[id^="google_ads_"]', // Google Ads
  'div[id*="gpt-ad"]', // Google Publisher Tags
  'div[data-google-query-id]', // Google Arama reklamları
  'div[data-ad-unit-path]', // Google Ads
  'div[data-ad-format]',
  'div[data-ad-client]',
  'div[data-ad-slot]',
  'ins.adsbygoogle', // Google Adsense
  'a[href*="/adclick."]', // Ad click redirects
  'a[href*="googleadservices.com/pagead/aclk"]', // Google Ad redirects
  'a[href*="doubleclick.net/ddm/clk"]', // DoubleClick redirects
  'div[aria-label*="Ad"]', // Erişilebilirlik etiketi "Ad"
  'div[aria-label*="Sponsored"]', // Erişilebilirlik etiketi "Sponsored"
  '.ad-banner',
  '.advertisement',
  '.banner-ad',
  '.google-ad',
  '.sponsored-link',
  'div[class*=" ad-"]', // class içinde " ad-" içerenler (daha spesifik)
  'div[id*="-ad-"]', // id içinde "-ad-" içerenler
  'iframe[src*="googleads.g.doubleclick.net"]', // Reklam iframe'leri
  'iframe[src*="googlesyndication.com"]', // Reklam iframe'leri
  'iframe[src*="adnxs.com"]', // Reklam iframe'leri
  'iframe[name^="google_ads_"]', // Reklam iframe isimleri
  '#tads > .ads-ad', // Eski Google arama reklamları
  '#bottomads > .ads-ad' // Eski Google arama reklamları
];

// CSS selectors for analytics tools and trackers
// Not: Scriptleri gizlemek yerine neutralizeAnalyticsFunctions kullanmak genellikle daha iyidir.
// Pikselleri gizlemek ise genellikle güvenlidir.
const analyticsSelectors = [
  // Primarily for tracking pixels (images, iframes)
  'img[src*="google-analytics.com/collect"]',
  'img[src*="facebook.com/tr"]',
  'img[src*="pixel"]', // Genel pixel img'leri (dikkatli olunmalı)
  'img[width="1"][height="1"]', // Boyutları 1x1 olan resimler (genellikle izleyici)
  'iframe[src*="googletagmanager.com/ns.html"]', // GTM iframe
  'iframe[src*="matomo.php"]', // Matomo iframe
  'iframe[height="1"][width="1"]' // Boyutları 1x1 olan iframe'ler
];

// Scriptleri etkisizleştiren fonksiyon (bu yöntem genellikle daha güvenli)
function neutralizeAnalyticsFunctions() {
    try {
        // Daha önce tanımlandığı gibi, yaygın global değişkenleri etkisiz hale getir
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

// --- isCriticalPageContext, safeToModify, hasCriticalAncestorOrSelf KALDIRILDI ---

// Block ads (Simplified)
function blockAds() {
  // Sadece beyaz listede değilse çalıştır
  if (isWhitelisted || !adBlockingEnabled) return 0;

  let count = 0;
  try {
    const elements = document.querySelectorAll(adSelectors.join(', '));
    elements.forEach(element => {
      // Basitçe gizle
      if (element.style.display !== 'none') {
        element.style.setProperty('display', 'none', 'important');
        element.style.setProperty('visibility', 'hidden', 'important'); // Ekstra güvenlik
         // Boyutları sıfırlamak bazen layout'u bozabilir, sadece display none yeterli olabilir.
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

// Block analytics (Simplified)
function blockAnalytics() {
  // Beyaz listede değilse ve analiz engelleme açıksa çalıştır
  if (isWhitelisted || !analyticsBlockingEnabled) return 0;

  let count = 0;
  try {
    // 1. Fonksiyonları etkisizleştir (En güvenli yöntem)
    neutralizeAnalyticsFunctions();
    count++; // Etkisizleştirmeyi bir işlem sayalım

    // 2. Sadece izleme piksellerini (img, iframe) gizle
    const elements = document.querySelectorAll(analyticsSelectors.join(', '));
    elements.forEach(element => {
       // Sadece img ve iframe gibi piksel olabilecekleri gizle
       if (element.tagName === 'IMG' || element.tagName === 'IFRAME' || element.tagName === 'PICTURE') {
           if (element.style.display !== 'none') {
               element.style.setProperty('display', 'none', 'important');
               element.style.setProperty('visibility', 'hidden', 'important');
               element.style.setProperty('width', '0', 'important'); // Pikseller için genellikle güvenli
               element.style.setProperty('height', '0', 'important');
               element.style.setProperty('position', 'absolute', 'important');
               element.style.setProperty('pointer-events', 'none', 'important');
               count++;
           }
       }
       // Not: Analiz scriptlerini DOM'dan gizlemek yerine 'neutralize' etmek daha iyi.
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

// Performance-friendly DOM observer (Basitleştirilmiş)
function observeDOMChanges() {
  try {
    let adCheckTimeout = null;
    let analyticsCheckTimeout = null;
    const CHECK_DELAY = 350; // Biraz daha uzun bir gecikme

    const observer = new MutationObserver((mutations) => {
      // Çok basit bir kontrol: Eğer node eklenmişse, gecikmeli tarama yap.
      // Daha optimize edilebilir ama basitlik öncelikli.
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
             // Analiz fonksiyonlarını etkisizleştirme genellikle ilk yüklemede yeterlidir,
             // ama dinamik yüklenenler için tekrar çağrılabilir. Pikseller için de geçerli.
             analyticsCheckTimeout = setTimeout(blockAnalytics, CHECK_DELAY);
          }
      }

    });

    // Gözlemciyi başlat
     const observeTarget = document.documentElement || document.body;
     if (observeTarget) {
         observer.observe(observeTarget, {
             childList: true,
             subtree: true
         });
     }

    // İlk taramayı DOM yüklendikten sonra yap
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
                observeDOMChanges(); // Gözlemciyi sadece ilk durum alındıktan sonra başlat
            } else {
                // console.warn('[AdBlocker Simplified] Did not receive initial state. Using defaults.');
                observeDOMChanges(); // Varsayılanlarla gözlemciyi başlat
            }
        })
        .catch(error => {
            // console.error('[AdBlocker Simplified] Error getting initial state:', error);
            observeDOMChanges(); // Hata durumunda bile gözlemciyi başlatmayı dene
        });
}

initializeBlocking();

// Listen for messages (whitelist changes or on/off toggles)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateState') {
        let stateChanged = false;
        let runScan = false; // Sadece durum değiştiğinde değil, engelleme açıldığında da tarama yapmalı

        if (request.adBlockingEnabled !== undefined && adBlockingEnabled !== request.adBlockingEnabled) {
            adBlockingEnabled = request.adBlockingEnabled;
            stateChanged = true;
            if(adBlockingEnabled) runScan = true; // Engelleme açıldıysa tarama yap
        }
        if (request.analyticsBlockingEnabled !== undefined && analyticsBlockingEnabled !== request.analyticsBlockingEnabled) {
            analyticsBlockingEnabled = request.analyticsBlockingEnabled;
            stateChanged = true;
             if(analyticsBlockingEnabled) runScan = true; // Engelleme açıldıysa tarama yap
        }
        if (request.isWhitelisted !== undefined && isWhitelisted !== request.isWhitelisted) {
            isWhitelisted = request.isWhitelisted;
            stateChanged = true;
            if(!isWhitelisted) runScan = true; // Beyaz listeden çıkarıldıysa tarama yap
        }

        if (stateChanged) {
            // console.log(`[AdBlocker Simplified] State Updated: Ads=${adBlockingEnabled}, Analytics=${analyticsBlockingEnabled}, Whitelisted=${isWhitelisted}`);
            // Beyaz listede değilse ve ilgili engelleme açıksa ve tarama gerekiyorsa
             if (runScan && !isWhitelisted) {
                 if(adBlockingEnabled) setTimeout(blockAds, 50); // Küçük bir gecikmeyle taramayı tetikle
                 if(analyticsBlockingEnabled) setTimeout(blockAnalytics, 50);
             }
             // Eğer beyaz listeye eklendiyse veya engelleme kapatıldıysa, gizlenenleri geri GÖSTERMEK gerekir.
             // Bu daha karmaşık bir mantık gerektirir (örneğin, gizlenen elementleri takip etmek).
             // Şimdilik bu kısım eklenmedi, sayfa yenilemesi gerekir.
        }
        sendResponse({ success: true });
        return true; // Indicate async response
    }
    // Diğer mesaj türleri için false dönebilir veya işlem yapabilir.
    return false;
});