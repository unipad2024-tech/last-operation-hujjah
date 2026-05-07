import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useGame } from "@/context/GameContext";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://backend-production-cfa1f.up.railway.app"}/api`;

/* ── Prestige System (mirrors backend: 11 prestiges × 55 levels) ────────────── */
const XP_PER_PRESTIGE = 10_000;

// Colors match CoD Black Ops 2 prestige emblems (top-left → right → next row)
const PRESTIGE_META = [
  { name: "المُجنَّد",        color: "#4ade80", glow: "#4ade8055" },  // P1  Eagle Shield (green)
  { name: "المقاتل",          color: "#f97316", glow: "#f9731655" },  // P2  Lightning Fist (orange)
  { name: "المحارب",          color: "#94a3b8", glow: "#94a3b844" },  // P3  Scorpion (dark grey)
  { name: "الفارس",           color: "#a16207", glow: "#a1620755" },  // P4  Demon Wolf (dark gold)
  { name: "الحامي",           color: "#a855f7", glow: "#a855f755" },  // P5  Snake Diamond (purple)
  { name: "البطل",            color: "#60a5fa", glow: "#60a5fa55" },  // P6  Trident Shield (blue)
  { name: "الأسطورة",         color: "#cbd5e1", glow: "#cbd5e155" },  // P7  Viking Axes (silver)
  { name: "النخبة",           color: "#fb923c", glow: "#fb923c55" },  // P8  Skull Diamond+Stars (orange-red)
  { name: "نخبة الأساطير",    color: "#92400e", glow: "#92400e55" },  // P9  Military Skull (dark brown)
  { name: "قائد الأبطال",     color: "#dc2626", glow: "#dc262655" },  // P10 Flame Demon (red)
  { name: "ماستر",            color: "#f2b85b", glow: "#f2b85b77" },  // P11 Master (gold)
];

function getPrestigeMeta(prestige) {
  const p = Math.max(1, Math.min(11, prestige || 1));
  return PRESTIGE_META[p - 1];
}

