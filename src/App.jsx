import React, { useState, useEffect, useRef, useCallback } from "react";
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Polyline, Circle, useMapEvents, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function playWarningAudio(msg) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);

    if (msg && window.speechSynthesis) {
        window.speechSynthesis.cancel(); // Clears any hanging queue in Chrome/Edge
        const u = new SpeechSynthesisUtterance(msg);
        u.lang = "id-ID";
        u.rate = 1.1;
        window.speechSynthesis.speak(u);
    }
  } catch (e) {
    console.error("Audio playback failed", e);
  }
}

function speakText(msg) {
  if (window.ttsEnabled === false) return;
  try {
    if (msg && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(msg);
      u.lang = "id-ID";
      u.rate = 1.1;
      window.speechSynthesis.speak(u);
    }
  } catch (e) {
    console.error("TTS failed", e);
  }
}


/* ─────────────────────────────────────────────────────────────────────────
   GLOBAL STYLES — injected once into <head>
───────────────────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;500;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --void: #05070D;
  --base: #090C17;
  --panel: #0C1120;
  --card: #111827;
  --hover: #172033;
  --cyan: #00D4FF;
  --cyan2: #007BA8;
  --cyan-glow: rgba(0,212,255,0.18);
  --amber: #FFB020;
  --amber-glow: rgba(255,176,32,0.18);
  --green: #00E87A;
  --green-glow: rgba(0,232,122,0.18);
  --red: #FF4444;
  --red-glow: rgba(255,68,68,0.18);
  --text: #E2EEFF;
  --text2: #6B87AF;
  --text3: #3A4E6B;
  --border: #1A2840;
  --border2: #243552;
}

/* Deuteranopia Palette */
:root.colorblind-deuteranopia {
  --green: #0072B2 !important; /* Cobalt Blue */
  --green-glow: rgba(0,114,178,0.3) !important;
  --amber: #F0E442 !important; /* Bright Yellow */
  --amber-glow: rgba(240,228,66,0.3) !important;
  --red: #D55E00 !important;   /* Vermillion Orange */
  --red-glow: rgba(213,94,0,0.35) !important;
  --cyan: #56B4E9 !important;  /* Sky Blue */
  --cyan-glow: rgba(86,180,233,0.3) !important;
}

/* Protanopia Palette */
:root.colorblind-protanopia {
  --green: #377eb8 !important; /* Clear Blue */
  --green-glow: rgba(55,126,184,0.3) !important;
  --amber: #fdbf6f !important; /* Light Orange */
  --amber-glow: rgba(253,191,111,0.3) !important;
  --red: #ff3333 !important;   /* High-Luminance Red */
  --red-glow: rgba(255,51,51,0.35) !important;
  --cyan: #e31a1c !important;  /* Brick Red */
  --cyan-glow: rgba(227,26,28,0.3) !important;
}

/* Tritanopia Palette */
:root.colorblind-tritanopia {
  --green: #05b3c3 !important; /* Teal */
  --green-glow: rgba(5,179,195,0.3) !important;
  --amber: #e41a1c !important; /* Pure Red contrast */
  --amber-glow: rgba(228,26,28,0.3) !important;
  --red: #f781bf !important;   /* High-Contrast Pink */
  --red-glow: rgba(247,129,191,0.35) !important;
  --cyan: #ff7f00 !important;  /* Orange */
  --cyan-glow: rgba(255,127,0,0.3) !important;
}

html, body, #root { height: 100%; overflow: hidden; }
body { font-family: 'Exo 2', sans-serif; background: var(--void); color: var(--text); }
.mono { font-family: 'JetBrains Mono', monospace; }

/* Scrollbar */
::-webkit-scrollbar { width: 3px; height: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

/* Scanline overlay */
.scanlines::after {
  content:''; position:fixed; inset:0; pointer-events:none; z-index:9000;
  background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px);
}

/* Grid background */
.grid-bg {
  background-image: linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px);
  background-size: 28px 28px;
}

/* Glow utilities */
.glow-c { box-shadow: 0 0 24px var(--cyan-glow), inset 0 0 16px rgba(0,212,255,0.04); }
.glow-a { box-shadow: 0 0 24px var(--amber-glow); }
.glow-g { box-shadow: 0 0 16px var(--green-glow); }
.glow-r { box-shadow: 0 0 16px var(--red-glow); }
.tglow-c { text-shadow: 0 0 12px var(--cyan), 0 0 24px rgba(0,212,255,0.4); }
.tglow-a { text-shadow: 0 0 12px var(--amber); }
.tglow-g { text-shadow: 0 0 12px var(--green); }
.tglow-r { text-shadow: 0 0 12px var(--red); }

/* Animations */
@keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.35} }
@keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0}   }
@keyframes spin   { to{transform:rotate(360deg)}          }
@keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes slideR { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
@keyframes slideL { from{opacity:0;transform:translateX(12px)}  to{opacity:1;transform:translateX(0)} }
@keyframes ping   { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(2.5);opacity:0} }
@keyframes scanH  { 0%{top:0} 100%{top:100%} }
@keyframes waveform { 0%,100%{height:4px} 50%{height:14px} }
@keyframes drift  { 0%,100%{transform:translate(0,0)} 30%{transform:translate(3px,-2px)} 70%{transform:translate(-2px,3px)} }

.anim-pulse  { animation: pulse 2s ease-in-out infinite; }
.anim-blink  { animation: blink 1s step-end infinite; }
.anim-spin   { animation: spin 1.2s linear infinite; }
.anim-fade   { animation: fadeUp .3s ease-out both; }
.anim-slideR { animation: slideR .3s ease-out both; }
.anim-slideL { animation: slideL .3s ease-out both; }
.anim-drift  { animation: drift 4s ease-in-out infinite; }

/* Buttons */
.btn {
  display:inline-flex; align-items:center; justify-content:center; gap:6px;
  padding:7px 16px; border-radius:4px; font-family:'Exo 2',sans-serif;
  font-weight:600; font-size:12px; letter-spacing:.06em; text-transform:uppercase;
  cursor:pointer; border:none; transition:all .2s;
}
.btn-c { background:linear-gradient(135deg,rgba(0,212,255,.18),rgba(0,123,168,.1)); border:1px solid var(--cyan); color:var(--cyan); }
.btn-c:hover { background:linear-gradient(135deg,rgba(0,212,255,.28),rgba(0,123,168,.18)); box-shadow:0 0 20px var(--cyan-glow); }
.btn-a { background:linear-gradient(135deg,rgba(255,176,32,.18),rgba(204,136,0,.1)); border:1px solid var(--amber); color:var(--amber); }
.btn-a:hover { background:linear-gradient(135deg,rgba(255,176,32,.28),rgba(204,136,0,.18)); box-shadow:0 0 20px var(--amber-glow); }
.btn-g { background:linear-gradient(135deg,rgba(0,232,122,.18),rgba(0,170,88,.1)); border:1px solid var(--green); color:var(--green); }
.btn-g:hover { background:linear-gradient(135deg,rgba(0,232,122,.28),rgba(0,170,88,.18)); box-shadow:0 0 20px var(--green-glow); }
.btn-r { background:linear-gradient(135deg,rgba(255,68,68,.18),rgba(200,30,30,.1)); border:1px solid var(--red); color:var(--red); }
.btn-r:hover { background:linear-gradient(135deg,rgba(255,68,68,.28),rgba(200,30,30,.18)); box-shadow:0 0 20px var(--red-glow); }
.btn-ghost { background:transparent; border:1px solid var(--border2); color:var(--text2); }
.btn-ghost:hover { border-color:var(--cyan); color:var(--cyan); }
.btn:disabled { opacity:.35; cursor:not-allowed; }

/* Phase tab */
.phase-tab { padding:8px 18px; font-size:11px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; cursor:pointer; border-bottom:2px solid transparent; color:var(--text2); transition:all .2s; }
.phase-tab:hover { color:var(--text); }
.phase-tab.active { color:var(--cyan); border-bottom-color:var(--cyan); background:linear-gradient(180deg,rgba(0,212,255,.08) 0%,transparent 100%); }

/* Checklist item */
.chk-item { padding:10px 12px; border:1px solid var(--border); border-radius:6px; background:var(--card); display:flex; align-items:center; gap:10px; cursor:pointer; transition:all .2s; user-select:none; }
.chk-item:hover { background:var(--hover); }
.chk-item.ok  { border-color:rgba(0,232,122,.3); }
.chk-item.warn{ border-color:rgba(255,176,32,.35); }

/* Chat bubbles */
.bubble-user { background:linear-gradient(135deg,rgba(0,212,255,.14),rgba(0,123,168,.08)); border:1px solid rgba(0,212,255,.22); border-radius:12px 12px 2px 12px; }
.bubble-ai   { background:var(--card); border:1px solid var(--border); border-radius:12px 12px 12px 2px; }
.bubble-sys  { background:linear-gradient(135deg,rgba(0,232,122,.1),rgba(0,170,88,.05)); border:1px solid rgba(0,232,122,.2); border-radius:8px; text-align:center; }
.bubble-rej  { background:linear-gradient(135deg,rgba(255,68,68,.12),rgba(200,30,30,.06)); border:1px solid rgba(255,68,68,.3); border-radius:8px; }

/* Metric card */
.metric { background:var(--card); border:1px solid var(--border); border-radius:8px; padding:14px 16px; transition:all .2s; }
.metric:hover { border-color:var(--border2); background:var(--hover); }

/* Alert item */
.alert-warn { background:linear-gradient(90deg,rgba(255,176,32,.1),transparent); border-left:2px solid var(--amber); }
.alert-info { background:linear-gradient(90deg,rgba(0,212,255,.08),transparent); border-left:2px solid var(--cyan); }
.alert-good { background:linear-gradient(90deg,rgba(0,232,122,.08),transparent); border-left:2px solid var(--green); }

