
V40-PERF (masaüstü kasma düzeltmesi, tarayıcıda test edilmedi):
- v37.css: #map>svg üzerindeki CSS filter (sepia/contrast) kaldırıldı (her kaydırma/yakınlaştırmada tüm haritayı yeniden boyuyordu - ana neden), mix-blend-mode:multiply vinyet kaldırıldı, su animasyonları durduruldu.
- v38/v39/v36/v35/v20: setInterval aralıkları seyreltildi, v38 recolor aralığı kaldırıldı (paint zaten çağırıyor), gizli sekmede çalışmaz.
- v31: MutationObserver debounce 30→200 ms.
- V40b: "Yeni Oyun" onayı + mod seçimi artık v35 ana menüsünün içinde (v35.js: subNew/subModes, askNew/modes menü açıkken yönlendirilir). Test edilmedi.
- V40b: v37.css'in !important kenar kuralları .moving (kaydırma) optimizasyonunu eziyordu; kaydırırken kenar, kıyı köpüğü/gölgesi, su ve vinyet gizleniyor.
- V41: Mod adları "Tek Oyunculu"/"Çift Oyunculu"; mod seçince kısa geçiş animasyonu (v35 launch); başlık harf animasyonundan blur/ölçek/filtre kaldırıldı, 3B küre kurulumu başlık animasyonundan sonraya ertelendi (donma). Test edilmedi.
- V42 (video üzerinden): menü anında opak açılır (düz harita çakması yok), grain/amblem filtre animasyonları kapatıldı, küre çözünürlüğü düşürüldü ve dokunmatikte ~30 fps, mobilde alıntı/istatistik çakışması giderildi. Kullanılmayan animations.js, animation-audio.js, animation-sprites.js (~23 MB) pakete alınmadı. Test edilmedi.
- V43: yaklaşan gezegen: doku telefonda 1024x512, anisotropi 2, daha az segment, shader ön ısıtma (compile+render), giriş animasyonu duvar saati yerine sınırlı dt ile (atlama yok), yaklaşma mesafesi kısaltıldı (+3.2→+1.8), küre ilk kareler çizilince fade-in. Test edilmedi.

V44 (diplomasi, test edilmedi): v40.js + v40.css
- Kendi ülke rozeti artık ülke adını tekrar etmiyor: "Siz"/"You" (app.js ownerInfo).
- Diplomasi balonu (Elçi Gönder/Keşif yanında): Dostluk Antlaşması, Saldırmazlık Antlaşması (mevcut pakt), Koruma Parası Talep Et, İttifaktan Çık.
- Dostluk Antlaşması: yapay zekâ küçük devletler ortak tehdide karşı kendiliğinden ittifak kurar (tehlike arttıkça eğilim artar, rahat devlet nadiren); oyuncu teklif eder (kabul olasılığı tehlikeye bağlı, bu tur 1 deneme).
- Savaşta müttefiklerin 5 değeri toplanır (v5.js attack5 -> WCD.war); müttefike saldırılamaz (targets filtresi).
- Koruma parası: 5 değerin >=3'ünde üstünlük; güçsüz öder (genelde ekonomi %10, nadiren başka değer, gerekçeli); reddederse değerler yakınsa sonraki tur saldırı (müttefiklerle), yoksa tutum olumsuz.
- YAPILMADI/BASİTLEŞTİRİLDİ: yapay zekâ saldırı olasılığı (wpEst) müttefikleri hesaba katmaz; ittifak durumu haritada işaretlenmedi (yalnızca balonda ve toast); savaş ekranı müttefik bayraklarını ayrı göstermez.

V45 (diplomasi + harita renkleri + savaş zarı + Turu Bitir; playwright ile denendi): v40.js, v41.js, v41.css, app.js, v7.js, v20.js, v24.js, v30.js, v33.js
- Savaş zarı: zar farkı başına çarpan %10 → %15 (app.js DIE_STEP=.15; 5 farkta ×1.75). Yapay zekâ olasılık hesabı da aynı battle() ile uyumlu.
- Harita rengi (v40.js col sarmalayıcı): oyuncu + fethettikleri kendi rengi, ittifaksız herkes BEJ (hsl 46,30,38), her ittifak kendi soluk ortak rengi (12'li palet,
  komşu ittifaklar farklı renk alır; G.dip.co[].ci kayıtlı). 3B küre ownSig'e WCD.sig() eklendi (ittifak değişince yeniden boyar).
- Saldırmazlık paktı kolaylaştı: altın bedeli 3–12 (eski 5–25), güçlü devlet kabul olasılığı %8 → %60 (tampon %90), olumsuz ilişkide ret %50 → %25.
- Haraç (eski "Koruma Parası"): tur başına toplam en çok 2, aynı ülkeden en çok 1 (G.dip.tc); 3 turluk bekleme kalktı. Güç karşılaştırması yalnızca iki devletin kendi 5 değeri
  (müttefikler dahil değil). "5 değerden 3'ü" kuralı oyuncuya gösterilmez; yetmiyorsa "Haraç talep edecek gücünüz yok." yazar.
- Müttefik yardımı altyapısı (olaylar sonra): WCD.helpRequest({from,title,text,can,onAccept,gain}) / WCD.helpFulfilled(ally,gain) → G.dip.fr[devlet] (0–10) artar,
  WCD.friend(e) seviye döner (Normal/Dostane/Yakın/Sadık); Dostluk Antlaşması kabul eğilimini +%10/puan artırır.
- Diplomasi Merkezi (v41.js): harita kontrol sütununda 🕊 düğmesi → ittifak listesi (harita rengiyle), komşular + ülke arama, her satırdan 🤝/🛡/💰.
- Turu Bitir yeniden tasarlandı (v7.js + v41.css): panel butonlarıyla aynı kahve/altın dil; solda altın ikon, ortada ad, sağda hamle sayacı; hamle bitince altın (birincil).