/* ── Prestige Badge SVG ──────────────────────────────────────────────────────── */
function PrestigeBadge({ prestige, size = 40 }) {
  const p = Math.max(1, Math.min(11, prestige || 1));
  const m = PRESTIGE_META[p - 1];
  const c = m.color;
  const id = `pbf${p}`;
  const lg = `pblg${p}`;
  const num = p < 11 ? String(p) : "M";

  const glowFilter = (
    <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="1.8" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  );

  const numLabel = (x, y, fs = 11) => (
    <text x={x} y={y} textAnchor="middle" fontSize={fs} fontWeight="900"
      fill="rgba(0,0,0,0.55)" fontFamily="sans-serif" letterSpacing="-0.5">{num}</text>
  );

  const shapes = {
    /* P1 — Eagle Shield (green holographic) */
    1: <>
      <defs>{glowFilter}</defs>
      {/* Shield body */}
      <path d="M20 3 L34 8 L34 24 C34 33 28 39 20 42 C12 39 6 33 6 24 L6 8 Z"
        fill={`${c}22`} stroke={c} strokeWidth="1.5" filter={`url(#${id})`}/>
      {/* Eagle wings */}
      <path d="M20 19 L9 13 L11 18 L7 22 L13 20 L20 24 Z" fill={c} opacity="0.9"/>
      <path d="M20 19 L31 13 L29 18 L33 22 L27 20 L20 24 Z" fill={c} opacity="0.9"/>
      {/* Eagle head + beak */}
      <ellipse cx="20" cy="14" rx="4" ry="3.5" fill={c} filter={`url(#${id})`}/>
      <path d="M24 14 L26 16 L24 16" fill={c} opacity="0.7"/>
      {/* Chain links hint */}
      <circle cx="7" cy="12" r="1.5" fill="none" stroke={c} strokeWidth="1" opacity="0.4"/>
      <circle cx="33" cy="12" r="1.5" fill="none" stroke={c} strokeWidth="1" opacity="0.4"/>
    </>,

    /* P2 — Lightning Fist Shield (orange) */
    2: <>
      <defs>{glowFilter}</defs>
      {/* Shield */}
      <path d="M20 4 L33 9 L33 26 C33 33 27 39 20 41 C13 39 7 33 7 26 L7 9 Z"
        fill={`${c}20`} stroke={c} strokeWidth="1.5" filter={`url(#${id})`}/>
      {/* Crossed swords at top */}
      <line x1="11" y1="5"  x2="23" y2="14" stroke={c} strokeWidth="2"   opacity="0.65" strokeLinecap="round"/>
      <line x1="29" y1="5"  x2="17" y2="14" stroke={c} strokeWidth="2"   opacity="0.65" strokeLinecap="round"/>
      {/* Fist suggestion (circle) */}
      <circle cx="20" cy="20" r="5" fill={c} opacity="0.7" filter={`url(#${id})`}/>
      {/* Lightning bolt */}
      <path d="M23 15 L17 22 L21 22 L17 30 L27 20 L23 20 Z"
        fill={c} filter={`url(#${id})`}/>
    </>,

    /* P3 — Scorpion Hex (dark grey) */
    3: <>
      <defs>{glowFilter}</defs>
      {/* Hexagon frame */}
      <polygon points="20,2 35,11 35,29 20,38 5,29 5,11"
        fill={`${c}18`} stroke={c} strokeWidth="1.5"/>
      {/* Claws */}
      <path d="M14 23 L7 18 M14 23 L7 26" stroke={c} strokeWidth="2.5" strokeLinecap="round" opacity="0.85"/>
      <path d="M26 23 L33 18 M26 23 L33 26" stroke={c} strokeWidth="2.5" strokeLinecap="round" opacity="0.85"/>
      {/* Body */}
      <ellipse cx="20" cy="24" rx="5" ry="6" fill={c} opacity="0.9" filter={`url(#${id})`}/>
      {/* Tail curving up */}
      <path d="M20 18 C21 13 25 10 24 6" stroke={c} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Stinger */}
      <circle cx="24" cy="5" r="2" fill={c} filter={`url(#${id})`}/>
    </>,

    /* P4 — Demon Wolf Head (dark gold/brown, red eyes) */
    4: <>
      <defs>{glowFilter}</defs>
      {/* Head */}
      <path d="M10 36 Q8 28 10 22 Q12 14 20 12 Q28 14 30 22 Q32 28 30 36 Q26 38 20 39 Q14 38 10 36 Z"
        fill={`${c}25`} stroke={c} strokeWidth="1.5" filter={`url(#${id})`}/>
      {/* Horns */}
      <path d="M13 18 L9 7 L15 16" fill={c} opacity="0.9"/>
      <path d="M27 18 L31 7 L25 16" fill={c} opacity="0.9"/>
      {/* Red eyes */}
      <ellipse cx="16" cy="22" rx="3" ry="2.5" fill="#ef4444" filter={`url(#${id})`}/>
      <ellipse cx="24" cy="22" rx="3" ry="2.5" fill="#ef4444" filter={`url(#${id})`}/>
      <ellipse cx="16" cy="22" rx="1.5" ry="1.5" fill="#fff" opacity="0.4"/>
      <ellipse cx="24" cy="22" rx="1.5" ry="1.5" fill="#fff" opacity="0.4"/>
      {/* Snout */}
      <path d="M15 29 C17 32 23 32 25 29" stroke={c} strokeWidth="2" fill="none" strokeLinecap="round"/>
    </>,

    /* P5 — Snake + Daggers Diamond (purple) */
    5: <>
      <defs>{glowFilter}</defs>
      {/* Diamond frame */}
      <polygon points="20,3 37,20 20,37 3,20"
        fill={`${c}18`} stroke={c} strokeWidth="1.5" filter={`url(#${id})`}/>
      {/* Crossed daggers */}
      <line x1="11" y1="11" x2="29" y2="29" stroke={c} strokeWidth="2" opacity="0.5" strokeLinecap="round"/>
      <line x1="29" y1="11" x2="11" y2="29" stroke={c} strokeWidth="2" opacity="0.5" strokeLinecap="round"/>
      {/* Snake body (S-curve) */}
      <path d="M13 22 Q17 14 20 20 Q23 26 27 18" stroke={c} strokeWidth="3.5"
        fill="none" strokeLinecap="round" filter={`url(#${id})`}/>
      {/* Snake head */}
      <ellipse cx="28" cy="17" rx="3.5" ry="2.5" fill={c} transform="rotate(-30,28,17)"/>
      {/* Tongue */}
      <path d="M30 16 L33 14 M30 16 L33 18" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.8"/>
    </>,

    /* P6 — Trident Shield (blue + gold trident) */
    6: <>
      <defs>{glowFilter}</defs>
      {/* Shield */}
      <path d="M20 3 L34 9 L34 26 C34 34 28 40 20 43 C12 40 6 34 6 26 L6 9 Z"
        fill={`${c}1a`} stroke={c} strokeWidth="1.5" filter={`url(#${id})`}/>
      {/* Tentacle hints */}
      <path d="M11 28 Q9 21 13 17" stroke={c} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6"/>
      <path d="M29 28 Q31 21 27 17" stroke={c} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6"/>
      {/* Trident shaft */}
      <line x1="20" y1="10" x2="20" y2="34" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Trident prongs */}
      <line x1="14" y1="10" x2="14" y2="16" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
      <line x1="26" y1="10" x2="26" y2="16" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
      <line x1="14" y1="16" x2="17" y2="16" stroke="#f59e0b" strokeWidth="1.5"/>
      <line x1="23" y1="16" x2="26" y2="16" stroke="#f59e0b" strokeWidth="1.5"/>
    </>,

    /* P7 — Viking Helmet + Crossed Axes (silver) */
    7: <>
      <defs>{glowFilter}</defs>
      {/* Circle border */}
      <circle cx="20" cy="20" r="17" fill={`${c}14`} stroke={c} strokeWidth="1.5"/>
      {/* Crossed axes (diagonal) */}
      <line x1="8"  y1="32" x2="32" y2="8"  stroke={c} strokeWidth="2.5" opacity="0.55" strokeLinecap="round"/>
      <line x1="32" y1="32" x2="8"  y2="8"  stroke={c} strokeWidth="2.5" opacity="0.55" strokeLinecap="round"/>
      {/* Axe heads */}
      <path d="M6 10 L12 7 L10 13 Z" fill={c} opacity="0.85"/>
      <path d="M34 10 L28 7 L30 13 Z" fill={c} opacity="0.85"/>
      <path d="M6 30 L12 33 L10 27 Z" fill={c} opacity="0.85"/>
      <path d="M34 30 L28 33 L30 27 Z" fill={c} opacity="0.85"/>
      {/* Helmet dome */}
      <path d="M13 24 Q13 15 20 13 Q27 15 27 24 L25 26 L20 28 L15 26 Z"
        fill={c} filter={`url(#${id})`}/>
      {/* Horns */}
      <line x1="13" y1="20" x2="7" y2="13" stroke={c} strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
      <line x1="13" y1="20" x2="8" y2="18" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      <line x1="27" y1="20" x2="33" y2="13" stroke={c} strokeWidth="2.5" strokeLinecap="round" opacity="0.8"/>
      <line x1="27" y1="20" x2="32" y2="18" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    </>,

    /* P8 — Skull Diamond + 5 Stars (orange-red) */
    8: <>
      <defs>{glowFilter}</defs>
      {/* 5 stars around */}
      {[[20,3],[35,14],[29,34],[11,34],[5,14]].map(([sx,sy],i) => (
        <polygon key={i} points={`${sx},${sy-3} ${sx+1.8},${sy} ${sx+3.5},${sy-1} ${sx+2.2},${sy+2} ${sx+3.5},${sy+4} ${sx},${sy+2.5} ${sx-3.5},${sy+4} ${sx-2.2},${sy+2} ${sx-3.5},${sy-1} ${sx-1.8},${sy}`}
          fill={c} opacity="0.75" filter={`url(#${id})`}/>
      ))}
      {/* Diamond */}
      <polygon points="20,7 32,20 20,33 8,20" fill={`${c}22`} stroke={c} strokeWidth="1.5"/>
      {/* Skull head */}
      <ellipse cx="20" cy="19" rx="7" ry="6.5" fill={c} opacity="0.95" filter={`url(#${id})`}/>
      {/* Jaw */}
      <rect x="16" y="24" width="8" height="4.5" rx="1.5" fill={c} opacity="0.9"/>
      {/* Eye sockets */}
      <ellipse cx="17" cy="19" rx="2.5" ry="2.5" fill="rgba(0,0,0,0.6)"/>
      <ellipse cx="23" cy="19" rx="2.5" ry="2.5" fill="rgba(0,0,0,0.6)"/>
      {/* Teeth */}
      <line x1="17.5" y1="24.5" x2="17.5" y2="28" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5"/>
      <line x1="20"   y1="24.5" x2="20"   y2="28" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5"/>
      <line x1="22.5" y1="24.5" x2="22.5" y2="28" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5"/>
    </>,

    /* P9 — Military Skull + Beret + Crossbones (dark brown) */
    9: <>
      <defs>{glowFilter}</defs>
      {/* Circle border */}
      <circle cx="20" cy="20" r="17" fill={`${c}18`} stroke={c} strokeWidth="1.5"/>
      {/* Skull */}
      <ellipse cx="20" cy="18" rx="8.5" ry="8" fill={c} filter={`url(#${id})`}/>
      {/* Beret (flat top) */}
      <path d="M11 15 Q11 9 20 8 Q29 9 29 15" fill={c} opacity="0.75"/>
      {/* Eye sockets */}
      <ellipse cx="16.5" cy="18" rx="3" ry="2.5" fill="rgba(0,0,0,0.6)"/>
      <ellipse cx="23.5" cy="18" rx="3" ry="2.5" fill="rgba(0,0,0,0.6)"/>
      {/* Jaw */}
      <rect x="15" y="24" width="10" height="5" rx="2" fill={c}/>
      {/* Teeth */}
      <line x1="17" y1="24" x2="17" y2="29" stroke="rgba(0,0,0,0.45)" strokeWidth="1.5"/>
      <line x1="20" y1="24" x2="20" y2="29" stroke="rgba(0,0,0,0.45)" strokeWidth="1.5"/>
      <line x1="23" y1="24" x2="23" y2="29" stroke="rgba(0,0,0,0.45)" strokeWidth="1.5"/>
      {/* Crossbones */}
      <line x1="7"  y1="35" x2="33" y2="29" stroke={c} strokeWidth="3.5" strokeLinecap="round" opacity="0.85"/>
      <line x1="7"  y1="29" x2="33" y2="35" stroke={c} strokeWidth="3.5" strokeLinecap="round" opacity="0.85"/>
    </>,

    /* P10 — Flaming Demon Face (red-dark) */
    10: <>
      <defs>
        {glowFilter}
        <radialGradient id={`rg${p}`} cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={c} stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#1a0000" stopOpacity="1"/>
        </radialGradient>
      </defs>
      {/* Flames */}
      <path d="M11 38 Q9 29 13 22 Q9 20 11 12 Q16 18 15 22 Q19 13 21 8 Q24 16 22 22 Q26 14 28 10 Q30 18 27 23 Q31 29 29 38 Z"
        fill={`url(#rg${p})`} filter={`url(#${id})`}/>
      {/* Face oval */}
      <ellipse cx="20" cy="27" rx="9" ry="9" fill={`${c}30`} stroke={c} strokeWidth="1"/>
      {/* Glowing eyes */}
      <ellipse cx="16.5" cy="26" rx="3" ry="2.5" fill="#fff" opacity="0.85" filter={`url(#${id})`}/>
      <ellipse cx="23.5" cy="26" rx="3" ry="2.5" fill="#fff" opacity="0.85" filter={`url(#${id})`}/>
      <ellipse cx="16.5" cy="26" rx="1.8" ry="1.8" fill={c}/>
      <ellipse cx="23.5" cy="26" rx="1.8" ry="1.8" fill={c}/>
      {/* Grin */}
      <path d="M14 31 Q17 34 20 34 Q23 34 26 31" stroke={c} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </>,

    /* P11 — Master: Zombie Face + Daggers + Fire (gold) */
    11: <>
      <defs>
        {glowFilter}
        <linearGradient id={lg} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.45"/>
          <stop offset="100%" stopColor={c} stopOpacity="1"/>
        </linearGradient>
        <radialGradient id={`rg${p}`} cx="50%" cy="70%" r="50%">
          <stop offset="0%" stopColor={`${c}55`}/>
          <stop offset="100%" stopColor="transparent"/>
        </radialGradient>
      </defs>
      {/* Outer glow ring */}
      <circle cx="20" cy="20" r="18.5" fill="none" stroke={c} strokeWidth="1" opacity="0.35"/>
      {/* Bottom fire glow */}
      <ellipse cx="20" cy="34" rx="14" ry="7" fill={`url(#rg${p})`}/>
      {/* Crossed daggers behind face */}
      <line x1="11" y1="9"  x2="30" y2="32" stroke={c} strokeWidth="2.5" opacity="0.5" strokeLinecap="round"/>
      <line x1="29" y1="9"  x2="10" y2="32" stroke={c} strokeWidth="2.5" opacity="0.5" strokeLinecap="round"/>
      {/* Dagger handles */}
      <line x1="9"  y1="7"  x2="13" y2="11" stroke={c} strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
      <line x1="31" y1="7"  x2="27" y2="11" stroke={c} strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
      {/* Face */}
      <path d="M13 29 Q11 22 14 17 Q17 12 20 12 Q23 12 26 17 Q29 22 27 29 Q24 35 20 36 Q16 35 13 29 Z"
        fill={`url(#${lg})`} filter={`url(#${id})`}/>
      {/* Eye sockets */}
      <ellipse cx="16.5" cy="22" rx="3" ry="2.5" fill="rgba(0,0,0,0.65)"/>
      <ellipse cx="23.5" cy="22" rx="3" ry="2.5" fill="rgba(0,0,0,0.65)"/>
      {/* Eye glow */}
      <ellipse cx="16.5" cy="22" rx="1.5" ry="1.5" fill={c} opacity="0.8"/>
      <ellipse cx="23.5" cy="22" rx="1.5" ry="1.5" fill={c} opacity="0.8"/>
      {/* Skull teeth */}
      <rect x="16" y="27" width="8" height="4" rx="1" fill="rgba(0,0,0,0.5)"/>
      <line x1="18" y1="27" x2="18" y2="31" stroke={c} strokeWidth="1.2" opacity="0.6"/>
      <line x1="20" y1="27" x2="20" y2="31" stroke={c} strokeWidth="1.2" opacity="0.6"/>
      <line x1="22" y1="27" x2="22" y2="31" stroke={c} strokeWidth="1.2" opacity="0.6"/>
    </>,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: `drop-shadow(0 0 ${size/6}px ${m.glow})`, flexShrink: 0 }}>
      {shapes[p]}
    </svg>
  );
}

