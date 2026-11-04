// KAÇIŞ PLANI bölümleri (tools/build.js ile üretildi, hepsi tahmin gerektirmeden çözülebilir)
// # duvar, . zemin, S başlangıç, E çıkış, T gizli tuzak, K anahtar, D kilitli kapı
export const LEVELS = [
 {
  "name": "İlk Adım",
  "hint": "Sayı, çevresindeki 8 karede kaç tuzak olduğunu söyler.",
  "rows": [
  "#######",
  "#..E#.#",
  "#T#..T#",
  "#.....#",
  "#S..T.#",
  "#....T#",
  "#######"
  ]
 },
 {
  "name": "Sayılar",
  "hint": "0 görürsen çevren tamamen güvenlidir.",
  "rows": [
  "#######",
  "#S.T..#",
  "#...T.#",
  "#...T##",
  "#TT.E##",
  "#.T..##",
  "#######"
  ]
 },
 {
  "name": "Bayrak",
  "hint": "Tuzak olduğundan eminsen 🚩 koy, yanlışlıkla basma.",
  "rows": [
  "########",
  "#TTTTTE#",
  "#..T.T.#",
  "#S...T.#",
  "#......#",
  "#T####.#",
  "#.T..#.#",
  "########"
  ]
 },
 {
  "name": "Anahtar",
  "hint": "Anahtarı al, kilitli kapıyı aç. Her anahtar bir kapı açar.",
  "rows": [
  "########",
  "#.KTTTT#",
  "#S.T.#.#",
  "#....#.#",
  "####D###",
  "###....#",
  "#TTTE.##",
  "########"
  ]
 },
 {
  "name": "Yan Yana",
  "hint": "İki sayıyı birlikte düşün: biri diğerinin içindeyse fark ortaya çıkar.",
  "rows": [
  "#########",
  "#.T.T..T#",
  "#TT.T.TE#",
  "#T...T..#",
  "#..T.T#.#",
  "#..#.T#.#",
  "##T.....#",
  "#T..S####",
  "#########"
  ]
 },
 {
  "name": "Dar Geçit",
  "hint": "Kapının önünde tuzaklar var, anahtara dikkat.",
  "rows": [
  "#########",
  "#TTT#..##",
  "#T..#.T.#",
  "###SD.#T#",
  "##..#.T.#",
  "#...#..T#",
  "#..T#..T#",
  "#TKT##.E#",
  "#########"
  ]
 },
 {
  "name": "Mayın Tarlası",
  "hint": "Sayılardan tuzakları tek tek bul.",
  "rows": [
  "#########",
  "#......##",
  "#...T.S.#",
  "#.T.T...#",
  "#.##T.T.#",
  "#ETTTTTT#",
  "#T..#.#T#",
  "#T###T..#",
  "#########"
  ]
 },
 {
  "name": "Çifte Kilit",
  "hint": "İki kapı, iki anahtar.",
  "rows": [
  "##########",
  "#.....####",
  "#T..KS..##",
  "####D#####",
  "#....K.T.#",
  "#..TTTT###",
  "#D########",
  "#ET.T.TTT#",
  "##..TT.###",
  "##########"
  ]
 },
 {
  "name": "Labirent",
  "hint": "Duvarlar sayıları değiştirir; sadece zemin karelerinde tuzak olur.",
  "rows": [
  "##########",
  "###..#..##",
  "#.TKT##.##",
  "###..D.T.#",
  "#TT..#.ET#",
  "#..T.#T.##",
  "#....#.T##",
  "#..T##T.T#",
  "#S..##...#",
  "##########"
  ]
 },
 {
  "name": "Karanlık Koridor",
  "hint": "Biraz sabır: önce güvenli yerleri aç, sonra ilerle.",
  "rows": [
  "###########",
  "#..TT...TT#",
  "#S..#.#.K##",
  "##.T...#.T#",
  "##......T.#",
  "#T.##...T.#",
  "#######D###",
  "#TT..T....#",
  "#...T..##.#",
  "#.#.TE.#.T#",
  "###########"
  ]
 },
 {
  "name": "Anahtar Avı",
  "hint": "Anahtar da bir ödül, ona giden yol da tehlikeli.",
  "rows": [
  "###########",
  "###T.#TTTE#",
  "#T#..#....#",
  "#.##T#..T##",
  "#..T.D...T#",
  "#....#..#T#",
  "#.S.##TT.T#",
  "#....#.#..#",
  "#T..T##.T##",
  "#...K##.T##",
  "###########"
  ]
 },
 {
  "name": "Kaçış Planı",
  "hint": "Son bölüm. Tüm bilgiyi kullan.",
  "rows": [
  "###########",
  "##...S#T..#",
  "#..#.K..T##",
  "#D#########",
  "#....TT...#",
  "#..TT.T##.#",
  "#...K...TT#",
  "##D########",
  "#...T..T###",
  "#ETT.#.T###",
  "###########"
  ]
 }
];