V46 (zorluk + yön tepkisi; kısa playwright denemesi): v40.js, v42.js (yeni), v20.js
- İsyancı devletin üzerinde haritada saban simgesi (v42.js; yalnızca 2B harita katmanı, 3B küre değil).
- İttifak en fazla 4 devlet (MAXCO; oyuncu + yapay zekâ).
- Zorluk: savunan büyük devlet +%2/ek toprak (en çok +%25), oyuncu büyüdükçe herkese +%1/toprak (en çok +%15); yapay zekâ gelişimi 1.08x+.5; oyuncu >1.2x güçlüyse geride kalan
  yapay zekâlar her tur en çok %5 toparlanır; kendinden >1.6x güçlü devlete yalnızca kara sınırından saldırılır (deniz hedefi kalkar, hiç hedef kalmazsa filtre uygulanmaz);
  tur başına 2 yapay zekâ ittifakı.
- Saldırı yönü (Batı/Doğu/Güney/Kuzey blokları, G.dip.dir): her 3 saldırıda o bloğun savunması +%4 (en çok +%20), 2 devlet sana yönelir, bölge devletleri ittifak kurar;
  her 4 saldırıda o bloktan saldırmazlık teklifi (Ordu/Ekonomi/Teknoloji/Diplomasi +%8 hediye, nüfus asla).
- Bir müttefike saldırılınca onun müttefikleri (zaten savaşa katılır) sonraki tur oyuncuya misilleme saldırısı planlar (G.dip.rev).

V47 (yatay ekran + renk güvencesi; tek kısa headless denemesi: bej renk doğrulandı):
YAPILDI
- Renk: v40.js col sarmalayıcı artık G.v5'e bağlı değil; oyuncu hariç her ülke BEJ (hsl 46,30,38), ittifaklar ayrı soluk renk (v40 ACOL). Denemede 173 ülke tek bej tonunda.
- Yatay ekran: v47.js (screen.orientation.lock; uyarı ekranı kaldırıldı, kilit APK manifestiyle), v47.css (ana menü yatay düzeni: iki sütun, 2'li düğme ızgarası, istatistik görünür).
- Android: setup_android_windows.bat AndroidManifest'e screenOrientation=sensorLandscape ekler (cap add sonrası). Mevcut android/ klasörünüz varsa bat'ı yeniden çalıştırın.
- Yapay zekâ saldırı olasılığı (v20 wpEst) artık müttefik değerlerini katıyor (WCD.side dışa açıldı).
- İttifak durumu haritada renkle işaretli (ayrı renk); ittifak değişince 2B harita yeniden boyanır.
YAPILMADI
- Müttefik yardım olayları (WCD.helpRequest kullanan olay içeriği), savaş ekranında müttefik bayrakları, 3B kürede gerçek sınır birleşimi, 3B menü küresinin yatay kompozisyon ince ayarı.
- Gerçek telefonda/APK'da test; menü grid'i (#wcm .menu) görsel olarak doğrulanmadı.
- Ekran görüntüsündeki pembe/mor tonlar bu pakette üretilmiyor; eski sürüm veya eski kayıt olabilir -> yeni oyun deneyin.

V48 (renk hatası düzeltmesi; headless ile 1 deneme: seçim öncesi 174 bej, seçim sonrası oyuncu #a01220 + 173 bej):
- Sorun: v19.js oyuncu rengini paletten seçip G.plCol'u eziyordu (oyuncu bej/zeytin görünüyordu); ülke seçilmeden önce de eski renkler kullanılıyordu.
- v19.js: v5 modunda G.plCol her zaman koyu kırmızı. v40.js col sarmalayıcı: oyuncu = koyu kırmızı, ülke seçilmeden herkes bej, seçimden sonra diğerleri bej / ittifaklar ayrı ton.
- 3B küre (v30.js ownCol) aynı col()/G.plCol'u kullandığı için otomatik düzelir. Telefonda 3B küre görseli test edilmedi.

V49 (yatay ekran gerçek ekran görüntüsüyle kontrol edildi, 780x360 ve 915x412):
- v47.css: yatayda ülke paneli sıkıştırıldı (38vw, tarih notu gizli, düğmeler sarar), Turu Bitir sağ alta, menü alıntısı kesilmiyor.
- Menü yatayda doğrulandı (sol: başlık+düğmeler, sağ: küre).
YAPILMADI: oyun içi hamburger menü/savaş ekranı/dükkân modallarının yatay ekran görüntüsüyle kontrolü; globun panel açıkken sağa kaydırılması; gerçek telefon testi.

V50 (3B küre: oyuncu ülkesi kırmızıdan bej'e dönüyordu; headless ile pikselle doğrulandı):
- Sebep: v30.js küre kaplaması yalnızca G.plCol/sahipler değişince yeniden boyanıyordu; ülke onaylanınca (G.pl) imza aynı kaldığından kaplama seçim öncesi bej halinde kaldı.
- Düzeltme: v30.js ownSig() ve sig() imzalarına G.pl eklendi; imza değişince 3B blok (kapak/duvar) renkleri de yenilenir (colorEx).
- Fetih sonrası iki ülkenin kırmızı olması bu imza üzerinden de çalışır; fetih senaryosu bu turda ayrıca denenmedi.

V51: .github/workflows/build-apk.yml eklendi (GitHub Actions ile bulutta APK derler, yatay kilit manifeste eklenir). Burada Android SDK/internet olmadığından çalıştırılmadı, test edilmedi.

V52: GitHub web yükleme sınırı (100 dosya) için www/flags -> kök flags.zip (workflow derlemede www/ içine açar), www/tests çıkarıldı.