/* ── Banner presets ─────────────────────────────────────────────────────────── */
const BANNERS = [
  { id: "burgundy", label: "أحمر",    gradient: "linear-gradient(135deg, #5B0E14 0%, #1a0505 60%, #2d0a0a 100%)" },
  { id: "purple",   label: "بنفسجي",  gradient: "linear-gradient(135deg, #1a0f28 0%, #2d1a4a 50%, #3b1d6e 100%)" },
  { id: "midnight", label: "ليلي",    gradient: "linear-gradient(135deg, #0a0710 0%, #0d0d1a 50%, #1a1035 100%)" },
  { id: "forest",   label: "غابة",    gradient: "linear-gradient(135deg, #0a1f0f 0%, #0d2718 50%, #1a3d20 100%)" },
  { id: "ocean",    label: "بحري",    gradient: "linear-gradient(135deg, #0a1428 0%, #0a1e3d 50%, #0d2d50 100%)" },
  { id: "fire",     label: "ناري",    gradient: "linear-gradient(135deg, #1a0800 0%, #3d1200 50%, #5c1a00 100%)" },
  { id: "gold",     label: "ذهبي",    gradient: "linear-gradient(135deg, #1a1200 0%, #2e1f00 50%, #3d2c00 100%)" },
  { id: "cosmic",   label: "كوني",    gradient: "linear-gradient(135deg, #0a0014 0%, #14001e 50%, #1a0a28 100%)" },
];

