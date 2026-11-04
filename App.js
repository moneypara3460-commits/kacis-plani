import React, { useEffect, useMemo, useRef, useState, memo, useCallback } from "react";
import {
  View, Text, Pressable, StyleSheet, SafeAreaView, StatusBar, Animated, Easing, Modal, useWindowDimensions
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { parseLevel, newState, move, moveTo, toggleFlag, pathTo, zeroSafe, starsFor, neighbors4, START_LIVES } from "./engine";
import { LEVELS } from "./levels";
import { playSfx } from "./sound";

const STORE_KEY = "kacis-plani-v1";
const NUM_COLORS = ["#fff", "#6ea8ff", "#5fd68a", "#ff6b6b", "#b388ff", "#ffb347", "#4dd0e1", "#ffffff", "#aaaaaa"];
const CONFETTI = ["#ffd86b", "#ff6b6b", "#6bd6ff", "#9bff8f", "#ff9bf0", "#ffffff"];

// ---------- Tek kare ----------
const Tile = memo(function Tile({ ch, vis, cnt, flag, rev, opened, zs, ghost, taken, size }) {
  if (ch === "#") {
    return <View style={{ width: size, height: size, padding: 1 }}>
      <View style={{ flex: 1, borderRadius: size * .14, backgroundColor: "#3b4170", borderTopWidth: 2, borderTopColor: "#5a62a0", borderBottomWidth: 3, borderBottomColor: "#262a4d" }} />
    </View>;
  }
  const special = ch === "E" || (ch === "D" && !opened) || (ch === "K" && !taken);
  let bg = vis ? "#2d3559" : "#171b30";
  let border = vis ? "#3b4574" : "#232844";
  let icon = null;
  if (ch === "E") { bg = "#1b5a42"; border = "#3fe0a0"; icon = "🏁"; }
  else if (ch === "D" && !opened) { bg = "#58421a"; border = "#e8b84a"; icon = "🚪"; }
  else if (ch === "K" && !taken) { icon = "🔑"; }
  if (rev) { bg = "#6a2030"; border = "#ff5a7a"; icon = "💥"; }
  else if (ghost && ch === "T") { bg = "#2a1a26"; icon = "💣"; }
  else if (flag) { icon = "🚩"; }
  const showNum = vis && !special && cnt > 0;
  return <View style={{ width: size, height: size, padding: 1 }}>
    <View style={{ flex: 1, borderRadius: size * .18, backgroundColor: bg, borderWidth: 1.5, borderColor: border, alignItems: "center", justifyContent: "center" }}>
      {icon && <Text style={{ fontSize: size * .5, opacity: ghost && !rev ? .55 : 1 }}>{icon}</Text>}
      {showNum && <Text style={{ fontSize: size * .52, fontWeight: "900", color: NUM_COLORS[cnt] }}>{cnt}</Text>}
      {zs && !vis && !icon && <View style={{ width: size * .16, height: size * .16, borderRadius: size, backgroundColor: "#5fd68a", opacity: .75 }} />}
    </View>
  </View>;
});

// ---------- Konfeti ----------
function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 26 }, (_, i) => ({
    x: Math.random(), delay: Math.random() * 500, dur: 1400 + Math.random() * 1200,
    color: CONFETTI[i % CONFETTI.length], size: 6 + Math.random() * 6, rot: Math.random() * 360, v: new Animated.Value(0)
  })), []);
  useEffect(() => {
    pieces.forEach(p => Animated.timing(p.v, { toValue: 1, duration: p.dur, delay: p.delay, easing: Easing.in(Easing.quad), useNativeDriver: true }).start());
  }, []);
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    {pieces.map((p, i) => <Animated.View key={i} style={{
      position: "absolute", left: (p.x * 100) + "%", top: -20, width: p.size, height: p.size * 1.6, backgroundColor: p.color, borderRadius: 2,
      opacity: p.v.interpolate({ inputRange: [0, .1, .9, 1], outputRange: [0, 1, 1, 0] }),
      transform: [{ translateY: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, 520] }) }, { rotate: p.v.interpolate({ inputRange: [0, 1], outputRange: [p.rot + "deg", p.rot + 540 + "deg"] }) }]
    }} />)}
  </View>;
}

const Btn = ({ label, onPress, style, textStyle, disabled }) => (
  <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [st.btn, style, pressed && { opacity: .7, transform: [{ scale: .96 }] }, disabled && { opacity: .35 }]}>
    <Text style={[st.btnText, textStyle]}>{label}</Text>
  </Pressable>
);

