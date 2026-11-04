# KAÇIŞ PLANI

Gizli tuzaklarla dolu bir labirentten kaçış oyunu. Her hamlede bir kare yürürsün; tuzaklar görünmez ama izlerini sayılardan okuyabilirsin.

## Nasıl oynanır
- **Okları** kullan ya da **bir kareye dokun**. Yanındaki kareye dokunursan yürürsün, daha önce bastığın uzak bir kareye dokunursan oraya otomatik yürürsün.
- Bastığın karede (turuncu topun içinde ve zeminde) bir **sayı** çıkar: çevresindeki 8 karede kaç tuzak olduğunu gösterir. Mayın Tarlası gibi.
- **0** çıkarsa çevrendeki her yer güvenlidir (yeşil noktalarla işaretlenir).
- Tuzaklar sadece boş zemin karelerinde olur. 🔑, 🚪, 🏁 ve başlangıç karesinde asla tuzak yoktur.
- Tuzağa basarsan **bir can** gidersin (3 canın var), tuzak ortaya çıkar ve yerinde kalırsın.
- 🔑 anahtar bir kilitli 🚪 kapıyı açar. Her anahtar tek kapı açar.
- Tuzak olduğundan eminsen **🚩 bayrak** koy (düğme ya da kareye uzun basış). Bayraklı kareye basılamaz.
- 🏁 çıkışa ulaş. Hiç can kaybetmezsen 3 yıldız, 1 can 2 yıldız, fazlası 1 yıldız.

Her bölüm tahmin gerektirmeden, sadece sayılarla çözülebilir. Bölümleri bir bilgisayar ajanı doğrular (aşağıya bak).

## Dosyalar
- `App.js` ekran ve etkileşim
- `engine.js` oyun kuralları (ekrandan bağımsız)
- `levels.js` bölümler (`#` duvar, `.` zemin, `S` başlangıç, `E` çıkış, `T` gizli tuzak, `K` anahtar, `D` kapı)
- `sound.js` ses efektleri (dosya yok, kodla üretilir)
- `tools/agent.js` Mayın Tarlası mantığıyla (temel kural + alt küme kuralı) bölümü tahmin etmeden çözmeye çalışır
- `tools/gen.js`, `tools/build.js` bölüm üretici: `node tools/build.js` ile `levels.js` yeniden yazılır
- `tools/check.js` tüm bölümleri kontrol eder, `tools/test.js` kural testleri

Expo Snack'e git deposundan aktarılabilir.

## Sıradaki fikirler
Kutu itme engeli, ışınlanma kareleri, kapanan tuzaklar, 2 oyunculu "tuzak kur / kaç" modu.