/* ── Accent colors ──────────────────────────────────────────────────────────── */
const ACCENTS = [
  { color: "#f2b85b", label: "ذهبي" },
  { color: "#73f0a8", label: "أخضر" },
  { color: "#60a5fa", label: "أزرق" },
  { color: "#f87171", label: "أحمر" },
  { color: "#a78bfa", label: "بنفسجي" },
  { color: "#fb923c", label: "برتقالي" },
  { color: "#f472b6", label: "وردي" },
  { color: "#34d399", label: "زمرد" },
];

/* ── Helpers ────────────────────────────────────────────────────────────────── */
function fmtNumber(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n ?? 0);
}

function Avatar({ url, username, size = 80, accent = "#f2b85b", pulse = false }) {
  const colors = ["#5B0E14","#7c3aed","#0369a1","#065f46","#92400e","#1e40af","#be185d"];
  const bg     = colors[(username?.charCodeAt(0) || 0) % colors.length];
  const style  = {
    width: size, height: size, borderRadius: "50%", flexShrink: 0,
    border: `3px solid ${accent}`,
    boxShadow: `0 0 ${pulse ? 20 : 10}px ${accent}55`,
    transition: "box-shadow 0.3s",
    cursor: "default",
  };
  if (url) {
    return <img src={url} alt={username} style={{ ...style, objectFit: "cover" }} onError={e => { e.target.style.display="none"; }} />;
  }
  return (
    <div style={{ ...style, background: `linear-gradient(135deg, ${bg}, ${bg}99)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.42, fontWeight: 900, color: "#fff", fontFamily: "Cairo, sans-serif" }}>
      {username?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

function XPBar({ progress, accent, level, prestige }) {
  const { percent, current_xp, needed_xp, can_prestige } = progress || {};
  const pct = Math.min(100, percent || 0);
  const isMax = can_prestige;
  return (
    <div style={{ padding: "0 20px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.45)" }}>
          {isMax ? (prestige < 11 ? "✨ جاهز للبرستيج!" : "👑 ماستر") : `Lv.${level} → Lv.${level + 1}`}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: isMax ? accent : "rgba(255,255,255,0.5)" }}>
          {isMax ? "MAX" : `${current_xp} / ${needed_xp} XP`}
        </span>
      </div>
      <div style={{ height: 7, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 999,
          background: isMax
            ? `linear-gradient(90deg, ${accent}, #fff8, ${accent})`
            : `linear-gradient(90deg, ${accent}66, ${accent})`,
          width: `${pct}%`,
          transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: `0 0 10px ${accent}88`,
          backgroundSize: isMax ? "200% 100%" : "100% 100%",
          animation: isMax ? "shimmer 2s linear infinite" : "none",
        }} />
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, accent, onClick }) {
  return (
    <div onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, padding: "14px 12px", textAlign: "center", flex: "1 1 80px",
        cursor: onClick ? "pointer" : "default", transition: "background 0.2s",
        minWidth: 80,
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
    >
      <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: accent, lineHeight: 1 }}>{fmtNumber(value)}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 4, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

/* ── Image uploader ─────────────────────────────────────────────────────────── */
function ImageUploader({ label, value, onChange, token, circle = false, placeholder = "" }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const upload = async (file) => {
    if (!file) return;
    if (!["image/jpeg","image/png","image/webp"].includes(file.type)) { toast.error("JPG / PNG / WEBP فقط"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("الحجم الأقصى 5 ميغابايت"); return; }
    setBusy(true);
    try {
      const form = new FormData(); form.append("file", file);
      const { data } = await axios.post(`${API}/community/upload`, form, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      onChange(data.url); toast.success("✓ تم رفع الصورة");
    } catch (e) { toast.error(e?.response?.data?.detail || "فشل الرفع"); }
    finally { setBusy(false); }
  };
  return (
    <div>
      {label && <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6, fontWeight: 700 }}>{label}</label>}
      {value && (
        <div style={{ marginBottom: 8, position: "relative", display: "inline-block" }}>
          <img src={value} alt="" style={{ height: circle ? 60 : 56, width: circle ? 60 : 120, objectFit: "cover", borderRadius: circle ? "50%" : 10, border: "1px solid rgba(255,255,255,0.15)" }} />
          <button onClick={() => onChange("")} style={{ position:"absolute",top:-5,right:-5,background:"#ff5f6d",border:"none",borderRadius:"50%",width:18,height:18,color:"#fff",cursor:"pointer",fontSize:10,lineHeight:"18px",textAlign:"center" }}>✕</button>
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <input style={{ flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, padding:"8px 12px", color:"#f8f2e7", fontSize:12, fontFamily:"Cairo,sans-serif", outline:"none", direction:"ltr", minWidth:0 }}
          value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder || "رابط أو ارفع صورة..."} />
        <button onClick={()=>inputRef.current?.click()} disabled={busy}
          style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, padding:"8px 12px", color:"#f8f2e7", cursor:"pointer", fontSize:12, fontFamily:"Cairo,sans-serif", flexShrink:0, opacity:busy?0.6:1 }}>
          {busy ? "⏳" : "📁"}
        </button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{display:"none"}} onChange={e=>upload(e.target.files?.[0])} />
      </div>
    </div>
  );
}

