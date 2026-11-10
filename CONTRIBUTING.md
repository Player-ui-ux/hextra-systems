# 🤝 Katkıda Bulunma Rehberi (Contributing Guide)

**Hextra Studio** projesine katkıda bulunmak istediğiniz için teşekkür ederiz! Açık kaynak topluluğunun desteği ile projeyi daha güvenli, kararlı ve güçlü kılmayı hedefliyoruz.

---

## 🛠️ Geliştirme Ortamı Kurulumu

1. **Depoyu klonlayın:**
   ```bash
   git clone https://github.com/kullaniciadi/hextra-studio.git
   cd hextra-studio
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **Geliştirici modunu başlatın:**
   ```bash
   npm run dev
   ```

4. **Derleme testi yapın:**
   ```bash
   npm run build
   ```

---

## 📋 Kurallar & İlkeler

- **Güvenlik İlk Sırada:** Tokenler veya hassas kimlik bilgileri bellekte dahi gereksiz yere açık tutulmamalı, dosya sisteminde daima `AES-256-GCM` ile şifrelenmelidir.
- **Discord API Koruması:** Discord'a gönderilen tüm istekler Windows Masaüstü İstemcisi başlıklarıyla (`User-Agent`, `X-Super-Properties`) uyumlu olmalı ve anti-ban gecikmeleri (jitter) korunmalıdır.
- **Kod Standartları:** TypeScript tür güvenliği ve Tailwind CSS siberpunk tema değişkenleri (`obsidian-*`, `hextra-*`) tutarlı kullanılmalıdır.
- **Hassas Bilgi Paylaşmama:** Pull Request veya Issue açarken kişisel Discord tokeni, e-posta veya özel sunucu ID'leri eklemeyin.

---

## 🚀 Pull Request Gönderme

1. Yeni bir özellik veya hata düzeltmesi için bir dal (branch) açın:
   ```bash
   git checkout -b feature/yeni-ozellik
   ```
2. Değişikliklerinizi yapın ve test edin.
3. Commit mesajlarınızı net ve anlaşılır yazın:
   ```bash
   git commit -m "feat(quests): yeni video gorev zamanlayici eklendi"
   ```
4. Dalınızı GitHub'a push edin ve bir Pull Request oluşturun.

*Hextra Studio Ekibi*
