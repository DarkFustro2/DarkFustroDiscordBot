# Discord Panel

Kendi Discord sunucunu tarayıcıdan, Discord'a benzeyen bir arayüzle yönetmek için kişisel panel.
Bot tokeni ile çalışır. Siteye şifreyle girilir.

## Özellikler
- Discord görünümlü arayüz (sunucular, kanallar, sohbet, üyeler)
- Yazılı kanallarda mesaj okuma / yazma / silme
- Kanal ve kategori ekleme, silme, yeniden adlandırma
- Rol oluşturma, düzenleme, silme; üyelere rol verme / alma
- **Ana sayfa (💬):** arkadaş listesi, birebir özel mesajlar (DM), okunmamış sayacı
- **Arkadaş ekleme:** kullanıcı adıyla (botla ortak sunucudaki kişiler) ya da ID ile
- **Özel ses odası:** bir arkadaşınla sesli görüşmek için sadece ikinizin görebildiği geçici ses kanalı açılır, davet DM ile gider, bitince kanal silinir
- **Profil:** herkesin profiline bak (afiş, roller, katılma tarihi); botun profilini düzenle (ad, resim, afiş, hakkımda, sunucu takma adı)
- Sunucular ve ana sayfa arasında tek tıkla geçiş
- Sesli kanala katılma: tarayıcı mikrofonu → bot → Discord, Discord'daki sesler → tarayıcı
- İsteğe bağlı mesaj şifreleme (AES-256, tarayıcıda)
- Düşük RAM: mesaj önbelleği kapalı, 10 dakikada bir bellek temizliği
- 5 dakikada bir kendi `/health` adresine istek atar (Render uyumasın diye)

## Kurulum

### 1) Discord botu
1. https://discord.com/developers/applications → uygulamanı aç → **Bot**
2. **Reset Token** ile yeni token al (kimseyle paylaşma).
3. Aynı sayfada **Privileged Gateway Intents** altında şunları aç:
   **Server Members Intent** ve **Message Content Intent**.
4. **OAuth2 → URL Generator**: `bot` seç, yetki olarak **Administrator** seç, çıkan linkle botu sunucuna ekle.
5. Sunucu ayarlarında botun rolünü rol listesinin **en üstüne** sürükle (yoksa rolleri yönetemez).

### 2) GitHub
Bu klasörü **Private** bir repoya yükle. `.env` dosyası `.gitignore`'da, token koda yazılı değil.

### 3) Render
1. https://render.com → **New → Web Service** → GitHub reposunu seç (ya da Blueprint ile `render.yaml`).
2. Runtime: Node, Plan: **Free**, Build: `npm install`, Start: `npm start`.
3. **Environment** bölümüne ekle:
   - `DISCORD_TOKEN` = yeni bot tokenin
   - `SITE_PASSWORD` = uzun, zor bir şifre
   - `DISPLAY_PREFIX` = (isteğe bağlı) adın, mesajların başına eklenir
4. Deploy et. Adresin `https://...onrender.com` olur, şifreyle gir.

## Discord'un botlara koyduğu sınırlar (kodla aşılamaz)
- **Botların gerçek arkadaş listesi yoktur.** "Arkadaşlar" listesi panele özeldir ve tarayıcında (localStorage) saklanır; başka tarayıcıda boş görünür.
- **DM sadece şu durumda gider:** kişi botla en az bir ortak sunucuda ve özel mesajlara izin vermiş olmalı.
- **Botlar DM'de sesli arama yapamaz.** Bunun yerine "özel ses odası" açılır; arkadaşın Discord'dan o kanala girer.
- **Botun "hakkımda" yazısı**, uygulamanın açıklaması olarak kaydedilir. Kullanıcı adı değişimi saatte 2 kez sınırlıdır.
- Başkalarının "hakkımda" yazısını ve çevrimiçi durumunu bot göremez.

## Bilmen gerekenler
- Mesajlar **bot adıyla** gider (bot tokeniyle kendi hesabınla yazılamaz). `DISPLAY_PREFIX` ile başına adını ekleyebilirsin.
- Ses için **Chrome / Edge** önerilir ve site HTTPS olmalı (Render zaten HTTPS verir). Kulaklık tak, yoksa yankı olur.
- Şifreleme: parolayı 🔓 butonundan gir. Aynı parolayı giren panel mesajı çözer; normal Discord şifreli metni görür.
  Ses, şifreleme parolasıyla değil HTTPS + Discord'un kendi şifrelemesiyle korunur (bot sesi çözmek zorunda).
- Render free planda ilk istek yavaş olabilir; bot yeniden başlarsa 20-30 sn içinde bağlanır.
- Yerelde denemek: `.env.example` → `.env` yap, doldur, `npm install` ve `npm run dev`.