const TABS_CONFIG = [
  { key: "about",     label: "الملف الشخصي" },
  { key: "cats",      label: "الفئات" },
  { key: "followers", label: "المتابعون" },
  { key: "following", label: "المتابَعون" },
];

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const { username: paramUsername } = useParams();
  const navigate  = useNavigate();
  const { currentUser, userToken, refreshUser } = useGame();

  const viewingUsername = paramUsername || currentUser?.username;

  const [profile,        setProfile]        = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [activeTab,      setActiveTab]      = useState("about");

  /* Edit state */
  const [editing,        setEditing]        = useState(false);
  const [eBio,           setEBio]           = useState("");
  const [eAvatar,        setEAvatar]        = useState("");
  const [eBanner,        setEBanner]        = useState("");
  const [eAccent,        setEAccent]        = useState("#f2b85b");
  const [eUsername,      setEUsername]      = useState("");
  const [eInterests,     setEInterests]     = useState("");
  const [saving,         setSaving]         = useState(false);

  /* Prestige */
  const [prestigeBusy,   setPrestigeBusy]   = useState(false);

  /* Follow */
  const [followBusy,     setFollowBusy]     = useState(false);

  /* Categories tab */
  const [cats,           setCats]           = useState([]);
  const [catsPage,       setCatsPage]       = useState(0);
  const [catsMore,       setCatsMore]       = useState(true);
  const [catsLoading,    setCatsLoading]    = useState(false);

  /* Social tabs */
  const [followers,      setFollowers]      = useState([]);
  const [followingList,  setFollowingList]  = useState([]);
  const [socialLoaded,   setSocialLoaded]   = useState(false);

  const h = userToken ? { headers: { Authorization: `Bearer ${userToken}` } } : {};

  /* ── Loaders ──────────────────────────────────────────────────────────────── */
  const loadProfile = useCallback(async () => {
    if (!viewingUsername) { navigate("/login"); return; }
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/profile/${viewingUsername}`, h);
      setProfile(data);
      setEBio(data.bio || "");
      setEAvatar(data.avatar_url || "");
      setEBanner(data.banner_url || "");
      setEAccent(data.accent_color || "#f2b85b");
      setEUsername(data.username || "");
      setEInterests((data.interests || []).join("، "));
    } catch (e) {
      if (e?.response?.status === 404) toast.error("المستخدم غير موجود");
      else toast.error("خطأ في التحميل");
    } finally { setLoading(false); }
  }, [viewingUsername, userToken]); // eslint-disable-line

  const loadCats = useCallback(async (page) => {
    if (!viewingUsername || catsLoading) return;
    setCatsLoading(true);
    try {
      const { data } = await axios.get(`${API}/profile/${viewingUsername}/categories`, {
        params: { skip: page * 12, limit: 12 },
      });
      if (data.length < 12) setCatsMore(false);
      setCats(prev => page === 0 ? data : [...prev, ...data]);
      setCatsPage(page + 1);
    } catch { /**/ }
    finally { setCatsLoading(false); }
  }, [viewingUsername, catsLoading]); // eslint-disable-line

  const loadSocial = useCallback(async () => {
    if (!viewingUsername || socialLoaded) return;
    try {
      const [frs, fng] = await Promise.all([
        axios.get(`${API}/profile/${viewingUsername}/followers`),
        axios.get(`${API}/profile/${viewingUsername}/following`),
      ]);
      setFollowers(frs.data); setFollowingList(fng.data); setSocialLoaded(true);
    } catch { /**/ }
  }, [viewingUsername, socialLoaded]); // eslint-disable-line

  useEffect(() => { loadProfile(); }, [viewingUsername]); // eslint-disable-line
  useEffect(() => {
    if (activeTab === "cats"      && cats.length === 0)      loadCats(0);
    if ((activeTab === "followers" || activeTab === "following") && !socialLoaded) loadSocial();
  }, [activeTab]); // eslint-disable-line

  /* ── Actions ──────────────────────────────────────────────────────────────── */
  const handleFollow = async () => {
    if (!userToken) { navigate("/login"); return; }
    setFollowBusy(true);
    try {
      if (profile.is_following) {
        await axios.delete(`${API}/profile/${profile.username}/follow`, h);
        setProfile(p => ({ ...p, is_following: false, followers_count: p.followers_count - 1 }));
        toast.success("تم إلغاء المتابعة");
      } else {
        await axios.post(`${API}/profile/${profile.username}/follow`, {}, h);
        setProfile(p => ({ ...p, is_following: true, followers_count: p.followers_count + 1 }));
        toast.success("تمت المتابعة ✓");
      }
    } catch (e) { toast.error(e?.response?.data?.detail || "خطأ"); }
    finally { setFollowBusy(false); }
  };

  const handlePrestige = async () => {
    if (!userToken) return;
    setPrestigeBusy(true);
    try {
      const { data } = await axios.post(`${API}/profile/${profile.username}/prestige`, {}, h);
      toast.success(`🎉 برستيج ${data.new_prestige} — مبروك!`);
      await loadProfile();
    } catch (e) { toast.error(e?.response?.data?.detail || "خطأ"); }
    finally { setPrestigeBusy(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const interestArr = eInterests.split(/[،,]/).map(s => s.trim()).filter(Boolean);
      await axios.put(`${API}/auth/me`, {
        bio:          eBio,
        avatar_url:   eAvatar,
        banner_url:   eBanner,
        accent_color: eAccent,
        interests:    interestArr,
        username:     eUsername !== profile.username ? eUsername : undefined,
      }, h);
      await refreshUser();
      await loadProfile();
      setEditing(false);
      toast.success("تم حفظ التغييرات ✓");
    } catch (e) { toast.error(e?.response?.data?.detail || "خطأ في الحفظ"); }
    finally { setSaving(false); }
  };

  const shareProfile = () => {
    const url = `${window.location.origin}/profile/${profile.username}`;
    if (navigator.share) { navigator.share({ title: profile.username, url }).catch(()=>{}); }
    else { navigator.clipboard.writeText(url); toast.success("تم نسخ رابط البروفايل"); }
  };

  const shareCat = (cat) => {
    const url = `${window.location.origin}/categories?community=${cat.id}`;
    if (navigator.share) { navigator.share({ title: cat.name, url }).catch(()=>{}); }
    else { navigator.clipboard.writeText(url); toast.success("تم نسخ رابط الفئة"); }
  };

  /* ── Loading / Error states ───────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#09070b", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Cairo, sans-serif", color: "rgba(255,255,255,0.4)", fontSize: 16 }}>
        جاري التحميل...
      </div>
    );
  }
  if (!profile) {
    return (
      <div style={{ minHeight: "100vh", background: "#09070b", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "Cairo, sans-serif" }}>
        <span style={{ fontSize: 48 }}>🔍</span>
        <span style={{ color: "#f8f2e7", fontSize: 18, fontWeight: 800 }}>المستخدم غير موجود</span>
        <button onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "10px 20px", color: "#f8f2e7", cursor: "pointer", fontFamily: "Cairo, sans-serif", fontWeight: 700 }}>رجوع</button>
      </div>
    );
  }

  const accent       = profile.accent_color || "#f2b85b";
  const prestige     = profile.prestige || 0;
  const prestigeMeta = prestige > 0 ? getPrestigeMeta(prestige) : null;
  const canPrestige  = profile.xp_progress?.can_prestige && profile.is_own;
  const prestigeColor = prestigeMeta ? prestigeMeta.color : accent;

  /* resolve banner */
  const bannerStyle = profile.banner_url
    ? { backgroundImage: `url(${profile.banner_url})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: BANNERS.find(b => b.id === "burgundy")?.gradient || BANNERS[0].gradient };

  /* ── Render: HERO ─────────────────────────────────────────────────────────── */
  const renderHero = () => (
    <>
      {/* Banner */}
      <div style={{ height: 160, ...bannerStyle, position: "relative", flexShrink: 0 }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(9,7,11,0.95) 100%)" }} />
        {/* Back button */}
        <button onClick={() => navigate(-1)}
          style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 999, padding: "6px 14px", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: 13, fontFamily: "Cairo, sans-serif", fontWeight: 700 }}>
          ← رجوع
        </button>
        {/* Share */}
        <button onClick={shareProfile}
          style={{ position: "absolute", top: 14, left: 14, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 999, padding: "6px 14px", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: 13, fontFamily: "Cairo, sans-serif", fontWeight: 700 }}>
          🔗 مشاركة
        </button>
      </div>

      {/* Avatar row */}
      <div style={{ padding: "0 20px", marginTop: -48, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ position: "relative" }}>
          <Avatar url={profile.avatar_url} username={profile.username} size={96} accent={prestigeColor} pulse={profile.is_own} />
          {/* Prestige badge OR level ring */}
          {prestige > 0 ? (
            <div style={{ position: "absolute", bottom: -10, right: -10 }}>
              <PrestigeBadge prestige={prestige} size={38} />
            </div>
          ) : (
            <div style={{
              position: "absolute", bottom: -6, right: -6,
              background: `linear-gradient(135deg, ${accent}, ${accent}88)`,
              borderRadius: 999, padding: "3px 8px",
              fontSize: 11, fontWeight: 900, color: "#0a0710",
              boxShadow: `0 2px 8px ${accent}66`,
            }}>
              Lv.{profile.level}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingBottom: 8 }}>
          {profile.is_own ? (
            <>
              <button onClick={() => setEditing(e => !e)}
                style={{ background: editing ? `${accent}22` : "rgba(255,255,255,0.08)", border: `1px solid ${editing ? accent : "rgba(255,255,255,0.15)"}`, borderRadius: 12, padding: "10px 18px", color: editing ? accent : "#f8f2e7", cursor: "pointer", fontSize: 13, fontFamily: "Cairo, sans-serif", fontWeight: 800, transition: "all 0.2s" }}>
                {editing ? "✕ إغلاق" : "✏️ تعديل"}
              </button>
              {canPrestige && prestige < 11 && (
                <button onClick={handlePrestige} disabled={prestigeBusy}
                  style={{
                    background: `linear-gradient(135deg, ${prestigeMeta?.color || accent}, ${accent})`,
                    border: "none", borderRadius: 12, padding: "10px 18px",
                    color: "#0a0710", cursor: "pointer", fontSize: 13,
                    fontFamily: "Cairo, sans-serif", fontWeight: 900,
                    opacity: prestigeBusy ? 0.6 : 1, transition: "all 0.2s",
                    boxShadow: `0 4px 16px ${accent}55`,
                    animation: "pulse 2s infinite",
                  }}>
                  {prestigeBusy ? "..." : `⭐ برستيج ${prestige + 1}`}
                </button>
              )}
            </>
          ) : (
            <button onClick={handleFollow} disabled={followBusy}
              style={{
                background: profile.is_following ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                border: `1px solid ${profile.is_following ? "rgba(255,255,255,0.2)" : "transparent"}`,
                borderRadius: 12, padding: "10px 22px",
                color: profile.is_following ? "#f8f2e7" : "#0a0710",
                cursor: "pointer", fontSize: 13, fontFamily: "Cairo, sans-serif", fontWeight: 800,
                opacity: followBusy ? 0.6 : 1, transition: "all 0.2s",
              }}>
              {followBusy ? "..." : profile.is_following ? "✓ تتابعه" : "+ متابعة"}
            </button>
          )}
        </div>
      </div>

      {/* Name + info */}
      <div style={{ padding: "12px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: "#f8f2e7" }}>{profile.username}</span>
          {profile.subscription_type === "premium" && (
            <span style={{ fontSize: 11, background: "rgba(234,179,8,0.15)", color: "#f59e0b", padding: "3px 9px", borderRadius: 999, fontWeight: 800, border: "1px solid rgba(234,179,8,0.3)" }}>⭐ Premium</span>
          )}
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>@{profile.username}</div>

        {/* Level + Prestige badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {prestige > 0 && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${prestigeColor}14`, border: `1px solid ${prestigeColor}33`, borderRadius: 999, padding: "4px 12px" }}>
              <PrestigeBadge prestige={prestige} size={18} />
              <span style={{ fontSize: 12, fontWeight: 900, color: prestigeColor }}>{prestigeMeta.name}</span>
            </div>
          )}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `${accent}12`, border: `1px solid ${accent}28`, borderRadius: 999, padding: "4px 12px" }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: accent }}>Lv.{profile.level}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>/55</span>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", marginTop: 10, lineHeight: 1.65, maxWidth: 480 }}>
            {profile.bio}
          </p>
        )}

        {/* Interests */}
        {profile.interests?.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {profile.interests.map(tag => (
              <span key={tag} style={{ fontSize: 11, background: `${accent}14`, color: accent, padding: "3px 10px", borderRadius: 999, fontWeight: 700, border: `1px solid ${accent}30` }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Social counts */}
        <div style={{ display: "flex", gap: 20, marginTop: 10, fontSize: 13 }}>
          <span onClick={() => setActiveTab("followers")} style={{ color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>
            <span style={{ color: accent, fontWeight: 900 }}>{fmtNumber(profile.followers_count)}</span> متابع
          </span>
          <span onClick={() => setActiveTab("following")} style={{ color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>
            <span style={{ color: accent, fontWeight: 900 }}>{fmtNumber(profile.following_count)}</span> يتابع
          </span>
        </div>
      </div>

      {/* XP Bar */}
      <div style={{ marginTop: 14 }}>
        <XPBar progress={profile.xp_progress} accent={prestigeColor} level={profile.level} prestige={prestige} />
      </div>
    </>
  );

  /* ── Render: STATS ROW ────────────────────────────────────────────────────── */
  const renderStats = () => (
    <div style={{ padding: "0 12px 16px", overflowX: "auto" }}>
      <div style={{ display: "flex", gap: 8, minWidth: "max-content" }}>
        <StatCard icon="🎮" value={profile.game_count}          label="لعبة"     accent={accent} />
        <StatCard icon="📚" value={profile.approved_categories}  label="فئة"     accent={accent} onClick={() => setActiveTab("cats")} />
        <StatCard icon="❤️" value={profile.total_likes}          label="إعجاب"   accent={accent} />
        <StatCard icon="🎯" value={profile.total_plays}          label="تشغيل"   accent={accent} />
        <StatCard icon="👥" value={profile.followers_count}      label="متابع"   accent={accent} onClick={() => setActiveTab("followers")} />
        <StatCard icon="✨" value={profile.total_xp}             label="XP"      accent={accent} />
      </div>
    </div>
  );

  /* ── Render: EDIT PANEL ───────────────────────────────────────────────────── */
  const renderEdit = () => (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 20, marginBottom: 16, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: accent }}>✏️ تعديل البروفايل</div>

      {/* Username */}
      <div>
        <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6, fontWeight: 700 }}>اسم المستخدم</label>
        <input style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 14px", color: "#f8f2e7", fontSize: 14, fontFamily: "Cairo, sans-serif", outline: "none", boxSizing: "border-box" }}
          value={eUsername} onChange={e => setEUsername(e.target.value)} />
      </div>

      {/* Bio */}
      <div>
        <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6, fontWeight: 700 }}>Bio — وصف مختصر</label>
        <textarea style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 14px", color: "#f8f2e7", fontSize: 14, fontFamily: "Cairo, sans-serif", outline: "none", boxSizing: "border-box", resize: "vertical", minHeight: 80 }}
          value={eBio} onChange={e => setEBio(e.target.value)} maxLength={300} placeholder="اكتب شيئاً عن نفسك..." />
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textAlign: "left" }}>{eBio.length}/300</div>
      </div>

      {/* Interests */}
      <div>
        <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6, fontWeight: 700 }}>الاهتمامات (مفصولة بفاصلة)</label>
        <input style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 14px", color: "#f8f2e7", fontSize: 14, fontFamily: "Cairo, sans-serif", outline: "none", boxSizing: "border-box" }}
          value={eInterests} onChange={e => setEInterests(e.target.value)} placeholder="مثال: أفلام، رياضة، علوم" />
      </div>

      {/* Avatar */}
      <ImageUploader label="صورة الملف الشخصي" value={eAvatar} onChange={setEAvatar} token={userToken} circle placeholder="رابط الصورة..." />

      {/* Banner */}
      <div>
        <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 8, fontWeight: 700 }}>خلفية البروفايل (Banner)</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {BANNERS.map(b => (
            <div key={b.id}
              onClick={() => setEBanner("")}
              style={{ width: 48, height: 32, borderRadius: 8, background: b.gradient, cursor: "pointer", border: `2px solid ${!eBanner && eBanner === "" ? accent : "transparent"}`, transition: "border 0.2s", flexShrink: 0 }}
              title={b.label}
            />
          ))}
        </div>
        <ImageUploader value={eBanner} onChange={setEBanner} token={userToken} placeholder="أو رابط صورة مخصصة..." />
      </div>

      {/* Accent color */}
      <div>
        <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 8, fontWeight: 700 }}>لون البروفايل</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ACCENTS.map(a => (
            <div key={a.color} onClick={() => setEAccent(a.color)}
              style={{ width: 32, height: 32, borderRadius: "50%", background: a.color, cursor: "pointer", border: `3px solid ${eAccent === a.color ? "#fff" : "transparent"}`, boxShadow: eAccent === a.color ? `0 0 10px ${a.color}` : "none", transition: "all 0.2s", flexShrink: 0 }}
              title={a.label}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={handleSave} disabled={saving}
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, color: "#0a0710", border: "none", borderRadius: 12, padding: "11px 22px", fontWeight: 800, cursor: "pointer", fontSize: 14, fontFamily: "Cairo, sans-serif", opacity: saving ? 0.6 : 1 }}>
          {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
        <button onClick={() => setEditing(false)}
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "11px 18px", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 14, fontFamily: "Cairo, sans-serif", fontWeight: 700 }}>
          إلغاء
        </button>
      </div>
    </div>
  );

  /* ── Render: ABOUT TAB ────────────────────────────────────────────────────── */
  const renderAbout = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {profile.is_own && editing && renderEdit()}

      {/* Earnings (own only) */}
      {profile.is_own && profile.wallet && (
        <div style={{ background: "rgba(64,212,140,0.05)", border: "1px solid rgba(64,212,140,0.2)", borderRadius: 18, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#73f0a8", marginBottom: 14 }}>💰 أرباحك</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              { v: `${profile.wallet.balance?.toFixed(2)} ر`, l: "الرصيد المتاح", c: accent },
              { v: `${profile.wallet.monthly_pending_sar?.toFixed(2)} ر`, l: "هذا الشهر", c: "#73f0a8" },
              { v: `${profile.wallet.total_earned?.toFixed(2)} ر`, l: "إجمالي الأرباح", c: "rgba(255,255,255,0.6)" },
            ].map(({ v, l, c }) => (
              <div key={l} style={{ flex: "1 1 100px" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: c, lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/community")}
            style={{ marginTop: 14, background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, color: "#0a0710", border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 800, cursor: "pointer", fontSize: 13, fontFamily: "Cairo, sans-serif" }}>
            إدارة الأرباح
          </button>
        </div>
      )}

      {/* Best category */}
      {profile.best_category && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>🏆 أفضل فئة</div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {profile.best_category.image_url && (
              <img src={profile.best_category.image_url} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
            )}
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#f8f2e7" }}>{profile.best_category.name}</div>
              <div style={{ display: "flex", gap: 14, marginTop: 6, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                <span>🎮 {profile.best_category.play_count || 0}</span>
                <span>❤️ {profile.best_category.likes_count || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* XP breakdown */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.5)", marginBottom: 14 }}>⚡ مصادر الـ XP</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "الألعاب المُلعَبة",   value: profile.game_count,          mult: 10, icon: "🎮" },
            { label: "فئات معتمدة",         value: profile.approved_categories,  mult: 50, icon: "📚" },
            { label: "تشغيلات الفئات",      value: profile.total_plays,          mult: 2,  icon: "🎯" },
            { label: "الإعجابات المستلمة",  value: profile.total_likes,          mult: 5,  icon: "❤️" },
          ].map(({ label, value, mult, icon }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{icon} {label}</span>
              <div style={{ textAlign: "left" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginLeft: 8 }}>{value} × {mult}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: accent }}>{(value * mult)} XP</span>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#f8f2e7" }}>الإجمالي</span>
            <span style={{ fontSize: 15, fontWeight: 900, color: accent }}>{profile.total_xp} XP</span>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Render: CATEGORIES TAB ───────────────────────────────────────────────── */
  const renderCats = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {!catsLoading && cats.length === 0 && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📂</div>
          <div style={{ color: "rgba(255,255,255,0.4)" }}>لا توجد فئات معتمدة</div>
        </div>
      )}
      {cats.map(cat => (
        <div key={cat.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 16 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            {cat.image_url && (
              <img src={cat.image_url} alt={cat.name} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 12, flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#f8f2e7", marginBottom: 6 }}>
                {cat.icon && <span style={{ marginLeft: 6 }}>{cat.icon}</span>}{cat.name}
              </div>
              {cat.description && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat.description}</div>}
              <div style={{ display: "flex", gap: 16 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>🎮 {cat.play_count || 0}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>❤️ {cat.likes_count || 0}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>📝 {cat.questions_count}</span>
                {profile.is_own && cat.play_count > 0 && (
                  <span style={{ fontSize: 12, color: "#73f0a8" }}>+{Math.floor(cat.play_count * 2)} XP</span>
                )}
              </div>
            </div>
            <button onClick={() => shareCat(cat)}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "7px 12px", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 12, fontFamily: "Cairo, sans-serif", fontWeight: 700, flexShrink: 0 }}>
              🔗
            </button>
          </div>
        </div>
      ))}
      {catsLoading && <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: 20 }}>جاري التحميل...</div>}
      {catsMore && !catsLoading && cats.length > 0 && (
        <button onClick={() => loadCats(catsPage)}
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "11px", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 13 }}>
          تحميل المزيد
        </button>
      )}
    </div>
  );

  /* ── Render: USER LIST (followers/following) ──────────────────────────────── */
  const renderUserList = (list, empty) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {list.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.35)" }}>{empty}</div>
      )}
      {list.map(u => (
        <div key={u.id} onClick={() => navigate(`/profile/${u.username}`)}
          style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 14, cursor: "pointer", transition: "background 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
        >
          <Avatar url={u.avatar_url} username={u.username} size={46} accent={accent} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#f8f2e7" }}>
              {u.username}
              {u.subscription_type === "premium" && <span style={{ marginRight: 6, fontSize: 11, background: "rgba(234,179,8,0.15)", color: "#f59e0b", padding: "2px 7px", borderRadius: 999 }}>⭐</span>}
            </div>
            {u.bio && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{u.bio}</div>}
          </div>
        </div>
      ))}
    </div>
  );

  /* ── FINAL RENDER ─────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "#09070b", fontFamily: "Cairo, sans-serif", direction: "rtl", color: "#f8f2e7" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Hero */}
        {renderHero()}

        {/* Stats row */}
        {renderStats()}

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 12px 16px" }} />

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, padding: "0 12px", marginBottom: 16, overflowX: "auto" }}>
          {TABS_CONFIG.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{
                padding: "9px 16px", borderRadius: 10, border: "none", whiteSpace: "nowrap",
                fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 13, cursor: "pointer",
                transition: "all 0.2s",
                background: activeTab === t.key ? `${accent}22` : "transparent",
                color:      activeTab === t.key ? accent : "rgba(255,255,255,0.45)",
                borderBottom: activeTab === t.key ? `2px solid ${accent}` : "2px solid transparent",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: "0 12px 60px" }}>
          {activeTab === "about"     && renderAbout()}
          {activeTab === "cats"      && renderCats()}
          {activeTab === "followers" && renderUserList(followers,     "لا يوجد متابعون بعد")}
          {activeTab === "following" && renderUserList(followingList,  "لا يتابع أحداً بعد")}
        </div>
      </div>
    </div>
  );
}
