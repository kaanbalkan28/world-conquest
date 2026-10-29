V7 değişiklikleri: v7.js + v7.css (index.html'e eklendi). Mevcut dosyalar korunmuştur.
- Ülkeyi oyuncu seçer (radar grafik + tarihçe cümlesi, "Bu Ülkeyle Başla / Başka Ülke Seç"); kamera Türkiye çevresinden başlar.
- Bayraklar ülke geometrisine kırpılarak harita üzerinde; fetihte eski bayrak küçülüp silinir, yeni bayrak belirir.
- Yeni savaş ekranı: kılıç çarpışması, krem zarlar, çarpan ve beş özellik karşılaştırması; yeni tazminat/özellik kopyalama ekranı.
- Yüzen "Turu Bitir" düğmesi. Testler: tests/ (node tests/rules5_test.js; python3 tests/e2e_v7_*.py, Playwright).

V29: v29.js + v29.css — oyun içi duraklatma menüsü (tur/bölge/altın özeti, Oyuna Dön, Kaydet), parşömen stilinde ayarlar (anahtarlı düğmeler, bölümler, Geri) ve parşömen onay penceresi. Mevcut işlevler aynen çağrılır.
Not: animation-audio.js, animation-sprites.js, animations.js dosyaları tamamen sıfır baytla dolu (40 MB), index.html bunları yüklemiyor.

V30: v30.js + v30.css + globe/ — 3B küre görünümü. Sağ üstteki "3B" düğmesi küreyi açar/kapar (varsayılan: 2B). Küre oyunun kendi verisini (R, ownerOf/col, TG, G.sel, pickC) kullanır; kurallar değişmedi. Küre dosyaları (globe/three.min.js, globe/data.js) ilk açılışta yüklenir. v30.js başındaki DEFAULT_3D=true ile oyun küreyle açılır.