/* MAVLink code block */
.mavlink-block { background:#060A14; border:1px solid rgba(0,212,255,.2); border-radius:6px; padding:10px 12px; }

/* NLI input */
.nli-input { background:var(--card); border:1px solid var(--border2); color:var(--text); font-family:'Exo 2',sans-serif; font-size:13px; border-radius:6px; padding:10px 14px; width:100%; outline:none; transition:border .2s; }
.nli-input:focus { border-color:var(--cyan); box-shadow:0 0 0 2px rgba(0,212,255,.12); }
.nli-input::placeholder { color:var(--text3); }

/* Confidence bar */
.conf-track { height:3px; background:var(--border2); border-radius:2px; overflow:hidden; }
.conf-high { height:100%; width:94%; background:var(--green); border-radius:2px; }
.conf-med  { height:100%; width:62%; background:var(--amber); border-radius:2px; }
.conf-low  { height:100%; width:22%; background:var(--red); border-radius:2px; }

/* Battery cell bar */
.cell-bar { height:5px; border-radius:3px; background:var(--border2); overflow:hidden; }
.cell-fill { height:100%; background:linear-gradient(90deg,var(--green),var(--cyan)); border-radius:3px; transition:width .5s ease; }

/* Status dot */
.dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.dot-g { background:var(--green); box-shadow:0 0 6px var(--green-glow); animation:pulse 2.5s infinite; }
.dot-a { background:var(--amber); box-shadow:0 0 6px var(--amber-glow); animation:pulse 2s infinite; }
.dot-r { background:var(--red);   box-shadow:0 0 6px var(--red-glow);   animation:pulse 1s infinite; }
.dot-d { background:var(--text3); }

/* Overlay backdrop */
.overlay { position:fixed; inset:0; background:rgba(5,7,13,.82); backdrop-filter:blur(8px); z-index:1000; display:flex; align-items:center; justify-content:center; }

/* Sidebar nav item */
.nav-item { display:flex; align-items:center; gap:8px; padding:7px 12px; border-radius:5px; font-size:12px; font-weight:500; color:var(--text2); cursor:pointer; transition:all .2s; }
.nav-item:hover { background:var(--hover); color:var(--text); }
.nav-item.active { background:rgba(0,212,255,.1); color:var(--cyan); border-left:2px solid var(--cyan); padding-left:10px; }

/* Waveform bars (loading) */
.wave-bar { width:3px; border-radius:2px; background:var(--cyan); }
.wave-bar:nth-child(1) { animation:waveform .8s ease-in-out infinite; }
.wave-bar:nth-child(2) { animation:waveform .8s ease-in-out .1s infinite; }
.wave-bar:nth-child(3) { animation:waveform .8s ease-in-out .2s infinite; }
.wave-bar:nth-child(4) { animation:waveform .8s ease-in-out .3s infinite; }
.wave-bar:nth-child(5) { animation:waveform .8s ease-in-out .4s infinite; }

/* Section label */
.sec-label { font-size:9px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; color:var(--text3); margin-bottom:6px; }

/* Custom Leaflet Popup Overrides */
.leaflet-popup-content-wrapper {
  background: var(--panel) !important;
  color: var(--text) !important;
  border: 1px solid var(--border) !important;
  border-radius: 8px !important;
  padding: 0 !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.6) !important;
}
.leaflet-popup-content {
  margin: 0 !important;
  padding: 10px 14px !important;
}
.leaflet-popup-tip {
  background: var(--panel) !important;
  border: 1px solid var(--border) !important;
}
.leaflet-popup-close-button {
  color: var(--text2) !important;
  font-size: 14px !important;
  padding: 8px !important;
}
.leaflet-popup-close-button:hover {
  color: var(--red) !important;
  background: transparent !important;
}
`;

/* ─────────────────────────────────────────────────────────────────────────
   CONSTANTS & DATA
───────────────────────────────────────────────────────────────────────── */
const CHECKLIST = [
  { id:"bat",  icon:"⚡", label:"Baterai",             desc:"Level ≥ 80% & tegangan stabil",  status:"ok",   detail:"Cell total: 3.80V · Overall OK" },
  { id:"gps",  icon:"🛰", label:"GPS Lock",             desc:"Min. 8 satelit, HDOP < 1.5",     status:"ok",   detail:"30 satelit · HDOP: 0.9 · OK" },
  { id:"comp", icon:"🧭", label:"Compass Calibration",  desc:"Tidak ada interferensi magnetik", status:"ok",   detail:"Current state → OK" },
  { id:"mot",  icon:"⚙", label:"Motor & Propeller",    desc:"Propeller terpasang, tidak aus",  status:"ok",   detail:"Rotation test confirmed → OK" },
  { id:"tele", icon:"📡", label:"Telemetri & RC Link",  desc:"RSSI > −80 dBm, link stabil",    status:"ok",   detail:"RSSI: −62 dBm · Sinyal kuat" },
  { id:"wx",   icon:"🌤", label:"Kondisi Cuaca",        desc:"Angin ≤ 10 m/s, tidak hujan",    status:"warn", detail:"⚠ 8.2 m/s · Mendekati batas aman" },
  { id:"mis",  icon:"🗺", label:"Mission Plan",         desc:"Waypoint tervalidasi",            status:"ok",   detail:"5 waypoints · Route OK" },
  { id:"fs",   icon:"🛡", label:"Failsafe Setting",     desc:"RTL & batas baterai dikonfig.",  status:"ok",   detail:"RTL configured & tested → OK" },
  { id:"home", icon:"🏠", label:"Home Point",           desc:"Lokasi home tersimpan benar",     status:"ok",   detail:"Home point locked · Verified" },
];

const WAYPOINTS = [
  { id:"WP1", label:"Start",      x:12,  y:74, pct: 100 },
  { id:"WP2", label:"Chk-A",      x:28,  y:46, pct: 100 },
  { id:"WP3", label:"Survey",     x:52,  y:28, pct:  60 },
  { id:"WP4", label:"Chk-B",      x:72,  y:54, pct:   0 },
  { id:"WP5", label:"Landing",    x:87,  y:73, pct:   0 },
];

const ROUTE_PATH = "M 12 74 Q 20 60 28 46 Q 40 37 52 28 Q 62 41 72 54 Q 80 64 87 73";

const AI_ALERTS_INIT = [
  { id:1, type:"warn", text:"Angin kencang terdeteksi di WP4 (8.2 m/s). Pertimbangkan turun ke 40 m untuk menghindari turbulensi.", time:"12:34" },
  { id:2, type:"info", text:"Rute alternatif tersedia menghindari zona angin. Estimasi hemat baterai ~8%.",                            time:"12:35" },
  { id:3, type:"good", text:"GPS lock stabil. 30 satelit aktif. HDOP optimal.",                                                        time:"12:36" },
];

/* NLI intent matching */
function resolveNLI(input, batt) {
  const t = input.toLowerCase();
  if (["abaikan","ignore","paksa","force","bypass","skip safety"].some(k=>t.includes(k)))
    return {
      text:"⛔ PERINTAH DITOLAK — Safety Validation Layer memblokir eksekusi.",
      safe:false, conf:"HIGH",
      reject:{ reason:"Perintah melanggar batas keselamatan operasional.",
               detail:`Konsumsi rute ini (35%) melebihi sisa daya (${Math.round(batt)}%) yang diperlukan untuk RTL.`,
               suggest:"Revisi perintah dengan parameter aman, atau tunggu pengisian baterai." }
    };
  if (["rtl","pulang","return","kembali"].some(k=>t.includes(k)))
    return {
      text:"Menginisiasi Return to Launch (RTL). Drone akan kembali ke Home Point secara otomatis.",
      safe:true, conf:"HIGH",
      mavlink:["SET_MODE         RTL","NAV_RETURN_TO_LAUNCH"],
      hitl:{ summary:`Drone kembali ke Home Point. Estimasi: 3m 20s. Baterai tiba: ~${Math.max(batt-12,5).toFixed(0)}%.`, time:"3m 20s", batt:`~${Math.max(batt-12,5).toFixed(0)}%`, action:"Konfirmasi RTL" }
    };
  if (["loiter","hover","diam","tahan","hold"].some(k=>t.includes(k)))
    return {
      text:"Mengaktifkan mode LOITER. Drone mempertahankan posisi & ketinggian saat ini.",
      safe:true, conf:"HIGH",
      mavlink:["SET_MODE         LOITER","NAV_LOITER_UNLIM lat=-6.200 lon=106.816"],
      hitl:{ summary:"Drone berhenti dan melayang di posisi saat ini.", time:"~0s", batt:`${Math.round(batt)}%`, action:"Konfirmasi Loiter" }
    };
  if (["hindari","avoid","terbangkan","wp4","waypoint","navigasi","fly","pergi"].some(k=>t.includes(k)))
    return {
      text:"Perintah diterima. Terdeteksi zona angin kencang (8.2 m/s). Rute telah dioptimasi. MAVLink siap dikirim:",
      safe:true, conf:"MEDIUM",
      mavlink:[
        "SET_MODE         AUTO",
        "NAV_WAYPOINT     lat=-6.200 lon=106.816",
        "                 alt=50  frame=GLOBAL_REL",
        "DO_CHANGE_SPEED  speedType=0 speed=5.0",
        "CONDITION_YAW    heading=auto",
        "NAV_AVOID_ZONE   lat=-6.198 r=150m",
      ],
      hitl:{ summary:`Drone berpindah ke WP4 ~0.3 km. Rute dideviasi menghindari zona angin 8.2 m/s.`, time:"4m 10s", batt:`~${Math.max(batt-22,5).toFixed(0)}%`, action:"Konfirmasi & Kirim" }
    };
  if (["baterai","battery","daya","power"].some(k=>t.includes(k)))
    return {
      text:`Berdasarkan jarak ke WP4 dan konsumsi rata-rata, estimasi baterai tersisa adalah **${Math.max(Math.round(batt)-22,5)}% (±5%)**. ${batt-22>20?"Masih mencukupi untuk RTL ✓":"⚠ Mendekati batas RTL minimum."}`,
      safe:true, conf:"HIGH", mavlink:null
    };
  return {
    text:"Saya butuh informasi lebih spesifik. Bisakah sebutkan koordinat tujuan atau waypoint yang dimaksud?",
    safe:true, conf:"LOW", mavlink:null, clarify:true
  };
}

/* ─────────────────────────────────────────────────────────────────────────
   SMALL REUSABLE PIECES
───────────────────────────────────────────────────────────────────────── */
const Dot = ({t="g"}) => <span className={`dot dot-${t}`}/>;
const Sec = ({children}) => <p className="sec-label">{children}</p>;
const Divider = () => <div style={{height:1,background:"var(--border)",margin:"8px 0"}}/>;

function ConfBar({level}) {
  const map = {HIGH:"high",MEDIUM:"med",LOW:"low"};
  const col = {HIGH:"var(--green)",MEDIUM:"var(--amber)",LOW:"var(--red)"};
  return (
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div className="conf-track" style={{flex:1}}>
        <div className={`conf-${map[level]||"low"}`}/>
      </div>
      <span style={{fontSize:10,fontWeight:700,color:col[level]||"var(--red)",fontFamily:"JetBrains Mono,monospace",letterSpacing:".06em"}}>{level}</span>
    </div>
  );
}

function MAVBlock({lines}) {
  return (
    <div className="mavlink-block anim-fade">
      <div style={{fontSize:9,fontWeight:700,letterSpacing:".15em",color:"var(--cyan)",marginBottom:6,opacity:.7}}>✦ MAVLINK COMMAND PREVIEW</div>
      {lines.map((l,i)=>(
        <div key={i} className="mono" style={{fontSize:11,color:"var(--green)",lineHeight:1.7,opacity:i===0?1:.85}}>{l}</div>
      ))}
    </div>
  );
}

function SafetyBadge({passed}) {
  return passed ? (
    <div style={{display:"flex",alignItems:"center",gap:5,background:"rgba(0,232,122,.12)",border:"1px solid rgba(0,232,122,.3)",borderRadius:4,padding:"3px 8px"}}>
      <span style={{fontSize:10}}>✓</span>
      <span style={{fontSize:10,fontWeight:700,color:"var(--green)",letterSpacing:".08em"}}>SAFETY CHECK PASSED</span>
    </div>
  ) : (
    <div style={{display:"flex",alignItems:"center",gap:5,background:"rgba(255,68,68,.12)",border:"1px solid rgba(255,68,68,.3)",borderRadius:4,padding:"3px 8px"}}>
      <span style={{fontSize:10}}>⛔</span>
      <span style={{fontSize:10,fontWeight:700,color:"var(--red)",letterSpacing:".08em"}}>SAFETY VALIDATION FAILED</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   HEADER
───────────────────────────────────────────────────────────────────────── */
function Header({phase,setPhase,nliOpen,setNliOpen,telemetry,armed,apiKey,handleApiKeyChange,colorblindMode,setColorblindMode,ttsEnabled,setTtsEnabled,setShortcutsGuideOpen}) {
  const phases = ["preflight","inflight","landing"];
  const labels = {"preflight":"Pre-Flight","inflight":"In-Flight","landing":"Landing"};
  return (
    <header style={{height:52,background:"var(--panel)",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",flexShrink:0,position:"relative",zIndex:100}}>
      {/* Logo */}
      <div style={{width:200,padding:"0 16px",display:"flex",alignItems:"center",gap:8,borderRight:"1px solid var(--border)",height:"100%",flexShrink:0}}>
        <div style={{width:28,height:28,borderRadius:6,background:"linear-gradient(135deg,var(--cyan),#0088AA)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>✈</div>
        <div>
          <div style={{fontSize:13,fontWeight:800,letterSpacing:".12em",color:"var(--text)"}}>
            <span style={{color:"var(--cyan)"}}>AERO</span>DASHBOARD
          </div>
          <div style={{fontSize:9,color:"var(--text3)",letterSpacing:".12em",fontWeight:600}}>NLI · MISSION PLANNER</div>
        </div>
      </div>

      {/* Status band */}
      <div style={{display:"flex",alignItems:"center",gap:4,padding:"0 12px",borderRight:"1px solid var(--border)",height:"100%"}}>
        <Dot t={armed?"g":"d"}/>
        <span style={{fontSize:10,fontWeight:700,color:armed?"var(--green)":"var(--text3)",letterSpacing:".08em"}}>{armed?"ARMED":"DISARMED"}</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:4,padding:"0 12px",borderRight:"1px solid var(--border)",height:"100%"}}>
        <Dot t="g"/>
        <span style={{fontSize:10,fontWeight:600,color:"var(--text2)"}} className="mono">{telemetry.mode}</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:4,padding:"0 12px",borderRight:"1px solid var(--border)",height:"100%"}}>
        <span style={{fontSize:10,color:"var(--text3)"}}>GPS</span>
        <span style={{fontSize:10,fontWeight:700,color:"var(--cyan)"}} className="mono">{telemetry.gps} sat</span>
      </div>

      {/* Flight Phase Timeline Tracker */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,height:"100%"}}>
        {phases.map((p, idx) => {
          const isActive = phase === p;
          const isCompleted = (phase === "inflight" && idx === 0) || (phase === "landing" && idx < 2);
          
          let stateColor = "var(--text3)";
          if (isActive) {
            stateColor = p === "preflight" ? "var(--green)" : p === "inflight" ? "var(--amber)" : "var(--cyan)";
          } else if (isCompleted) {
            stateColor = "var(--cyan)";
          }

          return (
            <React.Fragment key={p}>
              <button 
                onClick={() => setPhase(p)} 
                style={{
                  background: isActive ? "rgba(255,255,255,0.02)" : "none",
                  border: isActive ? `1px solid ${stateColor}` : "1px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  position: "relative",
                  cursor: "pointer",
                  padding: "5px 12px",
                  borderRadius: 100,
                  transition: "all 0.25s ease",
                  boxShadow: isActive ? `0 0 12px rgba(0,0,0,0.5)` : "none"
                }}
              >
                {/* Status Dot / Checkmark */}
                <div 
                  className={isActive ? (p === "preflight" ? "dot-g" : p === "inflight" ? "dot-a" : "dot-r") : ""} 
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: isCompleted ? "var(--cyan)" : isActive ? stateColor : "var(--text3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 8,
                    color: "#05070D"
                  }}
                >
                  {isCompleted && <span style={{fontSize:7,fontWeight:900,color:"#05070D",lineHeight:1}}>✓</span>}
                </div>
                
                {/* Step Label */}
                <span style={{
                  fontSize: 10,
                  fontWeight: isActive ? 800 : 500,
                  letterSpacing: ".08em",
                  color: isActive ? "var(--text)" : isCompleted ? "var(--text2)" : "var(--text3)",
                  textTransform: "uppercase"
                }}>
                  {labels[p]}
                </span>

                {/* Sub-label showing system status */}
                {isActive && (
                  <span style={{
                    fontSize: 8,
                    fontWeight: 800,
                    color: "#05070D",
                    background: stateColor,
                    letterSpacing: ".05em",
                    padding: "1px 5px",
                    borderRadius: 3,
                    lineHeight: 1
                  }}>
                    {p === "preflight" ? "READY" : p === "inflight" ? "ACTIVE" : "DESCENT"}
                  </span>
                )}
              </button>
              
              {/* Connector Arrow */}
              {idx < 2 && (
                <span style={{ fontSize: 9, color: isCompleted ? "var(--cyan)" : "var(--text3)", opacity: 0.5 }}>➔</span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Accessibility Toolbar */}
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"0 12px",borderLeft:"1px solid var(--border)",height:"100%"}}>
        {/* Colorblind Dropdown */}
        <select
          value={colorblindMode}
          onChange={(e) => {
            const mode = e.target.value;
            setColorblindMode(mode);
            if (mode === "none") speakText("Kembali ke mode normal.");
            else if (mode === "deuteranopia") speakText("Mode Deuteranopia diaktifkan.");
            else if (mode === "protanopia") speakText("Mode Protanopia diaktifkan.");
            else if (mode === "tritanopia") speakText("Mode Tritanopia diaktifkan.");
          }}
          style={{
            background: colorblindMode !== "none" ? "rgba(0,114,178,0.15)" : "none",
            border: `1px solid ${colorblindMode !== "none" ? "var(--green)" : "var(--border)"}`,
            borderRadius: 4,
            padding: "4px 6px",
            fontSize: 9,
            color: colorblindMode !== "none" ? "var(--green)" : "var(--text2)",
            cursor: "pointer",
            fontWeight: 700,
            outline: "none",
            transition: "all 0.2s"
          }}
          title="Select Colorblind Mode (Shortcut: C to cycle)"
        >
          <option value="none" style={{background:"var(--panel)",color:"var(--text)"}}>👁️ Normal Mode</option>
          <option value="deuteranopia" style={{background:"var(--panel)",color:"var(--text)"}}>👁️ Deuteranopia</option>
          <option value="protanopia" style={{background:"var(--panel)",color:"var(--text)"}}>👁️ Protanopia</option>
          <option value="tritanopia" style={{background:"var(--panel)",color:"var(--text)"}}>👁️ Tritanopia</option>
        </select>

        {/* TTS Toggle */}
        <button 
          onClick={() => {
            setTtsEnabled(v => !v);
            if (!ttsEnabled) {
              window.ttsEnabled = true;
              speakText("Suara asisten diaktifkan.");
            }
          }}
          style={{
            background: ttsEnabled ? "rgba(0,212,255,0.08)" : "none",
            border: `1px solid ${ttsEnabled ? "var(--cyan)" : "var(--border)"}`,
            borderRadius: 4,
            padding: "4px 8px",
            fontSize: 9,
            color: ttsEnabled ? "var(--cyan)" : "var(--text3)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontWeight: 700,
            transition: "all 0.2s"
          }}
          title="Toggle TTS Voice (Shortcut: V)"
        >
          🔊 {ttsEnabled ? "TTS ON" : "TTS Muted"}
        </button>

        {/* Key Guide Trigger */}
        <button 
          onClick={() => setShortcutsGuideOpen(v => !v)}
          style={{
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: 4,
            padding: "4px 8px",
            fontSize: 9,
            color: "var(--text2)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontWeight: 700,
            transition: "all 0.2s"
          }}
          title="Keyboard Shortcuts Cheatsheet (Shortcut: H)"
        >
          ⌨️ Shortcuts [H]
        </button>
      </div>

      {/* NLI toggle + time */}
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"0 16px",borderLeft:"1px solid var(--border)",height:"100%"}}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', padding: '4px 8px', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 10, color: 'var(--text2)', marginRight: 6 }}>API:</span>
          <input 
            type="password" 
            placeholder="Gemini API Key" 
            value={apiKey} 
            onChange={handleApiKeyChange}
            style={{ background: 'transparent', border: 'none', color: 'var(--cyan)', outline: 'none', width: '90px', fontSize: '11px', fontFamily: 'JetBrains Mono' }}
          />
        </div>
        <button
          className={`btn ${nliOpen?"btn-c":"btn-ghost"}`}
          onClick={()=>setNliOpen(v=>!v)}
          style={{fontSize:11,padding:"5px 12px"}}
          aria-label={nliOpen ? "Tutup panel Natural Language Interface" : "Buka panel Natural Language Interface"}
          aria-expanded={nliOpen}
        >
          {nliOpen?"✕ Tutup NLI":"💬 NLI"}
          {nliOpen&&<span className="anim-blink" style={{fontSize:8,marginLeft:2}}>●</span>}
        </button>
        <div style={{textAlign:"right"}}>
          <div className="mono" style={{fontSize:12,color:"var(--cyan)",fontWeight:700}}>{telemetry.time}</div>
          <div style={{fontSize:9,color:"var(--text3)",letterSpacing:".08em"}}>UTC+7</div>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────────────────────────────────── */
function Sidebar({phase,armed,telemetry,activeView,setActiveView}) {
  const sel = activeView;
  const setSel = setActiveView;
  const navItems = [
    {id:"map",  icon:"🗺",  label:"Map & Route"},
    {id:"tele", icon:"📡",  label:"Telemetri",  badge:armed?"LIVE":null},
    {id:"fpv",  icon:"📷",  label:"FPV Camera"},
    {id:"wp",   icon:"📍",  label:"Waypoints"},
  ];
  const sysItems = [
    {id:"param",icon:"⚙",  label:"Parameters",  badge:"24"},
    {id:"fs",   icon:"🛡",  label:"Failsafe"},
    {id:"log",  icon:"📋",  label:"Data Log"},
  ];
  const misItems = [
    {id:"mp",   icon:"✈",  label:"Mission Plan"},
    {id:"rtlc", icon:"🏠",  label:"RTL Config"},
  ];
  return (
    <aside style={{width:192,background:"var(--panel)",borderRight:"1px solid var(--border)",display:"flex",flexDirection:"column",flexShrink:0,overflow:"hidden"}}>
      <div style={{flex:1,overflowY:"auto",padding:10}}>
        <Sec>Navigation</Sec>
        {navItems.map(n=>(
          <div key={n.id} className={`nav-item ${sel===n.id?"active":""}`} onClick={()=>setSel(n.id)}>
            <span style={{fontSize:13}}>{n.icon}</span>
            <span style={{flex:1}}>{n.label}</span>
            {n.badge&&<span style={{fontSize:9,background:"var(--cyan)",color:"#000",borderRadius:3,padding:"1px 4px",fontWeight:800}}>{n.badge}</span>}
          </div>
        ))}
        <div style={{height:10}}/>
        <Sec>System</Sec>
        {sysItems.map(n=>(
          <div key={n.id} className={`nav-item ${sel===n.id?"active":""}`} onClick={()=>setSel(n.id)}>
            <span style={{fontSize:13}}>{n.icon}</span>
            <span style={{flex:1}}>{n.label}</span>
            {n.badge&&<span style={{fontSize:9,background:"rgba(0,212,255,.18)",color:"var(--cyan)",borderRadius:3,padding:"1px 4px",fontWeight:700}}>{n.badge}</span>}
          </div>
        ))}
        <div style={{height:10}}/>
        <Sec>Mission</Sec>
        {misItems.map(n=>(
          <div key={n.id} className={`nav-item ${sel===n.id?"active":""}`} onClick={()=>setSel(n.id)}>
            <span style={{fontSize:13}}>{n.icon}</span>
            <span style={{flex:1}}>{n.label}</span>
          </div>
        ))}
      </div>
      {/* Drone Status */}
      <div style={{borderTop:"1px solid var(--border)",padding:10}}>
        <Sec>Drone Status</Sec>
        {[
          ["Armed",  armed?"ACTIVE":"DISARMED", armed?"var(--green)":"var(--text3)"],
          ["Mode",   telemetry.mode,             "var(--cyan)"],
          ["GPS Fix",`${telemetry.gps} (${telemetry.gps>=20?"14":"8"} sat)`,"var(--text)"],
          ["RSSI",   `${telemetry.rssi} dBm`,   telemetry.rssi>-80?"var(--green)":"var(--amber)"],
        ].map(([k,v,c])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:3}}>
            <span style={{color:"var(--text3)"}}>{k}</span>
            <span className="mono" style={{color:c,fontWeight:700}}>{v}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   PRE-FLIGHT VIEW
───────────────────────────────────────────────────────────────────────── */
function PreflightView({checklist,checklistDone,onCheck,canArm,armed,setArmed,setPhase,telemetry,setTelemetry}) {
  const allOk = checklistDone.size >= 8;
  return (
    <div style={{height:"100%",overflowY:"auto",padding:18,display:"flex",flexDirection:"column",gap:14}} className="grid-bg">
      {/* Top metrics */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,flexShrink:0}}>
        {[
          {label:"Rencana Altitude Takeoff", val:"47 m",    sub:"Target: 50 m",           col:"var(--cyan)"},
          {label:"Ground Speed",             val:"8.3 m/s", sub:"✓ Dalam batas aman",      col:"var(--green)"},
          {label:"Baterai",                  val:"62%",     sub:"▲ Estimasi 14 mnt",        col:"var(--amber)"},
          {label:"Jarak Tempuh Rencana",     val:"1.2 km",  sub:"WP1→5",                   col:"var(--cyan)"},
        ].map(m=>(
          <div key={m.label} className="metric" style={{borderRadius:8}}>
            <div style={{fontSize:10,color:"var(--text3)",fontWeight:600,letterSpacing:".06em",marginBottom:4}}>{m.label.toUpperCase()}</div>
            <div className="mono tglow-c" style={{fontSize:26,fontWeight:700,color:m.col,lineHeight:1}}>{m.val}</div>
            <div style={{fontSize:10,color:"var(--text2)",marginTop:4}}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:14,flex:1,minHeight:0}}>
        {/* Checklist */}
        <div style={{display:"flex",flexDirection:"column",gap:10,minHeight:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>⚠ Pre-flight Checklist</div>
              <div style={{fontSize:11,color:"var(--text2)",marginTop:2}}>Selesaikan semua pengecekan sebelum arming drone. Klik item untuk menandai selesai.</div>
            </div>
            <div style={{fontSize:11,color:"var(--text2)"}} className="mono">{checklistDone.size} / {CHECKLIST.length} selesai</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,overflowY:"auto"}}>
            {CHECKLIST.map(c=>{
              const done = checklistDone.has(c.id);
              return (
                <div key={c.id} className={`chk-item ${c.status}`} onClick={()=>onCheck(c.id)}
                  style={{opacity:done?1:.85}}>
                  <div style={{width:20,height:20,borderRadius:4,border:`1.5px solid ${done?"var(--green)":c.status==="warn"?"var(--amber)":"var(--border2)"}`,display:"flex",alignItems:"center",justifyContent:"center",background:done?"rgba(0,232,122,.15)":"transparent",flexShrink:0,transition:"all .2s"}}>
                    {done&&<span style={{color:"var(--green)",fontSize:12,fontWeight:700}}>✓</span>}
                  </div>
                  <div style={{minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
                      <span style={{fontSize:13}}>{c.icon}</span>
                      <span style={{fontSize:11,fontWeight:700,color:done?"var(--green)":c.status==="warn"?"var(--amber)":"var(--text)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.label}</span>
                    </div>
                    <div style={{fontSize:10,color:"var(--text3)",lineHeight:1.4}}>{c.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* ARM button */}
          <div style={{marginTop:4,padding:14,background:"var(--card)",border:`1px solid ${allOk?"rgba(0,232,122,.3)":"var(--border)"}`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"space-between",transition:"all .3s"}}>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:"var(--text)"}}>✈ ARM Drone</div>
              <div style={{fontSize:10,color:"var(--text2)",marginTop:2}}>{allOk?"Semua parameter OK. Siap untuk arming.":"Selesaikan checklist untuk mengaktifkan arming."}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{fontSize:11,color:"var(--text3)"}} className="mono">{checklistDone.size} / {CHECKLIST.length} selesai</div>
              <button
                disabled={!allOk||armed}
                className={`btn ${allOk&&!armed?"btn-g":"btn-ghost"}`}
                style={{fontSize:12,padding:"8px 20px"}}
                onClick={()=>{
                  setArmed(true);
                  setTelemetry(p => ({ ...p, altitude: 10.0, speed: 8.3, battery: 98.0, range: 0.1 }));
                  setTimeout(()=>setPhase("inflight"),400);
                }}
              >
                {armed?"✓ ARMED":"⚡ ARM DRONE"}
              </button>
            </div>
          </div>
        </div>

        {/* Right: AI Analysis + Battery */}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {/* AI Pre-flight Analysis */}
          <div style={{background:"var(--card)",border:"1px solid rgba(0,212,255,.18)",borderRadius:8,padding:14,flex:1}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--cyan)",letterSpacing:".08em",marginBottom:8}}>▲ AI PRE-FLIGHT ANALYSIS</div>
            <div style={{fontSize:11,color:"var(--text2)",lineHeight:1.7}}>
              Parameter operasional (Baterai, GPS, Motor) dalam kondisi nominal. Rute misi valid berdasarkan data telemetri terkini.
            </div>
            <div style={{marginTop:10,padding:10,background:"rgba(255,176,32,.08)",border:"1px solid rgba(255,176,32,.2)",borderRadius:6}}>
              <div style={{fontSize:10,fontWeight:700,color:"var(--amber)",marginBottom:4}}>⚠ PERHATIAN</div>
              <div style={{fontSize:10,color:"var(--text2)",lineHeight:1.6}}>
                Kecepatan angin lokal 8.2 m/s — mendekati batas operasional. Pertimbangkan penurunan altitude 10 m saat melewati WP4.
              </div>
            </div>
            <div style={{marginTop:8}}>
              <ConfBar level="HIGH"/>
              <div style={{fontSize:9,color:"var(--text3)",marginTop:4}}>Confidence AI berdasarkan 9 parameter</div>
            </div>
          </div>
          {/* Battery Cells */}
          <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,padding:14}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--text2)",letterSpacing:".06em",marginBottom:10}}>⚡ BATERAI & POWER</div>
            {[["Cell 1","3.81 V",96],["Cell 2","3.79 V",94]].map(([l,v,p])=>(
              <div key={l} style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:4}}>
                  <span style={{color:"var(--text2)"}}>{l}</span>
                  <span className="mono" style={{color:"var(--cyan)",fontWeight:700}}>{v}</span>
                </div>
                <div className="cell-bar"><div className="cell-fill" style={{width:`${p}%`}}/></div>
              </div>
            ))}
            <Divider/>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
              <span style={{color:"var(--text3)"}}>Total</span>
              <span className="mono" style={{color:"var(--green)",fontWeight:700}}>7.60 V · 62%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   FUNCTIONAL SUB-VIEWS FOR GCS NAVIGATION
───────────────────────────────────────────────────────────────────────── */
function FpvView({ telemetry }) {
  return (
    <div style={{height:"100%",background:"#03050A",position:"relative",border:"1px solid var(--border)",borderRadius:8,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}} className="grid-bg">
      <div style={{position:"absolute",inset:0,background:"radial-gradient(circle, transparent 40%, rgba(0,0,0,0.85))",zIndex:2}}/>
      <div style={{color:"var(--cyan)",fontSize:32,fontWeight:300,position:"relative",zIndex:3,textShadow:"0 0 8px var(--cyan)"}}>
        [ + ]
      </div>
      <div style={{position:"absolute",top:15,left:15,zIndex:3,fontSize:10,color:"var(--cyan)"}} className="mono">
        CAM: FPV_HD_FLIR<br/>
        FPS: 60 / H.264<br/>
        LAT: {telemetry.altitude > 0 ? "LOCK" : "STBY"}
      </div>
      <div style={{position:"absolute",top:15,right:15,zIndex:3,fontSize:10,color:"var(--green)"}} className="mono">
        BATT: {telemetry.battery.toFixed(1)}%<br/>
        RSSI: {telemetry.rssi} dBm<br/>
        VSPD: {telemetry.vspd} m/s
      </div>
      <div style={{position:"absolute",bottom:15,left:"50%",transform:"translateX(-50%)",zIndex:3,fontSize:11,color:"var(--cyan)",textAlign:"center"}} className="mono">
        PITCH: {telemetry.pitch}° | ROLL: {telemetry.roll}°<br/>
        <span style={{fontSize:9,color:"var(--text3)"}}>LIVE FEED FROM GIMBAL-1</span>
      </div>
    </div>
  );
}

function TelemetriView({ telemetry }) {
  return (
    <div style={{height:"100%",overflowY:"auto",padding:18,display:"flex",flexDirection:"column",gap:14}} className="grid-bg">
      <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>📊 Live Telemetry Diagnostics</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {[
          {label:"Pitch & Roll Angle", val:`P: ${telemetry.pitch}° / R: ${telemetry.roll}°`, sub:"Attitude stability normal", col:"var(--cyan)"},
          {label:"Vertical Speed",    val:`${telemetry.vspd} m/s`, sub:"Altitude rate", col:"var(--green)"},
          {label:"RSSI & Signal Quality", val:`${telemetry.rssi} dBm`, sub:"Excellent signal link", col:"var(--green)"},
          {label:"GPS Precision",    val:`HDOP ${telemetry.hdop}`, sub:`${telemetry.gps} Satellites`, col:"var(--cyan)"},
          {label:"Internal Temp",    val:`${telemetry.temp} °C`, sub:"Core temperature nominal", col:"var(--amber)"},
          {label:"Battery Cells",    val:"7.60 V (2S)", sub:"Cell imbalance: 0.02 V", col:"var(--cyan)"},
        ].map(m=>(
          <div key={m.label} className="metric">
            <div style={{fontSize:9,color:"var(--text3)",fontWeight:700,letterSpacing:".08em",marginBottom:4}}>{m.label.toUpperCase()}</div>
            <div className="mono tglow-c" style={{fontSize:20,fontWeight:700,color:m.col}}>{m.val}</div>
            <div style={{fontSize:10,color:"var(--text2)",marginTop:4}}>{m.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WaypointsView({ customRoute, setCustomRoute }) {
  return (
    <div style={{height:"100%",overflowY:"auto",padding:18,display:"flex",flexDirection:"column",gap:14}} className="grid-bg">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>📍 Waypoint Route Planner</div>
          <div style={{fontSize:11,color:"var(--text2)",marginTop:2}}>Daftar titik koordinat misi yang diplot di peta.</div>
        </div>
        <button onClick={()=>setCustomRoute([])} className="btn btn-r" style={{fontSize:10,padding:"6px 12px"}} disabled={customRoute.length===0}>
          🗑 Hapus Semua Rute
        </button>
      </div>
      <div style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:8,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,textAlign:"left"}}>
          <thead>
            <tr style={{background:"rgba(0,0,0,0.3)",borderBottom:"1px solid var(--border)"}}>
              <th style={{padding:"8px 12px",color:"var(--text3)"}}>WP Index</th>
              <th style={{padding:"8px 12px",color:"var(--text3)"}}>Latitude</th>
              <th style={{padding:"8px 12px",color:"var(--text3)"}}>Longitude</th>
              <th style={{padding:"8px 12px",color:"var(--text3)",textAlign:"right"}}>Action</th>
            </tr>
          </thead>
          <tbody>
            {customRoute.length === 0 ? (
              <tr>
                <td colSpan={4} style={{padding:20,textAlign:"center",color:"var(--text3)"}}>Belum ada waypoint. Klik peta satelit untuk menambahkan.</td>
              </tr>
            ) : (
              customRoute.map((pt, idx) => (
                <tr key={idx} style={{borderBottom:"1px solid var(--border)"}}>
                  <td style={{padding:"8px 12px",color:"var(--cyan)",fontWeight:700}}>WP {idx === 0 ? "1 (Takeoff)" : idx === customRoute.length-1 ? `${idx+1} (Landing)` : idx+1}</td>
                  <td className="mono" style={{padding:"8px 12px"}}>{pt[0].toFixed(6)}</td>
                  <td className="mono" style={{padding:"8px 12px"}}>{pt[1].toFixed(6)}</td>
                  <td style={{padding:"8px 12px",textAlign:"right"}}>
                    <button onClick={()=>setCustomRoute(prev=>prev.filter((_,i)=>i!==idx))} style={{background:"transparent",border:"none",color:"var(--red)",cursor:"pointer",fontSize:10}}>Hapus</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ParametersView() {
  const [params, setParams] = useState([
    { name: "WP_RADIUS", val: "2.0 m", desc: "Radius kedekatan waypoint" },
    { name: "RTL_ALT", val: "50.0 m", desc: "Ketinggian aman Return-to-Launch" },
    { name: "FS_BATT_VOLT", val: "7.00 V", desc: "Failsafe tegangan minimum baterai" },
    { name: "GEO_RADIUS", val: "150 m", desc: "Geofence radius zona terbang" },
    { name: "SPEED_CRUISE", val: "8.5 m/s", desc: "Kecepatan terbang nominal drone" }
  ]);
  const handleEdit = (name, currentVal) => {
    const newVal = prompt(`Ubah nilai untuk ${name}:`, currentVal);
    if (newVal) {
      setParams(p => p.map(x => x.name === name ? { ...x, val: newVal } : x));
    }
  };
  return (
    <div style={{height:"100%",overflowY:"auto",padding:18,display:"flex",flexDirection:"column",gap:14}} className="grid-bg">
      <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>⚙ MAVLink Parameter Settings</div>
      <div style={{fontSize:11,color:"var(--text2)",lineHeight:1.5}}>MAVLink registry onboard parameters. Klik baris parameter untuk memodifikasi nilai.</div>
      <div style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:8,overflow:"hidden"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,textAlign:"left"}}>
          <thead>
            <tr style={{background:"rgba(0,0,0,0.3)",borderBottom:"1px solid var(--border)"}}>
              <th style={{padding:"8px 12px",color:"var(--text3)"}}>Parameter Name</th>
              <th style={{padding:"8px 12px",color:"var(--text3)"}}>Value</th>
              <th style={{padding:"8px 12px",color:"var(--text3)"}}>Description</th>
            </tr>
          </thead>
          <tbody>
            {params.map(p => (
              <tr key={p.name} onClick={() => handleEdit(p.name, p.val)} style={{borderBottom:"1px solid var(--border)",cursor:"pointer",transition:"background .15s"}} onMouseOver={e=>e.currentTarget.style.background="var(--hover)"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                <td style={{padding:"8px 12px",color:"var(--cyan)",fontWeight:700}} className="mono">{p.name}</td>
                <td className="mono" style={{padding:"8px 12px",color:"var(--green)",fontWeight:700}}>{p.val}</td>
                <td style={{padding:"8px 12px",color:"var(--text2)"}}>{p.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FailsafeView() {
  const [failsafes, setFailsafes] = useState([
    { id: "bat", label: "Battery Failsafe", desc: "Memicu RTL jika level baterai di bawah 25%", active: true },
    { id: "link", label: "RC Link Loss", desc: "Memicu RTL jika sinyal kendali hilang > 3 detik", active: true },
    { id: "fence", label: "Geofence Violation", desc: "Membatasi drone hanya terbang di area 150m", active: true },
  ]);
  const toggle = (id) => {
    setFailsafes(fs => fs.map(f => f.id === id ? { ...f, active: !f.active } : f));
  };
  return (
    <div style={{height:"100%",overflowY:"auto",padding:18,display:"flex",flexDirection:"column",gap:14}} className="grid-bg">
      <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>🛡 Safety & Failsafe Configuration</div>
      <div style={{fontSize:11,color:"var(--text2)",lineHeight:1.5}}>Atur pemicu pengaman darurat drone. Klik sakelar untuk mengaktifkan/nonaktifkan.</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {failsafes.map(f => (
          <div key={f.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:"var(--text)"}}>{f.label}</div>
              <div style={{fontSize:10,color:"var(--text2)",marginTop:2}}>{f.desc}</div>
            </div>
            <button 
              onClick={() => toggle(f.id)} 
              className={`btn ${f.active ? "btn-g" : "btn-ghost"}`}
              style={{fontSize:10,padding:"6px 14px",minWidth:100}}
            >
              {f.active ? "🟢 ENABLED" : "⚪ DISABLED"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataLogView() {
  const [logs, setLogs] = useState([
    "SYS: System boot up completed successfully.",
    "MAV: Connecting via telemetry radio on COM3 @ 57600bps...",
    "MAV: Connection established. MAVLink version v2.0.",
    "SYS: RC receiver calibrated. RSSI link healthy.",
    "AI: Safety validation layer armed and verified."
  ]);
  useEffect(() => {
    const interval = setInterval(() => {
      const msgs = [
        "MAV: Ping request sent to vehicle",
        "SYS: Sensor calibration check... OK",
        "GPS: Status locked with 30 satellites",
        "MAV: Parameter check WP_RADIUS=2.0... verified",
        "AI: Local wind speed stable at 8.2 m/s"
      ];
      const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
      setLogs(l => [...l, `[${new Date().toTimeString().slice(0, 8)}] ${randomMsg}`].slice(-100));
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  const endRef = useRef();
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  return (
    <div style={{height:"100%",padding:18,display:"flex",flexDirection:"column",gap:10}} className="grid-bg">
      <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>📋 MAVLink Data Console</div>
      <div style={{fontSize:11,color:"var(--text2)"}}>Log data telemetri mentah langsung dari sistem onboard.</div>
      <div style={{flex:1,background:"#03050A",border:"1px solid var(--border)",borderRadius:8,padding:14,overflowY:"auto",fontFamily:"monospace",fontSize:10,color:"var(--green)",lineHeight:1.7}}>
        {logs.map((log, idx) => (
          <div key={idx}>{log}</div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

function MissionPlanView({ checklist, checklistDone }) {
  return (
    <div style={{height:"100%",overflowY:"auto",padding:18,display:"flex",flexDirection:"column",gap:14}} className="grid-bg">
      <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>✈ Preflight Mission Planning</div>
      <div style={{fontSize:11,color:"var(--text2)",lineHeight:1.5}}>Integrasi Parameter Keselamatan Operasional. Status checklist verifikasi saat ini:</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,padding:14}}>
          <div style={{fontSize:11,fontWeight:700,color:"var(--cyan)",marginBottom:10}}>✓ CHECKLIST TERVERIFIKASI ({checklistDone.size}/8)</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {checklist.map(c => {
              const done = checklistDone.has(c.id);
              if (!done) return null;
              return (
                <div key={c.id} style={{fontSize:11,color:"var(--green)",display:"flex",alignItems:"center",gap:6}}>
                  <span>🟢</span>
                  <span>{c.label} — {c.desc}</span>
                </div>
              );
            })}
            {checklistDone.size === 0 && <div style={{fontSize:11,color:"var(--text3)"}}>Belum ada parameter yang terverifikasi.</div>}
          </div>
        </div>
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,padding:14}}>
          <div style={{fontSize:11,fontWeight:700,color:"var(--amber)",marginBottom:10}}>⚠ BELUM TERVERIFIKASI ({8 - checklistDone.size}/8)</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {checklist.map(c => {
              const done = checklistDone.has(c.id);
              if (done) return null;
              return (
                <div key={c.id} style={{fontSize:11,color:"var(--text2)",display:"flex",alignItems:"center",gap:6}}>
                  <span>⚫</span>
                  <span>{c.label} — {c.desc}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function RtlConfigView({ telemetry, setTelemetry }) {
  const [alt, setAlt] = useState(telemetry.targetAlt);
  const handleSave = () => {
    setTelemetry(p => ({ ...p, targetAlt: alt }));
    alert(`Return-to-Launch Altitude disimpan pada ketinggian: ${alt} meter.`);
  };
  return (
    <div style={{height:"100%",overflowY:"auto",padding:18,display:"flex",flexDirection:"column",gap:14}} className="grid-bg">
      <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>🏠 Return to Launch (RTL) Configuration</div>
      <div style={{fontSize:11,color:"var(--text2)"}}>Konfigurasi prosedur darurat otomatis untuk kembali ke titik asal.</div>
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,padding:18,maxWidth:400,display:"flex",flexDirection:"column",gap:12}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"var(--cyan)",marginBottom:6}}>RTL TARGET ALTITUDE</div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <input 
              type="number" 
              value={alt} 
              onChange={e=>setAlt(Number(e.target.value))} 
              style={{background:"#03050A",border:"1px solid var(--border)",color:"var(--text)",padding:"6px 10px",borderRadius:4,fontSize:13,width:100,fontFamily:"monospace"}}
            />
            <span style={{fontSize:12,color:"var(--text2)"}}>Meter</span>
          </div>
          <div style={{fontSize:10,color:"var(--text3)",marginTop:4}}>Ketinggian aman di atas rintangan darat. Rekomendasi: 50m.</div>
        </div>
        <button onClick={handleSave} className="btn btn-g" style={{fontSize:11,padding:"8px 16px",alignSelf:"flex-start"}}>
          Simpan Konfigurasi RTL
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   MISSION MAP HELPERS & COMPONENT
───────────────────────────────────────────────────────────────────────── */
function MapEventsHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function MapViewUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
}

function MissionMap({customRoute,setCustomRoute,dronePos}) {
  const [activeWp, setActiveWp] = useState(null); // { idx, pt }

  return (
    <div style={{position:"relative", height: "100%", width: "100%", background:"#060C18",borderRadius:8,overflow:"hidden",border:"1px solid var(--border)"}}>
      <MapContainer center={[-6.198000, 106.818000]} zoom={16} style={{ height: "100%", width: "100%" }} attributionControl={false} zoomControl={false}>
        <TileLayer url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" />
        <Polyline positions={customRoute} color="var(--cyan)" weight={3} dashArray="5, 10" />
        <Circle center={[-6.197500, 106.818500]} radius={150} pathOptions={{ color: 'var(--amber)', fillColor: 'var(--amber)', fillOpacity: 0.2 }} />
        <MapEventsHandler onMapClick={(latlng) => setCustomRoute(prev => [...prev, latlng])} />
        <MapViewUpdater center={dronePos} />
        
        {customRoute.map((pt, idx) => (
          <Marker 
            key={idx} 
            position={pt} 
            draggable={true}
            eventHandlers={{
              click: () => {
                setActiveWp({ idx, pt });
              },
              dragend: (e) => {
                const marker = e.target;
                const position = marker.getLatLng();
                const newPt = [position.lat, position.lng];
                setCustomRoute(prev => {
                  const nextRoute = [...prev];
                  nextRoute[idx] = newPt;
                  return nextRoute;
                });
                setActiveWp(prev => (prev && prev.idx === idx ? { idx, pt: newPt } : prev));
              }
            }}
          />
        ))}

        {activeWp && (
          <Popup 
            position={activeWp.pt} 
            onClose={() => setActiveWp(null)}
          >
            <div style={{minWidth:140,color:"var(--text)",fontFamily:"'Exo 2', sans-serif"}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--cyan)",marginBottom:4}}>
                {activeWp.idx === 0 ? "TAKEOFF POINT" : activeWp.idx === customRoute.length - 1 ? "RTL / LANDING" : `WAYPOINT ${activeWp.idx + 1}`}
              </div>
              <div style={{fontSize:9,color:"var(--text2)",marginBottom:8,lineHeight:1.4}} className="mono">
                LAT: {activeWp.pt[0].toFixed(6)}<br/>
                LNG: {activeWp.pt[1].toFixed(6)}
              </div>
              <button 
                onClick={(e) => {
                  L.DomEvent.stopPropagation(e);
                  setCustomRoute(prev => prev.filter((_, i) => i !== activeWp.idx));
                  setActiveWp(null);
                }}
                style={{width:"100%",background:"rgba(255,68,68,0.18)",border:"1px solid var(--red)",color:"var(--red)",borderRadius:4,padding:"5px 0",fontSize:9,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:4,transition:"all .2s"}}
                onMouseOver={e=>{e.target.style.background="var(--red)";e.target.style.color="white";}}
                onMouseOut={e=>{e.target.style.background="rgba(255,68,68,0.18)";e.target.style.color="var(--red)";}}
              >
                🗑 Hapus Waypoint
              </button>
            </div>
          </Popup>
        )}

        <Marker position={dronePos} icon={new L.DivIcon({
          html: `<div style="font-size: 24px; text-shadow: 0 0 10px var(--cyan); color: var(--cyan); transform: translate(-12px, -12px);">✈</div>`,
          className: 'drone-icon'
        })} />
      </MapContainer>
      {/* scan line */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,rgba(0,212,255,.4),transparent)",animation:"scanH 4s linear infinite",pointerEvents:"none",zIndex:1000}}/>
      
      {/* Tip Box */}
      <div style={{position:"absolute",top:8,left:10,zIndex:1000,background:"rgba(6,12,24,0.85)",border:"1px solid var(--border)",padding:"6px 10px",borderRadius:6,fontSize:9,color:"var(--text2)",display:"flex",flexDirection:"column",gap:2}}>
        <div style={{fontWeight:700,color:"var(--cyan)"}}>💡 PANDUAN WAYPOINT:</div>
        <div>• Klik Peta: Tambah Waypoint baru</div>
        <div>• Seret (Drag) Pin: Geser posisi Waypoint</div>
        <div>• Klik Pin: Buka Opsi Detail & Hapus</div>
      </div>
      {/* Overlay labels & Reset */}
      <div style={{position:"absolute",bottom:8,left:10,display:"flex",gap:12, zIndex:1000, background:"rgba(0,0,0,0.6)", padding:"4px 8px", borderRadius:4}}>
        {[["var(--cyan)","🔵 Peta aktif"],["rgba(255,176,32,.8)","⚠ Zona angin"]].map(([c,t])=>(
          <div key={t} style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:c}}>{t}</div>
        ))}
      </div>
      <button 
        onClick={() => setCustomRoute([])}
        className="btn btn-ghost" 
        style={{position:"absolute", bottom: 8, right: 10, zIndex: 1000, fontSize: 9, padding: "4px 8px"}}
      >
        Reset Rute
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   IN-FLIGHT VIEW
───────────────────────────────────────────────────────────────────────── */
function InFlightView({telemetry, customRoute, setCustomRoute, dronePos, currentWpIndex}) {
  const metrics = [
    {label:"ALTITUDE",  val:telemetry.altitude.toFixed(1), unit:"m",   sub:`Target ${telemetry.targetAlt} m`, col:"var(--cyan)"},
    {label:"GROUND SPD",val:telemetry.speed.toFixed(1),    unit:"m/s", sub:"✓ Dalam batas aman",              col:"var(--green)"},
    {label:"BATTERY",   val:Math.floor(telemetry.battery), unit:"%",   sub:`▲ Estimasi ${Math.max(Math.floor(telemetry.battery/4.5),1)} mnt`, col:"var(--amber)"},
    {label:"EST. RANGE", val:telemetry.range.toFixed(2),   unit:"km",  sub:`WP ${currentWpIndex + 1}/${customRoute.length}`, col:"var(--cyan)"},
  ];
  return (
    <div style={{height:"100%",overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:10}} className="grid-bg">
      {/* Metrics row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,flexShrink:0}}>
        {metrics.map(m=>(
          <div key={m.label} className="metric">
            <div style={{fontSize:9,color:"var(--text3)",fontWeight:700,letterSpacing:".1em",marginBottom:3}}>{m.label}</div>
            <div style={{display:"flex",alignItems:"baseline",gap:4}}>
              <span className="mono tglow-c" style={{fontSize:30,fontWeight:700,color:m.col,lineHeight:1}}>{m.val}</span>
              <span style={{fontSize:13,color:"var(--text2)",fontWeight:600}}>{m.unit}</span>
            </div>
            <div style={{fontSize:10,color:"var(--text2)",marginTop:4}}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Map + right panels */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 200px",gap:10,flex:1,minHeight:0}}>
        <div style={{display:"flex",flexDirection:"column",gap:6,minHeight:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--text2)"}}>🗺 Peta Misi — Live</div>
            <div style={{display:"flex",gap:6}}>
              <span style={{fontSize:9,color:"var(--text3)"}}>Zoom 17</span>
              <span className="anim-blink" style={{fontSize:9,color:"var(--red)",fontWeight:700}}>● LMF</span>
            </div>
          </div>
          <div style={{flex:1,minHeight:200}}>
            <MissionMap dronePos={dronePos} customRoute={customRoute} setCustomRoute={setCustomRoute}/>
          </div>
        </div>

        {/* Waypoint progress */}
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <Sec>● Waypoint Progress</Sec>
          {customRoute.map((pt, i)=>{
            const done = i < currentWpIndex;
            const active = i === currentWpIndex;
            const label = i === 0 ? "Takeoff Point" : i === customRoute.length - 1 ? "RTL / Landing" : `Waypoint ${i+1}`;
            return (
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"var(--card)",border:`1px solid ${done?"rgba(0,232,122,.25)":active?"rgba(0,212,255,.25)":"var(--border)"}`,borderRadius:6}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:done?"var(--green)":active?"var(--cyan)":"var(--border2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"#000",flexShrink:0}}>
                  {done?"✓":i+1}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:10,fontWeight:700,color:done?"var(--green)":active?"var(--cyan)":"var(--text3)"}}>{`WP ${i+1}`}</div>
                  <div style={{fontSize:9,color:"var(--text3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}</div>
                </div>
                {active&&<span style={{fontSize:9,color:"var(--cyan)"}} className="anim-blink">● LIVE</span>}
                {!done && !active && <span style={{fontSize:9,color:"var(--text3)"}}>–</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   NLI PANEL
───────────────────────────────────────────────────────────────────────── */
function NLIPanel({messages,input,setInput,onSubmit,loading,chatEndRef,telemetry}) {
  const handleKey=(e)=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();onSubmit();} };
  const SUGGESTIONS = [
    "Terbangkan drone ke Thamrin City",
    "Peringatan angin lokal di mana?",
    "Loiter selama 30 detik",
    "RTL sekarang",
    "Batalkan perintah berbahaya"
  ];
  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",overflow:"hidden",background:"var(--panel)",width:"100%"}}>
      {/* NLI header */}
      <div style={{padding:"10px 16px",borderBottom:"1px solid var(--border)",background:"rgba(5,7,13,.4)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:"var(--cyan)",animation:"pulse 2s infinite"}}/>
          <span style={{fontSize:12,fontWeight:700,color:"var(--cyan)",letterSpacing:".05em"}}>NLI COMMAND CONTROL</span>
          <span style={{fontSize:8,color:"var(--text3)",marginLeft:"auto"}}>GEMINI AI</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:10}}>
        {messages.map(m=>(
          <div key={m.id} className="anim-fade" style={{display:"flex",flexDirection:"column",alignItems:m.role==="user"?"flex-end":"flex-start",gap:4}}>
            {m.role!=="system"&&(
              <div style={{fontSize:9,color:"var(--text3)",marginBottom:1}}>{m.role==="user"?"Operator":"AI Assistant"} · {m.time}</div>
            )}
            {m.role==="user"&&(
              <div className="bubble-user" style={{padding:"8px 12px",maxWidth:"85%"}}>
                <div style={{fontSize:11,color:"var(--text)",lineHeight:1.6}}>{m.text}</div>
              </div>
            )}
            {m.role==="ai"&&(
              <div style={{maxWidth:"90%",display:"flex",flexDirection:"column",gap:6}}>
                <div className="bubble-ai" style={{padding:"10px 12px"}}>
                  <div style={{fontSize:11,color:"var(--text)",lineHeight:1.7}}
                    dangerouslySetInnerHTML={{__html:m.text.replace(/\*\*(.+?)\*\*/g,'<strong style="color:var(--cyan)">$1</strong>')}}>
                  </div>
                  {m.data?.safe!==undefined&&<div style={{marginTop:6}}><SafetyBadge passed={m.data.safe}/></div>}
                  {m.data?.conf&&<div style={{marginTop:6}}><ConfBar level={m.data.conf}/></div>}
                  {m.data?.mavlink&&<div style={{marginTop:8}}><MAVBlock lines={m.data.mavlink}/></div>}
                  {m.data?.reject&&(
                    <div className="bubble-rej anim-fade" style={{marginTop:8,padding:"8px 10px"}}>
                      <div style={{fontSize:10,fontWeight:700,color:"var(--red)",marginBottom:4}}>⛔ {m.data.reject.reason}</div>
                      <div style={{fontSize:9,color:"var(--text2)",lineHeight:1.6,marginBottom:4}}>{m.data.reject.detail}</div>
                      <div style={{fontSize:9,color:"var(--amber)"}}>{m.data.reject.suggest}</div>
                    </div>
                  )}
                  {m.data?.hitl&&(
                    <div style={{marginTop:8,padding:"8px 10px",background:"rgba(0,212,255,.06)",border:"1px solid rgba(0,212,255,.2)",borderRadius:6}}>
                      <div style={{fontSize:10,fontWeight:700,color:"var(--cyan)",marginBottom:4}}>🔔 Konfirmasi HitL Diperlukan</div>
                      <div style={{fontSize:9,color:"var(--text2)",lineHeight:1.6,marginBottom:6}}>{m.data.hitl.summary}</div>
                      <div style={{display:"flex",gap:8,fontSize:9}}>
                        <span style={{color:"var(--text3)"}}>⏱ {m.data.hitl.time}</span>
                        <span style={{color:"var(--text3)"}}>🔋 {m.data.hitl.batt}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {m.role==="system"&&(
              <div className="bubble-sys" style={{padding:"6px 14px",width:"100%"}}>
                <span style={{fontSize:10,color:"var(--green)"}}>{m.text}</span>
              </div>
            )}
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px"}}>
            <div style={{display:"flex",gap:2,alignItems:"flex-end",height:16}}>
              {[1,2,3,4,5].map(i=><div key={i} className="wave-bar" style={{height:6}}/>)}
            </div>
            <span style={{fontSize:9,color:"var(--text3)"}}>AI memproses perintah…</span>
          </div>
        )}
        <div ref={chatEndRef}/>
      </div>

      {/* Clickable horizontal suggestions */}
      <div style={{padding:"6px 10px",display:"flex",gap:6,overflowX:"auto",background:"rgba(0,0,0,0.15)",borderTop:"1px solid var(--border)",flexShrink:0}} className="no-scrollbar">
        {SUGGESTIONS.map((s, idx) => (
          <button 
            key={idx} 
            onClick={() => setInput(s)}
            style={{fontSize:9,padding:"4px 8px",background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,color:"var(--cyan)",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{padding:"8px 10px",borderTop:"1px solid var(--border)",flexShrink:0,display:"flex",gap:6,alignItems:"flex-end"}}>
        <textarea
          className="nli-input"
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ketik perintah MAVLink..."
          rows={2}
          style={{resize:"none",lineHeight:1.4,fontSize:11,flex:1}}
        />
        <button
          className="btn btn-c"
          onClick={onSubmit}
          disabled={!input.trim()||loading}
          style={{padding:"8px 12px",flexShrink:0,alignSelf:"stretch",fontSize:11}}
        >
          {loading?"…":"▶"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   RIGHT PANEL
───────────────────────────────────────────────────────────────────────── */
function RightPanel({phase,setPhase,setArmed,setRtlActive,isLoitering,setIsLoitering,telemetry,alerts,onDismissAlert,setNliOpen}) {
  return (
    <aside style={{width:232,background:"var(--panel)",borderLeft:"1px solid var(--border)",display:"flex",flexDirection:"column",flexShrink:0,overflow:"hidden"}}>
      <div style={{flex:1,overflowY:"auto",padding:10}}>
        {/* Battery & Power */}
        <Sec>⚡ BATERAI & POWER</Sec>
        {[["Cell 1","3.81 V",96],["Cell 2","3.79 V",94]].map(([l,v,p])=>(
          <div key={l} style={{marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:3}}>
              <span style={{color:"var(--text2)"}}>{l}</span>
              <span className="mono" style={{color:"var(--cyan)",fontWeight:700}}>{v}</span>
            </div>
            <div className="cell-bar"><div className="cell-fill" style={{width:`${p}%`}}/></div>
          </div>
        ))}
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginTop:6,paddingTop:6,borderTop:"1px solid var(--border)"}}>
          <span style={{color:"var(--text3)"}}>Total</span>
          <span className="mono" style={{color:"var(--green)",fontWeight:700}}>7.60 V · {Math.floor(telemetry.battery)}%</span>
        </div>

        <div style={{height:12}}/>
        {/* AI Alerts */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <Sec style={{marginBottom:0}}>▲ AI ALERTS</Sec>
          <span style={{fontSize:9,color:"var(--text3)"}}>{alerts.length} aktif</span>
        </div>
        {alerts.length===0&&(
          <div style={{fontSize:10,color:"var(--text3)",textAlign:"center",padding:"12px 0"}}>Tidak ada peringatan aktif</div>
        )}
        {alerts.map(a=>(
          <div key={a.id} className={`alert-${a.type} anim-slideL`} style={{marginBottom:6,padding:"7px 8px",borderRadius:5,position:"relative"}}>
            <div style={{paddingRight:16}}>
              <div style={{fontSize:10,color:a.type==="warn"?"var(--amber)":a.type==="good"?"var(--green)":"var(--cyan)",lineHeight:1.6,fontWeight:500}}>{a.text}</div>
              <div style={{fontSize:9,color:"var(--text3)",marginTop:3}}>{a.time}</div>
            </div>
            <button onClick={()=>onDismissAlert(a.id)} style={{position:"absolute",top:5,right:5,background:"none",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:12,padding:0,lineHeight:1}}>×</button>
          </div>
        ))}

        <div style={{height:12}}/>
        {/* Quick Actions */}
        <Sec>⚡ QUICK ACTIONS</Sec>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {[
            isLoitering 
              ? {l:"▶ Resume",c:"btn-g", cb:() => { setIsLoitering(false); speakText("Melanjutkan misi otonom menuju waypoint berikutnya."); }}
              : {l:"⏸ Loiter",c:"btn-ghost", cb:() => { setIsLoitering(true); speakText("Misi dijeda. Drone menahan posisi di udara."); }},
            {l:"🏠 RTL",   c:"btn-a",     cb:() => { setRtlActive(true); speakText("Manual override diaktifkan. Membatalkan misi dan kembali ke pangkalan."); }},
            {l:"⬇ Land",  c:"btn-ghost", cb:() => { setPhase("landing"); setArmed(false); speakText("Manual override diaktifkan. Drone mendarat darurat di posisi saat ini."); }},
            {l:"💬 NLI",   c:"btn-c",     cb:()=>setNliOpen(true)},
          ].map(({l,c,cb})=>(
            <button key={l} className={`btn ${c}`} style={{fontSize:10,padding:"6px"}} onClick={cb}>{l}</button>
          ))}
        </div>

        {/* AI Insight */}
        {phase==="inflight"&&(
          <>
            <div style={{height:12}}/>
            <div style={{background:"rgba(0,212,255,.05)",border:"1px solid rgba(0,212,255,.15)",borderRadius:6,padding:10}}>
              <div style={{fontSize:9,fontWeight:800,color:"var(--cyan)",letterSpacing:".1em",marginBottom:5}}>🤖 AI INSIGHT</div>
              <div style={{fontSize:10,color:"var(--text2)",lineHeight:1.65}}>
                Berdasarkan telemetri, rute menuju WP4 melewati area berangin (8.2 m/s). Pertimbangkan turun ke 40 m untuk menghindari turbulensi.
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   TELEMETRY BAR
───────────────────────────────────────────────────────────────────────── */
function TelemetryBar({telemetry,phase}) {
  const items = [
    {k:"TELEMETRI",v:"AKTIF",c:"var(--green)"},
    {k:"ALT",     v:`${telemetry.altitude.toFixed(1)} m`,      c:"var(--cyan)"},
    {k:"PITCH",   v:`${telemetry.pitch.toFixed(1)}°`,          c:"var(--text)"},
    {k:"ROLL",    v:`${telemetry.roll.toFixed(1)}°`,           c:"var(--text)"},
    {k:"YAW",     v:`${telemetry.yaw}°`,                       c:"var(--text)"},
    {k:"GND SPD", v:`${telemetry.speed.toFixed(2)} m/s`,       c:"var(--green)"},
    {k:"VSPD",    v:`${telemetry.vspd.toFixed(2)} m/s`,        c:"var(--text)"},
    {k:"TEMP",    v:`${telemetry.temp}°C`,                     c:"var(--amber)"},
    {k:"GPS",     v:`${telemetry.gps} sat`,                    c:"var(--cyan)"},
    {k:"RSSI",    v:`${telemetry.rssi} dBm`,                   c:telemetry.rssi>-80?"var(--green)":"var(--amber)"},
  ];
  return (
    <div style={{height:30,background:"var(--void)",borderTop:"1px solid var(--border)",display:"flex",alignItems:"center",padding:"0 16px",gap:0,flexShrink:0,overflow:"hidden"}}>
      {items.map((it,i)=>(
        <div key={it.k} style={{display:"flex",alignItems:"center",gap:4,padding:"0 10px",borderRight:i<items.length-1?"1px solid var(--border)":"none",flexShrink:0}}>
          <span style={{fontSize:8,color:"var(--text3)",fontWeight:700,letterSpacing:".1em"}}>{it.k}</span>
          <span className="mono" style={{fontSize:10,color:it.c,fontWeight:700}}>{it.v}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   HitL CONFIRMATION MODAL
───────────────────────────────────────────────────────────────────────── */
function HitLModal({data,onConfirm,onCancel}) {
  if(!data?.hitl) return null;
  return (
    <div className="overlay">
      <div className="anim-fade" style={{background:"var(--panel)",border:"1px solid rgba(0,212,255,.3)",borderRadius:12,padding:24,width:440,maxWidth:"92vw",boxShadow:"0 0 60px rgba(0,212,255,.12)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <div style={{width:36,height:36,borderRadius:8,background:"rgba(0,212,255,.15)",border:"1px solid var(--cyan)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🔔</div>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:"var(--cyan)"}}>Konfirmasi HitL Diperlukan</div>
            <div style={{fontSize:10,color:"var(--text3)"}}>Human-in-the-Loop — keputusan akhir di tangan Anda</div>
          </div>
        </div>

        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,padding:14,marginBottom:14}}>
          <div style={{fontSize:12,color:"var(--text)",lineHeight:1.7,marginBottom:12}}>{data.hitl.summary}</div>
          <div style={{display:"flex",gap:16}}>
            {[["⏱ Estimasi",data.hitl.time,"var(--cyan)"],["🔋 Baterai",data.hitl.batt,"var(--amber)"],["🎯 Confidence",data.conf,"var(--green)"]].map(([l,v,c])=>(
              <div key={l}>
                <div style={{fontSize:9,color:"var(--text3)",marginBottom:2}}>{l}</div>
                <div className="mono" style={{fontSize:13,fontWeight:700,color:c}}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {data.mavlink&&<div style={{marginBottom:14}}><MAVBlock lines={data.mavlink}/></div>}

        <SafetyBadge passed={data.safe}/>

        <div style={{display:"flex",gap:10,marginTop:16}}>
          <button className="btn btn-ghost" onClick={onCancel} style={{flex:1}}>✕ Batalkan</button>
          <button className="btn btn-g" onClick={onConfirm} style={{flex:2,fontSize:12}}>✓ {data.hitl.action}</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   LANDING VIEW
───────────────────────────────────────────────────────────────────────── */
function LandingView({telemetry,setPhase,setArmed}) {
  return (
    <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:20}} className="grid-bg">
      <div style={{textAlign:"center",padding:"30px 40px",background:"var(--card)",border:"1px solid rgba(0,232,122,.3)",borderRadius:12,maxWidth:480}} className="glow-g anim-fade">
        <div style={{fontSize:48,marginBottom:10}}>🏁</div>
        <div style={{fontSize:18,fontWeight:800,color:"var(--green)",marginBottom:6}}>Misi Selesai — Mendarat</div>
        <div style={{fontSize:12,color:"var(--text2)",lineHeight:1.7,marginBottom:20}}>
          Drone telah kembali ke Home Point dan mendarat dengan aman. Semua sistem dalam kondisi nominal.
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
          {[["Durasi","18m 42s","var(--cyan)"],["Jarak","2.4 km","var(--green)"],["Baterai Sisa",`${Math.floor(telemetry.battery)}%`,"var(--amber)"]].map(([l,v,c])=>(
            <div key={l} style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:8,padding:"10px"}}>
              <div style={{fontSize:9,color:"var(--text3)",marginBottom:4}}>{l}</div>
              <div className="mono" style={{fontSize:16,fontWeight:700,color:c}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10}}>
          <button className="btn btn-ghost" onClick={()=>setPhase("inflight")} style={{flex:1}}>← Kembali</button>
          <button className="btn btn-c" onClick={()=>{setArmed(false);setPhase("preflight");}} style={{flex:2}}>🔄 Reset untuk Misi Baru</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   KEYBOARD SHORTCUTS MODAL
───────────────────────────────────────────────────────────────────────── */
function ShortcutsModal({isOpen,onClose}) {
  if(!isOpen) return null;
  const shortcuts = [
    { key: "1", action: "Beralih ke Fase Pre-Flight" },
    { key: "2", action: "Beralih ke Fase In-Flight" },
    { key: "3", action: "Beralih ke Fase Landing" },
    { key: "Space", action: "Arm/Disarm Drone (atau Konfirmasi HITL)" },
    { key: "N", action: "Buka/Tutup AI Assistant (NLI Chat)" },
    { key: "C", action: "Toggle Mode Buta Warna (Colorblind)" },
    { key: "V", action: "Toggle Suara Asisten (TTS Voice)" },
    { key: "H", action: "Buka/Tutup Panduan Shortcut Keyboard ini" },
    { key: "Esc", action: "Tutup Modul / Batalkan Konfirmasi" }
  ];
  return (
    <div className="overlay" onClick={onClose}>
      <div className="anim-fade" onClick={e=>e.stopPropagation()} style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:12,padding:24,width:400,boxShadow:"0 0 60px rgba(0,0,0,0.8)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,borderBottom:"1px solid var(--border)",paddingBottom:12}}>
          <span style={{fontSize:20}}>⌨️</span>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:"var(--cyan)"}}>Panduan Aksesibilitas Keyboard</div>
            <div style={{fontSize:10,color:"var(--text3)"}}>GCS Hands-Free Keyboard Navigation</div>
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
          {shortcuts.map(s=>(
            <div key={s.key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:12}}>
              <span style={{color:"var(--text2)"}}>{s.action}</span>
              <kbd className="mono" style={{
                background:"var(--card)",
                border:"1px solid var(--border2)",
                borderRadius:4,
                padding:"2px 8px",
                fontSize:10,
                color:"var(--cyan)",
                fontWeight:700,
                boxShadow:"0 2px 0 rgba(0,0,0,0.4)"
              }}>{s.key}</kbd>
            </div>
          ))}
        </div>

        <button className="btn btn-c" onClick={onClose} style={{width:"100%"}}>✕ Tutup Panduan</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ROOT APP
───────────────────────────────────────────────────────────────────────── */
export default function App() {
  const [phase,    setPhase]    = useState("preflight");
  const [activeView, setActiveView] = useState("map");
  const [nliOpen,  setNliOpen]  = useState(false);
  const [armed,    setArmed]    = useState(false);
  const [checklistDone, setChecklistDone] = useState(new Set());
  const [colorblindMode, setColorblindMode] = useState("none"); // "none", "deuteranopia", "protanopia", "tritanopia"
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [shortcutsGuideOpen, setShortcutsGuideOpen] = useState(false);
  const [rtlActive, setRtlActive] = useState(false);
  const [isLoitering, setIsLoitering] = useState(false);
  const wpIdxRef = useRef(0);
  const stepRef = useRef(0);

  useEffect(() => {
    if (phase === "preflight") {
      wpIdxRef.current = 0;
      stepRef.current = 0;
    }
  }, [phase]);


  
  useEffect(() => {
    document.documentElement.classList.remove("colorblind-deuteranopia", "colorblind-protanopia", "colorblind-tritanopia");
    if (colorblindMode !== "none") {
      document.documentElement.classList.add(`colorblind-${colorblindMode}`);
    }
  }, [colorblindMode]);

  useEffect(() => {
    window.ttsEnabled = ttsEnabled;
  }, [ttsEnabled]);

  const [telemetry,setTelemetry]= useState({
    altitude:0.0, targetAlt:50, speed:0.0, battery:100.0,
    range:0.0, gps:30, rssi:-62, pitch:0.0, roll:0.0,
    yaw:0, vspd:0.0, hdop:0.9, temp:28, mode:"AUTO",
    time:new Date().toTimeString().slice(0,8)
  });
  const [chatMessages,setChatMessages]=useState([{
    id:0,role:"ai",
    text:"Halo! Saya akan membantu mengendalikan drone Anda. Sampaikan perintah dalam Bahasa Indonesia atau Inggris — saya akan menerjemahkannya dan memastikan keamanannya sebelum dieksekusi.",
    time:"12:30"
  }]);
  const [nliInput,  setNliInput]  = useState("");
  const [nliLoading,setNliLoading]= useState(false);
  const [pendingHitl,setPendingHitl]=useState(null);
  const [alerts,   setAlerts]    = useState(AI_ALERTS_INIT);
  const chatEndRef = useRef(null);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const handleApiKeyChange = (e) => {
    setApiKey(e.target.value);
    localStorage.setItem('gemini_api_key', e.target.value);
  };
  const [customRoute, setCustomRoute] = useState([
    [-6.176392, 106.826153],
    [-6.176392, 106.828153],
    [-6.174392, 106.828153],
    [-6.174392, 106.826153],
    [-6.176392, 106.826153]
  ]);
  const [dronePos, setDronePos] = useState([-6.176392, 106.826153]);
  const [currentWpIndex, setCurrentWpIndex] = useState(0);

  useEffect(() => {
    if (!rtlActive) return;
    const home = customRoute[0] || [-6.176392, 106.826153];
    const start = dronePos;
    let step = 0;
    const totalRtlSteps = 30; // 30 steps of 150ms = 4.5 seconds to return home
    
    const interval = setInterval(() => {
      step += 1;
      const lat = start[0] + (home[0] - start[0]) * (step / totalRtlSteps);
      const lng = start[1] + (home[1] - start[1]) * (step / totalRtlSteps);
      setDronePos([lat, lng]);
      
      setTelemetry(p => ({
        ...p,
        altitude: Math.max(0, +(p.altitude - (p.altitude / (totalRtlSteps - step + 1))).toFixed(1)),
        speed: 6.0,
      }));
      
      if (step >= totalRtlSteps) {
        clearInterval(interval);
        setRtlActive(false);
        setPhase("landing");
        setArmed(false);
      }
    }, 150);
    
    return () => clearInterval(interval);
  }, [rtlActive, customRoute, dronePos]);

  // Smooth interpolation along customRoute when In-Flight and Armed
  useEffect(() => {
    if (phase !== "inflight" || !armed || customRoute.length === 0) return;

    let wpIdx = wpIdxRef.current;
    let step = stepRef.current;

    let start = customRoute[wpIdx] || customRoute[0];
    let end = customRoute[wpIdx + 1] || start;
    const totalSteps = 40; // 40 steps between waypoints (takes 8 seconds per waypoint for smooth presentation)

    const interval = setInterval(() => {
      if (isLoitering) {
        // Just hover: slight fluctuations, speed near zero
        setTelemetry(p => ({
          ...p,
          altitude: +(p.altitude + (Math.random() - 0.5) * 0.1).toFixed(1),
          speed: +(0.1 + Math.random() * 0.1).toFixed(1),
        }));
        return;
      }

      if (wpIdx >= customRoute.length - 1) {
        clearInterval(interval);
        setPhase("landing");
        setArmed(false);
        return;
      }

      step += 1;
      stepRef.current = step;
      const lat = start[0] + (end[0] - start[0]) * (step / totalSteps);
      const lng = start[1] + (end[1] - start[1]) * (step / totalSteps);
      setDronePos([lat, lng]);

      // Telemetry updates based on drone coordinates
      setTelemetry(p => ({
        ...p,
        altitude: +(50 + Math.sin(step * 0.3) * 2).toFixed(1), // Altitude fluctuates around 50m
        speed: +(8.0 + Math.cos(step * 0.2) * 0.5).toFixed(1), // Speed fluctuates around 8.0 m/s
        range: +(p.range + 0.005).toFixed(2), // Range slowly increases
      }));

      if (step >= totalSteps) {
        wpIdx += 1;
        wpIdxRef.current = wpIdx;
        setCurrentWpIndex(wpIdx);
        start = customRoute[wpIdx] || start;
        end = customRoute[wpIdx + 1] || start;
        step = 0;
        stepRef.current = 0;
      }
    }, 200); // 200ms tick for smooth motion

    return () => clearInterval(interval);
  }, [phase, armed, customRoute, isLoitering]);

  /* Inject CSS */
  useEffect(()=>{
    let el=document.getElementById("aero-css");
    if(!el){el=document.createElement("style");el.id="aero-css";document.head.appendChild(el);}
    el.textContent=GLOBAL_CSS;
  },[]);

  /* Telemetry simulation */
  useEffect(()=>{
    if(phase!=="inflight") return;
    const t=setInterval(()=>{
      setTelemetry(p=>({
        ...p,
        altitude:+Math.max(0,p.altitude+(Math.random()-.47)*.4).toFixed(1),
        speed:+Math.max(0,p.speed+(Math.random()-.5)*.15).toFixed(1),
        battery:+Math.max(0,p.battery-.008).toFixed(2),
        pitch:+((Math.random()-.5)*5).toFixed(1),
        roll:+((Math.random()-.5)*12).toFixed(1),
        time:new Date().toTimeString().slice(0,8)
      }));
    },800);
    return()=>clearInterval(t);
  },[phase]);

  /* Random AI alert */
  useEffect(()=>{
    if(phase!=="inflight") return;
    const t=setTimeout(()=>{
      setAlerts(a=>[{id:Date.now(),type:"warn",text:"Sinyal RC melemah momentan. RSSI: −78 dBm. Monitor kondisi.",time:new Date().toTimeString().slice(0,5)},...a.slice(0,3)]);
      playWarningAudio("Peringatan: Sinyal RC melemah momentan.");
    },60000); // Trigger after 60 seconds (much rarer)
    return()=>clearTimeout(t);
  },[phase]);

  useEffect(()=>{ chatEndRef.current?.scrollIntoView({behavior:"smooth"}); },[chatMessages]);

  const handleNliSubmit = useCallback(async ()=>{
    if(!nliInput.trim()||nliLoading) return;
    const txt=nliInput.trim();
    setNliInput("");
    setChatMessages(p=>[...p,{id:Date.now(),role:"user",text:txt,time:new Date().toTimeString().slice(0,5)}]);
    setNliLoading(true);

    if (!apiKey) {
      setTimeout(()=>{
        let responseText = "⚠ Harap masukkan Gemini API Key di sudut kanan atas untuk menggunakan fitur NLI cerdas.";
        let mockData = null;
        
        const lowerTxt = txt.toLowerCase();
        if (lowerTxt.includes("monas") || lowerTxt.includes("lingkaran") || lowerTxt.includes("survei") || lowerTxt.includes("rute")) {
          const centerLat = -6.175392;
          const centerLng = 106.827153;
          const radius = 0.0018; // approx 200m
          const smoothRoute = [];
          for (let i = 0; i <= 16; i++) {
            const angle = (i * 2 * Math.PI) / 16;
            const lat = centerLat + radius * Math.cos(angle);
            const lng = centerLng + radius * Math.sin(angle);
            smoothRoute.push([
              Number(lat.toFixed(6)),
              Number(lng.toFixed(6))
            ]);
          }
          setCustomRoute(smoothRoute);
          setDronePos(smoothRoute[0]);
          setTelemetry(p => ({ ...p, targetAlt: 45 }));
          
          responseText = "✓ Gemini NLI (Simulasi Local): Berhasil membuat rute survei melingkar (16 waypoint) di sekitar Monas dengan target ketinggian 45 meter. Peta dipusatkan ke Monas!";
          mockData = { safe: true, conf: "HIGH", route: smoothRoute };
          speakText("Berhasil membuat rute survei melingkar di sekitar Monas setinggi empat puluh lima meter.");
        } else if (lowerTxt.includes("preflight") || lowerTxt.includes("checklist") || lowerTxt.includes("verifikasi") || lowerTxt.includes("siap") || lowerTxt.includes("pemeriksaan")) {
          setChecklistDone(new Set(["chk1", "chk2", "chk3", "chk4"]));
          responseText = "✓ Gemini NLI (Simulasi Local): Seluruh sistem checklist keselamatan pre-flight telah berhasil diverifikasi dan dicentang hijau. Drone siap lepas landas!";
          mockData = { safe: true, conf: "HIGH", checkAll: true };
          speakText("Semua sistem preflight checklist telah berhasil diverifikasi. Status drone siap lepas landas.");
        } else if (lowerTxt.includes("lepas landas") || lowerTxt.includes("takeoff") || lowerTxt.includes("terbang") || lowerTxt.includes("arm")) {
          setChecklistDone(new Set(["chk1", "chk2", "chk3", "chk4"]));
          setArmed(true);
          setPhase("inflight");
          setTelemetry(p => ({
            ...p,
            altitude: 10.0,
            speed: 8.3,
            battery: 98.0
          }));
          responseText = "✓ Gemini NLI (Simulasi Local): Menghidupkan motor drone. Lepas landas otonom aktif. Ketinggian jelajah sepuluh meter.";
          mockData = { safe: true, conf: "HIGH", setArmed: true };
          speakText("Menghidupkan motor drone. Lepas landas otonom aktif.");
        } else if (lowerTxt.includes("mendarat") || lowerTxt.includes("landing") || lowerTxt.includes("rtl") || lowerTxt.includes("kembali")) {
          setRtlActive(true);
          responseText = "✓ Gemini NLI (Simulasi Local): Mengaktifkan protokol mendarat otonom dan Return-to-Launch. Drone terbang kembali ke pangkalan.";
          mockData = { safe: true, conf: "HIGH" };
          speakText("Mengaktifkan protokol Return to Launch. Drone terbang kembali ke pangkalan.");
        } else if (lowerTxt.includes("jeda") || lowerTxt.includes("pause") || lowerTxt.includes("loiter") || lowerTxt.includes("tahan")) {
          setIsLoitering(true);
          responseText = "✓ Gemini NLI (Simulasi Local): Menangguhkan misi otonom. Drone mengambang menahan posisi (Loiter aktif).";
          mockData = { safe: true, conf: "HIGH" };
          speakText("Misi otonom ditangguhkan. Drone menahan posisi di udara.");
        } else if (lowerTxt.includes("lanjut") || lowerTxt.includes("resume") || lowerTxt.includes("continue")) {
          setIsLoitering(false);
          responseText = "✓ Gemini NLI (Simulasi Local): Melanjutkan misi otonom drone dari posisi terakhir.";
          mockData = { safe: true, conf: "HIGH" };
          speakText("Melanjutkan misi otonom menuju waypoint berikutnya.");
        } else if (lowerTxt.includes("abaikan") || lowerTxt.includes("baterai") || lowerTxt.includes("paksa")) {
          responseText = "⛔ PERINTAH DITOLAK — Safety Validation Layer memblokir eksekusi. Alasan: Perintah melanggar batas keselamatan operasional (Baterai Kritis).";
          mockData = { safe: false, conf: "HIGH" };
          playWarningAudio("Peringatan Keselamatan: Perintah diblokir oleh sistem onboard.");
        } else if (lowerTxt.includes("pemetaan") || lowerTxt.includes("ekstrim") || lowerTxt.includes("barat")) {
          responseText = "AI mengusulkan rute inspeksi sektor barat. Menunggu verifikasi human-in-the-loop...";
          mockData = {
            safe: true,
            conf: "MEDIUM",
            hitl: {
              summary: "Rute Pemetaan Sektor Barat (3 Waypoint)",
              time: "4 menit",
              batt: "82%",
              action: "Konfirmasi & Kirim Misi"
            }
          };
          speakText(responseText);
        } else {
          speakText(responseText);
        }

        setChatMessages(p=>[...p,{id:Date.now()+1,role:"ai",text:responseText,data:mockData,time:new Date().toTimeString().slice(0,5)}]);
        if (mockData && mockData.hitl) {
          setTimeout(()=>setPendingHitl({hitl: mockData.hitl, text: responseText, safe: mockData.safe, conf: mockData.conf, mavlink: null}), 600);
        }
        setNliLoading(false);
      }, 500);
      return;
    }

    try {
      const prompt = `Anda adalah AI Assistant "AeroDashboard NLI" untuk Mission Planner Drone.
