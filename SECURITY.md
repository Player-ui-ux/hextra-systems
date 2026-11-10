# 🛡️ Güvenlik Politikası (Security Policy)

Hextra Studio, kullanıcı güvenliğini ve veri gizliliğini temel ilke olarak benimser.

---

## 🔐 Token Güvenliği & Şifreleme Mimarisi

- **Sıfır Dış Sunucu:** Hextra Studio sunucusuz (serverless/offline) bir masaüstü aracıdır. Eklenen hiçbir token, şifre veya oturum bilgisi harici bir üçüncü taraf sunucuya veya veri tabanına iletilmez.
- **AES-256-GCM Donanımsal Şifreleme:** Eklenen tüm kullanıcı tokenleri, cihazın ana makine adı, kullanıcı adı ve yerel rastgele tuz (salt/entropy) ile türetilen anahtar ile `AES-256-GCM` standardında şifrelenir. Başka bir bilgisayara dosya kopyalansa dahi çözülemez.
- **Anti-Ban Simülasyonu:** İstekler Discord'un resmi Windows masaüstü istemcisi kimliğini (`User-Agent: discord/1.0.9175`, `build 359505`) simüle eder. Yapay zeka benzeri rastgele gecikmeler (jitter) ile Discord'un otomatik bot ve rate-limit algoritmaları bypass edilir.

---

## 🚨 Güvenlik Açığı Bildirimi

Eğer bir güvenlik açığı tespit ederseniz, lütfen genel bir GitHub Issue açmak yerine doğrudan özel iletişim kanalları veya GitHub Private Vulnerability Reporting üzerinden bildiriniz.

Bildiriminiz incelendikten sonra en kısa sürede bir yama yayımlanacaktır.
