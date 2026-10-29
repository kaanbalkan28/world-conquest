V31 (test edilmedi — istek gereği):
YAPILDI
- Yenilgide toprak: kaybeden, KAZANANIN topraklarına en yakın (önce kara komşusu) kendi toprağını verir (v31.js, R5.pickLoss). Tek toprağı kalan ülke yok olur (mevcut kural).
- 2B haritada fethedilen ülke sahibin rengiyle sınırlanır -> ana parçayla birleşik görünür (v31.js merge()).
- Kutup haleleri: 3B kürede bulut katmanı kutuplarda silinir (v30.js, 'clouds' dokusu). Hale başka bir katmandaysa v30.js ~satır 180'deki atmosfer küresine bakılmalı.
- Keşif düğmesi küçültüldü (v31.css).
- İkonlar: assets/icons/*.svg (3B görünümlü: nüfus, ordu, ekonomi, teknoloji, diplomasi, koruma, kışkırt, pakt, politika, elçi). Emoji'ler otomatik değiştirilir; elçi kartları da.
- 3B üretici entegrasyonu: assets/icons.js içindeki yolları üreticiden aldığınız PNG/WebP ile değiştirin.
YAPILMADI / EKSİK
- 3B kürede (WebGL) fethedilen ülkelerin gerçek geometrik birleşmesi (sınır çizgileri) yapılmadı.
- Politika listesindeki kartlarda (polMenu) özel ikonlar eşlenmedi; sadece emoji karşılıkları değişir.
- Çevrimdışı ortamda harici 3B üretici API'sine bağlanılamaz; canlı entegrasyon yok, sadece dosya değiştirme kancası var.

V32 (ikon yenileme, test edilmedi — istek gereği):
- assets/icons/*.svg baştan çizildi: koyu "Makyavelist" madalyon, altın çerçeve, metal/altın/parşömen/balmumu dokuları, gölge ve parlama.
  Nüfus: altın küre + insan kalabalığı | Ordu: çapraz kılıçlar + kalkan | Ekonomi: altın sikke yığını + hazine kesesi
  Teknoloji: parlayan çark içinde atom | Diplomasi: zeytin dallı güvercin | Politika: kırmızı mühürlü parşömen
  Elçi: mühürlü zarf + bayrak (yeni envoy.svg) | Pakt: tokalaşan eller | Koruma: kalkan | Kışkırtma: alev
- icons.js: envoy yolu ve 🤝 / ✉ / 📨 eşlemeleri eklendi.
- Not: Burada harici 3B üretici (Meshy/Tripo vb.) çağrılamadı; ikonlar elle çizilmiş vektörlerdir. Üreticiden PNG/WebP alırsanız assets/icons.js'teki yolları değiştirmeniz yeterli.

V35 (ana menü, test edilmedi — istek gereği):
- Yeni sinematik tam ekran ana menü: v35.js + v35.css (index.html'e eklendi).
- Three.js ile 3B küre: ülke dokulu, altın sınırlar, kıpkırmızı atmosfer, astrolab halkaları, dönen uydular,
  canlı "fetih okları", kıvılcımlar, yıldızlar, sürükleyerek döndürme, fare paralaksı, açılışta kamera yaklaşması.
- Kayıt varsa fethettiğiniz ülkeler küre üzerinde altın renkte görünür; Tur / Fethedilen / Dünya % istatistikleri gösterilir.
- Makyavel esintili dönen sözler (TR/EN), harf harf açılan başlık, film greni, çerçeve; mobil dikey ve yatay düzen.
- Düğmeler: Seferi Sürdür, Yeni Fetih, Hazine (Dükkân), Ayarlar, Dil. Oyun içi menü eski modal olarak kalır.
- 3B üretici kancası: window.WC_MENU = {bg:'assets/menu/bg.webp', emblem:'assets/menu/emblem.png'} (v35.js başı).
- YAPILMADI: üretici API'sine canlı bağlantı (çevrimdışı), menü müziği, gerçek tarayıcı testi.

V36 (test edilmedi — istek gereği):
- Game Over geri getirildi: v36.js, oyuncunun tüm toprağı gidince yenilgi / tüm dünya alınınca zafer ekranını zorla açar (render, savaş kapanışı ve 0.7sn aralıklı denetim).
- Rusya karartısı: 180° boylamını aşan ülkelerin seçim/vurgu katmanı (app.js ovd()) artık parçalara bölünerek çiziliyor; tüm haritayı kaplayan koyu dolgu giderildi.

V37 (test edilmedi): v37.css — çöl/bej/eskimiş tema: harita zemini kum rengi, ülkeler sepya ile solmuş, kenar vinyeti, kahverengi arayüz paneli/düğmeleri/altın vurgu. index.html sonuna eklendi.
YAPILMADI: ana menü (v35) ve 3B küre renkleri, ikon SVG'leri bu temaya uyarlanmadı; etiket rengi test edilmedi.

V38-FIX (test edilmedi — istek gereği):
- Tek toprağı kalan oyuncu savaşı kaybedince Game Over: v36.js yeniden yazıldı; kontrol artık G.over bayrağına değil gerçek toprak sayısına bakar,
  bayrak set olup pencere açılmadıysa pencereyi açar (savaş kapanınca + 500 ms aralıkla). v5.js attack5'te bayrak korunur.
- YAPILMADI: kök neden tarayıcıda doğrulanmadı (test yapılmadı).
- V38-FIX2: yeni oyunda (ülke seçimi/intro fazı) erken 'yenilgi' tetiklenmesi giderildi; sadece oyun başlamış ve toprak gerçekten 0 ise biter. Test edilmedi.
- V38-FIX3: v38.js eklendi: (1) oyuncunun toprağı 0 ise modal sisteminden bağımsız tam ekran YENİLGİ katmanı; (2) fethedilen toprakların rengi her boyamada sahibin rengine zorla eşitlenir. Test edilmedi; renk sorununun kök nedeni (3B küre dahil) doğrulanmadı.

V39 (test edilmedi — istek gereği):
- v39.js: fethedilen ülkeler başlangıç ülkesiyle aynı renkte (poligon + nokta). index.html v38 sonrasına eklendi.
YAPILMADI: 3B küre (WebGL) ve ana menü küresi renkleri; gerçek tarayıcı testi.