// ---------- Ana uygulama ----------
export default function App() {
  const { width, height } = useWindowDimensions();
  const [lvIdx, setLvIdx] = useState(0);
  const lv = useMemo(() => parseLevel(LEVELS[lvIdx].rows), [lvIdx]);
  const [s, setS] = useState(() => newState(parseLevel(LEVELS[0].rows)));
  const sRef = useRef(s);
  const lvRef = useRef(lv); lvRef.current = lv;
  const lvIdxRef = useRef(0); lvIdxRef.current = lvIdx;
  const cellRef = useRef(40);
  const [flagMode, setFlagMode] = useState(false);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const [best, setBest] = useState({});
  const [picker, setPicker] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const walkTimer = useRef(null);

  const shake = useRef(new Animated.Value(0)).current;
  const px = useRef(new Animated.Value(0)).current, py = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  const boardPx = Math.max(220, Math.min(width - 16, height - 330, 440));
  const cell = Math.floor(boardPx / lv.w);
  cellRef.current = cell;
  const bw = cell * lv.w, bh = cell * lv.h;

  const sfx = useCallback(n => { if (!mutedRef.current) playSfx(n); }, []);
  const say = useCallback((msg, color) => {
    setToast({ msg, color });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1500);
  }, []);
  const cancelWalk = () => { clearTimeout(walkTimer.current); walkTimer.current = null; };

  // Kayıtlı ilerleme
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORE_KEY);
        if (raw) { const d = JSON.parse(raw); if (d.best) setBest(d.best); if (d.muted) { setMuted(true); mutedRef.current = true; } }
      } catch (e) {}
    })();
    return () => { cancelWalk(); clearTimeout(toastTimer.current); };
  }, []);
  const save = (b, m) => { try { AsyncStorage.setItem(STORE_KEY, JSON.stringify({ best: b, muted: m })); } catch (e) {} };

  // Oyuncu konumu animasyonu
  const placePlayer = (pos, animate) => {
    const l = lvRef.current, c0 = cellRef.current, tx = (pos % l.w) * c0, ty = Math.floor(pos / l.w) * c0;
    if (!animate) { px.setValue(tx); py.setValue(ty); return; }
    Animated.parallel([
      Animated.timing(px, { toValue: tx, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      Animated.timing(py, { toValue: ty, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: false })
    ]).start();
  };
  useEffect(() => { placePlayer(sRef.current.pos, false); }, [lvIdx, cell]);

  const doShake = () => {
    shake.setValue(0);
    Animated.sequence([-1, 1, -.7, .7, -.3, 0].map(v => Animated.timing(shake, { toValue: v, duration: 50, useNativeDriver: true }))).start();
  };

  const apply = useCallback((r) => {
    const prev = sRef.current;
    if (r.s !== prev) {
      sRef.current = r.s; setS(r.s);
      if (r.s.pos !== prev.pos) placePlayer(r.s.pos, true);
    }
    switch (r.ev) {
      case "step": sfx("step"); break;
      case "key": sfx("key"); say("🔑 Anahtar alındı!", "#ffd86b"); break;
      case "door": sfx("door"); say("🚪 Kapı açıldı!", "#ffd86b"); break;
      case "locked": sfx("locked"); say("Kilitli! Önce anahtarı bul 🔑", "#ffb347"); cancelWalk(); break;
      case "flag": sfx("locked"); say("🚩 Bayraklı kareye basılmaz", "#ffb347"); cancelWalk(); break;
      case "trap": sfx("trap"); doShake(); cancelWalk(); say("💥 Tuzak! Bir can gitti", "#ff6b6b"); break;
      case "lose": sfx("trap"); doShake(); cancelWalk(); setTimeout(() => sfx("lose"), 350); break;
      case "win": {
        cancelWalk(); sfx("win");
        const stars = starsFor(r.s.lost), idx = lvIdxRef.current;
        setBest(b => { const nb = { ...b, [idx]: Math.max(b[idx] || 0, stars) }; save(nb, mutedRef.current); return nb; });
        break;
      }
    }
  }, []);

  const go = dir => { cancelWalk(); apply(move(lvRef.current, sRef.current, dir)); };

  const startLevel = (i) => {
    cancelWalk(); setToast(null); setFlagMode(false);
    const l = parseLevel(LEVELS[i].rows);
    const ns = newState(l);
    lvRef.current = l; sRef.current = ns; lvIdxRef.current = i;
    setLvIdx(i); setS(ns);
  };
  const restart = () => startLevel(lvIdxRef.current);

  const walk = (dirs) => {
    cancelWalk();
    let k = 0;
    const tick = () => {
      if (k >= dirs.length) { walkTimer.current = null; return; }
      const r = move(lvRef.current, sRef.current, dirs[k++]);
      apply(r);
      if (r.ev === "step") walkTimer.current = setTimeout(tick, 95);
    };
    tick();
  };

  const onTile = (i) => {
    const cur = sRef.current, l = lvRef.current;
    if (cur.status !== "play") return;
    if (flagMode) {
      const n = toggleFlag(l, cur, i);
      if (n !== cur) { sRef.current = n; setS(n); sfx("flag"); }
      return;
    }
    if (i === cur.pos) return;
    if (neighbors4(l, cur.pos).includes(i)) { cancelWalk(); apply(moveTo(l, cur, i)); return; }
    const p = pathTo(l, cur, i);
    if (p) walk(p);
  };
  const onTileLong = (i) => {
    const cur = sRef.current, n = toggleFlag(lvRef.current, cur, i);
    if (n !== cur) { cancelWalk(); sRef.current = n; setS(n); sfx("flag"); }
  };

  const zs = useMemo(() => zeroSafe(lv, s), [lv, s]);
  const lost = s.status === "lost", won = s.status === "won";
  const stars = won ? starsFor(s.lost) : 0;
  const totalStars = Object.values(best).reduce((a, b) => a + b, 0);
  const flagsUsed = s.flags.reduce((a, b) => a + b, 0);
  const curNum = lv.nb[s.pos];

  const tiles = [];
  for (let i = 0; i < lv.cells.length; i++) {
    const c = i % lv.w, r = (i - c) / lv.w;
    tiles.push(<Pressable key={i} onPress={() => onTile(i)} onLongPress={() => onTileLong(i)} delayLongPress={260}
      style={{ position: "absolute", left: c * cell, top: r * cell }}>
      <Tile ch={lv.cells[i]} vis={!!s.visited[i]} cnt={lv.nb[i]} flag={!!s.flags[i]} rev={!!s.revealed[i]}
        opened={!!s.opened[i]} zs={!!zs[i]} ghost={lost && !s.revealed[i]} taken={!!s.taken[i]} size={cell} />
    </Pressable>);
  }

  const dpad = (label, dir) => <Btn label={label} onPress={() => go(dir)} style={st.dbtn} textStyle={{ fontSize: 26 }} disabled={s.status !== "play" || flagMode} />;
  const heartsText = Array.from({ length: START_LIVES }, (_, i) => i < s.lives ? "❤️" : "🖤").join(" ");

  return (
    <SafeAreaView style={st.root}>
      <StatusBar barStyle="light-content" />
      <View style={st.top}>
        <Btn label="☰" onPress={() => setPicker(true)} style={st.small} />
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={st.title}>{lvIdx + 1}. {LEVELS[lvIdx].name}</Text>
          <Text style={st.sub}>{heartsText}   {s.keys > 0 ? "🔑 ×" + s.keys + "   " : ""}💣 {lv.traps}   🚩 {flagsUsed}</Text>
        </View>
        <Btn label={muted ? "🔇" : "🔊"} onPress={() => { const m = !muted; setMuted(m); mutedRef.current = m; save(best, m); }} style={st.small} />
      </View>
      <Text style={st.hint}>{LEVELS[lvIdx].hint}</Text>

      <View style={{ alignItems: "center", marginTop: 6 }}>
        <Animated.View style={{ width: bw + 8, height: bh + 8, padding: 4, borderRadius: 14, backgroundColor: "#0a0c18", borderWidth: 2, borderColor: flagMode ? "#ffd86b" : "#2e3560", transform: [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-9, 9] }) }] }}>
          <View style={{ width: bw, height: bh }}>
            {tiles}
            {/* Oyuncu: üstünde bulunduğu karenin sayısını taşır */}
            <Animated.View pointerEvents="none" style={{ position: "absolute", width: cell, height: cell, padding: cell * .12, left: px, top: py, opacity: lost ? .35 : 1 }}>
              <View style={{ flex: 1, borderRadius: cell, backgroundColor: "#ff9f2e", borderWidth: 2, borderColor: "#ffe0a8", alignItems: "center", justifyContent: "center", shadowColor: "#ff9f2e", shadowOpacity: 1, shadowRadius: 8 }}>
                <Text style={{ fontSize: cell * .4, fontWeight: "900", color: curNum > 0 ? "#2b1405" : "#7a4a10" }}>{curNum}</Text>
              </View>
            </Animated.View>
          </View>
          {won && <Confetti />}
          {(won || lost) && <View style={st.overlay}>
            <Text style={st.ovTitle}>{won ? "KAÇTIN! 🎉" : "YAKALANDIN 💀"}</Text>
            {won && <Text style={st.ovStars}>{"★".repeat(stars)}<Text style={{ color: "#555b80" }}>{"★".repeat(3 - stars)}</Text></Text>}
            <Text style={st.ovSub}>{won ? (s.lost === 0 ? "Hiç can kaybetmedin!" : s.lost + " can kaybettin") : "Tuzakların yerini şimdi görüyorsun. Bir daha dene!"}</Text>
            <View style={{ flexDirection: "row", marginTop: 12 }}>
              <Btn label="↻ Tekrar" onPress={restart} style={st.ovBtn} />
              {won && lvIdx < LEVELS.length - 1 && <Btn label="Sonraki ▶" onPress={() => startLevel(lvIdx + 1)} style={[st.ovBtn, { backgroundColor: "#1f8f64", borderColor: "#5dffb0" }]} />}
            </View>
          </View>}
        </Animated.View>
      </View>

      <View style={st.toastBox}>{toast && <Text style={[st.toast, { color: toast.color }]}>{toast.msg}</Text>}</View>

      <View style={st.controls}>
        <View style={{ width: 3 * 58 }}>
          <View style={{ alignItems: "center" }}>{dpad("▲", 0)}</View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>{dpad("◀", 3)}{dpad("▼", 2)}{dpad("▶", 1)}</View>
        </View>
        <View style={{ flex: 1, alignItems: "flex-end", justifyContent: "center" }}>
          <Btn label={flagMode ? "🚩 Bayrak: AÇIK" : "🚩 Bayrak"} onPress={() => setFlagMode(f => !f)} style={[st.side, flagMode && { backgroundColor: "#7a5b10", borderColor: "#ffd86b" }]} />
          <Btn label="↻ Yeniden" onPress={restart} style={st.side} />
        </View>
      </View>

      <Modal visible={picker} transparent animationType="fade" onRequestClose={() => setPicker(false)}>
        <View style={st.modalBg}>
          <View style={st.modal}>
            <Text style={st.ovTitle}>Bölümler</Text>
            <Text style={[st.ovSub, { marginBottom: 10 }]}>Toplam ★ {totalStars} / {LEVELS.length * 3}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center" }}>
              {LEVELS.map((L, i) => (
                <Pressable key={i} onPress={() => { setPicker(false); startLevel(i); }} style={[st.lvBtn, i === lvIdx && { borderColor: "#ffd86b" }]}>
                  <Text style={st.lvNum}>{i + 1}</Text>
                  <Text style={{ fontSize: 11, color: best[i] ? "#ffd86b" : "#555b80" }}>{best[i] ? "★".repeat(best[i]) : "—"}</Text>
                </Pressable>
              ))}
            </View>
            <Btn label="Kapat" onPress={() => setPicker(false)} style={{ marginTop: 14 }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0d0f1c" },
  top: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingTop: 8 },
  title: { color: "#fff", fontSize: 18, fontWeight: "800" },
  sub: { color: "#aab2d8", fontSize: 14, marginTop: 2 },
  hint: { color: "#8f98c8", fontSize: 12.5, textAlign: "center", marginTop: 6, paddingHorizontal: 18, minHeight: 32 },
  btn: { backgroundColor: "#242a4a", borderRadius: 12, borderWidth: 1.5, borderColor: "#3b4574", paddingVertical: 10, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  small: { width: 46, height: 42, paddingVertical: 0, paddingHorizontal: 0 },
  dbtn: { width: 54, height: 50, margin: 2, paddingVertical: 0, paddingHorizontal: 0 },
  side: { marginVertical: 4, minWidth: 140 },
  controls: { flexDirection: "row", paddingHorizontal: 14, paddingTop: 2, alignItems: "center" },
  toastBox: { height: 24, alignItems: "center", justifyContent: "center", marginTop: 4 },
  toast: { fontSize: 15, fontWeight: "800" },
  overlay: { position: "absolute", left: 4, right: 4, top: 4, bottom: 4, borderRadius: 12, backgroundColor: "rgba(8,10,22,.82)", alignItems: "center", justifyContent: "center", padding: 14 },
  ovTitle: { color: "#fff", fontSize: 26, fontWeight: "900", textAlign: "center" },
  ovStars: { color: "#ffd86b", fontSize: 38, marginTop: 4 },
  ovSub: { color: "#c3c9e8", fontSize: 14, textAlign: "center", marginTop: 4 },
  ovBtn: { marginHorizontal: 6 },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,.7)", alignItems: "center", justifyContent: "center", padding: 20 },
  modal: { backgroundColor: "#141831", borderRadius: 18, borderWidth: 2, borderColor: "#3b4574", padding: 18, alignItems: "center", width: "100%", maxWidth: 380 },
  lvBtn: { width: 64, height: 60, margin: 5, borderRadius: 12, backgroundColor: "#242a4a", borderWidth: 2, borderColor: "#3b4574", alignItems: "center", justifyContent: "center" },
  lvNum: { color: "#fff", fontSize: 20, fontWeight: "800" }
});