Telemetri: Baterai ${telemetry.battery.toFixed(1)}%, Altitude ${telemetry.altitude.toFixed(1)}m, Speed ${telemetry.speed.toFixed(1)}m/s.
Status penerbangan: ${armed ? 'ARMED' : 'DISARMED'}.

Instruksi: "${txt}"

Balas DALAM FORMAT JSON SAJA (tanpa backtick json):
{
  "text": "respon bahasa indonesia singkat",
  "safe": true/false (tolak jika berbahaya/baterai kurang),
  "conf": "HIGH" atau "MEDIUM" atau "LOW",
  "mavlink": ["MAV_CMD_..."] atau null,
  "route": [[lat, lng], [lat, lng], ...] (opsional, jika instruksi berupa pembuatan rute/waypoint baru. Monas adalah sekitar -6.1754, 106.8271. Thamrin City/Grand Indonesia adalah -6.1980, 106.8180. Jika meminta lingkaran/survei area Monas, buatlah 5 waypoint sirkular berjarak sekitar 0.001 derajat mengelilingi Monas),
  "setArmed": true/false (opsional, jika pengguna meminta lepas landas/terbang/arm atau mendarat/disarm),
  "setPhase": "preflight" atau "inflight" atau "landing" (opsional, jika memindahkan fase flight atau mendarat/kembali),
  "checkAll": true/false (opsional, jika meminta verifikasi checklist pre-flight),
  "hitl": { "summary": "deskripsi eksekusi singkat", "time": "est waktu", "batt": "est sisa baterai", "action": "label tombol konfirmasi" } (isi hitl jika butuh konfirmasi eksekusi)
}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      let rawText = data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
      const r = JSON.parse(rawText);

      if (r.safe === false || r.isWarning) {
        playWarningAudio("Peringatan Keselamatan: " + r.text);
      } else {
        speakText(r.text);
      }

      if (r.checkAll) {
        setChecklistDone(new Set(["chk1", "chk2", "chk3", "chk4"]));
      }
      if (r.setPhase) {
        if (r.setPhase === "landing") {
          setRtlActive(true);
        } else {
          setPhase(r.setPhase);
        }
      }
      if (r.setArmed !== undefined) {
        setArmed(r.setArmed);
        if (r.setArmed) {
          setChecklistDone(new Set(["chk1", "chk2", "chk3", "chk4"]));
          setPhase("inflight");
          setTelemetry(p => ({
            ...p,
            altitude: 10.0,
            speed: 8.3,
            battery: 98.0
          }));
        } else {
          setPhase("preflight");
        }
      }

      if (r.route && Array.isArray(r.route) && r.route.length > 0) {
        setCustomRoute(r.route);
        setDronePos(r.route[0]);
      }

      setChatMessages(p=>[...p,{id:Date.now()+1,role:"ai",text:r.text,data:r,time:new Date().toTimeString().slice(0,5)}]);
      if(r.hitl) setTimeout(()=>setPendingHitl({hitl: r.hitl, text: r.text, safe: r.safe, conf: r.conf, mavlink: r.mavlink}),600);
    } catch (err) {
      setChatMessages(p=>[...p,{id:Date.now()+1,role:"ai",text:"⚠ Gagal menghubungi AI. Error: " + err.message,time:new Date().toTimeString().slice(0,5)}]);
      speakText("Gagal menghubungi sistem kecerdasan buatan.");
    }
    setNliLoading(false);
  },[nliInput,nliLoading,telemetry,apiKey,armed,setCustomRoute,setDronePos,setTelemetry]);

  const confirmHitl=useCallback(()=>{
    if(!pendingHitl) return;
    const summary = pendingHitl.hitl.summary || "";
    setChatMessages(p=>[...p,{id:Date.now(),role:"system",text:`✓ Perintah dieksekusi. ${summary}`,time:new Date().toTimeString().slice(0,5)}]);
    speakText(`Perintah dikonfirmasi. Mengeksekusi ${summary}.`);
    
    const action = pendingHitl.hitl.action || "";
    if(action.includes("RTL")) {
      setRtlActive(true);
    } else if(action.includes("Kirim") || action.includes("Konfirmasi") || action.includes("Mulai") || action.includes("ARM")) {
      setArmed(true);
      setPhase("inflight");
      setTelemetry(p => ({
        ...p,
        altitude: 10.0,
        speed: 8.3,
        battery: 98.0,
        range: 0.1
      }));
    }
    setPendingHitl(null);
  },[pendingHitl]);

  const onCheck=(id)=>setChecklistDone(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});

  // Global Keyboard Navigation and Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") {
        return;
      }
      
      const key = e.key.toLowerCase();
      if (key === "1") {
        setPhase("preflight");
        speakText("Beralih ke fase pre flight");
      } else if (key === "2") {
        setPhase("inflight");
        speakText("Beralih ke fase in flight");
      } else if (key === "3") {
        setRtlActive(true);
        speakText("Beralih ke fase landing darurat otonom.");
      } else if (key === "n") {
        e.preventDefault();
        setNliOpen(v => !v);
      } else if (key === "c") {
        setColorblindMode(prev => {
          let next = "none";
          if (prev === "none") {
            next = "deuteranopia";
            speakText("Mode Deuteranopia diaktifkan.");
          } else if (prev === "deuteranopia") {
            next = "protanopia";
            speakText("Mode Protanopia diaktifkan.");
          } else if (prev === "protanopia") {
            next = "tritanopia";
            speakText("Mode Tritanopia diaktifkan.");
          } else {
            speakText("Kembali ke mode normal.");
          }
          return next;
        });
      } else if (key === "v") {
        setTtsEnabled(v => !v);
        if (ttsEnabled) {
          speakText("Suara asisten dinonaktifkan.");
        } else {
          window.ttsEnabled = true;
          speakText("Suara asisten diaktifkan.");
        }
      } else if (key === "h") {
        e.preventDefault();
        setShortcutsGuideOpen(v => !v);
      } else if (e.code === "Space") {
        e.preventDefault();
        if (pendingHitl) {
          confirmHitl();
        } else {
          setArmed(a => {
            const next = !a;
            if (next) {
              setChecklistDone(new Set(["chk1", "chk2", "chk3", "chk4"]));
              setPhase("inflight");
              speakText("Sistem dipersenjatai. Lepas landas otonom aktif.");
            } else {
              setPhase("preflight");
              speakText("Sistem dimatikan.");
            }
            return next;
          });
        }
      } else if (key === "escape") {
        setPendingHitl(null);
        setShortcutsGuideOpen(false);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, pendingHitl, ttsEnabled, colorblindMode, confirmHitl]);

  return (
    <div className="scanlines" style={{display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden",background:"var(--void)"}}>
      <Header 
        phase={phase} 
        setPhase={setPhase} 
        nliOpen={nliOpen} 
        setNliOpen={setNliOpen} 
        telemetry={telemetry} 
        armed={armed} 
        apiKey={apiKey} 
        handleApiKeyChange={handleApiKeyChange}
        colorblindMode={colorblindMode}
        setColorblindMode={setColorblindMode}
        ttsEnabled={ttsEnabled}
        setTtsEnabled={setTtsEnabled}
        setShortcutsGuideOpen={setShortcutsGuideOpen}
      />
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        <Sidebar phase={phase} armed={armed} telemetry={telemetry} activeView={activeView} setActiveView={setActiveView}/>
        {/* Collapsible NLI Chat Sidebar */}
        {nliOpen && (
          <div style={{width:380,borderRight:"1px solid var(--border)",background:"var(--panel)",display:"flex",flexDirection:"column",zIndex:100,flexShrink:0}}>
            <NLIPanel messages={chatMessages} input={nliInput} setInput={setNliInput} onSubmit={handleNliSubmit} loading={nliLoading} chatEndRef={chatEndRef} telemetry={telemetry}/>
          </div>
        )}

        <div style={{flex:1,overflow:"hidden",position:"relative"}}>
          {activeView === "map" ? (
            phase==="preflight"
              ? <PreflightView checklist={CHECKLIST} checklistDone={checklistDone} onCheck={onCheck} canArm={checklistDone.size>=8} armed={armed} setArmed={setArmed} setPhase={setPhase} telemetry={telemetry} setTelemetry={setTelemetry}/>
              : phase==="inflight"
                ? <InFlightView telemetry={telemetry} customRoute={customRoute} setCustomRoute={setCustomRoute} dronePos={dronePos} currentWpIndex={currentWpIndex}/>
                : <LandingView telemetry={telemetry} setPhase={setPhase} setArmed={setArmed}/>
          ) : activeView === "tele" ? (
            <TelemetriView telemetry={telemetry} />
          ) : activeView === "fpv" ? (
            <FpvView telemetry={telemetry} />
          ) : activeView === "wp" ? (
            <WaypointsView customRoute={customRoute} setCustomRoute={setCustomRoute} />
          ) : activeView === "param" ? (
            <ParametersView />
          ) : activeView === "fs" ? (
            <FailsafeView />
          ) : activeView === "log" ? (
            <DataLogView />
          ) : activeView === "mp" ? (
            <MissionPlanView checklist={CHECKLIST} checklistDone={checklistDone} />
          ) : (
            <RtlConfigView telemetry={telemetry} setTelemetry={setTelemetry} />
          )}
        </div>
        <RightPanel phase={phase} setPhase={setPhase} setArmed={setArmed} setRtlActive={setRtlActive} isLoitering={isLoitering} setIsLoitering={setIsLoitering} telemetry={telemetry} alerts={alerts} onDismissAlert={id=>setAlerts(a=>a.filter(x=>x.id!==id))} setNliOpen={setNliOpen}/>
      </div>
      <TelemetryBar telemetry={telemetry} phase={phase}/>
      {pendingHitl&&<HitLModal data={pendingHitl} onConfirm={confirmHitl} onCancel={()=>setPendingHitl(null)}/>}
      <ShortcutsModal isOpen={shortcutsGuideOpen} onClose={()=>setShortcutsGuideOpen(false)} />
    </div>
  );
}
