# Chrome Ad Blocker Extension

[English](#english) | [Türkçe](#türkçe)

<img src="icons/ad-blocker.png" alt="Ad Blocker Logo" width="100" />

---

## English

### Overview

This Chrome extension provides comprehensive ad and analytics blocking capabilities with a modern UI. Built with Manifest V3 compatibility, it combines network-level blocking via `declarativeNetRequest` with DOM-based content filtering for maximum ad-blocking effectiveness.

### Features

- **Network-Level Ad Blocking**: Blocks ads at the request level before they load
- **DOM-Based Ad Removal**: Removes ad elements that might bypass network filtering
- **Analytics Blocking**: Separate toggle for blocking analytics and tracking scripts
- **Separated Statistics**: Track ads and analytics blocking separately
- **Whitelist Management**: Easily add or remove trusted sites from blocking
- **Filter Lists**: Enable/disable various filter categories
- **Dark/Light Theme**: Automatically adapts to system theme preference
- **Multilingual Support**: Available in English and Turkish

### Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked" and select the extension directory
5. The extension is now installed and active

### Usage

- Click on the extension icon in your toolbar to open the popup
- Toggle ad blocking or analytics blocking on/off
- View statistics on how many ads and analytics scripts have been blocked
- Add the current site to your whitelist if needed
- Click "Options" for more detailed settings

### Options Page

The options page provides additional settings:
- Detailed blocking statistics
- Comprehensive whitelist management
- Fine-tuned filter list controls

### Technical Details

- **Manifest Version**: V3
- **Permissions**: declarativeNetRequest, storage, activeTab
- **APIs Used**: chrome.declarativeNetRequest, chrome.storage, chrome.tabs

### License

This project is available as open source under the terms of the MIT License.

For support: mail@ridvanatmaca.com

---

## Türkçe

### Genel Bakış

Bu Chrome uzantısı, modern bir kullanıcı arayüzü ile kapsamlı reklam ve analitik engelleme yetenekleri sağlar. Manifest V3 uyumlu olarak tasarlanmış olup, maksimum reklam engelleme etkinliği için `declarativeNetRequest` ile ağ düzeyinde engellemeyi DOM tabanlı içerik filtreleme ile birleştirir.

### Özellikler

- **Ağ Seviyesinde Reklam Engelleme**: Reklamları yüklenmeden önce istek seviyesinde engeller
- **DOM Tabanlı Reklam Kaldırma**: Ağ filtrelemesini atlatabilen reklam öğelerini kaldırır
- **Analitik Engelleme**: Analitik ve izleme komut dosyalarını engellemek için ayrı bir düğme
- **Ayrılmış İstatistikler**: Reklam ve analitik engellemelerini ayrı ayrı takip edin
- **Güvenilir Site Yönetimi**: Engellemeden güvenilir siteleri kolayca ekleyin veya kaldırın
- **Filtre Listeleri**: Çeşitli filtre kategorilerini etkinleştirin/devre dışı bırakın
- **Koyu/Açık Tema**: Sistem tema tercihine otomatik olarak uyum sağlar
- **Çoklu Dil Desteği**: İngilizce ve Türkçe dillerinde kullanılabilir

### Kurulum

1. Bu depoyu indirin veya klonlayın
2. Chrome'u açın ve `chrome://extensions/` adresine gidin
3. "Geliştirici modu"nu etkinleştirin (sağ üst köşedeki düğme)
4. "Paketlenmemiş öğe yükle"ye tıklayın ve uzantı dizinini seçin
5. Uzantı artık kuruldu ve aktif

### Kullanım

- Popup'ı açmak için araç çubuğundaki uzantı simgesine tıklayın
- Reklam engellemeyi veya analitik engellemeyi açın/kapatın
- Kaç reklam ve analitik komut dosyasının engellendiğine dair istatistikleri görüntüleyin
- Gerekirse mevcut siteyi güvenilir listenize ekleyin
- Daha ayrıntılı ayarlar için "Ayarlar"a tıklayın

### Ayarlar Sayfası

Ayarlar sayfası ek ayarlar sunar:
- Ayrıntılı engelleme istatistikleri
- Kapsamlı güvenilir site yönetimi
- İnce ayarlı filtre listesi kontrolleri

### Teknik Detaylar

- **Manifest Sürümü**: V3
- **İzinler**: declarativeNetRequest, storage, activeTab
- **Kullanılan API'ler**: chrome.declarativeNetRequest, chrome.storage, chrome.tabs

### Lisans

Bu proje MIT Lisansı şartları altında açık kaynak olarak mevcuttur. 

Destek için: mail@ridvanatmaca.com