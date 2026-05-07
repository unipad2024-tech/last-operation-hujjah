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
  { name: "المُجنَّد",        color: "#4ade80", glow: "#4ade8055" },  // P1  Green Eagle Shield
  { name: "المقاتل",          color: "#f97316", glow: "#f9731655" },  // P2  Orange Lightning Fist
  { name: "المحارب",          color: "#ca8a04", glow: "#ca8a0455" },  // P3  Gold Scorpion Circle
  { name: "الفارس",           color: "#71717a", glow: "#71717a55" },  // P4  Gray Beast Head
  { name: "الحامي",           color: "#7c3aed", glow: "#7c3aed55" },  // P5  Purple Snake Diamond
  { name: "البطل",            color: "#3b82f6", glow: "#3b82f655" },  // P6  Blue Trident Shield
  { name: "الأسطورة",         color: "#a8a29e", glow: "#a8a29e55" },  // P7  Silver Viking Axes
  { name: "النخبة",           color: "#c2410c", glow: "#c2410c55" },  // P8  Bronze Skull Diamond Stars
  { name: "نخبة الأساطير",    color: "#4b5563", glow: "#4b556355" },  // P9  Dark Military Skull
  { name: "قائد الأبطال",     color: "#6b7280", glow: "#6b728055" },  // P10 Gray Split-Face Chevron
  { name: "ماستر",            color: "#f2b85b", glow: "#f2b85b77" },  // P11 Gold Master Dual-Skull
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

    /* P1 — Dark shield with chain links + double-headed eagle (green holographic) */
    1: <>
      <defs>{glowFilter}</defs>
      {/* Shield body — tall, pointed bottom */}
      <path d="M20 2 L35 7 L35 23 C35 33 28 40 20 42 C12 40 5 33 5 23 L5 7 Z"
        fill={`${c}1a`} stroke={c} strokeWidth="1.8" filter={`url(#${id})`}/>
      {/* Chain links left side */}
      <ellipse cx="6" cy="12" rx="1.8" ry="1.1" fill="none" stroke={c} strokeWidth="1" opacity="0.6" transform="rotate(-30,6,12)"/>
      <ellipse cx="6" cy="16" rx="1.8" ry="1.1" fill="none" stroke={c} strokeWidth="1" opacity="0.6" transform="rotate(30,6,16)"/>
      <ellipse cx="6" cy="20" rx="1.8" ry="1.1" fill="none" stroke={c} strokeWidth="1" opacity="0.6" transform="rotate(-30,6,20)"/>
      {/* Chain links right side */}
      <ellipse cx="34" cy="12" rx="1.8" ry="1.1" fill="none" stroke={c} strokeWidth="1" opacity="0.6" transform="rotate(30,34,12)"/>
      <ellipse cx="34" cy="16" rx="1.8" ry="1.1" fill="none" stroke={c} strokeWidth="1" opacity="0.6" transform="rotate(-30,34,16)"/>
      <ellipse cx="34" cy="20" rx="1.8" ry="1.1" fill="none" stroke={c} strokeWidth="1" opacity="0.6" transform="rotate(30,34,20)"/>
      {/* Left eagle head facing left */}
      <ellipse cx="14" cy="13" rx="3.2" ry="2.8" fill={c} filter={`url(#${id})`}/>
      <path d="M11 13 L8 15 L11 14.5" fill={c}/>
      {/* Left wing spreading up-left */}
      <path d="M14 16 L7 22 L10 20 L8 26 L14 21 Z" fill={c} opacity="0.85"/>
      {/* Right eagle head facing right */}
      <ellipse cx="26" cy="13" rx="3.2" ry="2.8" fill={c} filter={`url(#${id})`}/>
      <path d="M29 13 L32 15 L29 14.5" fill={c}/>
      {/* Right wing spreading up-right */}
      <path d="M26 16 L33 22 L30 20 L32 26 L26 21 Z" fill={c} opacity="0.85"/>
      {/* Body connecting both heads */}
      <ellipse cx="20" cy="22" rx="4" ry="3" fill={c} opacity="0.7"/>
      {numLabel(20, 30, 9)}
    </>,

    /* P2 — Dark red pentagonal shield, crossed swords top, armored fist + golden lightning bolt */
    2: <>
      <defs>{glowFilter}</defs>
      {/* Pentagon shield */}
      <path d="M20 3 L36 11 L36 27 C36 33 30 39 20 41 C10 39 4 33 4 27 L4 11 Z"
        fill={`${c}20`} stroke={c} strokeWidth="1.8" filter={`url(#${id})`}/>
      {/* Crossed sword left (handle top-left, blade goes down-right) */}
      <line x1="10" y1="4" x2="22" y2="14" stroke={c} strokeWidth="2.2" strokeLinecap="round" opacity="0.9"/>
      <line x1="8" y1="6" x2="12" y2="6" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.9"/>
      {/* Crossed sword right (handle top-right, blade goes down-left) */}
      <line x1="30" y1="4" x2="18" y2="14" stroke={c} strokeWidth="2.2" strokeLinecap="round" opacity="0.9"/>
      <line x1="32" y1="6" x2="28" y2="6" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.9"/>
      {/* Armored gauntlet/fist (rounded rectangle = glove) */}
      <rect x="16" y="17" width="8" height="9" rx="2.5" fill={c} opacity="0.85" filter={`url(#${id})`}/>
      {/* Knuckle ridges */}
      <line x1="17" y1="17" x2="17" y2="20" stroke="rgba(0,0,0,0.4)" strokeWidth="1"/>
      <line x1="20" y1="17" x2="20" y2="20" stroke="rgba(0,0,0,0.4)" strokeWidth="1"/>
      <line x1="23" y1="17" x2="23" y2="20" stroke="rgba(0,0,0,0.4)" strokeWidth="1"/>
      {/* Golden lightning bolt held by fist */}
      <path d="M22 11 L16 21 L20.5 21 L17 30 L28 18 L23 18 Z"
        fill="#fbbf24" filter={`url(#${id})`}/>
      {/* Fire glow at bottom */}
      <ellipse cx="20" cy="37" rx="8" ry="3" fill={`${c}40`}/>
    </>,

    /* P3 — Dark circle with 8 spike protrusions, large golden scorpion inside */
    3: <>
      <defs>{glowFilter}</defs>
      {/* 8-spike sun border */}
      <polygon points="20,1 22.5,7 27,3 26,9 32,8 29,13 36,15 31,18 36,22 30,23 33,29 27,28 27,35 22,31 20,38 18,31 13,35 13,28 7,29 10,23 4,22 9,18 4,15 11,13 8,8 14,9 13,3 18,7"
        fill={`${c}22`} stroke={c} strokeWidth="1.2" filter={`url(#${id})`}/>
      {/* Dark inner circle */}
      <circle cx="20" cy="20" r="13" fill="#0d0d0d" stroke={c} strokeWidth="1" opacity="0.85"/>
      {/* Scorpion body segments */}
      <ellipse cx="20" cy="23" rx="4.5" ry="5.5" fill="#ca8a04" opacity="0.95" filter={`url(#${id})`}/>
      <ellipse cx="20" cy="19" rx="3.5" ry="3" fill="#ca8a04" opacity="0.9"/>
      {/* Scorpion tail curving up with stinger */}
      <path d="M20 17 C21 13 24 11 25 8 C26 6 24 4 23 5" stroke="#ca8a04" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M23 5 L25 3 L24 6" fill="#ca8a04"/>
      {/* Left claw arm */}
      <path d="M16 22 L11 19 L9 16 M11 19 L10 23" stroke="#ca8a04" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Right claw arm */}
      <path d="M24 22 L29 19 L31 16 M29 19 L30 23" stroke="#ca8a04" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Legs */}
      <line x1="17" y1="24" x2="12" y2="26" stroke="#ca8a04" strokeWidth="1.2" opacity="0.7"/>
      <line x1="17" y1="26" x2="12" y2="29" stroke="#ca8a04" strokeWidth="1.2" opacity="0.7"/>
      <line x1="23" y1="24" x2="28" y2="26" stroke="#ca8a04" strokeWidth="1.2" opacity="0.7"/>
      <line x1="23" y1="26" x2="28" y2="29" stroke="#ca8a04" strokeWidth="1.2" opacity="0.7"/>
    </>,

    /* P4 — Floating beast/demon head, wide scaled head, banana horns, red glowing eyes, nose ring, 3 red bars */
    4: <>
      <defs>{glowFilter}</defs>
      {/* Wide scaled head — no frame */}
      <path d="M6 14 Q5 8 10 7 Q15 5 20 6 Q25 5 30 7 Q35 8 34 14 Q35 22 30 28 Q25 33 20 34 Q15 33 10 28 Q5 22 6 14 Z"
        fill={`${c}28`} stroke={c} strokeWidth="1.5" filter={`url(#${id})`}/>
      {/* Scale texture lines */}
      <path d="M10 12 Q13 10 16 12 Q19 14 22 12 Q25 10 28 12 Q31 14 33 13" stroke={c} strokeWidth="0.7" fill="none" opacity="0.4"/>
      <path d="M9 16 Q12 14 15 16 Q18 18 21 16 Q24 14 27 16 Q30 18 33 17" stroke={c} strokeWidth="0.7" fill="none" opacity="0.4"/>
      {/* Left banana-shaped curved horn */}
      <path d="M10 12 Q4 8 3 4 Q5 2 8 5 Q11 9 12 14" fill={c} opacity="0.9"/>
      {/* Right banana-shaped curved horn */}
      <path d="M30 12 Q36 8 37 4 Q35 2 32 5 Q29 9 28 14" fill={c} opacity="0.9"/>
      {/* Left glowing red eye */}
      <ellipse cx="15" cy="20" rx="3.5" ry="3" fill="#dc2626" filter={`url(#${id})`}/>
      <ellipse cx="15" cy="20" rx="2" ry="1.8" fill="#ff4444"/>
      <ellipse cx="15" cy="20" rx="1" ry="1" fill="#fff" opacity="0.5"/>
      {/* Right glowing red eye */}
      <ellipse cx="25" cy="20" rx="3.5" ry="3" fill="#dc2626" filter={`url(#${id})`}/>
      <ellipse cx="25" cy="20" rx="2" ry="1.8" fill="#ff4444"/>
      <ellipse cx="25" cy="20" rx="1" ry="1" fill="#fff" opacity="0.5"/>
      {/* Nose ring at bottom of muzzle */}
      <ellipse cx="20" cy="28" rx="2.5" ry="1.5" fill="none" stroke={c} strokeWidth="1.8"/>
      {/* 3 red bars below */}
      <rect x="12" y="32" width="16" height="1.8" rx="0.9" fill="#dc2626" opacity="0.9"/>
      <rect x="13" y="35" width="14" height="1.8" rx="0.9" fill="#dc2626" opacity="0.7"/>
      <rect x="14" y="38" width="12" height="1.8" rx="0.9" fill="#dc2626" opacity="0.5"/>
    </>,

    /* P5 — Purple diamond/hexagonal frame, two combat knives X, snake head emerging from center */
    5: <>
      <defs>{glowFilter}</defs>
      {/* Diamond/hexagonal frame */}
      <polygon points="20,2 38,20 20,38 2,20"
        fill={`${c}18`} stroke={c} strokeWidth="2" filter={`url(#${id})`}/>
      {/* Combat knife 1 — diagonal top-left to bottom-right */}
      <line x1="9" y1="9" x2="31" y2="31" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      {/* Knife guard left */}
      <line x1="8" y1="11" x2="11" y2="8" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
      {/* Knife handle left */}
      <rect x="5" y="5" width="5" height="2.5" rx="1" fill={c} opacity="0.75" transform="rotate(45,7.5,6.25)"/>
      {/* Combat knife 2 — diagonal top-right to bottom-left */}
      <line x1="31" y1="9" x2="9" y2="31" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      {/* Knife guard right */}
      <line x1="32" y1="11" x2="29" y2="8" stroke={c} strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
      {/* Knife handle right */}
      <rect x="30" y="5" width="5" height="2.5" rx="1" fill={c} opacity="0.75" transform="rotate(-45,32.5,6.25)"/>
      {/* Snake long neck curving from bottom */}
      <path d="M20 38 Q18 30 20 24 Q22 18 20 14" stroke={c} strokeWidth="3.5" fill="none" strokeLinecap="round" filter={`url(#${id})`}/>
      {/* Snake head open mouth at top center */}
      <ellipse cx="20" cy="12" rx="5" ry="3.5" fill={c} filter={`url(#${id})`}/>
      {/* Upper jaw */}
      <path d="M15 11 Q20 9 25 11 L25 12 Q20 10.5 15 12 Z" fill={c}/>
      {/* Open mouth / lower jaw */}
      <path d="M15 13 Q20 15.5 25 13" stroke={c} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* Tongue forked */}
      <path d="M20 9 L19 6 M20 9 L21 6" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Snake eye */}
      <ellipse cx="17" cy="11" rx="1.2" ry="1.2" fill="#fbbf24"/>
    </>,

    /* P6 — Blue hexagonal shield, thick tentacles, golden trident prominent in foreground */
    6: <>
      <defs>{glowFilter}</defs>
      {/* Hexagonal shield */}
      <polygon points="20,2 35,11 35,29 20,38 5,29 5,11"
        fill={`${c}1a`} stroke={c} strokeWidth="1.8" filter={`url(#${id})`}/>
      {/* Thick tentacle 1 — left upper */}
      <path d="M10 14 Q8 18 11 22 Q14 26 11 30" stroke={c} strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.65"/>
      {/* Thick tentacle 2 — left lower */}
      <path d="M8 22 Q6 27 9 32" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5"/>
      {/* Thick tentacle 3 — right upper */}
      <path d="M30 14 Q32 18 29 22 Q26 26 29 30" stroke={c} strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.65"/>
      {/* Thick tentacle 4 — right lower */}
      <path d="M32 22 Q34 27 31 32" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5"/>
      {/* Trident shaft — prominent, tall center */}
      <line x1="20" y1="8" x2="20" y2="36" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" filter={`url(#${id})`}/>
      {/* Center prong (tallest) */}
      <path d="M20 8 L18 14 L20 12 L22 14 Z" fill="#fbbf24"/>
      {/* Left prong */}
      <line x1="13" y1="8" x2="13" y2="18" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M13 8 L11 13 L13 11 L15 13 Z" fill="#fbbf24"/>
      {/* Right prong */}
      <line x1="27" y1="8" x2="27" y2="18" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M27 8 L25 13 L27 11 L29 13 Z" fill="#fbbf24"/>
      {/* Crossbar connecting side prongs to shaft */}
      <line x1="13" y1="17" x2="27" y2="17" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
    </>,

    /* P7 — No frame, two large crossed battle axes, spiked Viking helmet center, chain at bottom */
    7: <>
      <defs>{glowFilter}</defs>
      {/* Axe 1 — top-left to bottom-right diagonal */}
      <line x1="10" y1="8" x2="30" y2="32" stroke={c} strokeWidth="2.2" strokeLinecap="round" opacity="0.7"/>
      {/* Axe 1 blade — top-left (crescent shape) */}
      <path d="M5 5 Q12 2 14 10 Q10 12 5 10 Z" fill={c} opacity="0.9"/>
      {/* Axe 1 blade — bottom-right */}
      <path d="M35 35 Q28 38 26 30 Q30 28 35 30 Z" fill={c} opacity="0.9"/>
      {/* Axe 2 — top-right to bottom-left diagonal */}
      <line x1="30" y1="8" x2="10" y2="32" stroke={c} strokeWidth="2.2" strokeLinecap="round" opacity="0.7"/>
      {/* Axe 2 blade — top-right */}
      <path d="M35 5 Q28 2 26 10 Q30 12 35 10 Z" fill={c} opacity="0.9"/>
      {/* Axe 2 blade — bottom-left */}
      <path d="M5 35 Q12 38 14 30 Q10 28 5 30 Z" fill={c} opacity="0.9"/>
      {/* Viking helmet dome */}
      <path d="M14 26 Q13 18 20 15 Q27 18 26 26 L24 27 L20 29 L16 27 Z"
        fill={c} filter={`url(#${id})`}/>
      {/* Helmet nose guard */}
      <rect x="19" y="23" width="2" height="6" rx="1" fill={`${c}cc`}/>
      {/* Center spike on top */}
      <polygon points="20,12 18.5,16 21.5,16" fill={c}/>
      {/* Left curved horn */}
      <path d="M14 21 Q9 16 8 11 Q10 9 13 13 Q15 17 15 22" fill={c} opacity="0.85"/>
      {/* Right curved horn */}
      <path d="M26 21 Q31 16 32 11 Q30 9 27 13 Q25 17 25 22" fill={c} opacity="0.85"/>
      {/* Chain links at bottom */}
      <ellipse cx="16" cy="34" rx="2.2" ry="1.2" fill="none" stroke={c} strokeWidth="1.2" opacity="0.65"/>
      <ellipse cx="20" cy="34" rx="2.2" ry="1.2" fill="none" stroke={c} strokeWidth="1.2" opacity="0.65"/>
      <ellipse cx="24" cy="34" rx="2.2" ry="1.2" fill="none" stroke={c} strokeWidth="1.2" opacity="0.65"/>
    </>,

    /* P8 — 3D copper/bronze diamond, ivory skull center, 5 silver metallic stars at corners */
    8: <>
      <defs>
        {glowFilter}
        <linearGradient id={lg} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e86234"/>
          <stop offset="60%" stopColor={c}/>
          <stop offset="100%" stopColor="#7a2508"/>
        </linearGradient>
      </defs>
      {/* 5 silver 3D metallic stars — arranged at diamond corners and midpoints */}
      {/* Top */}
      <polygon points="20,1 21.2,4.5 24.5,4.5 21.8,6.5 22.8,10 20,8 17.2,10 18.2,6.5 15.5,4.5 18.8,4.5"
        fill="#d4d4d4" filter={`url(#${id})`}/>
      {/* Right */}
      <polygon points="37,18 38.2,21.5 39,21.5 38,22.5 38.5,25 37,23.5 35.5,25 36,22.5 35,21.5 35.8,21.5"
        fill="#d4d4d4" filter={`url(#${id})`}/>
      {/* Bottom */}
      <polygon points="20,29 21.2,32.5 24.5,32.5 21.8,34.5 22.8,38 20,36 17.2,38 18.2,34.5 15.5,32.5 18.8,32.5"
        fill="#d4d4d4" filter={`url(#${id})`}/>
      {/* Left */}
      <polygon points="3,18 4.2,21.5 5,21.5 4,22.5 4.5,25 3,23.5 1.5,25 2,22.5 1,21.5 1.8,21.5"
        fill="#d4d4d4" filter={`url(#${id})`}/>
      {/* Upper-right mid */}
      <polygon points="31,7 31.8,9.5 34,9.5 32.3,11 33,13.5 31,12 29,13.5 29.7,11 28,9.5 30.2,9.5"
        fill="#d4d4d4" filter={`url(#${id})`}/>
      {/* 3D diamond body with beveled edges */}
      <polygon points="20,8 33,20 20,32 7,20" fill={`url(#${lg})`} stroke="#7a2508" strokeWidth="0.8"/>
      {/* Bevel highlights */}
      <polygon points="20,8 33,20 27,20 20,14" fill="rgba(255,255,255,0.18)"/>
      <polygon points="20,8 7,20 13,20 20,14" fill="rgba(0,0,0,0.15)"/>
      {/* Ivory skull cranium */}
      <ellipse cx="20" cy="19" rx="6.5" ry="6" fill="#e8e0d0" filter={`url(#${id})`}/>
      {/* Skull jaw */}
      <rect x="16.5" y="23.5" width="7" height="4" rx="1.5" fill="#ddd4c0"/>
      {/* Eye sockets */}
      <ellipse cx="17.5" cy="19" rx="2.2" ry="2.2" fill="rgba(0,0,0,0.7)"/>
      <ellipse cx="22.5" cy="19" rx="2.2" ry="2.2" fill="rgba(0,0,0,0.7)"/>
      {/* Teeth gaps */}
      <line x1="17.5" y1="23.5" x2="17.5" y2="27" stroke="rgba(0,0,0,0.5)" strokeWidth="1.2"/>
      <line x1="20" y1="23.5" x2="20" y2="27" stroke="rgba(0,0,0,0.5)" strokeWidth="1.2"/>
      <line x1="22.5" y1="23.5" x2="22.5" y2="27" stroke="rgba(0,0,0,0.5)" strokeWidth="1.2"/>
    </>,

    /* P9 — Dark angular crest, bat-wing blades left/right, military skull with beret, crossed bones below */
    9: <>
      <defs>{glowFilter}</defs>
      {/* Angular crest badge background */}
      <path d="M20 3 L33 8 L36 18 L33 28 L20 36 L7 28 L4 18 L7 8 Z"
        fill={`${c}20`} stroke={c} strokeWidth="1.5" filter={`url(#${id})`}/>
      {/* Left bat-wing/blade extension */}
      <path d="M7 14 L2 8 L3 16 L1 22 L5 20 L4 26 L8 20 Z" fill={c} opacity="0.85"/>
      {/* Right bat-wing/blade extension */}
      <path d="M33 14 L38 8 L37 16 L39 22 L35 20 L36 26 L32 20 Z" fill={c} opacity="0.85"/>
      {/* Skull cranium */}
      <ellipse cx="20" cy="17" rx="8" ry="7.5" fill={c} filter={`url(#${id})`}/>
      {/* Beret (flat tilted cap) */}
      <path d="M12 14 Q13 8 20 7 Q27 6 28 11 Q24 13 20 13 Q16 14 12 14 Z" fill={`${c}dd`}/>
      {/* Beret brim line */}
      <line x1="12" y1="14" x2="29" y2="13" stroke={c} strokeWidth="1.2" opacity="0.6"/>
      {/* Small gold badge on beret */}
      <polygon points="20,8 20.8,10 22.5,10 21.2,11.2 21.7,13 20,12 18.3,13 18.8,11.2 17.5,10 19.2,10"
        fill="#fbbf24" opacity="0.9"/>
      {/* Eye sockets */}
      <ellipse cx="16.5" cy="17" rx="2.8" ry="2.5" fill="rgba(0,0,0,0.65)"/>
      <ellipse cx="23.5" cy="17" rx="2.8" ry="2.5" fill="rgba(0,0,0,0.65)"/>
      {/* Skull jaw */}
      <rect x="15" y="22.5" width="10" height="4.5" rx="2" fill={c}/>
      <line x1="17.5" y1="22.5" x2="17.5" y2="27" stroke="rgba(0,0,0,0.45)" strokeWidth="1.3"/>
      <line x1="20" y1="22.5" x2="20" y2="27" stroke="rgba(0,0,0,0.45)" strokeWidth="1.3"/>
      <line x1="22.5" y1="22.5" x2="22.5" y2="27" stroke="rgba(0,0,0,0.45)" strokeWidth="1.3"/>
      {/* Crossed large bones (X) below skull */}
      <line x1="9" y1="31" x2="31" y2="38" stroke={c} strokeWidth="3.5" strokeLinecap="round" opacity="0.9"/>
      <line x1="31" y1="31" x2="9" y2="38" stroke={c} strokeWidth="3.5" strokeLinecap="round" opacity="0.9"/>
      {/* Bone end knobs */}
      <circle cx="9" cy="31" r="2.5" fill={c}/>
      <circle cx="31" cy="38" r="2.5" fill={c}/>
      <circle cx="31" cy="31" r="2.5" fill={c}/>
      <circle cx="9" cy="38" r="2.5" fill={c}/>
    </>,

    /* P10 — Downward-pointing chevron/V-shield, split cyborg+zombie face, bullet shapes at bottom */
    10: <>
      <defs>
        {glowFilter}
        <linearGradient id={lg} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#374151"/>
          <stop offset="50%" stopColor={c}/>
          <stop offset="100%" stopColor="#4b1919"/>
        </linearGradient>
      </defs>
      {/* Chevron / V-shape shield pointing down */}
      <path d="M3 5 L20 39 L37 5 Z"
        fill={`${c}20`} stroke={c} strokeWidth="1.8" filter={`url(#${id})`}/>
      {/* Vertical center divider line */}
      <line x1="20" y1="7" x2="20" y2="33" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8"/>
      {/* LEFT HALF — mechanical/cyborg */}
      {/* Cyborg circular yellow glowing eye */}
      <circle cx="14" cy="17" r="4" fill="#1a1a2e" stroke="#ca8a04" strokeWidth="1.2"/>
      <circle cx="14" cy="17" r="2.5" fill="#ca8a04" opacity="0.9" filter={`url(#${id})`}/>
      <circle cx="14" cy="17" r="1.2" fill="#fff" opacity="0.6"/>
      {/* Tech panel lines left */}
      <line x1="8" y1="13" x2="12" y2="13" stroke={c} strokeWidth="1" opacity="0.5"/>
      <line x1="8" y1="15" x2="11" y2="15" stroke={c} strokeWidth="1" opacity="0.4"/>
      <line x1="9" y1="22" x2="13" y2="22" stroke={c} strokeWidth="1" opacity="0.5"/>
      {/* Left side of jaw — mechanical panels */}
      <rect x="10" y="23" width="9" height="6" rx="1" fill={`${c}40`} stroke={c} strokeWidth="0.6"/>
      <line x1="12" y1="23" x2="12" y2="29" stroke={c} strokeWidth="0.6" opacity="0.6"/>
      <line x1="14" y1="23" x2="14" y2="29" stroke={c} strokeWidth="0.6" opacity="0.6"/>
      {/* RIGHT HALF — zombie/flesh */}
      {/* Zombie red glowing eye */}
      <ellipse cx="26" cy="17" rx="3.5" ry="3" fill="#1a0000"/>
      <ellipse cx="26" cy="17" rx="2.2" ry="2" fill="#dc2626" opacity="0.9" filter={`url(#${id})`}/>
      <ellipse cx="26" cy="17" rx="1" ry="0.8" fill="#ff8888" opacity="0.7"/>
      {/* Rotting flesh texture lines right */}
      <path d="M22 14 Q24 12 26 14" stroke="#7a3333" strokeWidth="1" fill="none" opacity="0.6"/>
      <path d="M23 11 Q25 9 28 11" stroke="#7a3333" strokeWidth="1" fill="none" opacity="0.5"/>
      {/* Right side of jaw — rotting/exposed teeth */}
      <rect x="21" y="23" width="9" height="6" rx="1" fill="#2a1010" stroke="#5a2020" strokeWidth="0.6"/>
      <line x1="23" y1="23" x2="23" y2="29" stroke="#7a3333" strokeWidth="1" opacity="0.7"/>
      <line x1="25" y1="23" x2="25" y2="29" stroke="#7a3333" strokeWidth="1" opacity="0.7"/>
      <line x1="27" y1="23" x2="27" y2="29" stroke="#7a3333" strokeWidth="1" opacity="0.7"/>
      {/* Bullet shapes along the bottom edge */}
      <ellipse cx="14" cy="35" rx="1.5" ry="2.5" fill={c} opacity="0.75"/>
      <ellipse cx="17" cy="36.5" rx="1.5" ry="2.5" fill={c} opacity="0.75"/>
      <ellipse cx="20" cy="37.5" rx="1.5" ry="2.5" fill={c} opacity="0.75"/>
      <ellipse cx="23" cy="36.5" rx="1.5" ry="2.5" fill={c} opacity="0.75"/>
      <ellipse cx="26" cy="35" rx="1.5" ry="2.5" fill={c} opacity="0.75"/>
    </>,

    /* P11 — No frame, 3 ice-blue daggers pointing up, 2 skulls below, fire/golden glow at base */
    11: <>
      <defs>
        {glowFilter}
        <radialGradient id={`rg${p}`} cx="50%" cy="85%" r="60%">
          <stop offset="0%" stopColor={c} stopOpacity="0.8"/>
          <stop offset="60%" stopColor={`${c}44`} stopOpacity="0.4"/>
          <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id={lg} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b0e0ff"/>
          <stop offset="100%" stopColor={c}/>
        </linearGradient>
      </defs>
      {/* Golden fire glow at base */}
      <ellipse cx="20" cy="37" rx="16" ry="6" fill={`url(#rg${p})`}/>
      {/* Fire tips */}
      <path d="M11 37 Q12 32 14 30 Q13 28 14 25 Q16 29 15 32 Q17 27 19 24 Q20 29 19 32 Q21 27 23 24 Q23 29 22 32 Q24 28 26 30 Q27 32 28 37 Z"
        fill={`${c}66`} filter={`url(#${id})`}/>
      {/* Center dagger — straight up, tallest */}
      <path d="M20 3 L18.5 8 L19.2 8 L19.2 22 L20.8 22 L20.8 8 L21.5 8 Z"
        fill={`url(#${lg})`} filter={`url(#${id})`}/>
      <path d="M20 3 L18 9 L22 9 Z" fill="#e0f4ff"/>
      {/* Left dagger — angled left-upward */}
      <path d="M14 7 L12 12 L12.7 12.5 L16 24 L17.2 23.5 L14.3 12.5 L15 12 Z"
        fill={`url(#${lg})`} filter={`url(#${id})`} transform="rotate(-18,14,15)"/>
      {/* Right dagger — angled right-upward */}
      <path d="M26 7 L28 12 L27.3 12.5 L24 24 L22.8 23.5 L25.7 12.5 L25 12 Z"
        fill={`url(#${lg})`} filter={`url(#${id})`} transform="rotate(18,26,15)"/>
      {/* Left skull — dark mechanical, yellow eye */}
      <ellipse cx="13" cy="30" rx="5.5" ry="5" fill="#2a2a3a" stroke={c} strokeWidth="0.8"/>
      <rect x="10" y="33.5" width="6" height="2.5" rx="1" fill="#222230"/>
      <ellipse cx="11.5" cy="29.5" rx="1.8" ry="1.5" fill="rgba(0,0,0,0.7)"/>
      <ellipse cx="11.5" cy="29.5" rx="1" ry="0.9" fill="#ca8a04" opacity="0.9"/>
      <ellipse cx="14.5" cy="29.5" rx="1.8" ry="1.5" fill="rgba(0,0,0,0.7)"/>
      <line x1="11" y1="33.5" x2="11" y2="36" stroke={c} strokeWidth="0.9" opacity="0.5"/>
      <line x1="13" y1="33.5" x2="13" y2="36" stroke={c} strokeWidth="0.9" opacity="0.5"/>
      <line x1="15" y1="33.5" x2="15" y2="36" stroke={c} strokeWidth="0.9" opacity="0.5"/>
      {/* Right skull — rotting zombie, red eye */}
      <ellipse cx="27" cy="30" rx="5.5" ry="5" fill="#2a1010" stroke="#dc2626" strokeWidth="0.8"/>
      <rect x="24" y="33.5" width="6" height="2.5" rx="1" fill="#1a0808"/>
      <ellipse cx="25" cy="29.5" rx="1.8" ry="1.5" fill="rgba(0,0,0,0.7)"/>
      <ellipse cx="28.5" cy="29.5" rx="1.8" ry="1.5" fill="rgba(0,0,0,0.7)"/>
      <ellipse cx="28.5" cy="29.5" rx="1" ry="0.9" fill="#dc2626" opacity="0.9" filter={`url(#${id})`}/>
      <line x1="25" y1="33.5" x2="25" y2="36" stroke="#dc2626" strokeWidth="0.9" opacity="0.6"/>
      <line x1="27" y1="33.5" x2="27" y2="36" stroke="#dc2626" strokeWidth="0.9" opacity="0.6"/>
      <line x1="29" y1="33.5" x2="29" y2="36" stroke="#dc2626" strokeWidth="0.9" opacity="0.6"/>
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
  { key: "prestige",  label: "⭐ البرستيج" },
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
            <div style={{
              position: "absolute", bottom: -18, right: -18,
              filter: `drop-shadow(0 0 12px ${prestigeColor}88)`,
              animation: "badgePulse 3s ease-in-out infinite",
            }}>
              <PrestigeBadge prestige={prestige} size={56} />
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

  /* ── Render: PRESTIGE TAB ───────────────────────────────────────────────────── */
  const renderPrestige = () => {
    const prog          = profile.xp_progress || {};
    const prestigeXP    = prog.prestige_xp   ?? 0;      // XP within current prestige (0-10000)
    const toNextLvlXP   = prog.needed_xp     ?? 0;      // XP remaining for next level
    const inLevelXP     = prog.current_xp    ?? 0;      // XP earned within current level
    const toPrestigeXP  = Math.max(0, 10000 - prestigeXP); // XP remaining to reach level 55
    const pct           = Math.min(100, (prestigeXP / 10000) * 100);
    const curMeta       = prestige > 0 ? getPrestigeMeta(prestige) : null;
    const nextMeta      = prestige < 11 ? getPrestigeMeta(prestige + 1) : null;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Current Prestige Hero Card ── */}
        <div style={{
          background: curMeta
            ? `radial-gradient(ellipse at top, ${curMeta.color}18 0%, rgba(0,0,0,0) 60%), rgba(255,255,255,0.03)`
            : "rgba(255,255,255,0.03)",
          border: `1px solid ${curMeta ? curMeta.color + "33" : "rgba(255,255,255,0.08)"}`,
          borderRadius: 24, padding: "28px 20px", textAlign: "center",
        }}>
          {/* Big badge */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            {prestige > 0 ? (
              <div style={{ filter: `drop-shadow(0 0 20px ${curMeta.color}88)` }}>
                <PrestigeBadge prestige={prestige} size={96} />
              </div>
            ) : (
              <div style={{
                width: 96, height: 96, borderRadius: "50%",
                background: "rgba(255,255,255,0.06)",
                border: "2px dashed rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 36,
              }}>🔒</div>
            )}
          </div>

          {/* Name */}
          <div style={{ fontSize: 22, fontWeight: 900, color: curMeta?.color || "rgba(255,255,255,0.4)", marginBottom: 4 }}>
            {prestige > 0 ? curMeta.name : "بدون برستيج"}
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 20 }}>
            {prestige > 0 ? `برستيج ${prestige} من 11` : "العب واجمع XP للوصول للبرستيج الأول"}
          </div>

          {/* Level progress */}
          <div style={{
            background: "rgba(0,0,0,0.3)", borderRadius: 16, padding: "16px 20px",
            textAlign: "right", marginBottom: 0,
          }}>
            {/* Level fraction */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>
                المستوى الحالي
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: curMeta?.color || accent, lineHeight: 1 }}>
                  {profile.level}
                </span>
                <span style={{ fontSize: 16, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>/55</span>
              </div>
            </div>

            {/* Bar for level within prestige */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 5 }}>
                <span>التقدم نحو البرستيج التالي</span>
                <span>{prestigeXP.toLocaleString()} / 10,000 XP</span>
              </div>
              <div style={{ height: 10, background: "rgba(255,255,255,0.07)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 999,
                  background: prog.can_prestige
                    ? `linear-gradient(90deg, ${curMeta?.color || accent}, #fff8, ${curMeta?.color || accent})`
                    : `linear-gradient(90deg, ${curMeta?.color || accent}66, ${curMeta?.color || accent})`,
                  width: `${pct}%`,
                  transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
                  boxShadow: `0 0 12px ${curMeta?.color || accent}88`,
                  animation: prog.can_prestige ? "shimmer 2s linear infinite" : "none",
                  backgroundSize: prog.can_prestige ? "200% 100%" : "100%",
                }}/>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { label: "XP للمستوى التالي", value: prog.can_prestige ? "MAX ✓" : `${toNextLvlXP - inLevelXP} XP`, color: accent },
                { label: "XP للبرستيج التالي", value: prog.can_prestige ? "جاهز!" : `${toPrestigeXP.toLocaleString()} XP`, color: curMeta?.color || accent },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 12,
                  padding: "10px 12px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color }}>{value}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Prestige button */}
            {canPrestige && prestige < 11 && profile.is_own && (
              <button onClick={handlePrestige} disabled={prestigeBusy}
                style={{
                  marginTop: 14, width: "100%",
                  background: `linear-gradient(135deg, ${nextMeta?.color || accent}, ${accent})`,
                  border: "none", borderRadius: 14, padding: "14px",
                  color: "#0a0710", cursor: "pointer", fontSize: 15,
                  fontFamily: "Cairo, sans-serif", fontWeight: 900,
                  opacity: prestigeBusy ? 0.6 : 1,
                  boxShadow: `0 6px 20px ${nextMeta?.color || accent}55`,
                  animation: "pulse 2s infinite",
                }}>
                {prestigeBusy ? "..." : `🎖️ ارتقِ إلى ${nextMeta?.name} (برستيج ${prestige + 1})`}
              </button>
            )}
          </div>
        </div>

        {/* ── All 11 Prestiges Grid ── */}
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 20, padding: "18px 14px",
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>
            جميع البرستيجات
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {PRESTIGE_META.map((meta, idx) => {
              const pNum     = idx + 1;
              const unlocked = pNum <= prestige;
              const isCurrent = pNum === prestige;
              const isNext    = pNum === prestige + 1;

              return (
                <div key={pNum} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  padding: "12px 8px", borderRadius: 16,
                  background: isCurrent
                    ? `${meta.color}18`
                    : isNext
                    ? "rgba(255,255,255,0.04)"
                    : "transparent",
                  border: isCurrent
                    ? `2px solid ${meta.color}55`
                    : isNext
                    ? "1px dashed rgba(255,255,255,0.15)"
                    : "1px solid transparent",
                  transition: "all 0.2s",
                  opacity: unlocked || isCurrent || isNext ? 1 : 0.3,
                  position: "relative",
                }}>
                  {/* Badge */}
                  <div style={{
                    filter: unlocked || isCurrent
                      ? `drop-shadow(0 0 8px ${meta.color}66)`
                      : "grayscale(1) brightness(0.5)",
                    transform: isCurrent ? "scale(1.15)" : "scale(1)",
                    transition: "transform 0.2s",
                  }}>
                    <PrestigeBadge prestige={pNum} size={isCurrent ? 52 : 40} />
                  </div>

                  {/* Name */}
                  <div style={{
                    fontSize: 10, fontWeight: 800, textAlign: "center",
                    color: isCurrent ? meta.color : unlocked ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)",
                    lineHeight: 1.3,
                  }}>
                    {meta.name}
                  </div>

                  {/* Status */}
                  <div style={{
                    fontSize: 9, fontWeight: 700,
                    color: isCurrent
                      ? meta.color
                      : unlocked
                      ? "#4ade80"
                      : isNext
                      ? "rgba(255,255,255,0.35)"
                      : "rgba(255,255,255,0.2)",
                  }}>
                    {isCurrent ? "← أنت هنا" : unlocked ? "✓ مكتمل" : isNext ? "التالي" : `P${pNum}`}
                  </div>

                  {/* Current badge pulse ring */}
                  {isCurrent && (
                    <div style={{
                      position: "absolute", inset: -3, borderRadius: 18,
                      border: `2px solid ${meta.color}`,
                      animation: "badgePulse 2s ease-in-out infinite",
                      pointerEvents: "none",
                    }}/>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    );
  };

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
          {activeTab === "prestige"  && renderPrestige()}
          {activeTab === "cats"      && renderCats()}
          {activeTab === "followers" && renderUserList(followers,     "لا يوجد متابعون بعد")}
          {activeTab === "following" && renderUserList(followingList,  "لا يتابع أحداً بعد")}
        </div>
      </div>
    </div>
  );
}
