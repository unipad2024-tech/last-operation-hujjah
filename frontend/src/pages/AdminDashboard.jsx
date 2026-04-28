import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL || "https://backend-production-cfa1f.up.railway.app"}/api`;

const CATEGORY_ICONS = {
  cat_flags: "🏳️", cat_easy: "💡", cat_saudi: "🇸🇦",
  cat_islamic: "☪️", cat_science: "🔬", cat_logos: "🏷️", cat_word: "🤫",
  cat_culture: "🎬", cat_sports: "⚽", cat_music: "🎵",
};

const emptyQuestion = {
  category_id: "", difficulty: 300, text: "", answer: "",
  image_url: "", answer_image_url: "", question_type: "text",
};

/* ═════════════════════════════════════════════════════════════════
   SECURITY DASHBOARD — Standalone component
   ═════════════════════════════════════════════════════════════════ */

const SEC = {
  bg:      "#0d1117",
  card:    "rgba(255,255,255,0.035)",
  border:  "rgba(255,255,255,0.07)",
  text:    "#e5e7eb",
  muted:   "rgba(229,231,235,0.45)",
  red:     { bg:"rgba(239,68,68,0.1)",  border:"rgba(239,68,68,0.35)",  text:"#f87171" },
  amber:   { bg:"rgba(251,191,36,0.1)", border:"rgba(251,191,36,0.3)",  text:"#fcd34d" },
  green:   { bg:"rgba(52,211,153,0.1)", border:"rgba(52,211,153,0.3)",  text:"#34d399" },
  blue:    { bg:"rgba(96,165,250,0.1)", border:"rgba(96,165,250,0.3)",  text:"#60a5fa" },
  purple:  { bg:"rgba(167,139,250,0.1)",border:"rgba(167,139,250,0.3)",text:"#c4b5fd" },
};

const EVENT_LABELS = {
  auto_lock_too_many_ips: "قفل تلقائي — IPs متعددة",
  device_limit_exceeded:  "تجاوز حد الأجهزة",
  many_ips_flagged:       "عناوين IP مشبوهة",
  rapid_device_switch:    "تبديل جهاز سريع",
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60)   return `منذ ${diff} ث`;
  if (diff < 3600) return `منذ ${Math.floor(diff/60)} د`;
  if (diff < 86400)return `منذ ${Math.floor(diff/3600)} س`;
  return d.toLocaleDateString("ar-SA");
};

const deviceIcon = (name) => {
  if (!name) return "🖥";
  const n = name.toLowerCase();
  if (n.includes("iphone") || n.includes("android")) return "📱";
  if (n.includes("ipad"))   return "📲";
  if (n.includes("mac") || n.includes("windows") || n.includes("linux")) return "💻";
  return "🖥";
};

function SecBadge({ children, color = "blue" }) {
  const c = SEC[color] || SEC.blue;
  return (
    <span style={{ background:c.bg, border:`1px solid ${c.border}`, color:c.text,
                   fontSize:"0.68rem", fontWeight:700, padding:"2px 9px", borderRadius:"9999px",
                   whiteSpace:"nowrap" }}>
      {children}
    </span>
  );
}

function SecCard({ children, style = {} }) {
  return (
    <div style={{ background:SEC.card, border:`1px solid ${SEC.border}`, borderRadius:"14px",
                  backdropFilter:"blur(12px)", ...style }}>
      {children}
    </div>
  );
}

function StatKPI({ icon, label, value, color, sub }) {
  return (
    <SecCard style={{ padding:"1.25rem 1.4rem", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:"-10px", right:"-8px", fontSize:"3.5rem", opacity:0.06 }}>{icon}</div>
      <div style={{ fontSize:"1.6rem", marginBottom:"0.25rem" }}>{icon}</div>
      <div style={{ fontSize:"2.1rem", fontWeight:900, color, lineHeight:1 }}>{value ?? "—"}</div>
      <div style={{ fontSize:"0.76rem", color:SEC.muted, marginTop:"0.3rem", fontWeight:600 }}>{label}</div>
      {sub && <div style={{ fontSize:"0.68rem", color, opacity:0.6, marginTop:"0.1rem" }}>{sub}</div>}
    </SecCard>
  );
}

function SecurityDashboard({ overview, users, sessions, suspicious, devices, loading,
  expandedUser, setExpandedUser, onLoad, onLoadDevices,
  onRevokeSession, onLock, onUnlock, onRemoveDevice, onClearLogs }) {

  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const timerRef = useRef(null);

  useEffect(() => { if (!overview) onLoad(); }, []);

  // Auto-refresh every 30s
  useEffect(() => {
    timerRef.current = setInterval(onLoad, 30_000);
    return () => clearInterval(timerRef.current);
  }, [onLoad]);

  const filteredUsers = users.filter(u =>
    !search || u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const TABS = [
    { key:"overview",   label:"نظرة عامة",  icon:"📊" },
    { key:"users",      label:`الأجهزة (${users.length})`, icon:"📱" },
    { key:"sessions",   label:`الجلسات (${sessions.length})`, icon:"🔗" },
    { key:"suspicious", label:`المخالفات (${suspicious.length})`, icon:"⚠️",
      alert: suspicious.some(s => ["auto_lock_too_many_ips","device_limit_exceeded"].includes(s.event_type)) },
  ];

  const POLICIES = [
    { icon:"📱", text:"حد الأجهزة", val:"2 / مستخدم", color:SEC.purple.text },
    { icon:"🔗", text:"جلسات متزامنة", val:"2 كحد أقصى", color:SEC.blue.text },
    { icon:"⏱", text:"انتهاء الجلسة", val:"60 دقيقة", color:SEC.green.text },
    { icon:"🛑", text:"Rate Limiting", val:"10 محاولة / 5 دقائق", color:SEC.amber.text },
    { icon:"🔄", text:"تغيير جهاز سريع", val:"تسجيل مشبوه < 30ث", color:SEC.red.text },
    { icon:"🌐", text:"حد عناوين IP", val:">5 تنبيه · >10 قفل", color:SEC.red.text },
    { icon:"🗑", text:"تنظيف IP logs", val:"تلقائي كل ساعتين", color:SEC.green.text },
  ];

  return (
    <div style={{ padding:"clamp(1rem,2.5vw,2rem)", minHeight:"70vh",
                  fontFamily:"Cairo,sans-serif", color:SEC.text }}>

      {/* ── Header ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                    marginBottom:"1.5rem", gap:"1rem", flexWrap:"wrap" }}>
        <div>
          <h2 style={{ margin:0, fontSize:"clamp(1.2rem,2.5vw,1.6rem)", fontWeight:900 }}>
            🛡 لوحة الأمان والمراقبة
          </h2>
          <p style={{ margin:"0.25rem 0 0", fontSize:"0.78rem", color:SEC.muted }}>
            تحديث تلقائي كل 30 ثانية
          </p>
        </div>
        <button
          data-testid="security-refresh-btn"
          onClick={onLoad}
          disabled={loading}
          style={{ background:SEC.blue.bg, border:`1px solid ${SEC.blue.border}`,
                   color:SEC.blue.text, borderRadius:"0.75rem", padding:"0.5rem 1.3rem",
                   cursor:"pointer", fontWeight:700, fontSize:"0.85rem",
                   opacity: loading ? 0.6 : 1, display:"flex", alignItems:"center", gap:"0.4rem" }}
        >
          <span style={{ display:"inline-block", animation: loading ? "spin 1s linear infinite" : "none" }}>↻</span>
          {loading ? "تحميل..." : "تحديث الآن"}
        </button>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:"flex", gap:"0.4rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
        {TABS.map(t => (
          <button
            key={t.key}
            data-testid={`sec-tab-${t.key}`}
            onClick={() => setTab(t.key)}
            style={{
              position:"relative",
              background: tab === t.key ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)",
              border: `1.5px solid ${tab === t.key ? "rgba(59,130,246,0.55)" : "rgba(255,255,255,0.1)"}`,
              color: tab === t.key ? "#93c5fd" : "rgba(229,231,235,0.6)",
              borderRadius:"0.8rem", padding:"0.45rem 1.1rem", cursor:"pointer",
              fontWeight:700, fontSize:"0.82rem", transition:"all 0.2s",
              display:"flex", alignItems:"center", gap:"0.35rem",
            }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
            {t.alert && (
              <span style={{ width:"7px", height:"7px", borderRadius:"50%",
                             background:"#ef4444", boxShadow:"0 0 6px #ef4444",
                             position:"absolute", top:"5px", right:"5px" }} />
            )}
          </button>
        ))}
      </div>

      {/* ══════════════ OVERVIEW ══════════════ */}
      {tab === "overview" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
          {/* KPI Grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:"0.9rem" }}>
            <StatKPI icon="👥" label="المستخدمون" value={overview?.total_users}   color="#60a5fa" />
            <StatKPI icon="📱" label="الأجهزة"    value={overview?.total_devices}  color="#c4b5fd" />
            <StatKPI icon="🔗" label="الجلسات"    value={overview?.active_sessions} color="#34d399" sub="نشطة الآن" />
            <StatKPI icon="⚠️" label="مشبوه (24س)" value={overview?.suspicious_24h}  color="#fbbf24" />
            <StatKPI icon="🔒" label="محظورون"    value={overview?.locked_accounts} color="#f87171" />
          </div>

          {/* Security health bar */}
          {overview && (
            <SecCard style={{ padding:"1.1rem 1.4rem" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.6rem" }}>
                <span style={{ fontWeight:700, fontSize:"0.85rem" }}>صحة الأمان</span>
                {(() => {
                  const score = overview.locked_accounts > 0 || overview.suspicious_24h > 5
                    ? overview.suspicious_24h > 10 ? "خطر" : "تنبيه"
                    : "جيد";
                  const c = score === "جيد" ? SEC.green : score === "تنبيه" ? SEC.amber : SEC.red;
                  return <SecBadge color={score === "جيد" ? "green" : score === "تنبيه" ? "amber" : "red"}>● {score}</SecBadge>;
                })()}
              </div>
              <div style={{ height:"4px", borderRadius:"9999px", background:"rgba(255,255,255,0.06)" }}>
                <div style={{
                  height:"100%", borderRadius:"9999px", transition:"width 0.5s",
                  background: overview.suspicious_24h > 10 ? "#ef4444" : overview.suspicious_24h > 3 ? "#f59e0b" : "#10b981",
                  width: `${Math.max(10, 100 - (overview.suspicious_24h || 0) * 5)}%`,
                }} />
              </div>
            </SecCard>
          )}

          {/* Policies */}
          <SecCard style={{ padding:"1.1rem 1.4rem" }}>
            <div style={{ fontWeight:700, fontSize:"0.78rem", color:SEC.muted, letterSpacing:"0.08em",
                          textTransform:"uppercase", marginBottom:"0.85rem" }}>
              سياسات الحماية النشطة
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:"0.5rem" }}>
              {POLICIES.map((p,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:"0.6rem",
                                      padding:"0.5rem 0.7rem", borderRadius:"0.6rem",
                                      background:"rgba(255,255,255,0.025)" }}>
                  <span style={{ fontSize:"1rem" }}>{p.icon}</span>
                  <span style={{ flex:1, fontSize:"0.82rem", color:SEC.text }}>{p.text}</span>
                  <span style={{ fontSize:"0.75rem", fontWeight:700, color:p.color, whiteSpace:"nowrap" }}>{p.val}</span>
                </div>
              ))}
            </div>
          </SecCard>
        </div>
      )}

      {/* ══════════════ USERS / DEVICES ══════════════ */}
      {tab === "users" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍  بحث بالاسم أو البريد..."
            style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${SEC.border}`,
                     borderRadius:"0.75rem", padding:"0.6rem 1rem", color:SEC.text,
                     fontSize:"0.85rem", outline:"none", fontFamily:"Cairo,sans-serif",
                     width:"100%", boxSizing:"border-box" }}
          />

          {filteredUsers.length === 0 && !loading && (
            <div style={{ textAlign:"center", padding:"3rem", color:SEC.muted }}>
              {search ? "لا توجد نتائج" : "لا يوجد مستخدمون"}
            </div>
          )}

          {filteredUsers.map(u => {
            const statusColor = u.is_locked ? "red" : u.suspicious_count > 3 ? "amber" : "green";
            const statusLabel = u.is_locked ? "محظور" : u.suspicious_count > 3 ? "مشبوه" : "آمن";
            const isOpen = expandedUser === u.id;
            return (
              <SecCard key={u.id} style={{ overflow:"hidden" }}>
                {/* Row */}
                <div
                  style={{ display:"flex", alignItems:"center", gap:"0.9rem",
                           padding:"0.85rem 1.1rem", cursor:"pointer", flexWrap:"wrap" }}
                  onClick={() => {
                    const next = isOpen ? null : u.id;
                    setExpandedUser(next);
                    if (next && !devices[u.id]) onLoadDevices(u.id);
                  }}
                >
                  {/* Avatar */}
                  <div style={{ width:"38px", height:"38px", borderRadius:"50%", flexShrink:0,
                                background:`${SEC[statusColor].bg}`, border:`1.5px solid ${SEC[statusColor].border}`,
                                display:"flex", alignItems:"center", justifyContent:"center",
                                fontWeight:900, color:SEC[statusColor].text, fontSize:"1rem" }}>
                    {(u.username||"؟")[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:"0.9rem" }}>{u.username || u.email}</div>
                    <div style={{ fontSize:"0.72rem", color:SEC.muted, overflow:"hidden",
                                  textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email}</div>
                  </div>

                  {/* Badges */}
                  <div style={{ display:"flex", gap:"0.45rem", alignItems:"center", flexWrap:"wrap" }}>
                    <SecBadge color={statusColor}>{statusLabel}</SecBadge>
                    <SecBadge color="purple">📱 {u.device_count}</SecBadge>
                    <SecBadge color="blue">🔗 {u.active_sessions}</SecBadge>
                    {u.suspicious_count > 0 && <SecBadge color="amber">⚠ {u.suspicious_count}</SecBadge>}
                  </div>

                  {/* Actions */}
                  <div style={{ display:"flex", gap:"0.35rem", flexShrink:0 }}>
                    {u.is_locked ? (
                      <button data-testid={`unlock-user-${u.id}`}
                        onClick={e => { e.stopPropagation(); onUnlock(u.id); }}
                        style={{ background:SEC.green.bg, border:`1px solid ${SEC.green.border}`,
                                 color:SEC.green.text, borderRadius:"0.55rem", padding:"0.28rem 0.7rem",
                                 cursor:"pointer", fontSize:"0.73rem", fontWeight:700 }}>
                        فتح
                      </button>
                    ) : (
                      <button data-testid={`lock-user-${u.id}`}
                        onClick={e => { e.stopPropagation(); onLock(u.id); }}
                        style={{ background:SEC.red.bg, border:`1px solid ${SEC.red.border}`,
                                 color:SEC.red.text, borderRadius:"0.55rem", padding:"0.28rem 0.7rem",
                                 cursor:"pointer", fontSize:"0.73rem", fontWeight:700 }}>
                        قفل
                      </button>
                    )}
                    {u.suspicious_count > 0 && (
                      <button data-testid={`clear-logs-${u.id}`}
                        onClick={e => { e.stopPropagation(); onClearLogs(u.id); }}
                        style={{ background:SEC.amber.bg, border:`1px solid ${SEC.amber.border}`,
                                 color:SEC.amber.text, borderRadius:"0.55rem", padding:"0.28rem 0.7rem",
                                 cursor:"pointer", fontSize:"0.73rem", fontWeight:700 }}>
                        مسح
                      </button>
                    )}
                  </div>

                  <span style={{ color:SEC.muted, fontSize:"0.75rem" }}>{isOpen ? "▲" : "▼"}</span>
                </div>

                {/* Expanded: Devices */}
                {isOpen && (
                  <div style={{ borderTop:`1px solid ${SEC.border}`, padding:"0.9rem 1.1rem",
                                background:"rgba(0,0,0,0.18)" }}>
                    <div style={{ fontSize:"0.72rem", fontWeight:700, color:SEC.muted,
                                  letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:"0.65rem" }}>
                      الأجهزة المسجلة
                    </div>
                    {(devices[u.id] || []).length === 0 ? (
                      <div style={{ color:SEC.muted, fontSize:"0.82rem" }}>لا توجد أجهزة</div>
                    ) : (
                      <div style={{ display:"flex", flexDirection:"column", gap:"0.45rem" }}>
                        {(devices[u.id] || []).map(d => (
                          <div key={d.device_id}
                               style={{ display:"flex", alignItems:"center", gap:"0.75rem",
                                        background:"rgba(255,255,255,0.025)", borderRadius:"0.75rem",
                                        padding:"0.6rem 0.9rem", border:`1px solid ${SEC.border}` }}>
                            <span style={{ fontSize:"1.25rem", flexShrink:0 }}>{deviceIcon(d.device_name)}</span>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontWeight:700, fontSize:"0.83rem" }}>{d.device_name || "جهاز غير معروف"}</div>
                              <div style={{ fontSize:"0.68rem", color:SEC.muted }}>
                                آخر دخول: {fmtDate(d.last_login)}
                                <span style={{ margin:"0 0.4rem", opacity:0.35 }}>·</span>
                                IP: <span style={{ fontFamily:"monospace", color:"#93c5fd" }}>{d.last_ip || "—"}</span>
                                {d.trusted && (
                                  <><span style={{ margin:"0 0.4rem", opacity:0.35 }}>·</span>
                                  <span style={{ color:SEC.green.text }}>موثوق ✓</span></>
                                )}
                              </div>
                            </div>
                            <button data-testid={`remove-device-${d.device_id}`}
                              onClick={() => onRemoveDevice(d.device_id, u.id)}
                              style={{ background:SEC.red.bg, border:`1px solid ${SEC.red.border}`,
                                       color:SEC.red.text, borderRadius:"0.55rem", padding:"0.24rem 0.6rem",
                                       cursor:"pointer", fontSize:"0.7rem", fontWeight:700, flexShrink:0 }}>
                              حذف
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </SecCard>
            );
          })}
        </div>
      )}

      {/* ══════════════ SESSIONS ══════════════ */}
      {tab === "sessions" && (
        <SecCard>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.82rem" }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${SEC.border}` }}>
                  {["المستخدم","الجهاز","عنوان IP","بدأت","آخر نشاط",""].map((h,i) => (
                    <th key={i} style={{ padding:"0.7rem 1rem", textAlign:"right",
                                         color:SEC.muted, fontWeight:700, fontSize:"0.72rem",
                                         textTransform:"uppercase", letterSpacing:"0.05em",
                                         whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr key={s.session_id}
                      style={{ borderBottom:`1px solid rgba(255,255,255,0.03)`,
                               background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                    <td style={{ padding:"0.65rem 1rem" }}>
                      <div style={{ fontWeight:700, fontSize:"0.85rem" }}>{s.username || "؟"}</div>
                      <div style={{ fontSize:"0.68rem", color:SEC.muted }}>{s.email}</div>
                    </td>
                    <td style={{ padding:"0.65rem 1rem" }}>
                      <span style={{ background:"rgba(255,255,255,0.05)", borderRadius:"0.4rem",
                                     padding:"2px 7px", fontFamily:"monospace", fontSize:"0.75rem",
                                     color:"rgba(229,231,235,0.7)" }}>
                        {s.device_id?.slice(0,8)}…
                      </span>
                    </td>
                    <td style={{ padding:"0.65rem 1rem" }}>
                      <span style={{ fontFamily:"monospace", color:"#93c5fd", fontSize:"0.8rem" }}>
                        {s.ip_address || "—"}
                      </span>
                    </td>
                    <td style={{ padding:"0.65rem 1rem", color:SEC.muted, fontSize:"0.75rem", whiteSpace:"nowrap" }}>
                      {fmtDate(s.created_at)}
                    </td>
                    <td style={{ padding:"0.65rem 1rem", whiteSpace:"nowrap" }}>
                      <span style={{ color:SEC.green.text, fontSize:"0.75rem", fontWeight:600 }}>
                        {fmtDate(s.last_activity)}
                      </span>
                    </td>
                    <td style={{ padding:"0.65rem 1rem" }}>
                      <button data-testid={`revoke-session-${s.session_id}`}
                        onClick={() => onRevokeSession(s.session_id)}
                        style={{ background:SEC.red.bg, border:`1px solid ${SEC.red.border}`,
                                 color:SEC.red.text, borderRadius:"0.5rem", padding:"0.28rem 0.8rem",
                                 cursor:"pointer", fontSize:"0.73rem", fontWeight:700 }}>
                        إلغاء
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sessions.length === 0 && (
              <div style={{ textAlign:"center", padding:"3rem", color:SEC.muted }}>
                🔗 لا توجد جلسات نشطة
              </div>
            )}
          </div>
        </SecCard>
      )}

      {/* ══════════════ SUSPICIOUS / VIOLATIONS ══════════════ */}
      {tab === "suspicious" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.55rem" }}>
          {suspicious.map((s, i) => {
            const isHigh = ["auto_lock_too_many_ips","device_limit_exceeded"].includes(s.event_type);
            const isMed  = ["many_ips_flagged","rapid_device_switch"].includes(s.event_type);
            const severity = isHigh ? "red" : isMed ? "amber" : "blue";
            const c = SEC[severity];
            const label = EVENT_LABELS[s.event_type] || s.event_type;
            return (
              <div key={i} style={{ background:c.bg, border:`1px solid ${c.border}`,
                                    borderRadius:"12px", padding:"0.85rem 1.1rem",
                                    display:"flex", alignItems:"flex-start", gap:"0.9rem" }}>
                <span style={{ fontSize:"1.1rem", flexShrink:0, marginTop:"1px" }}>
                  {isHigh ? "🔴" : isMed ? "🟡" : "🔵"}
                </span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", gap:"0.55rem", alignItems:"center",
                                flexWrap:"wrap", marginBottom:"0.35rem" }}>
                    <span style={{ fontWeight:700, fontSize:"0.88rem" }}>
                      {s.username || s.user_id?.slice(0,8)}
                    </span>
                    <span style={{ background:"rgba(0,0,0,0.25)", border:`1px solid ${c.border}`,
                                   color:c.text, borderRadius:"9999px", padding:"2px 9px",
                                   fontSize:"0.7rem", fontWeight:700 }}>
                      {label}
                    </span>
                    {isHigh && <SecBadge color="red">خطر عالٍ</SecBadge>}
                    {isMed  && <SecBadge color="amber">تنبيه</SecBadge>}
                    <span style={{ color:SEC.muted, fontSize:"0.7rem", marginLeft:"auto", whiteSpace:"nowrap" }}>
                      {fmtDate(s.created_at)}
                    </span>
                  </div>
                  {/* Data details */}
                  {s.data && Object.keys(s.data).length > 0 && (
                    <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
                      {Object.entries(s.data).map(([k, v]) => (
                        <span key={k} style={{ background:"rgba(0,0,0,0.3)", borderRadius:"0.4rem",
                                               padding:"1px 7px", fontSize:"0.68rem",
                                               fontFamily:"monospace", color:"rgba(229,231,235,0.5)" }}>
                          {k}: <span style={{ color:c.text }}>{String(v)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {suspicious.length === 0 && (
            <div style={{ textAlign:"center", padding:"4rem", color:SEC.muted }}>
              <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>✅</div>
              لا يوجد نشاط مشبوه
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
    </div>
  );
}

/* ── PendingQuestionCard — standalone component to avoid stale-closure ── */
function PendingQuestionCard({ q, i, categories, headers, onApprove, onReject, onUpdate, selected, onToggleSelect }) {
  const cat = categories.find(c => c.id === q.category_id);

  const [editText, setEditText]       = useState(false);
  const [editAnswer, setEditAnswer]   = useState(false);
  const [editDiff, setEditDiff]       = useState(false);
  const [editImg, setEditImg]         = useState(false);
  const [editAnsImg, setEditAnsImg]   = useState(false);
  const [tmpText, setTmpText]         = useState(q.text || "");
  const [tmpAnswer, setTmpAnswer]     = useState(q.answer || "");
  const [tmpDiff, setTmpDiff]         = useState(q.difficulty || 300);
  const [tmpImg, setTmpImg]           = useState(q.image_url || "");
  const [tmpAnsImg, setTmpAnsImg]     = useState(q.answer_image_url || "");
  const [saving, setSaving]           = useState(false);

  const diffColors = {
    300: { bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.4)", text: "#34d399", label: "سهل" },
    600: { bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.4)", text: "#fbbf24", label: "متوسط" },
    900: { bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.4)",  text: "#f87171", label: "صعب" },
  };
  const dc = diffColors[q.difficulty] || diffColors[300];

  const saveField = async (field, val) => {
    setSaving(true);
    try {
      await axios.patch(`${API}/admin/questions/pending/${q.id}`, { [field]: val }, { headers });
      onUpdate(q.id, { [field]: val });
      toast.success("تم الحفظ");
    } catch { toast.error("خطأ في الحفظ"); }
    finally { setSaving(false); }
  };

  const BG     = "#111827";
  const BORDER = "rgba(255,255,255,0.08)";
  const TEXT   = "#f3f4f6";
  const MUTED  = "rgba(243,244,246,0.45)";

  return (
    <div
      data-testid={`pending-q-${i}`}
      style={{
        background: selected ? "rgba(99,102,241,0.08)" : BG,
        border: `1.5px solid ${selected ? "rgba(99,102,241,0.55)" : BORDER}`,
        borderRadius: "14px",
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}
    >
      {/* Difficulty strip */}
      <div style={{ height: "3px", background: dc.text, opacity: 0.7 }} />

      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>

          {/* Checkbox */}
          <div style={{ paddingTop: "2px" }}>
            <input
              type="checkbox"
              checked={!!selected}
              onChange={() => onToggleSelect(q.id)}
              style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#818cf8" }}
            />
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Tags row */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px", alignItems: "center" }}>
              {/* Difficulty badge — click to edit */}
              {editDiff ? (
                <select
                  value={tmpDiff}
                  onChange={e => setTmpDiff(Number(e.target.value))}
                  onBlur={() => { saveField("difficulty", tmpDiff); setEditDiff(false); }}
                  autoFocus
                  style={{ background: dc.bg, border: `1px solid ${dc.border}`, color: dc.text,
                           fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: "9999px",
                           outline: "none", cursor: "pointer" }}
                >
                  <option value={300}>سهل · 300</option>
                  <option value={600}>متوسط · 600</option>
                  <option value={900}>صعب · 900</option>
                </select>
              ) : (
                <span
                  onClick={() => setEditDiff(true)}
                  title="انقر لتغيير الصعوبة"
                  style={{ background: dc.bg, border: `1px solid ${dc.border}`, color: dc.text,
                           fontSize: "0.72rem", fontWeight: 700, padding: "2px 9px", borderRadius: "9999px",
                           cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  {dc.label} · {q.difficulty} ✎
                </span>
              )}
              {cat && (
                <span style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                               color: MUTED, fontSize: "0.72rem", fontWeight: 700, padding: "2px 9px", borderRadius: "9999px" }}>
                  {cat.icon || ""} {cat.name}
                </span>
              )}
            </div>

            {/* Question text — click to edit inline */}
            {editText ? (
              <div style={{ marginBottom: "8px" }}>
                <textarea
                  value={tmpText}
                  onChange={e => setTmpText(e.target.value)}
                  rows={3}
                  autoFocus
                  style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(99,102,241,0.5)",
                           borderRadius: "10px", color: TEXT, padding: "8px 12px", fontSize: "0.9rem", fontFamily: "Cairo,sans-serif",
                           outline: "none", resize: "vertical" }}
                />
                <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                  <button
                    onClick={() => { saveField("text", tmpText); setEditText(false); }}
                    disabled={saving}
                    style={{ background: "rgba(52,211,153,0.2)", border: "1px solid rgba(52,211,153,0.5)", color: "#34d399",
                             fontSize: "0.75rem", fontWeight: 700, padding: "4px 12px", borderRadius: "8px", cursor: "pointer" }}
                  >✓ حفظ</button>
                  <button onClick={() => { setTmpText(q.text); setEditText(false); }}
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: MUTED,
                             fontSize: "0.75rem", padding: "4px 10px", borderRadius: "8px", cursor: "pointer" }}
                  >إلغاء</button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => { setTmpText(q.text); setEditText(true); }}
                title="انقر للتعديل"
                style={{ color: TEXT, fontWeight: 700, fontSize: "0.92rem", marginBottom: "6px",
                         cursor: "text", lineHeight: 1.5, fontFamily: "Cairo,sans-serif",
                         padding: "4px 6px", borderRadius: "6px", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {q.text} <span style={{ color: "rgba(99,102,241,0.5)", fontSize: "0.7rem" }}>✎</span>
              </div>
            )}

            {/* Answer — click to edit inline */}
            {editAnswer ? (
              <div style={{ marginBottom: "8px" }}>
                <input
                  type="text"
                  value={tmpAnswer}
                  onChange={e => setTmpAnswer(e.target.value)}
                  autoFocus
                  style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(251,191,36,0.5)",
                           borderRadius: "10px", color: "#fbbf24", padding: "8px 12px", fontSize: "0.88rem",
                           fontFamily: "Cairo,sans-serif", outline: "none" }}
                />
                <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                  <button
                    onClick={() => { saveField("answer", tmpAnswer); setEditAnswer(false); }}
                    disabled={saving}
                    style={{ background: "rgba(52,211,153,0.2)", border: "1px solid rgba(52,211,153,0.5)", color: "#34d399",
                             fontSize: "0.75rem", fontWeight: 700, padding: "4px 12px", borderRadius: "8px", cursor: "pointer" }}
                  >✓ حفظ</button>
                  <button onClick={() => { setTmpAnswer(q.answer); setEditAnswer(false); }}
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: MUTED,
                             fontSize: "0.75rem", padding: "4px 10px", borderRadius: "8px", cursor: "pointer" }}
                  >إلغاء</button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => { setTmpAnswer(q.answer); setEditAnswer(true); }}
                title="انقر لتعديل الإجابة"
                style={{ fontSize: "0.83rem", marginBottom: "10px", cursor: "text",
                         padding: "4px 6px", borderRadius: "6px", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ color: MUTED }}>الإجابة: </span>
                <span style={{ color: "#fbbf24", fontWeight: 900, fontFamily: "Cairo,sans-serif" }}>{q.answer}</span>
                <span style={{ color: "rgba(251,191,36,0.4)", fontSize: "0.68rem", marginRight: "4px" }}>✎</span>
              </div>
            )}

            {/* Images row */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {/* Question image */}
              <div>
                <div style={{ color: MUTED, fontSize: "0.68rem", fontWeight: 700, marginBottom: "4px" }}>صورة السؤال</div>
                {q.image_url && !editImg ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <img src={q.image_url} alt="سؤال" style={{ height: "48px", width: "72px", borderRadius: "8px", objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }} onError={e => e.target.style.display="none"} />
                    <button onClick={() => { setTmpImg(q.image_url||""); setEditImg(true); }}
                      style={{ fontSize: "0.68rem", color: MUTED, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", padding: "3px 8px", borderRadius: "6px", cursor: "pointer" }}>تغيير</button>
                  </div>
                ) : editImg ? (
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <input data-testid={`pending-q-img-input-${q.id}`} value={tmpImg} onChange={e=>setTmpImg(e.target.value)} placeholder="رابط الصورة..."
                      style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"8px", color:TEXT, padding:"4px 8px", fontSize:"0.75rem", outline:"none", width:"140px" }} />
                    <button onClick={()=>{ saveField("image_url",tmpImg); setEditImg(false); }} disabled={saving}
                      style={{ background:"rgba(52,211,153,0.2)", border:"1px solid rgba(52,211,153,0.4)", color:"#34d399", fontSize:"0.72rem", fontWeight:700, padding:"4px 8px", borderRadius:"6px", cursor:"pointer" }}>✓</button>
                    <button onClick={()=>setEditImg(false)} style={{ color:MUTED, fontSize:"0.72rem", cursor:"pointer", padding:"4px" }}>✕</button>
                  </div>
                ) : (
                  <button onClick={()=>{ setTmpImg(""); setEditImg(true); }}
                    style={{ fontSize:"0.72rem", color:MUTED, background:"rgba(255,255,255,0.04)", border:"1px dashed rgba(255,255,255,0.14)", padding:"5px 10px", borderRadius:"8px", cursor:"pointer" }}>+ إضافة صورة</button>
                )}
              </div>

              {/* Answer image */}
              <div>
                <div style={{ color: MUTED, fontSize: "0.68rem", fontWeight: 700, marginBottom: "4px" }}>صورة الإجابة</div>
                {q.answer_image_url && !editAnsImg ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <img src={q.answer_image_url} alt="إجابة" style={{ height: "48px", width: "72px", borderRadius: "8px", objectFit: "cover", border: "1px solid rgba(96,165,250,0.2)" }} onError={e => e.target.style.display="none"} />
                    <button onClick={() => { setTmpAnsImg(q.answer_image_url||""); setEditAnsImg(true); }}
                      style={{ fontSize: "0.68rem", color: MUTED, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", padding: "3px 8px", borderRadius: "6px", cursor: "pointer" }}>تغيير</button>
                  </div>
                ) : editAnsImg ? (
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <input data-testid={`pending-q-ans-img-input-${q.id}`} value={tmpAnsImg} onChange={e=>setTmpAnsImg(e.target.value)} placeholder="رابط صورة الإجابة..."
                      style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(96,165,250,0.25)", borderRadius:"8px", color:TEXT, padding:"4px 8px", fontSize:"0.75rem", outline:"none", width:"140px" }} />
                    <button onClick={()=>{ saveField("answer_image_url",tmpAnsImg); setEditAnsImg(false); }} disabled={saving}
                      style={{ background:"rgba(96,165,250,0.2)", border:"1px solid rgba(96,165,250,0.4)", color:"#60a5fa", fontSize:"0.72rem", fontWeight:700, padding:"4px 8px", borderRadius:"6px", cursor:"pointer" }}>✓</button>
                    <button onClick={()=>setEditAnsImg(false)} style={{ color:MUTED, fontSize:"0.72rem", cursor:"pointer", padding:"4px" }}>✕</button>
                  </div>
                ) : (
                  <button onClick={()=>{ setTmpAnsImg(""); setEditAnsImg(true); }}
                    style={{ fontSize:"0.72rem", color:MUTED, background:"rgba(255,255,255,0.04)", border:"1px dashed rgba(96,165,250,0.2)", padding:"5px 10px", borderRadius:"8px", cursor:"pointer" }}>+ صورة إجابة</button>
                )}
              </div>
            </div>
          </div>

          {/* Actions column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
            <button
              data-testid={`approve-q-${q.id}`}
              onClick={() => onApprove(q.id)}
              style={{ background: "rgba(52,211,153,0.18)", border: "1.5px solid rgba(52,211,153,0.5)", color: "#34d399",
                       padding: "8px 16px", borderRadius: "10px", fontWeight: 900, fontSize: "0.82rem",
                       cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(52,211,153,0.28)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(52,211,153,0.18)"}
            >✓ نشر</button>
            <button
              data-testid={`reject-q-${q.id}`}
              onClick={() => onReject(q.id)}
              style={{ background: "rgba(239,68,68,0.12)", border: "1.5px solid rgba(239,68,68,0.35)", color: "#f87171",
                       padding: "8px 16px", borderRadius: "10px", fontWeight: 900, fontSize: "0.82rem",
                       cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.22)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.12)"}
            >✕ رفض</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("admin_token");
  const headers = { Authorization: `Bearer ${token}` };

  // Role-based access
  const [adminRole, setAdminRole] = useState(localStorage.getItem("admin_role") || "super_admin");
  const [adminName, setAdminName] = useState(localStorage.getItem("admin_name") || "المدير الرئيسي");
  const isSuperAdmin = adminRole === "super_admin";

  const [categories, setCategories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [form, setForm] = useState(emptyQuestion);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("questions");
  const [gameSettings, setGameSettings] = useState({ default_timer: 65, word_timers: { "300": 80, "600": 60, "900": 45 }, free_categories: [], trial_enabled: true, trial_team1_categories: [], trial_team2_categories: [], trial_questions_only: false });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Security state
  const [secOverview, setSecOverview]     = useState(null);
  const [secUsers, setSecUsers]           = useState([]);
  const [secSessions, setSecSessions]     = useState([]);
  const [secSuspicious, setSecSuspicious] = useState([]);
  const [secLoading, setSecLoading]       = useState(false);
  const [secDevices, setSecDevices]       = useState({});    // user_id → devices[]
  const [expandedUser, setExpandedUser]   = useState(null);

  const loadSecurity = useCallback(async () => {
    setSecLoading(true);
    try {
      const [ov, us, ss, sp] = await Promise.all([
        axios.get(`${API}/admin/security/overview`,   { headers }),
        axios.get(`${API}/admin/security/users`,      { headers }),
        axios.get(`${API}/admin/security/sessions`,   { headers }),
        axios.get(`${API}/admin/security/suspicious`, { headers }),
      ]);
      setSecOverview(ov.data);
      setSecUsers(us.data);
      setSecSessions(ss.data);
      setSecSuspicious(sp.data);
    } catch { toast.error("خطأ في تحميل بيانات الأمان"); }
    finally { setSecLoading(false); }
  }, [headers]);

  const loadUserDevices = async (uid) => {
    try {
      const { data } = await axios.get(`${API}/admin/security/devices/${uid}`, { headers });
      setSecDevices(p => ({ ...p, [uid]: data }));
    } catch {}
  };

  const revokeSession = async (session_id) => {
    await axios.delete(`${API}/admin/security/sessions/${session_id}`, { headers });
    toast.success("تم إلغاء الجلسة");
    setSecSessions(p => p.filter(s => s.session_id !== session_id));
  };

  const lockUser = async (uid) => {
    await axios.post(`${API}/admin/security/lock/${uid}`, {}, { headers });
    toast.success("تم قفل الحساب");
    setSecUsers(p => p.map(u => u.id === uid ? { ...u, is_locked: true } : u));
  };

  const unlockUser = async (uid) => {
    await axios.post(`${API}/admin/security/unlock/${uid}`, {}, { headers });
    toast.success("تم فتح الحساب");
    setSecUsers(p => p.map(u => u.id === uid ? { ...u, is_locked: false } : u));
  };

  const removeDevice = async (device_id, uid) => {
    await axios.delete(`${API}/admin/security/devices/${device_id}`, { headers });
    toast.success("تم حذف الجهاز");
    setSecDevices(p => ({ ...p, [uid]: (p[uid] || []).filter(d => d.device_id !== device_id) }));
  };

  const clearLogs = async (uid) => {
    await axios.delete(`${API}/admin/security/logs/${uid}`, { headers });
    toast.success("تم مسح السجلات");
    setSecSuspicious(p => p.filter(l => l.user_id !== uid));
    setSecUsers(prev => prev.map(u => u.id === uid ? { ...u, suspicious_count: 0 } : u));
  };

  // Admin logs state
  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsLoading, setLogsLoading] = useState(false);

  // Staff management state
  const [staffList, setStaffList] = useState([]);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staffForm, setStaffForm] = useState({ username: "", password: "", display_name: "" });
  const [editingStaff, setEditingStaff] = useState(null);

  // Experimental mode
  const [expQuestions, setExpQuestions] = useState([]);
  const [expCatFilter, setExpCatFilter] = useState("all");
  const [expDiffFilter, setExpDiffFilter] = useState("all");
  const [expLoading, setExpLoading] = useState(false);
  const [expEditQ, setExpEditQ] = useState(null);
  const [expForm, setExpForm] = useState({ text: "", answer: "", difficulty: 300, image_url: "", answer_image_url: "" });

  // AI Generator state
  const [aiCatId, setAiCatId] = useState("");
  const [aiDiff, setAiDiff] = useState(300);
  const [aiCount, setAiCount] = useState(12);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiQuestions, setAiQuestions] = useState([]);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiFetchingImages, setAiFetchingImages] = useState(false);

  // Category groups
  const [categoryGroups, setCategoryGroups] = useState([]);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: "", icon: "", color: "#5B0E14", order: 0 });
  const [editingGroup, setEditingGroup] = useState(null);

  // New category form
  const [catForm, setCatForm] = useState({ name: "", icon: "", description: "", is_special: false, is_premium: false, is_active: true, color: "#5B0E14", image_url: "", group_id: "" });
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCat, setEditingCat] = useState(null);

  // Pending questions (import / approval workflow)
  const [pendingQuestions, setPendingQuestions] = useState([]);
  const [pendingLoading, setPendingLoading]     = useState(false);
  const [pendingTotal, setPendingTotal]         = useState(0);
  const [importUploading, setImportUploading]   = useState(false);
  const [importCustomPrompt, setImportCustomPrompt] = useState("");
  const importFileRef = useRef(null);
  const [selectedPending, setSelectedPending]   = useState(new Set());

  useEffect(() => {
    if (!token) { navigate("/admin"); return; }
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const { data } = await axios.get(`${API}/admin/verify`, { headers });
      // Refresh role from server response
      const role = data.role || "super_admin";
      const name = data.name || "المدير الرئيسي";
      setAdminRole(role);
      setAdminName(name);
      localStorage.setItem("admin_role", role);
      localStorage.setItem("admin_name", name);
      loadData();
    } catch {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_role");
      localStorage.removeItem("admin_name");
      navigate("/admin");
    }
  };

  const loadData = useCallback(async () => {
    const [catsRes, qsRes, groupsRes] = await Promise.all([
      axios.get(`${API}/categories?show_inactive=true`),
      axios.get(`${API}/questions`),
      axios.get(`${API}/category-groups`),
    ]);
    setCategories(catsRes.data);
    setQuestions(qsRes.data);
    setCategoryGroups(groupsRes.data || []);
    if (!selectedCat && catsRes.data.length > 0) setSelectedCat(catsRes.data[0].id);
  }, [selectedCat]);

  const loadUsers = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/admin/users`, { headers });
      setUsers(data);
    } catch { toast.error("خطأ في تحميل المستخدمين"); }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/admin/analytics`, { headers });
      setAnalytics(data);
    } catch { toast.error("خطأ في تحميل الإحصاءات"); }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/settings`);
      setGameSettings(data);
    } catch {}
  }, []);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const { data } = await axios.get(`${API}/admin/logs?limit=100`, { headers });
      setLogs(data.logs || []);
      setLogsTotal(data.total || 0);
    } catch { toast.error("خطأ في تحميل سجل النشاط"); }
    finally { setLogsLoading(false); }
  }, []);

  const loadStaff = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/admin/staff`, { headers });
      setStaffList(data);
    } catch { toast.error("خطأ في تحميل قائمة الموظفين"); }
  }, []);

  const loadPendingQuestions = useCallback(async () => {
    setPendingLoading(true);
    try {
      const { data } = await axios.get(`${API}/admin/questions/pending?limit=200`, { headers });
      setPendingQuestions(data.items || []);
      setPendingTotal(data.total || 0);
    } catch { toast.error("خطأ في تحميل الأسئلة المعلقة"); }
    finally { setPendingLoading(false); }
  }, []);

  const handleImportFile = async (file) => {
    if (!file) return;
    setImportUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    if (importCustomPrompt.trim()) fd.append("extra_prompt", importCustomPrompt.trim());
    try {
      const { data } = await axios.post(`${API}/admin/questions/import`, fd, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      toast.success(data.message);
      loadPendingQuestions();
      setActiveTab("pending");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "خطأ في رفع الملف");
    } finally { setImportUploading(false); }
  };

  const handleApproveQuestion = async (qId) => {
    try {
      await axios.post(`${API}/admin/questions/${qId}/approve`, {}, { headers });
      toast.success("تمت الموافقة ونشر السؤال");
      setPendingQuestions(prev => prev.filter(q => q.id !== qId));
      setPendingTotal(t => t - 1);
    } catch { toast.error("خطأ في الموافقة"); }
  };

  const handleRejectQuestion = async (qId) => {
    if (!window.confirm("رفض وحذف هذا السؤال؟")) return;
    try {
      await axios.post(`${API}/admin/questions/${qId}/reject`, {}, { headers });
      toast.success("تم رفض السؤال");
      setPendingQuestions(prev => prev.filter(q => q.id !== qId));
      setPendingTotal(t => t - 1);
    } catch { toast.error("خطأ في الرفض"); }
  };

  const handleApproveAll = async () => {
    if (!window.confirm(`الموافقة على ${pendingTotal} سؤال ونشرها جميعاً؟`)) return;
    try {
      const { data } = await axios.post(`${API}/admin/questions/approve-all`, {}, { headers });
      toast.success(data.message);
      setPendingQuestions([]);
      setPendingTotal(0);
      setSelectedPending(new Set());
      const { data: qs } = await axios.get(`${API}/questions`);
      setQuestions(qs);
    } catch { toast.error("خطأ في الموافقة الجماعية"); }
  };

  const handleBulkApprove = async () => {
    const ids = [...selectedPending];
    if (!ids.length) return;
    if (!window.confirm(`نشر ${ids.length} سؤال؟`)) return;
    let done = 0;
    for (const id of ids) {
      try { await axios.post(`${API}/admin/questions/${id}/approve`, {}, { headers }); done++; } catch {}
    }
    setPendingQuestions(prev => prev.filter(q => !selectedPending.has(q.id)));
    setPendingTotal(t => Math.max(0, t - done));
    setSelectedPending(new Set());
    toast.success(`تم نشر ${done} سؤال`);
  };

  const handleBulkReject = async () => {
    const ids = [...selectedPending];
    if (!ids.length) return;
    if (!window.confirm(`رفض وحذف ${ids.length} سؤال؟`)) return;
    let done = 0;
    for (const id of ids) {
      try { await axios.post(`${API}/admin/questions/${id}/reject`, {}, { headers }); done++; } catch {}
    }
    setPendingQuestions(prev => prev.filter(q => !selectedPending.has(q.id)));
    setPendingTotal(t => Math.max(0, t - done));
    setSelectedPending(new Set());
    toast.success(`تم رفض ${done} سؤال`);
  };

  const handleBulkFetchImages = async () => {
    const limit = parseInt(window.prompt("كم سؤال تريد تحديث صوره؟ (الحد الأقصى 200)", "50") || "50");
    if (!limit || isNaN(limit)) return;
    try {
      toast.info("جاري جلب الصور... قد يستغرق بعض الوقت");
      const { data } = await axios.post(`${API}/admin/questions/bulk-fetch-images`,
        { limit, category_id: selectedCat || undefined }, { headers });
      toast.success(data.message);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "خطأ في جلب الصور");
    }
  };

  const saveSettings = async () => {
    try {
      const body = {
        default_timer: gameSettings.default_timer,
        word_timers: gameSettings.word_timers,
        free_categories: gameSettings.free_categories || [],
        trial_enabled: gameSettings.trial_enabled ?? true,
        trial_team1_categories: gameSettings.trial_team1_categories || [],
        trial_team2_categories: gameSettings.trial_team2_categories || [],
        trial_questions_only: gameSettings.trial_questions_only ?? false,
      };
      await axios.put(`${API}/settings`, body, { headers });
      toast.success("تم حفظ الإعدادات ✓");
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } catch { toast.error("خطأ في الحفظ"); }
  };

  // ── Image upload helper ──
  const uploadImage = async (file, onSuccess) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await axios.post(`${API}/upload`, fd, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      onSuccess(data.url);
      toast.success("تم رفع الصورة!");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "خطأ في رفع الصورة");
    }
  };

  useEffect(() => {
    if (activeTab === "users") loadUsers();
    if (activeTab === "analytics") loadAnalytics();
    if (activeTab === "settings") loadSettings();
    if (activeTab === "logs") loadLogs();
    if (activeTab === "staff") loadStaff();
    if (activeTab === "pending") loadPendingQuestions();
  }, [activeTab]);

  // ── Auto-save state ──
  const [autoSaveStatus, setAutoSaveStatus] = useState(null); // null | 'saving' | 'saved'
  const autoSaveTimerRef = useRef(null);

  const triggerAutoSave = useCallback((questionId, fields) => {
    if (!questionId) return;
    clearTimeout(autoSaveTimerRef.current);
    setAutoSaveStatus('saving');
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await axios.patch(`${API}/questions/${questionId}/autosave`, fields, { headers });
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus(null), 2000);
      } catch { setAutoSaveStatus(null); }
    }, 1500);
  }, []);

  // ── Deleted questions ──
  const [deletedQuestions, setDeletedQuestions] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);

  const loadDeletedQuestions = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/admin/deleted-questions?limit=50`, { headers });
      setDeletedQuestions(data.items || []);
    } catch {}
  }, []);

  const handleRestoreQuestion = async (q) => {
    try {
      await axios.post(`${API}/admin/restore-question/${q.id}`, {}, { headers });
      toast.success(`تمت استعادة السؤال: "${q.text?.slice(0, 30)}..."`);
      loadDeletedQuestions();
      loadData();
    } catch { toast.error("خطأ في الاستعادة"); }
  };

  const handleSaveQuestion = async () => {
    if (!form.text.trim() || !form.answer.trim() || !form.category_id) {
      toast.error("أكمل جميع الحقول المطلوبة");
      return;
    }
    setLoading(true);
    try {
      if (editingQuestion) {
        await axios.put(`${API}/questions/${editingQuestion.id}`, form, { headers });
        toast.success("تم تحديث السؤال");
      } else {
        await axios.post(`${API}/questions`, form, { headers });
        toast.success("تمت إضافة السؤال");
      }
      setShowForm(false);
      setEditingQuestion(null);
      setForm(emptyQuestion);
      const { data } = await axios.get(`${API}/questions`);
      setQuestions(data);
    } catch (e) {
      toast.error("خطأ في الحفظ");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (id) => {
    const q = questions.find(qu => qu.id === id);
    const preview = q?.text?.slice(0, 70) || id;
    if (!window.confirm(`⚠️ تأكيد الحذف\n\nالسؤال: "${preview}"\n\nيمكن استعادته لاحقاً من "سلة المحذوفات". هل تريد المتابعة؟`)) return;
    try {
      await axios.delete(`${API}/questions/${id}`, { headers });
      setQuestions(questions.filter(qu => qu.id !== id));
      toast.success("تم الحذف — يمكن استعادته من زر 🗑️ استعادة");
    } catch { toast.error("خطأ في الحذف"); }
  };

  const handleEditQuestion = (q) => {
    setEditingQuestion(q);
    setForm({ ...q });
    setShowForm(true);
  };

  const handleSaveCat = async () => {
    if (!catForm.name.trim()) { toast.error("أدخل اسم الفئة"); return; }
    try {
      if (editingCat) {
        await axios.put(`${API}/categories/${editingCat.id}`, catForm, { headers });
        toast.success("تم تحديث الفئة");
      } else {
        await axios.post(`${API}/categories`, catForm, { headers });
        toast.success("تمت إضافة الفئة");
      }
      setShowCatForm(false);
      setEditingCat(null);
      setCatForm({ name: "", icon: "", description: "", is_special: false, is_premium: false, is_active: true, color: "#5B0E14", image_url: "" });
      loadData();
    } catch { toast.error("خطأ"); }
  };

  const handleEditCat = (cat) => {
    setEditingCat(cat);
    setCatForm({ name: cat.name, icon: cat.icon || "", description: cat.description || "", is_special: cat.is_special || false, is_premium: cat.is_premium || false, is_active: cat.is_active !== false, color: cat.color || "#5B0E14", image_url: cat.image_url || "" });
    setShowCatForm(true);
  };

  const handleDeleteCat = async (id) => {
    if (!window.confirm("حذف الفئة وجميع أسئلتها؟")) return;
    await axios.delete(`${API}/categories/${id}`, { headers });
    loadData();
    toast.success("تم الحذف");
  };

  // ── Experimental Mode Handlers ──
  const loadExpQuestions = async () => {
    setExpLoading(true);
    try {
      const { data } = await axios.get(`${API}/questions`, { params: { ...(expCatFilter !== "all" && { category_id: expCatFilter }) } });
      setExpQuestions(data);
    } catch { toast.error("خطأ في تحميل الأسئلة"); }
    finally { setExpLoading(false); }
  };

  const handleToggleExp = async (q) => {
    try {
      await axios.patch(`${API}/questions/${q.id}/experimental`, { is_experimental: !q.is_experimental }, { headers });
      setExpQuestions(prev => prev.map(x => x.id === q.id ? { ...x, is_experimental: !x.is_experimental } : x));
      toast.success((!q.is_experimental) ? "مُضاف لوضع التجربة ✓" : "مُزال من وضع التجربة");
    } catch { toast.error("خطأ"); }
  };

  const handleDeleteExpQ = async (qId) => {
    if (!window.confirm("هل تريد حذف هذا السؤال؟")) return;
    try {
      await axios.delete(`${API}/questions/${qId}`, { headers });
      setExpQuestions(prev => prev.filter(x => x.id !== qId));
      toast.success("تم الحذف");
    } catch { toast.error("خطأ في الحذف"); }
  };

  const handleSaveExpQ = async () => {
    if (!expForm.text.trim() || !expForm.answer.trim()) { toast.error("أدخل السؤال والإجابة"); return; }
    try {
      if (expEditQ) {
        await axios.put(`${API}/questions/${expEditQ.id}`, { ...expForm, is_experimental: true, category_id: expEditQ.category_id }, { headers });
        setExpQuestions(prev => prev.map(x => x.id === expEditQ.id ? { ...x, ...expForm, is_experimental: true } : x));
        toast.success("تم التحديث");
      }
      setExpEditQ(null);
      setExpForm({ text: "", answer: "", difficulty: 300, image_url: "", answer_image_url: "" });
    } catch { toast.error("خطأ في الحفظ"); }
  };

  const fetchUnsplashForQuestion = async (imageQuery) => {
    if (!imageQuery) return null;
    try {
      const { data } = await axios.get(
        `${API}/unsplash/search?query=${encodeURIComponent(imageQuery)}`,
        { headers }
      );
      if (data.url) {
        return {
          image_url:    data.regular_url || data.url,
          _img_thumb:   data.url,
          _img_credit:  data.credit_name,
        };
      }
    } catch {}
    return null;
  };

  const handleAiGenerate = async () => {
    if (!aiCatId) { toast.error("اختر الفئة أولاً"); return; }
    setAiGenerating(true);
    setAiQuestions([]);
    try {
      const { data } = await axios.post(`${API}/ai/generate-questions`, {
        category_id: aiCatId,
        difficulty: aiDiff,
        count: aiCount,
        prompt_description: aiPrompt.trim() || undefined,
      }, { headers });
      setAiQuestions(data.questions);
      toast.success(`تم توليد ${data.count} سؤال! جاري جلب الصور...`);
      // Fetch Unsplash images in parallel — collect ALL results before updating state
      setAiFetchingImages(true);
      const imageResults = await Promise.allSettled(
        data.questions.map((q) => fetchUnsplashForQuestion(q.image_query))
      );
      // Apply all results at once to avoid race conditions
      setAiQuestions(prev =>
        prev.map((q, i) => {
          const res = imageResults[i];
          if (res?.status === "fulfilled" && res.value) {
            return { ...q, ...res.value };
          }
          return q;
        })
      );
      setAiFetchingImages(false);
      toast.success("جاهز! راجع الأسئلة والصور");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "خطأ في التوليد");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAiSave = async () => {
    if (!aiQuestions.length) return;
    setAiSaving(true);
    try {
      const questionsToSave = aiQuestions.map(({ _img_thumb, _img_credit, ...q }) => q);
      const { data } = await axios.post(`${API}/ai/save-questions`, { questions: questionsToSave }, { headers });
      toast.success(data.message);
      setAiQuestions([]);
      const { data: qs } = await axios.get(`${API}/questions`);
      setQuestions(qs);
    } catch { toast.error("خطأ في الحفظ"); }
    finally { setAiSaving(false); }
  };

  const handleAiSaveAsPending = async () => {
    if (!aiQuestions.length) return;
    setAiSaving(true);
    try {
      const questionsToSave = aiQuestions.map(({ _img_thumb, _img_credit, ...q }) => q);
      const { data } = await axios.post(`${API}/ai/save-questions`, { questions: questionsToSave, pending: true }, { headers });
      toast.success(data.message + " — راجعها في تبويب مراجعة الأسئلة");
      setAiQuestions([]);
      loadPendingQuestions();
      setActiveTab("pending");
    } catch { toast.error("خطأ في الحفظ"); }
    finally { setAiSaving(false); }
  };

  const handleAiGenerate18 = async () => {
    if (!aiCatId) { toast.error("اختر الفئة أولاً"); return; }
    setAiGenerating(true);
    setAiQuestions([]);
    try {
      const { data } = await axios.post(`${API}/ai/generate-questions`, {
        category_id: aiCatId,
        mode: "full18",
      }, { headers });
      toast.success(`تم توليد ${data.count} سؤال! جاري الحفظ في قائمة المراجعة...`);
      // Save directly as pending
      const questionsToSave = data.questions;
      await axios.post(`${API}/ai/save-questions`, { questions: questionsToSave, pending: true }, { headers });
      toast.success("تم إرسال 18 سؤال لقائمة المراجعة ✓");
      loadPendingQuestions();
      setActiveTab("pending");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "خطأ في التوليد");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleUpdateUserSub = async (userId, subType) => {
    try {
      await axios.put(`${API}/admin/users/${userId}`, { subscription_type: subType }, { headers });
      toast.success("تم تحديث الاشتراك");
      loadUsers();
    } catch { toast.error("خطأ في التحديث"); }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("حذف المستخدم نهائياً؟")) return;
    try {
      await axios.delete(`${API}/admin/users/${userId}`, { headers });
      toast.success("تم الحذف");
      loadUsers();
    } catch { toast.error("خطأ في الحذف"); }
  };

  const handleGiftSubscription = async (userId, planId = "monthly") => {
    try {
      await axios.post(`${API}/admin/users/${userId}/gift-subscription`,
        { plan_id: planId }, { headers });
      toast.success("تم منح الاشتراك المميز مجاناً");
      loadUsers();
    } catch { toast.error("خطأ في منح الاشتراك"); }
  };

  const handleSaveStaff = async () => {
    if (!staffForm.username.trim() || !staffForm.password.trim()) {
      toast.error("اسم المستخدم وكلمة المرور مطلوبان"); return;
    }
    try {
      if (editingStaff) {
        await axios.put(`${API}/admin/staff/${editingStaff.id}`,
          { display_name: staffForm.display_name, password: staffForm.password || undefined }, { headers });
        toast.success("تم تحديث الموظف");
      } else {
        await axios.post(`${API}/admin/staff`, staffForm, { headers });
        toast.success("تم إضافة الموظف");
      }
      setShowStaffForm(false);
      setEditingStaff(null);
      setStaffForm({ username: "", password: "", display_name: "" });
      loadStaff();
    } catch (e) { toast.error(e?.response?.data?.detail || "خطأ في الحفظ"); }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!window.confirm("حذف الموظف نهائياً؟")) return;
    try {
      await axios.delete(`${API}/admin/staff/${staffId}`, { headers });
      toast.success("تم الحذف");
      loadStaff();
    } catch { toast.error("خطأ في الحذف"); }
  };

  // ── Category Group Handlers ──
  const handleSaveGroup = async () => {
    if (!groupForm.name.trim()) { toast.error("اسم المجموعة مطلوب"); return; }
    try {
      if (editingGroup) {
        await axios.put(`${API}/category-groups/${editingGroup.id}`, groupForm, { headers });
        toast.success("تم تحديث المجموعة");
      } else {
        await axios.post(`${API}/category-groups`, groupForm, { headers });
        toast.success("تم إضافة المجموعة");
      }
      setShowGroupForm(false);
      setEditingGroup(null);
      setGroupForm({ name: "", icon: "", color: "#5B0E14", order: 0 });
      loadData();
    } catch (e) { toast.error(e?.response?.data?.detail || "خطأ في الحفظ"); }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("حذف المجموعة؟ الفئات المرتبطة بها ستصبح بدون مجموعة.")) return;
    try {
      await axios.delete(`${API}/category-groups/${groupId}`, { headers });
      toast.success("تم الحذف");
      loadData();
    } catch { toast.error("خطأ في الحذف"); }
  };

  const [questionSearch, setQuestionSearch] = useState("");

  const filteredQuestions = questions.filter((q) => {
    const catMatch = selectedCat ? q.category_id === selectedCat : true;
    const diffMatch = selectedDifficulty === "all" ? true : q.difficulty === parseInt(selectedDifficulty);
    const searchMatch = !questionSearch.trim() ||
      q.text?.toLowerCase().includes(questionSearch.toLowerCase()) ||
      q.answer?.toLowerCase().includes(questionSearch.toLowerCase());
    return catMatch && diffMatch && searchMatch;
  });

  const getCatName = (id) => categories.find(c => c.id === id)?.name || id;
  const getQuestionCount = (catId, diff) => questions.filter(q => q.category_id === catId && q.difficulty === diff).length;

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_role");
    localStorage.removeItem("admin_name");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background text-primary" dir="rtl">
      {/* Top Bar */}
      <div className="bg-primary text-secondary px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black">حُجّة</span>
          <span className="text-secondary/50">|</span>
          <span className="text-secondary/80 font-bold">لوحة الإدارة</span>
          {/* Role badge */}
          <span
            data-testid="admin-role-badge"
            className={`text-xs px-2 py-0.5 rounded-full font-black border ${
              isSuperAdmin
                ? "bg-amber-400/20 border-amber-400/40 text-amber-300"
                : "bg-blue-400/20 border-blue-400/40 text-blue-300"
            }`}
          >
            {isSuperAdmin ? "مدير رئيسي" : "موظف"}
          </span>
          <span className="text-secondary/40 text-xs">{adminName}</span>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {/* Tabs - filtered by role */}
          {[
            { key: "questions", label: "الأسئلة", forAll: true },
            { key: "pending", label: `مراجعة الأسئلة${pendingTotal > 0 ? ` (${pendingTotal})` : ""}`, forAll: true },
            { key: "users", label: "المستخدمون", superOnly: true },
            { key: "security", label: "🛡 الأمان", superOnly: true },
            { key: "analytics", label: "الإحصاءات", superOnly: true },
            { key: "settings", label: "الإعدادات", superOnly: true },
            { key: "ai", label: "توليد AI", forAll: true },
            { key: "experimental", label: "وضع التجربة", forAll: true },
            { key: "logs", label: "سجل النشاط", superOnly: true },
            { key: "staff", label: "الموظفون", superOnly: true },
          ]
            .filter(t => t.forAll || (t.superOnly && isSuperAdmin))
            .map((tab) => (
              <button
                key={tab.key}
                data-testid={`tab-${tab.key}`}
                onClick={() => {
                  setActiveTab(tab.key);
                  if (tab.key === "experimental") { loadSettings(); loadExpQuestions(); }
                  if (tab.key === "settings") loadSettings();
                }}
                className={`text-sm px-3 py-1 rounded-lg font-bold transition-all ${activeTab === tab.key ? "bg-secondary text-primary" : "text-secondary/60 hover:text-secondary"}`}
              >
                {tab.label}
              </button>
            ))}
          <span className="text-secondary/20">|</span>
          <button onClick={() => navigate("/")} className="text-secondary/60 text-sm hover:text-secondary">الرئيسية</button>
          <button onClick={logout} className="text-secondary/60 text-sm hover:text-secondary">خروج</button>
        </div>
      </div>

      {/* ── QUESTIONS TAB ── */}
      {activeTab === "questions" && (
        <div className="flex">
          {/* Sidebar - Categories */}
          <div className="w-64 bg-primary/5 border-l border-primary/10 min-h-screen p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="font-black text-sm text-primary/60 uppercase tracking-widest">الفئات</span>
              <button
                data-testid="add-cat-btn"
                onClick={() => setShowCatForm(true)}
                className="text-primary bg-secondary/80 rounded-lg px-2 py-1 text-xs font-bold hover:bg-secondary transition-all"
              >
                + جديدة
              </button>
            </div>

            {/* Group filter */}
            {categoryGroups.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {categoryGroups.map(g => {
                    const count = categories.filter(c => c.group_id === g.id).length;
                    if (count === 0) return null;
                    return (
                      <span key={g.id} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary/60 font-bold cursor-default">
                        {g.icon} {g.name} ({count})
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-1 flex-1 overflow-y-auto">
              {/* Group categories by group_id */}
              {categoryGroups.length > 0 ? (
                <>
                  {categoryGroups.map(group => {
                    const groupCats = categories.filter(c => c.group_id === group.id);
                    if (groupCats.length === 0) return null;
                    return (
                      <div key={group.id}>
                        <div className="text-[10px] font-black text-primary/40 uppercase tracking-widest px-1 pt-2 pb-1 flex items-center gap-1">
                          <span>{group.icon}</span> {group.name}
                        </div>
                        {groupCats.map(cat => (
                          <div key={cat.id}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${selectedCat === cat.id ? "bg-primary text-secondary" : "hover:bg-primary/10"}`}
                            style={{ opacity: cat.is_active === false ? 0.45 : 1 }}
                            onClick={() => setSelectedCat(cat.id)}>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="shrink-0">{cat.icon || "🎯"}</span>
                              <span className="text-xs font-bold truncate">{cat.name}</span>
                              {cat.is_premium && <span className="text-yellow-500 text-[10px]">⭐</span>}
                              {cat.is_active === false && <span className="text-red-400 text-[10px]">●</span>}
                            </div>
                            <div className="flex shrink-0">
                              <button data-testid={`edit-cat-${cat.id}`}
                                onClick={(e) => { e.stopPropagation(); handleEditCat(cat); }}
                                className="text-primary/40 hover:text-primary/70 text-xs px-1">✎</button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteCat(cat.id); }}
                                className="text-red-400/50 hover:text-red-400 text-xs">×</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  {/* Ungrouped */}
                  {categories.filter(c => !c.group_id).length > 0 && (
                    <div>
                      <div className="text-[10px] font-black text-primary/40 uppercase tracking-widest px-1 pt-2 pb-1">بدون مجموعة</div>
                      {categories.filter(c => !c.group_id).map(cat => (
                        <div key={cat.id}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${selectedCat === cat.id ? "bg-primary text-secondary" : "hover:bg-primary/10"}`}
                          style={{ opacity: cat.is_active === false ? 0.45 : 1 }}
                          onClick={() => setSelectedCat(cat.id)}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="shrink-0">{cat.icon || "🎯"}</span>
                            <span className="text-xs font-bold truncate">{cat.name}</span>
                            {cat.is_premium && <span className="text-yellow-500 text-[10px]">⭐</span>}
                            {cat.is_active === false && <span className="text-red-400 text-[10px]">●</span>}
                          </div>
                          <div className="flex shrink-0">
                            <button data-testid={`edit-cat-${cat.id}`}
                              onClick={(e) => { e.stopPropagation(); handleEditCat(cat); }}
                              className="text-primary/40 hover:text-primary/70 text-xs px-1">✎</button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteCat(cat.id); }}
                              className="text-red-400/50 hover:text-red-400 text-xs">×</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                // Flat list (no groups)
                categories.map((cat) => (
                  <div key={cat.id}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${selectedCat === cat.id ? "bg-primary text-secondary" : "hover:bg-primary/10"}`}
                    style={{ opacity: cat.is_active === false ? 0.45 : 1 }}
                    onClick={() => setSelectedCat(cat.id)}>
                    <div className="flex items-center gap-2">
                      <span>{cat.icon || "🎯"}</span>
                      <span className="text-sm font-bold truncate">{cat.name}</span>
                      {cat.is_premium && <span className="text-yellow-500 text-xs">⭐</span>}
                      {cat.is_active === false && <span className="text-red-400 text-xs">●</span>}
                    </div>
                    <button data-testid={`edit-cat-${cat.id}`}
                      onClick={(e) => { e.stopPropagation(); handleEditCat(cat); }}
                      className="text-primary/40 hover:text-primary/70 text-xs px-1">✎</button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteCat(cat.id); }}
                      className="text-red-400/50 hover:text-red-400 text-xs">×</button>
                  </div>
                ))
              )}
            </div>

            {/* Seed groups button + manage groups */}
            <div className="mt-3 pt-3 border-t border-primary/10 space-y-2">
              {isSuperAdmin && categoryGroups.length === 0 && (
                <button
                  data-testid="seed-groups-btn"
                  onClick={async () => {
                    try {
                      await axios.post(`${API}/admin/seed-category-groups`, {}, { headers });
                      toast.success("تم إضافة المجموعات الافتراضية");
                      loadData();
                    } catch { toast.error("خطأ"); }
                  }}
                  className="w-full bg-primary/10 hover:bg-primary/20 text-primary py-1.5 rounded-lg text-xs font-bold transition-all"
                >
                  + أضف مجموعات الفئات
                </button>
              )}
              <button
                onClick={() => setShowGroupForm(true)}
                className="w-full bg-primary/10 hover:bg-primary/20 text-primary py-1.5 rounded-lg text-xs font-bold transition-all"
              >
                + مجموعة جديدة
              </button>
            </div>

            {/* Stats per category */}
            {selectedCat && (
              <div className="mt-3 bg-primary/5 rounded-xl p-3">
                <div className="text-xs font-bold text-primary/50 mb-2">إحصاء الأسئلة</div>
                {[300, 600, 900].map(d => (
                  <div key={d} className="flex justify-between items-center text-xs py-1">
                    <span className="text-primary/60">{d} نقطة</span>
                    <span className={`font-black ${getQuestionCount(selectedCat, d) >= 10 ? "text-green-600" : "text-amber-600"}`}>
                      {getQuestionCount(selectedCat, d)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-4 flex-wrap">
                <h2 className="text-2xl font-black">
                  {selectedCat ? getCatName(selectedCat) : "كل الأسئلة"}
                </h2>
                <div className="flex gap-2">
                  {["all", "300", "600", "900"].map((d) => (
                    <button
                      key={d}
                      data-testid={`filter-${d}`}
                      onClick={() => setSelectedDifficulty(d)}
                      className={`px-3 py-1 rounded-full text-sm font-bold transition-all ${selectedDifficulty === d ? "bg-primary text-secondary" : "bg-primary/10 hover:bg-primary/20"}`}
                    >
                      {d === "all" ? "الكل" : d}
                    </button>
                  ))}
                </div>
                {/* Search */}
                <input
                  data-testid="question-search-input"
                  value={questionSearch}
                  onChange={e => setQuestionSearch(e.target.value)}
                  placeholder="🔍 ابحث في الأسئلة..."
                  className="border border-primary/20 focus:border-primary rounded-xl px-3 py-1.5 text-sm outline-none bg-white"
                  style={{ fontFamily: "Cairo, sans-serif", minWidth: "180px" }}
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-primary/40 text-sm">{filteredQuestions.length} سؤال</span>
                <button
                  data-testid="show-deleted-btn"
                  onClick={() => { setShowDeleted(v => !v); if (!showDeleted) loadDeletedQuestions(); }}
                  className="text-sm text-primary/50 hover:text-primary border border-primary/20 hover:border-primary/40 px-3 py-1.5 rounded-lg transition-all font-bold"
                  title="سلة المحذوفات"
                >
                  🗑️ استعادة
                </button>
                {/* Import file button */}
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.json,.pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={(e) => handleImportFile(e.target.files?.[0])}
                />
                <button
                  data-testid="import-questions-btn"
                  onClick={() => importFileRef.current?.click()}
                  disabled={importUploading}
                  className="text-sm text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-all font-bold disabled:opacity-50"
                  title="رفع ملف أسئلة (Excel/CSV/JSON/PDF/Word/صورة)"
                >
                  {importUploading ? "⏳ جاري الرفع..." : "📥 رفع ملف"}
                </button>
                <button
                  data-testid="bulk-fetch-images-btn"
                  onClick={handleBulkFetchImages}
                  className="text-sm text-purple-600 hover:text-purple-700 border border-purple-200 hover:border-purple-400 px-3 py-1.5 rounded-lg transition-all font-bold"
                  title="جلب صور Unsplash لجميع الأسئلة التي لديها image_query بدون صورة"
                >
                  🖼️ جلب صور
                </button>
                <button
                  data-testid="add-question-btn"
                  onClick={() => {
                    setEditingQuestion(null);
                    setForm({ ...emptyQuestion, category_id: selectedCat || "" });
                    setShowForm(true);
                  }}
                  className="bg-primary text-secondary px-5 py-2 rounded-full font-bold hover:scale-105 transition-all"
                >
                  + سؤال جديد
                </button>
              </div>
            </div>

            {/* ── DELETED QUESTIONS RESTORE PANEL ── */}
            {showDeleted && (
              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-black text-amber-800 flex items-center gap-2">
                    <span>🗑️</span> سلة المحذوفات ({deletedQuestions.length})
                  </div>
                  <button onClick={() => setShowDeleted(false)} className="text-amber-600/60 hover:text-amber-700 text-lg">×</button>
                </div>
                {deletedQuestions.length === 0 ? (
                  <div className="text-amber-600/60 text-sm text-center py-4">السلة فارغة</div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {deletedQuestions.map(q => (
                      <div key={q.id} data-testid={`deleted-q-${q.id}`}
                        className="bg-white border border-amber-200 rounded-lg p-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-primary truncate">{q.text}</p>
                          <p className="text-xs text-primary/50">إجابة: {q.answer} · حُذف بواسطة: {q.deleted_by || "غير معروف"} · {new Date(q.deleted_at).toLocaleDateString("ar-SA")}</p>
                        </div>
                        <button
                          data-testid={`restore-q-${q.id}`}
                          onClick={() => handleRestoreQuestion(q)}
                          className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-black hover:bg-green-700 transition-all shrink-0"
                        >
                          استعادة
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-16 text-primary/30">
                  <div className="text-5xl mb-3">📝</div>
                  <div className="text-xl font-bold">لا يوجد أسئلة</div>
                  <div className="text-sm mt-2">اضغط "+ سؤال جديد" لإضافة أسئلة</div>
                </div>
              ) : (
                filteredQuestions.map((q) => (
                  <div
                    key={q.id}
                    data-testid={`question-row-${q.id}`}
                    className="bg-white border border-primary/10 rounded-xl p-4 flex items-start gap-3 hover:border-primary/30 transition-all"
                  >
                    {q.image_url && (
                      <img src={q.image_url} alt="" className="w-12 h-10 object-cover rounded-lg border border-primary/10 flex-shrink-0" onError={(e) => e.target.style.display = "none"} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${q.difficulty === 300 ? "bg-green-100 text-green-700" : q.difficulty === 600 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                          {q.difficulty}
                        </span>
                        <span className="text-xs text-primary/50">{getCatName(q.category_id)}</span>
                        {q.question_type === "secret_word" && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">ولا كلمة</span>
                        )}
                      </div>
                      <div className="font-bold text-primary truncate">{q.text}</div>
                      <div className="text-primary/60 text-sm mt-1">
                        الإجابة: <span className="font-medium text-primary">{q.answer}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        data-testid={`edit-q-${q.id}`}
                        onClick={() => handleEditQuestion(q)}
                        className="text-primary/50 hover:text-primary bg-primary/5 hover:bg-primary/10 px-3 py-1 rounded-lg text-sm font-bold transition-all"
                      >
                        تعديل
                      </button>
                      <button
                        data-testid={`delete-q-${q.id}`}
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-red-400/60 hover:text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg text-sm font-bold transition-all"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── USERS TAB ── */}
      {activeTab === "users" && (
        <div className="p-6">
          <h2 className="text-2xl font-black mb-6">المستخدمون ({users.length})</h2>
          {users.length === 0 ? (
            <div className="text-center py-16 text-primary/30">
              <div className="text-5xl mb-3">👤</div>
              <div className="text-xl font-bold">لا يوجد مستخدمون</div>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} data-testid={`user-row-${user.id}`} className="bg-white border border-primary/10 rounded-xl p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-black text-primary">{user.username}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${user.subscription_type === "premium" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                        {user.subscription_type === "premium" ? "مميز" : "مجاني"}
                      </span>
                    </div>
                    <div className="text-primary/50 text-xs">{user.email}</div>
                    <div className="text-primary/40 text-xs mt-0.5">
                      مباريات: {user.game_count || 0} · أسئلة مجابة: {user.answered_count || 0}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {user.subscription_type !== "premium" ? (
                      <>
                        <button
                          data-testid={`make-premium-${user.id}`}
                          onClick={() => handleUpdateUserSub(user.id, "premium")}
                          className="text-amber-600 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-lg text-xs font-bold transition-all"
                        >
                          ترقية
                        </button>
                        <button
                          data-testid={`gift-sub-${user.id}`}
                          onClick={() => handleGiftSubscription(user.id, "monthly")}
                          className="text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-lg text-xs font-bold transition-all"
                        >
                          هدية
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleUpdateUserSub(user.id, "free")}
                        className="text-gray-500 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-lg text-xs font-bold transition-all"
                      >
                        إلغاء المميز
                      </button>
                    )}
                    <button
                      data-testid={`delete-user-${user.id}`}
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-400/60 hover:text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg text-xs font-bold transition-all"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SECURITY TAB ── */}
      {activeTab === "security" && (
        <div style={{ background: "#0d1117", minHeight: "calc(100vh - 64px)" }}>
        <SecurityDashboard
          overview={secOverview}
          users={secUsers}
          sessions={secSessions}
          suspicious={secSuspicious}
          devices={secDevices}
          loading={secLoading}
          expandedUser={expandedUser}
          setExpandedUser={setExpandedUser}
          onLoad={loadSecurity}
          onLoadDevices={loadUserDevices}
          onRevokeSession={revokeSession}
          onLock={lockUser}
          onUnlock={unlockUser}
          onRemoveDevice={removeDevice}
          onClearLogs={clearLogs}
        />
        </div>
      )}

      {/* ── ANALYTICS TAB ── */}
      {activeTab === "analytics" && (() => {
        const A_BG    = "#0d1117";
        const A_CARD  = "rgba(255,255,255,0.035)";
        const A_BORDER= "rgba(255,255,255,0.08)";
        const A_TEXT  = "#f3f4f6";
        const A_MUTED = "rgba(243,244,246,0.45)";

        const ACard = ({ children, style = {} }) => (
          <div style={{ background: A_CARD, border: `1px solid ${A_BORDER}`, borderRadius: "16px",
                        backdropFilter: "blur(12px)", ...style }}>
            {children}
          </div>
        );

        const AKPI = ({ icon, label, value, sub, color, accent }) => (
          <ACard style={{ padding: "20px 22px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -8, right: -6, fontSize: "3.8rem", opacity: 0.055 }}>{icon}</div>
            <div style={{ fontSize: "2rem", marginBottom: "6px" }}>{icon}</div>
            <div style={{ fontSize: "2rem", fontWeight: 900, color, lineHeight: 1 }}>{value ?? "—"}</div>
            <div style={{ fontSize: "0.78rem", color: A_MUTED, marginTop: "5px", fontWeight: 700 }}>{label}</div>
            {sub && <div style={{ fontSize: "0.7rem", color, opacity: 0.6, marginTop: "3px" }}>{sub}</div>}
            {accent && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px",
                                     background: color, opacity: 0.4, borderRadius: "0 0 16px 16px" }} />}
          </ACard>
        );

        const SectionLabel = ({ children }) => (
          <div style={{ fontSize: "0.72rem", fontWeight: 800, color: A_MUTED, letterSpacing: "0.12em",
                        textTransform: "uppercase", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ flex: 1, height: "1px", background: A_BORDER }} />
            {children}
            <div style={{ flex: 1, height: "1px", background: A_BORDER }} />
          </div>
        );

        if (!analytics) return (
          <div style={{ padding: "64px", background: A_BG, minHeight: "calc(100vh - 64px)", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📊</div>
            <div style={{ color: A_MUTED, fontSize: "1rem" }}>جاري تحميل الإحصاءات...</div>
          </div>
        );

        const convRate = analytics.users.total > 0
          ? Math.round((analytics.users.premium / analytics.users.total) * 100) : 0;
        const maxCatCount = Math.max(...(analytics.questions.by_category || []).map(c => c.count), 1);
        const diffTotal = (analytics.questions.by_difficulty?.["300"] || 0) +
                          (analytics.questions.by_difficulty?.["600"] || 0) +
                          (analytics.questions.by_difficulty?.["900"] || 0);
        const trend = analytics.revenue?.trend || [];
        const maxTrend = Math.max(...trend.map(t => t.amount), 1);

        return (
          <div style={{ padding: "clamp(16px,2.5vw,28px)", background: A_BG, minHeight: "calc(100vh - 64px)",
                        fontFamily: "Cairo, sans-serif", color: A_TEXT }}>
            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", gap: "12px", flexWrap: "wrap" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "clamp(1.3rem,2.5vw,1.8rem)", fontWeight: 900 }}>📊 لوحة التحليلات</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: A_MUTED }}>نظرة شاملة على أداء المنصة</p>
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button onClick={loadAnalytics}
                  style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.3)", color: "#60a5fa",
                           padding: "9px 18px", borderRadius: "12px", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>
                  ↻ تحديث
                </button>
                {isSuperAdmin && (
                  <button
                    onClick={() => {
                      fetch(`${API}/admin/export-db`, { headers })
                        .then(r => r.blob())
                        .then(blob => {
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url; a.download = "hujjah_db_export.zip"; a.click();
                          URL.revokeObjectURL(url);
                        })
                        .catch(() => toast.error("خطأ في التصدير"));
                    }}
                    style={{ background: "rgba(255,255,255,0.06)", border: `1.5px solid ${A_BORDER}`, color: A_TEXT,
                             padding: "9px 18px", borderRadius: "12px", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer",
                             display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    <span>💾</span><span>تصدير DB</span>
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

              {/* ═══ SECTION: المستخدمون ═══ */}
              <SectionLabel>👥 المستخدمون</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "12px", marginTop: "-10px" }}>
                <AKPI icon="👥" label="إجمالي المستخدمين" value={analytics.users.total}    color="#60a5fa" accent sub={`+${analytics.users.new_7d} هذا الأسبوع`} />
                <AKPI icon="⭐" label="مشتركون مميزون"   value={analytics.users.premium}   color="#fbbf24" accent sub={`${analytics.users.free} مجاني`} />
                <AKPI icon="🔥" label="نشطون (24 ساعة)"  value={analytics.users.active_24h} color="#f87171" accent />
                <AKPI icon="📅" label="نشطون (7 أيام)"   value={analytics.users.active_7d}  color="#a78bfa" accent />
                <AKPI icon="🗓" label="نشطون (30 يوم)"   value={analytics.users.active_30d} color="#34d399" accent />
                <AKPI icon="📈" label="معدل التحويل"     value={`${convRate}%`}              color="#22d3ee" accent sub="مجاني → مميز" />
              </div>

              {/* ═══ SECTION: الجلسات والأسئلة ═══ */}
              <SectionLabel>🎮 الجلسات والمحتوى</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "12px", marginTop: "-10px" }}>
                <AKPI icon="🎮" label="جلسات اليوم"    value={analytics.sessions.active_24h} color="#a78bfa" accent />
                <AKPI icon="📋" label="جلسات الأسبوع"  value={analytics.sessions.active_7d}  color="#60a5fa" accent />
                <AKPI icon="📚" label="إجمالي الأسئلة" value={analytics.questions.total}      color="#34d399" accent />
                <AKPI icon="⏳" label="قيد المراجعة"   value={analytics.questions.pending}    color="#f59e0b" accent />
                <AKPI icon="📦" label="الفئات النشطة"  value={analytics.categories.active}   color="#22d3ee" accent />
                <AKPI icon="🔒" label="فئات مميزة"     value={analytics.categories.premium}  color="#fbbf24" accent />
              </div>

              {/* ═══ SECTION: الإيرادات ═══ */}
              <SectionLabel>💰 الإيرادات</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "-10px" }}>

                {/* Revenue total + conversion */}
                <ACard style={{ padding: "22px" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "rgba(251,191,36,0.55)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>
                    إجمالي الإيرادات
                  </div>
                  <div style={{ fontSize: "2.6rem", fontWeight: 900, color: "#fbbf24", lineHeight: 1 }}>
                    {analytics.revenue.total.toLocaleString()}
                  </div>
                  <div style={{ color: "rgba(251,191,36,0.5)", fontSize: "0.85rem", marginTop: "4px" }}>ريال سعودي</div>

                  <div style={{ marginTop: "18px" }}>
                    <div style={{ fontSize: "0.7rem", color: A_MUTED, fontWeight: 700, marginBottom: "10px" }}>آخر المعاملات</div>
                    {(analytics.revenue.recent_transactions || []).slice(0, 5).map((txn, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                                            padding: "7px 0", borderBottom: `1px solid ${A_BORDER}`, fontSize: "0.78rem" }}>
                        <span style={{ color: A_MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "130px" }}>
                          {txn.email || txn.gifted_by || "—"}
                        </span>
                        <span style={{ fontWeight: 900, flexShrink: 0,
                                       color: txn.payment_status === "paid" ? "#34d399" : txn.payment_status === "gift" ? "#fbbf24" : "#f87171" }}>
                          {txn.payment_status === "gift" ? "هدية 🎁" : `${txn.amount} ر.س`}
                        </span>
                      </div>
                    ))}
                    {(analytics.revenue.recent_transactions || []).length === 0 && (
                      <div style={{ color: A_MUTED, fontSize: "0.78rem", textAlign: "center", padding: "12px 0" }}>لا توجد معاملات بعد</div>
                    )}
                  </div>
                </ACard>

                {/* Revenue trend chart */}
                <ACard style={{ padding: "22px" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "rgba(251,191,36,0.55)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "14px" }}>
                    منحنى الإيرادات (30 يوم)
                  </div>
                  {trend.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 0", color: A_MUTED, fontSize: "0.82rem" }}>
                      لا توجد بيانات إيرادات بعد
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "100px", paddingBottom: "8px" }}>
                      {trend.map((t, i) => (
                        <div key={i} title={`${t.date}: ${t.amount} ر.س`}
                          style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", cursor: "default" }}>
                          <div style={{
                            width: "100%", borderRadius: "4px 4px 0 0",
                            background: t.amount > 0 ? "linear-gradient(to top,#d97706,#fbbf24)" : "rgba(255,255,255,0.04)",
                            height: `${Math.max(4, (t.amount / maxTrend) * 88)}px`,
                            transition: "height 0.4s ease",
                            minHeight: "4px",
                          }} />
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                    <span style={{ fontSize: "0.65rem", color: A_MUTED }}>{trend[0]?.date?.slice(5) || "—"}</span>
                    <span style={{ fontSize: "0.65rem", color: A_MUTED }}>{trend[trend.length - 1]?.date?.slice(5) || "—"}</span>
                  </div>
                </ACard>
              </div>

              {/* ═══ SECTION: الأسئلة ═══ */}
              <SectionLabel>📚 المحتوى والأسئلة</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "-10px" }}>

                {/* Questions by difficulty */}
                <ACard style={{ padding: "22px" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 800, color: A_MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>
                    الأسئلة حسب الصعوبة
                  </div>
                  {[
                    { key: "300", label: "سهل",   color: "#34d399", bg: "rgba(52,211,153,0.15)"  },
                    { key: "600", label: "متوسط", color: "#fbbf24", bg: "rgba(251,191,36,0.15)"  },
                    { key: "900", label: "صعب",   color: "#f87171", bg: "rgba(239,68,68,0.15)"   },
                  ].map(({ key, label, color, bg }) => {
                    const count = analytics.questions.by_difficulty?.[key] || 0;
                    const pct = diffTotal > 0 ? Math.round((count / diffTotal) * 100) : 0;
                    return (
                      <div key={key} style={{ marginBottom: "14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontSize: "0.82rem", color, fontWeight: 700 }}>{key} — {label}</span>
                          <span style={{ fontSize: "0.9rem", fontWeight: 900, color }}>{count} <span style={{ fontSize: "0.65rem", opacity: 0.6 }}>({pct}%)</span></span>
                        </div>
                        <div style={{ height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: "9999px", background: color,
                                        width: `${pct}%`, transition: "width 0.6s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ marginTop: "6px", fontSize: "0.72rem", color: A_MUTED, textAlign: "center" }}>
                    الإجمالي: {diffTotal} سؤال
                  </div>
                </ACard>

                {/* Weak categories */}
                <ACard style={{ padding: "22px" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "rgba(251,191,36,0.55)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "14px" }}>
                    ⚠️ فئات تحتاج محتوى (&lt;6 أسئلة)
                  </div>
                  {(analytics.questions.weak_categories || []).length === 0 ? (
                    <div style={{ textAlign: "center", padding: "24px 0", color: "#34d399", fontSize: "0.9rem" }}>
                      ✅ كل الفئات لديها محتوى كافٍ
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "180px", overflowY: "auto" }}>
                      {(analytics.questions.weak_categories || []).map(cat => (
                        <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: "10px",
                                                    padding: "8px 12px", borderRadius: "10px",
                                                    background: cat.count === 0 ? "rgba(239,68,68,0.1)" : "rgba(251,191,36,0.07)",
                                                    border: `1px solid ${cat.count === 0 ? "rgba(239,68,68,0.3)" : "rgba(251,191,36,0.2)"}` }}>
                          <span style={{ fontSize: "1rem" }}>{cat.icon || "🎯"}</span>
                          <span style={{ flex: 1, fontSize: "0.82rem", color: A_TEXT, fontWeight: 700 }}>{cat.name}</span>
                          <span style={{ fontSize: "0.75rem", fontWeight: 900,
                                         color: cat.count === 0 ? "#f87171" : "#fbbf24" }}>
                            {cat.count} سؤال
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </ACard>
              </div>

              {/* ═══ SECTION: الأسئلة بالفئات ═══ */}
              <SectionLabel>📊 الأسئلة بالفئات</SectionLabel>
              <ACard style={{ padding: "22px", marginTop: "-10px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {(analytics.questions.by_category || [])
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 15)
                    .map(cat => (
                      <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "0.85rem", width: "20px", textAlign: "center", flexShrink: 0 }}>{cat.icon || "🎯"}</span>
                        <span style={{ color: A_TEXT, fontSize: "0.82rem", width: "130px", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>
                          {cat.name}
                        </span>
                        <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: "9999px", height: "8px", overflow: "hidden" }}>
                          <div style={{
                            height: "100%", borderRadius: "9999px",
                            background: cat.count < 6
                              ? "linear-gradient(90deg,#ef4444,#f87171)"
                              : "linear-gradient(90deg,#6366f1,#818cf8)",
                            width: `${Math.max(2, (cat.count / maxCatCount) * 100)}%`,
                            transition: "width 0.6s ease",
                          }} />
                        </div>
                        <span style={{ color: cat.count < 6 ? "#f87171" : "#818cf8", fontSize: "0.78rem", fontWeight: 900, width: "32px", textAlign: "left", flexShrink: 0 }}>
                          {cat.count}
                        </span>
                      </div>
                    ))}
                </div>
              </ACard>

            </div>
            <style>{`@keyframes analyticsIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
          </div>
        );
      })()}

      {/* ── SETTINGS TAB ── */}
      {activeTab === "settings" && (
        <div className="p-6 max-w-2xl mx-auto">
          <h2 className="text-2xl font-black mb-6">إعدادات اللعبة</h2>

          {/* Default Timer */}
          <div className="bg-white border border-primary/10 rounded-2xl p-6 mb-4">
            <h3 className="font-black text-lg mb-1">التايمر الافتراضي</h3>
            <p className="text-primary/50 text-sm mb-4">مدة الإجابة الافتراضية لكل الأسئلة (بالثواني)</p>
            <div className="flex items-center gap-4">
              <input
                data-testid="default-timer-input"
                type="number"
                min={10} max={180}
                value={gameSettings.default_timer}
                onChange={(e) => setGameSettings({ ...gameSettings, default_timer: parseInt(e.target.value) || 65 })}
                className="w-28 border-2 border-primary/20 focus:border-primary rounded-xl px-4 py-2 text-xl font-black outline-none text-center"
              />
              <span className="text-primary/50 font-bold">ثانية</span>
              <div className="flex-1 h-2 bg-primary/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/50 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (gameSettings.default_timer / 120) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* ولا كلمة timers */}
          <div className="bg-white border border-primary/10 rounded-2xl p-6 mb-6">
            <h3 className="font-black text-lg mb-1">تايمرات "ولا كلمة"</h3>
            <p className="text-primary/50 text-sm mb-4">مدة مخصصة لفئة ولا كلمة حسب الصعوبة</p>
            <div className="space-y-4">
              {[
                { key: "300", label: "سهل (300 نقطة)", color: "text-green-600", bg: "bg-green-50 border-green-200" },
                { key: "600", label: "متوسط (600 نقطة)", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
                { key: "900", label: "صعب (900 نقطة)", color: "text-red-600", bg: "bg-red-50 border-red-200" },
              ].map(({ key, label, color, bg }) => (
                <div key={key} className={`flex items-center gap-4 p-3 rounded-xl border ${bg}`}>
                  <span className={`font-black text-sm w-36 ${color}`}>{label}</span>
                  <input
                    data-testid={`word-timer-${key}`}
                    type="number"
                    min={10} max={180}
                    value={gameSettings.word_timers?.[key] ?? (key === "300" ? 80 : key === "600" ? 60 : 45)}
                    onChange={(e) => setGameSettings({
                      ...gameSettings,
                      word_timers: { ...gameSettings.word_timers, [key]: parseInt(e.target.value) || 60 }
                    })}
                    className="w-20 border-2 border-primary/20 focus:border-primary rounded-xl px-3 py-1.5 text-lg font-black outline-none text-center bg-white"
                  />
                  <span className="text-primary/50 text-sm">ثانية</span>
                </div>
              ))}
            </div>
          </div>

          <button
            data-testid="save-settings-btn"
            onClick={saveSettings}
            className="w-full bg-primary text-secondary py-3 rounded-xl font-black text-lg hover:scale-[1.02] transition-all"
          >
            {settingsSaved ? "✓ تم الحفظ!" : "حفظ الإعدادات"}
          </button>

          {/* Reset hint */}
          <p className="text-center text-primary/30 text-xs mt-3">
            ملاحظة: التايمر الافتراضي 65 ثانية · ولا كلمة: سهل 80s، متوسط 60s، صعب 45s
          </p>

          {/* Trial Mode - Free Categories */}
          <div className="bg-white border border-primary/10 rounded-2xl p-6 mt-6">
            <h3 className="font-black text-lg mb-1">الفئات المجانية (وضع التجربة)</h3>
            <p className="text-primary/50 text-sm mb-4">الفئات المتاحة للمستخدمين المجانيين وغير المشتركين</p>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(cat => {
                const isFree = (gameSettings.free_categories || []).includes(cat.id);
                return (
                  <label key={cat.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isFree ? "border-green-400 bg-green-50" : "border-primary/10 hover:border-primary/20"}`}>
                    <input
                      type="checkbox"
                      checked={isFree}
                      onChange={(e) => {
                        const current = gameSettings.free_categories || [];
                        const updated = e.target.checked
                          ? [...current, cat.id]
                          : current.filter(id => id !== cat.id);
                        setGameSettings({ ...gameSettings, free_categories: updated });
                      }}
                      className="w-4 h-4 accent-green-600"
                    />
                    <span className="text-lg">{cat.icon || "🎯"}</span>
                    <span className="text-sm font-bold text-primary">{cat.name}</span>
                    {isFree && <span className="text-xs text-green-600 font-bold mr-auto">مجاني</span>}
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-primary/30 mt-3 text-center">
              {(gameSettings.free_categories || []).length} فئة مجانية من أصل {categories.length}
            </p>
          </div>
        </div>
      )}

      {/* ── ACTIVITY LOGS TAB ── */}
      {activeTab === "logs" && (
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black">سجل النشاط</h2>
              <p className="text-primary/50 text-sm mt-1">جميع الإجراءات التي قام بها المدراء والموظفون</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-primary/40 text-sm">{logsTotal} إجراء</span>
              <button
                data-testid="refresh-logs-btn"
                onClick={loadLogs}
                className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg text-sm font-bold transition-all"
              >
                تحديث
              </button>
            </div>
          </div>
          {logsLoading ? (
            <div className="text-center py-16 text-primary/30">جاري التحميل...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-primary/30">
              <div className="text-5xl mb-3">📋</div>
              <div className="text-xl font-bold">لا يوجد سجل بعد</div>
              <div className="text-sm mt-2">ستظهر هنا إجراءات المدراء والموظفين</div>
            </div>
          ) : (
            <div className="bg-white border border-primary/10 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-primary/5 border-b border-primary/10">
                  <tr>
                    <th className="text-right p-3 font-black text-primary/60 text-xs uppercase tracking-widest">المسؤول</th>
                    <th className="text-right p-3 font-black text-primary/60 text-xs uppercase tracking-widest">الدور</th>
                    <th className="text-right p-3 font-black text-primary/60 text-xs uppercase tracking-widest">الإجراء</th>
                    <th className="text-right p-3 font-black text-primary/60 text-xs uppercase tracking-widest">النوع</th>
                    <th className="text-right p-3 font-black text-primary/60 text-xs uppercase tracking-widest">المحتوى</th>
                    <th className="text-right p-3 font-black text-primary/60 text-xs uppercase tracking-widest">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr key={log.id} data-testid={`log-row-${i}`}
                      className={`border-b border-primary/5 hover:bg-primary/2 transition-colors ${i % 2 === 0 ? "" : "bg-primary/[0.02]"}`}>
                      <td className="p-3 font-bold">{log.admin_name}</td>
                      <td className="p-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                          log.admin_role === "super_admin"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {log.admin_role === "super_admin" ? "مدير رئيسي" : "موظف"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          log.action.includes("حذف") ? "bg-red-100 text-red-700" :
                          log.action.includes("إضافة") ? "bg-green-100 text-green-700" :
                          log.action.includes("هدية") ? "bg-amber-100 text-amber-700" :
                          "bg-primary/10 text-primary/70"
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-primary/60">{log.target_type}</td>
                      <td className="p-3 text-primary/80 max-w-xs truncate" title={log.target_name}>{log.target_name}</td>
                      <td className="p-3 text-primary/40 text-xs whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── STAFF MANAGEMENT TAB ── */}
      {activeTab === "staff" && (
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black">إدارة الموظفين</h2>
              <p className="text-primary/50 text-sm mt-1">أنشئ وأدر حسابات موظفي المحتوى</p>
            </div>
            <button
              data-testid="add-staff-btn"
              onClick={() => { setEditingStaff(null); setStaffForm({ username: "", password: "", display_name: "" }); setShowStaffForm(true); }}
              className="bg-primary text-secondary px-5 py-2 rounded-full font-bold hover:scale-105 transition-all"
            >
              + موظف جديد
            </button>
          </div>

          {/* Staff Form */}
          {showStaffForm && (
            <div className="bg-white border border-primary/15 rounded-2xl p-6 mb-6">
              <h3 className="font-black text-lg mb-4">{editingStaff ? "تعديل الموظف" : "إضافة موظف جديد"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-bold text-primary/70 mb-1 block">اسم المستخدم *</label>
                  <input
                    data-testid="staff-username-input"
                    type="text"
                    value={staffForm.username}
                    onChange={(e) => setStaffForm(f => ({ ...f, username: e.target.value }))}
                    disabled={!!editingStaff}
                    placeholder="مثال: staff1"
                    className="w-full border-2 border-primary/20 focus:border-primary rounded-xl px-3 py-2.5 text-sm font-bold outline-none disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-primary/70 mb-1 block">الاسم الظاهر</label>
                  <input
                    data-testid="staff-displayname-input"
                    type="text"
                    value={staffForm.display_name}
                    onChange={(e) => setStaffForm(f => ({ ...f, display_name: e.target.value }))}
                    placeholder="مثال: أحمد محمد"
                    className="w-full border-2 border-primary/20 focus:border-primary rounded-xl px-3 py-2.5 text-sm font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-primary/70 mb-1 block">{editingStaff ? "كلمة مرور جديدة" : "كلمة المرور *"}</label>
                  <input
                    data-testid="staff-password-input"
                    type="password"
                    value={staffForm.password}
                    onChange={(e) => setStaffForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="6 أحرف على الأقل"
                    className="w-full border-2 border-primary/20 focus:border-primary rounded-xl px-3 py-2.5 text-sm font-bold outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  data-testid="save-staff-btn"
                  onClick={handleSaveStaff}
                  className="bg-primary text-secondary px-6 py-2 rounded-full font-bold hover:scale-105 transition-all"
                >
                  {editingStaff ? "حفظ التعديلات" : "إضافة الموظف"}
                </button>
                <button
                  onClick={() => { setShowStaffForm(false); setEditingStaff(null); }}
                  className="bg-primary/10 text-primary px-6 py-2 rounded-full font-bold hover:bg-primary/20 transition-all"
                >
                  إلغاء
                </button>
              </div>
              <p className="text-xs text-primary/40 mt-3">
                الموظف يستطيع إدارة الأسئلة والفئات وتوليد AI فقط — لا يرى المستخدمين أو الإحصاءات أو الإيرادات.
              </p>
            </div>
          )}

          {/* Staff List */}
          {staffList.length === 0 ? (
            <div className="text-center py-16 text-primary/30">
              <div className="text-5xl mb-3">👤</div>
              <div className="text-xl font-bold">لا يوجد موظفون بعد</div>
              <div className="text-sm mt-2">اضغط "+ موظف جديد" لإضافة موظف</div>
            </div>
          ) : (
            <div className="space-y-3">
              {staffList.map((staff) => (
                <div key={staff.id} data-testid={`staff-row-${staff.id}`}
                  className="bg-white border border-primary/10 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-black text-lg">
                    {(staff.display_name || staff.username)[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-primary">{staff.display_name || staff.username}</div>
                    <div className="text-primary/50 text-xs">@{staff.username}</div>
                    <div className="text-primary/40 text-xs mt-0.5">
                      {new Date(staff.created_at).toLocaleDateString("ar-SA")} · صلاحيات: الأسئلة والفئات فقط
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      data-testid={`edit-staff-${staff.id}`}
                      onClick={() => { setEditingStaff(staff); setStaffForm({ username: staff.username, password: "", display_name: staff.display_name || "" }); setShowStaffForm(true); }}
                      className="text-primary/50 hover:text-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
                    >
                      تعديل
                    </button>
                    <button
                      data-testid={`delete-staff-${staff.id}`}
                      onClick={() => handleDeleteStaff(staff.id)}
                      className="text-red-400/60 hover:text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PENDING QUESTIONS (APPROVAL WORKFLOW) TAB ── */}
      {activeTab === "pending" && (
        <div className="p-6 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📋</span>
              <div>
                <h2 className="text-2xl font-black">مراجعة الأسئلة ({pendingTotal})</h2>
                <p className="text-primary/50 text-sm">أسئلة في انتظار الموافقة قبل نشرها</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                data-testid="reload-pending-btn"
                onClick={loadPendingQuestions}
                disabled={pendingLoading}
                className="border border-primary/20 text-primary/60 px-4 py-2 rounded-xl font-bold text-sm hover:border-primary/50 transition-all"
              >
                {pendingLoading ? "⏳" : "↺"} تحديث
              </button>
              {pendingTotal > 0 && (
                <button
                  data-testid="approve-all-btn"
                  onClick={handleApproveAll}
                  className="bg-green-600 text-white px-5 py-2 rounded-xl font-black text-sm hover:bg-green-700 transition-all"
                >
                  ✓ موافقة على الكل ({pendingTotal})
                </button>
              )}
            </div>
          </div>

          {/* Import section */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xl">📥</span>
              <div>
                <div className="font-black text-blue-800">استيراد أسئلة من ملف</div>
                <div className="text-xs text-blue-600">Excel · CSV · JSON · PDF · Word (.docx) · TXT</div>
              </div>
            </div>
            <div className="text-xs text-blue-700 mb-3 bg-blue-100 rounded-xl p-3">
              <div className="font-bold mb-1">تنسيق الملف المطلوب:</div>
              <div>أعمدة مطلوبة: <strong>text</strong> (نص السؤال) · <strong>answer</strong> (الإجابة)</div>
              <div>أعمدة اختيارية: <strong>difficulty</strong> (300/600/900) · <strong>category_id</strong> · <strong>image_query</strong></div>
              <div className="mt-1 text-blue-500">للملفات الأخرى (PDF/Word/TXT): سيستخدم الذكاء الاصطناعي لاستخراج الأسئلة تلقائياً</div>
            </div>

            {/* Custom AI instructions */}
            <div className="mb-4">
              <label className="block text-sm font-black text-blue-800 mb-1.5">
                تعليمات مخصصة للذكاء الاصطناعي <span className="text-blue-400 font-normal">(اختياري — لملفات PDF/Word/TXT)</span>
              </label>
              <textarea
                data-testid="import-custom-prompt"
                value={importCustomPrompt}
                onChange={e => setImportCustomPrompt(e.target.value)}
                placeholder="مثال: ركّز على الأسئلة المتعلقة بالشباب السعودي · استخرج أسئلة الصعوبة المتوسطة والصعبة فقط · صِغ الأسئلة بأسلوب ترفيهي ..."
                rows={3}
                className="w-full border-2 border-blue-300 focus:border-blue-500 rounded-xl px-3 py-2.5 text-sm outline-none resize-none bg-white"
                style={{ fontFamily: "Cairo, sans-serif" }}
              />
              <p className="text-xs text-blue-500 mt-1">هذه التعليمات ترشد الذكاء الاصطناعي عند استخراج الأسئلة من الملفات الكبيرة.</p>
            </div>

            <input
              ref={importFileRef}
              type="file"
              accept=".xlsx,.xls,.csv,.json,.pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => handleImportFile(e.target.files?.[0])}
            />
            <button
              data-testid="import-file-btn"
              onClick={() => importFileRef.current?.click()}
              disabled={importUploading}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-sm hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {importUploading ? (<><span className="animate-spin">⏳</span> جاري الرفع والمعالجة...</>) : (<><span>📂</span> اختر ملف وابدأ الاستيراد</>)}
            </button>
          </div>

          {/* Bulk action bar */}
          {selectedPending.size > 0 && (
            <div style={{
              background: "rgba(99,102,241,0.12)", border: "1.5px solid rgba(99,102,241,0.4)",
              borderRadius: "14px", padding: "12px 18px", marginBottom: "16px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap"
            }}>
              <div style={{ color: "#a5b4fc", fontWeight: 700, fontSize: "0.9rem" }}>
                ✔ {selectedPending.size} سؤال محدد
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={handleBulkApprove}
                  style={{ background: "rgba(52,211,153,0.18)", border: "1.5px solid rgba(52,211,153,0.5)", color: "#34d399",
                           padding: "7px 18px", borderRadius: "10px", fontWeight: 900, fontSize: "0.82rem", cursor: "pointer" }}>
                  ✓ نشر المحدد
                </button>
                <button onClick={handleBulkReject}
                  style={{ background: "rgba(239,68,68,0.12)", border: "1.5px solid rgba(239,68,68,0.4)", color: "#f87171",
                           padding: "7px 18px", borderRadius: "10px", fontWeight: 900, fontSize: "0.82rem", cursor: "pointer" }}>
                  ✕ رفض المحدد
                </button>
                <button onClick={() => setSelectedPending(new Set())}
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(243,244,246,0.5)",
                           padding: "7px 14px", borderRadius: "10px", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* Select all row */}
          {pendingQuestions.length > 0 && !pendingLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", padding: "0 4px" }}>
              <input
                type="checkbox"
                checked={selectedPending.size === pendingQuestions.length && pendingQuestions.length > 0}
                onChange={() => {
                  if (selectedPending.size === pendingQuestions.length) setSelectedPending(new Set());
                  else setSelectedPending(new Set(pendingQuestions.map(q => q.id)));
                }}
                style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#818cf8" }}
              />
              <span style={{ color: "rgba(243,244,246,0.45)", fontSize: "0.8rem", fontWeight: 700 }}>
                {selectedPending.size === pendingQuestions.length ? "إلغاء تحديد الكل" : "تحديد الكل"}
              </span>
            </div>
          )}

          {/* Pending list */}
          {pendingLoading ? (
            <div className="text-center py-16 text-primary/40">
              <div className="text-4xl mb-3 animate-spin">⏳</div>
              <div>جاري التحميل...</div>
            </div>
          ) : pendingQuestions.length === 0 ? (
            <div className="text-center py-16 text-primary/30">
              <div className="text-5xl mb-3">✅</div>
              <div className="font-bold">لا توجد أسئلة معلقة</div>
              <div className="text-sm mt-1">جميع الأسئلة المستوردة تمت مراجعتها</div>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingQuestions.map((q, i) => (
                <PendingQuestionCard
                  key={q.id}
                  q={q}
                  i={i}
                  categories={categories}
                  headers={headers}
                  onApprove={handleApproveQuestion}
                  onReject={handleRejectQuestion}
                  onUpdate={(id, fields) => setPendingQuestions(prev => prev.map(pq => pq.id === id ? { ...pq, ...fields } : pq))}
                  selected={selectedPending.has(q.id)}
                  onToggleSelect={(id) => setSelectedPending(prev => {
                    const next = new Set(prev);
                    next.has(id) ? next.delete(id) : next.add(id);
                    return next;
                  })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── AI GENERATOR TAB ── */}
      {activeTab === "ai" && (
        <div className="p-6 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🤖</span>
            <div>
              <h2 className="text-2xl font-black">توليد الأسئلة بالذكاء الاصطناعي</h2>
              <p className="text-primary/50 text-sm">أنشئ أسئلة حماسية ومتنوعة بضغطة زر</p>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white border border-primary/10 rounded-2xl p-6 mb-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-bold text-primary/70 mb-2 block">الفئة</label>
                <select
                  data-testid="ai-category-select"
                  value={aiCatId}
                  onChange={(e) => setAiCatId(e.target.value)}
                  className="w-full border-2 border-primary/20 focus:border-primary rounded-xl px-3 py-2.5 text-sm font-bold outline-none bg-white"
                >
                  <option value="">اختر فئة...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon || ""} {c.name}{c.is_premium ? " ⭐" : ""}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-primary/70 mb-2 block">الصعوبة</label>
                <select
                  data-testid="ai-difficulty-select"
                  value={aiDiff}
                  onChange={(e) => setAiDiff(parseInt(e.target.value))}
                  className="w-full border-2 border-primary/20 focus:border-primary rounded-xl px-3 py-2.5 text-sm font-bold outline-none bg-white"
                >
                  <option value={300}>300 - سهل</option>
                  <option value={600}>600 - متوسط</option>
                  <option value={900}>900 - صعب</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-primary/70 mb-2 block">عدد الأسئلة</label>
                <input
                  data-testid="ai-count-input"
                  type="number"
                  min={3} max={20}
                  value={aiCount}
                  onChange={(e) => setAiCount(Math.min(20, Math.max(3, parseInt(e.target.value) || 10)))}
                  className="w-full border-2 border-primary/20 focus:border-primary rounded-xl px-3 py-2.5 text-sm font-black outline-none text-center"
                />
              </div>
            </div>

            {/* Custom Prompt */}
            <div className="mt-4">
              <label className="text-sm font-bold text-primary/70 mb-2 block">
                وصف مخصص للأسئلة (اختياري)
              </label>
              <textarea
                data-testid="ai-prompt-input"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="مثال: أسئلة ترفيهية مناسبة لمراهقين سعوديين عن كرة القدم السعودية... أو أسئلة صعبة عن تاريخ الدوري الإنجليزي الممتاز"
                rows={3}
                className="w-full border-2 border-primary/20 focus:border-primary rounded-xl px-3 py-2 text-sm outline-none resize-none"
                style={{ fontFamily: "Cairo, sans-serif" }}
              />
              <p className="text-xs text-primary/40 mt-1">
                اكتب وصفاً ليتبعه الذكاء الاصطناعي عند توليد الأسئلة. اتركه فارغاً للتوليد التلقائي.
              </p>
            </div>

            <button
              data-testid="ai-generate-btn"
              onClick={handleAiGenerate}
              disabled={aiGenerating || !aiCatId}
              className="w-full mt-5 bg-primary text-secondary py-3.5 rounded-xl font-black text-lg hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {aiGenerating ? (
                <>
                  <span className="animate-spin inline-block">⏳</span>
                  <span>جاري التوليد...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>ولّد {aiCount} سؤال</span>
                </>
              )}
            </button>
            <button
              data-testid="ai-generate-18-btn"
              onClick={handleAiGenerate18}
              disabled={aiGenerating || !aiCatId}
              className="w-full mt-2 bg-amber-700 text-white py-3 rounded-xl font-black text-base hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              title="يولّد 18 سؤال: 6 سهل + 6 متوسط + 6 صعب ويرسلها للمراجعة"
            >
              <span>🎯</span>
              <span>ولّد 18 سؤال كاملة (6+6+6) للمراجعة</span>
            </button>
          </div>

          {/* Generated Questions Preview */}
          {aiQuestions.length > 0 && (
            <div className="bg-white border border-primary/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-lg">{aiQuestions.length} سؤال جاهز للمراجعة</h3>
                  {aiFetchingImages && (
                    <p className="text-xs text-primary/40 mt-0.5 flex items-center gap-1">
                      <span className="animate-spin inline-block">⏳</span> جاري جلب الصور من Unsplash...
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    data-testid="ai-save-pending-btn"
                    onClick={handleAiSaveAsPending}
                    disabled={aiSaving}
                    className="bg-amber-600 text-white px-4 py-2 rounded-xl font-black text-sm hover:bg-amber-700 transition-all disabled:opacity-50"
                  >
                    {aiSaving ? "..." : "📋 للمراجعة"}
                  </button>
                  <button
                    data-testid="ai-save-btn"
                    onClick={handleAiSave}
                    disabled={aiSaving}
                    className="bg-green-600 text-white px-6 py-2 rounded-xl font-black hover:bg-green-700 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {aiSaving ? "جاري الحفظ..." : `✓ نشر مباشر (${aiQuestions.length})`}
                  </button>
                </div>
              </div>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {aiQuestions.map((q, i) => (
                  <div key={q.id} data-testid={`ai-question-${i}`}
                    className={`rounded-xl border overflow-hidden ${q.difficulty === 300 ? "border-green-200 bg-green-50" : q.difficulty === 600 ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"}`}>
                    <div className="flex">
                      {/* Image Preview */}
                      <div className="w-28 shrink-0 bg-black/10 relative overflow-hidden">
                        {q._img_thumb || q.image_url ? (
                          <img
                            src={q._img_thumb || q.image_url}
                            alt=""
                            className="w-full h-full object-cover"
                            style={{ minHeight: "100px" }}
                            onError={e => e.target.style.display = "none"}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full min-h-[100px] text-primary/20 text-xs text-center p-2">
                            {q.image_query ? "⏳" : "لا صورة"}
                          </div>
                        )}
                        {q._img_credit && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1 py-0.5 truncate">
                            © {q._img_credit}
                          </div>
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${q.difficulty === 300 ? "bg-green-200 text-green-800" : q.difficulty === 600 ? "bg-amber-200 text-amber-800" : "bg-red-200 text-red-800"}`}>
                            {q.difficulty === 300 ? "سهل" : q.difficulty === 600 ? "متوسط" : "صعب"} • {q.difficulty}
                          </span>
                          <button
                            onClick={() => setAiQuestions(aiQuestions.filter((_, idx) => idx !== i))}
                            className="text-red-400/60 hover:text-red-500 text-xl font-black leading-none"
                            title="حذف هذا السؤال"
                          >
                            ×
                          </button>
                        </div>
                        <textarea
                          value={q.text}
                          onChange={(e) => {
                            const updated = [...aiQuestions];
                            updated[i] = { ...q, text: e.target.value };
                            setAiQuestions(updated);
                          }}
                          rows={2}
                          className="w-full bg-white border border-primary/10 rounded-lg px-3 py-2 text-sm font-bold outline-none resize-none"
                          placeholder="نص السؤال"
                        />
                        <div className="flex gap-2">
                          <input
                            value={q.answer}
                            onChange={(e) => {
                              const updated = [...aiQuestions];
                              updated[i] = { ...q, answer: e.target.value };
                              setAiQuestions(updated);
                            }}
                            className="flex-1 bg-white border border-primary/10 rounded-lg px-3 py-2 text-sm outline-none"
                            placeholder="الإجابة"
                          />
                          <input
                            value={q.image_query || ""}
                            onChange={(e) => {
                              const updated = [...aiQuestions];
                              updated[i] = { ...q, image_query: e.target.value };
                              setAiQuestions(updated);
                            }}
                            className="flex-1 bg-white border border-primary/10 rounded-lg px-3 py-2 text-xs outline-none"
                            placeholder="كلمة بحث الصورة (انجليزي)"
                          />
                          <button
                            onClick={async () => {
                              const result = await fetchUnsplashForQuestion(q.image_query);
                              if (result) {
                                setAiQuestions(prev => prev.map((item, idx) => idx === i ? { ...item, ...result } : item));
                              }
                            }}
                            disabled={!q.image_query}
                            title="جلب صورة جديدة"
                            className="bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 rounded-lg text-xs font-bold disabled:opacity-30 transition-all"
                          >
                            🖼️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiQuestions.length === 0 && !aiGenerating && (
            <div className="text-center py-12 text-primary/30">
              <div className="text-5xl mb-3">✨</div>
              <div className="font-bold">اختر الفئة والصعوبة واضغط توليد</div>
              <div className="text-sm mt-1">الذكاء الاصطناعي سيكتب لك أسئلة حماسية بالعربي</div>
            </div>
          )}
        </div>
      )}

      {/* ── EXPERIMENTAL MODE TAB ── */}
      {activeTab === "experimental" && (
        <div className="flex h-full" style={{ minHeight: "calc(100vh - 140px)" }}>

          {/* Left: Settings Panel */}
          <div className="w-72 border-l border-primary/10 p-4 flex-shrink-0 overflow-y-auto bg-secondary/5">
            <h3 className="font-black text-base mb-4 text-primary flex items-center gap-2">
              <span>🔓</span> إعدادات وضع التجربة
            </h3>

            {/* Enable/Disable toggle */}
            <div className="bg-white rounded-xl p-3 border border-primary/10 mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-primary">تفعيل وضع التجربة</span>
                <button
                  data-testid="trial-toggle"
                  onClick={() => setGameSettings({ ...gameSettings, trial_enabled: !gameSettings.trial_enabled })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${gameSettings.trial_enabled ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${gameSettings.trial_enabled ? "translate-x-5 left-0.5" : "translate-x-0 left-0.5"}`} />
                </button>
              </div>
              <p className="text-xs text-primary/50">{gameSettings.trial_enabled ? "مفعّل - المستخدمون المجانيون يلعبون" : "موقوف - لا يمكن للمجانيين اللعب"}</p>
            </div>

            {/* Use trial questions only */}
            <div className="bg-white rounded-xl p-3 border border-primary/10 mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-primary">أسئلة التجربة فقط</span>
                <button
                  data-testid="trial-questions-only-toggle"
                  onClick={() => setGameSettings({ ...gameSettings, trial_questions_only: !gameSettings.trial_questions_only })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${gameSettings.trial_questions_only ? "bg-blue-500" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${gameSettings.trial_questions_only ? "translate-x-5 left-0.5" : "translate-x-0 left-0.5"}`} />
                </button>
              </div>
              <p className="text-xs text-primary/50">إذا مفعّل: في وضع التجربة تظهر الأسئلة المعلّمة فقط</p>
            </div>

            {/* Team 1 Categories */}
            <div className="bg-white rounded-xl p-3 border border-red-200 mb-3">
              <h4 className="font-black text-sm text-red-600 mb-2">🔴 فئات الفريق الأول (3)</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {categories.map(cat => {
                  const sel = (gameSettings.trial_team1_categories || []).includes(cat.id);
                  return (
                    <label key={cat.id} className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer text-xs font-bold transition-all ${sel ? "bg-red-50 text-red-700" : "hover:bg-primary/5 text-primary/70"}`}>
                      <input
                        type="checkbox"
                        checked={sel}
                        onChange={(e) => {
                          const cur = gameSettings.trial_team1_categories || [];
                          const updated = e.target.checked
                            ? [...cur.filter(id => !((gameSettings.trial_team2_categories || []).includes(id) && id === cat.id)), cat.id].slice(0, 3)
                            : cur.filter(id => id !== cat.id);
                          setGameSettings({ ...gameSettings, trial_team1_categories: updated });
                        }}
                        className="w-3.5 h-3.5 accent-red-600"
                      />
                      {cat.icon || "🎯"} {cat.name}
                      {sel && <span className="text-[10px] text-red-400 mr-auto">✓</span>}
                    </label>
                  );
                })}
              </div>
              <div className="text-[10px] text-primary/30 mt-1">{(gameSettings.trial_team1_categories || []).length}/3 مختارة</div>
            </div>

            {/* Team 2 Categories */}
            <div className="bg-white rounded-xl p-3 border border-blue-200 mb-4">
              <h4 className="font-black text-sm text-blue-600 mb-2">🔵 فئات الفريق الثاني (3)</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {categories.map(cat => {
                  const sel = (gameSettings.trial_team2_categories || []).includes(cat.id);
                  return (
                    <label key={cat.id} className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer text-xs font-bold transition-all ${sel ? "bg-blue-50 text-blue-700" : "hover:bg-primary/5 text-primary/70"}`}>
                      <input
                        type="checkbox"
                        checked={sel}
                        onChange={(e) => {
                          const cur = gameSettings.trial_team2_categories || [];
                          const updated = e.target.checked
                            ? [...cur, cat.id].slice(0, 3)
                            : cur.filter(id => id !== cat.id);
                          setGameSettings({ ...gameSettings, trial_team2_categories: updated });
                        }}
                        className="w-3.5 h-3.5 accent-blue-600"
                      />
                      {cat.icon || "🎯"} {cat.name}
                      {sel && <span className="text-[10px] text-blue-400 mr-auto">✓</span>}
                    </label>
                  );
                })}
              </div>
              <div className="text-[10px] text-primary/30 mt-1">{(gameSettings.trial_team2_categories || []).length}/3 مختارة</div>
            </div>

            <button
              data-testid="save-trial-settings-btn"
              onClick={saveSettings}
              className="w-full bg-primary text-secondary py-2.5 rounded-xl font-black hover:scale-[1.02] transition-all text-sm"
            >
              {settingsSaved ? "✓ تم الحفظ!" : "💾 حفظ الإعدادات"}
            </button>
          </div>

          {/* Right: Questions List */}
          <div className="flex-1 overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="font-black text-lg text-primary">أسئلة وضع التجربة</h3>
                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                  {expQuestions.filter(q => q.is_experimental).length} معلّمة
                </span>
              </div>
              <div className="flex gap-2">
                <select
                  value={expCatFilter}
                  onChange={(e) => { setExpCatFilter(e.target.value); }}
                  className="border border-primary/20 rounded-lg px-2 py-1 text-xs font-bold outline-none bg-white"
                >
                  <option value="all">كل الفئات</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select
                  value={expDiffFilter}
                  onChange={(e) => setExpDiffFilter(e.target.value)}
                  className="border border-primary/20 rounded-lg px-2 py-1 text-xs font-bold outline-none bg-white"
                >
                  <option value="all">كل الصعوبات</option>
                  <option value="300">300 - سهل</option>
                  <option value="600">600 - متوسط</option>
                  <option value="900">900 - صعب</option>
                </select>
                <button onClick={loadExpQuestions} className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-bold hover:bg-primary/20 transition-all">
                  تحديث
                </button>
              </div>
            </div>

            {/* Edit Form */}
            {expEditQ && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-4">
                <h4 className="font-black text-sm text-amber-700 mb-3">تعديل السؤال</h4>
                <div className="space-y-2">
                  <textarea
                    value={expForm.text}
                    onChange={(e) => setExpForm({ ...expForm, text: e.target.value })}
                    rows={2}
                    className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm font-bold outline-none resize-none"
                    placeholder="نص السؤال"
                  />
                  <div className="flex gap-2">
                    <input
                      value={expForm.answer}
                      onChange={(e) => setExpForm({ ...expForm, answer: e.target.value })}
                      className="flex-1 border border-amber-300 rounded-lg px-3 py-2 text-sm outline-none"
                      placeholder="الإجابة"
                    />
                    <select
                      value={expForm.difficulty}
                      onChange={(e) => setExpForm({ ...expForm, difficulty: parseInt(e.target.value) })}
                      className="border border-amber-300 rounded-lg px-2 py-2 text-sm outline-none bg-white font-bold"
                    >
                      <option value={300}>300</option>
                      <option value={600}>600</option>
                      <option value={900}>900</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSaveExpQ} className="flex-1 bg-amber-600 text-white py-2 rounded-lg text-sm font-black hover:bg-amber-700 transition-all">حفظ التعديل</button>
                    <button onClick={() => { setExpEditQ(null); setExpForm({ text: "", answer: "", difficulty: 300, image_url: "", answer_image_url: "" }); }} className="px-4 bg-primary/10 text-primary py-2 rounded-lg text-sm font-bold">إلغاء</button>
                  </div>
                </div>
              </div>
            )}

            {/* Questions List */}
            {expLoading ? (
              <div className="text-center py-12 text-primary/40 font-bold">جاري التحميل...</div>
            ) : (
              <div className="space-y-2">
                {expQuestions
                  .filter(q => expCatFilter === "all" || q.category_id === expCatFilter)
                  .filter(q => expDiffFilter === "all" || q.difficulty === parseInt(expDiffFilter))
                  .map(q => {
                    const cat = categories.find(c => c.id === q.category_id);
                    const diffColor = q.difficulty === 300 ? "text-green-600 bg-green-50" : q.difficulty === 600 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";
                    return (
                      <div
                        key={q.id}
                        data-testid={`exp-question-${q.id}`}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${q.is_experimental ? "border-green-300 bg-green-50/50" : "border-primary/10 bg-white hover:border-primary/20"}`}
                      >
                        {/* Experimental toggle */}
                        <button
                          title={q.is_experimental ? "إزالة من وضع التجربة" : "إضافة لوضع التجربة"}
                          onClick={() => handleToggleExp(q)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 transition-all ${q.is_experimental ? "bg-green-500 text-white shadow-md" : "bg-primary/10 text-primary/40 hover:bg-primary/20"}`}
                        >
                          {q.is_experimental ? "✓" : "○"}
                        </button>

                        {/* Question content */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-primary line-clamp-2 mb-0.5">{q.text}</div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-primary/50 bg-primary/5 px-1.5 py-0.5 rounded">{cat?.name || q.category_id}</span>
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${diffColor}`}>{q.difficulty}</span>
                            <span className="text-xs text-primary/50">الجواب: <span className="font-bold text-primary/70">{q.answer}</span></span>
                            {q.is_experimental && <span className="text-xs text-green-600 font-bold">✓ في التجربة</span>}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => { setExpEditQ(q); setExpForm({ text: q.text, answer: q.answer, difficulty: q.difficulty, image_url: q.image_url || "", answer_image_url: q.answer_image_url || "" }); }}
                            className="w-7 h-7 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center text-xs hover:bg-amber-200 transition-all"
                            title="تعديل"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => handleDeleteExpQ(q.id)}
                            className="w-7 h-7 bg-red-100 text-red-500 rounded-lg flex items-center justify-center text-xs hover:bg-red-200 transition-all"
                            title="حذف"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                {expQuestions.filter(q => expCatFilter === "all" || q.category_id === expCatFilter).filter(q => expDiffFilter === "all" || q.difficulty === parseInt(expDiffFilter)).length === 0 && (
                  <div className="text-center py-10 text-primary/30">
                    <div className="text-3xl mb-2">📭</div>
                    <div className="font-bold">لا توجد أسئلة</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Question Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-primary mb-4">
              {editingQuestion ? "تعديل السؤال" : "سؤال جديد"}
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-primary/70 mb-1 block">الفئة</label>
                  <select
                    data-testid="question-category-select"
                    value={form.category_id}
                    onChange={(e) => setForm(prev => ({ ...prev, category_id: e.target.value }))}
                    className="w-full border-2 border-primary/20 focus:border-primary rounded-xl px-3 py-2 text-sm outline-none bg-white"
                  >
                    <option value="">اختر فئة</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-primary/70 mb-1 block">الصعوبة</label>
                  <select
                    data-testid="question-difficulty-select"
                    value={form.difficulty}
                    onChange={(e) => setForm(prev => ({ ...prev, difficulty: parseInt(e.target.value) }))}
                    className="w-full border-2 border-primary/20 focus:border-primary rounded-xl px-3 py-2 text-sm outline-none bg-white"
                  >
                    <option value={300}>300 - سهل</option>
                    <option value={600}>600 - متوسط</option>
                    <option value={900}>900 - صعب</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-primary/70 mb-1 block">نوع السؤال</label>
                <select
                  data-testid="question-type-select"
                  value={form.question_type}
                  onChange={(e) => setForm(prev => ({ ...prev, question_type: e.target.value }))}
                  className="w-full border-2 border-primary/20 focus:border-primary rounded-xl px-3 py-2 text-sm outline-none bg-white"
                >
                  <option value="text">سؤال عادي</option>
                  <option value="secret_word">ولا كلمة (كلمة سرية)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-primary/70 mb-1 flex items-center justify-between">
                  <span>{form.question_type === "secret_word" ? "تعليمات" : "نص السؤال"}</span>
                  {autoSaveStatus === 'saving' && <span className="text-xs text-amber-500 font-normal">جاري الحفظ التلقائي...</span>}
                  {autoSaveStatus === 'saved' && <span className="text-xs text-green-500 font-normal">✓ تم الحفظ</span>}
                </label>
                <textarea
                  data-testid="question-text-input"
                  value={form.text}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm(prev => ({ ...prev, text: val }));
                    if (editingQuestion?.id) triggerAutoSave(editingQuestion.id, { text: val });
                  }}
                  placeholder={form.question_type === "secret_word" ? "وصّف هذي الكلمة لفريقك!" : "أدخل نص السؤال"}
                  rows={3}
                  className="w-full border-2 border-primary/20 focus:border-primary rounded-xl px-3 py-2 text-sm outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-primary/70 mb-1 block">
                  {form.question_type === "secret_word" ? "الكلمة السرية" : "الإجابة"}
                </label>
                <input
                  data-testid="question-answer-input"
                  value={form.answer}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm(prev => ({ ...prev, answer: val }));
                    if (editingQuestion?.id) triggerAutoSave(editingQuestion.id, { answer: val });
                  }}
                  placeholder={form.question_type === "secret_word" ? "الكلمة السرية" : "الإجابة الصحيحة"}
                  className="w-full border-2 border-primary/20 focus:border-primary rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>

              {/* Question Image Upload */}
              <div>
                <label className="text-sm font-bold text-primary/70 mb-1 block">صورة السؤال (اختياري)</label>
                <div className="flex gap-2 items-center">
                  <label className="cursor-pointer flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-2 rounded-xl text-sm font-bold transition-all border border-primary/20">
                    <span>📷 رفع صورة</span>
                    <input
                      data-testid="question-image-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => uploadImage(e.target.files[0], (url) => setForm(prev => ({ ...prev, image_url: url })))}
                    />
                  </label>
                  <input
                    data-testid="question-image-input"
                    value={form.image_url}
                    onChange={(e) => setForm(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="أو الصق الرابط هنا"
                    className="flex-1 border-2 border-primary/20 focus:border-primary rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
                {form.image_url && (
                  <img src={form.image_url} alt="" className="mt-2 h-16 object-contain rounded-lg" onError={(e) => e.target.style.display = "none"} />
                )}
              </div>

              {/* Answer Image Upload */}
              <div>
                <label className="text-sm font-bold text-primary/70 mb-1 block">صورة الإجابة (اختياري)</label>
                <div className="flex gap-2 items-center">
                  <label className="cursor-pointer flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-2 rounded-xl text-sm font-bold transition-all border border-primary/20">
                    <span>📷 رفع صورة</span>
                    <input
                      data-testid="question-answer-image-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => uploadImage(e.target.files[0], (url) => setForm(prev => ({ ...prev, answer_image_url: url })))}
                    />
                  </label>
                  <input
                    data-testid="question-answer-image-input"
                    value={form.answer_image_url}
                    onChange={(e) => setForm(prev => ({ ...prev, answer_image_url: e.target.value }))}
                    placeholder="أو الصق الرابط هنا"
                    className="flex-1 border-2 border-primary/20 focus:border-primary rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
                {form.answer_image_url && (
                  <img src={form.answer_image_url} alt="" className="mt-2 h-16 object-contain rounded-lg" onError={(e) => e.target.style.display = "none"} />
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                data-testid="save-question-btn"
                onClick={handleSaveQuestion}
                disabled={loading}
                className="flex-1 bg-primary text-secondary py-3 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50"
              >
                {loading ? "جاري الحفظ..." : "حفظ"}
              </button>
              <button
                data-testid="cancel-question-btn"
                onClick={() => { setShowForm(false); setEditingQuestion(null); }}
                className="flex-1 bg-primary/10 text-primary py-3 rounded-xl font-bold hover:bg-primary/20 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {/* ── GROUP FORM MODAL ── */}
      {showGroupForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs">
            <h3 className="text-xl font-black text-primary mb-4">{editingGroup ? "تعديل المجموعة" : "مجموعة فئات جديدة"}</h3>
            <div className="space-y-3">
              <input
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                placeholder="اسم المجموعة (مثل: علمي، رياضة)"
                className="w-full border-2 border-primary/20 focus:border-primary rounded-xl px-3 py-2 text-sm outline-none"
              />
              <input
                value={groupForm.icon}
                onChange={(e) => setGroupForm({ ...groupForm, icon: e.target.value })}
                placeholder="إيموجي (مثل: 🔬)"
                className="w-full border-2 border-primary/20 focus:border-primary rounded-xl px-3 py-2 text-sm outline-none"
              />
              <div>
                <label className="text-xs font-bold text-primary/60 mb-1 block">لون المجموعة</label>
                <input type="color" value={groupForm.color}
                  onChange={(e) => setGroupForm({ ...groupForm, color: e.target.value })}
                  className="w-full h-10 rounded-xl border-2 border-primary/20 cursor-pointer" />
              </div>
              <input type="number" value={groupForm.order}
                onChange={(e) => setGroupForm({ ...groupForm, order: parseInt(e.target.value) || 0 })}
                placeholder="الترتيب (رقم)"
                className="w-full border-2 border-primary/20 focus:border-primary rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSaveGroup} className="flex-1 bg-primary text-secondary py-2 rounded-xl font-bold text-sm">
                {editingGroup ? "تحديث" : "إضافة"}
              </button>
              <button onClick={() => { setShowGroupForm(false); setEditingGroup(null); setGroupForm({ name: "", icon: "", color: "#5B0E14", order: 0 }); }}
                className="flex-1 bg-primary/10 text-primary py-2 rounded-xl font-bold text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {showCatForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-primary mb-4">{editingCat ? "تعديل الفئة" : "فئة جديدة"}</h3>
            <div className="space-y-3">
              <input
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                placeholder="اسم الفئة"
                className="w-full border-2 border-primary/20 focus:border-primary rounded-xl px-3 py-2 text-sm outline-none"
              />
              <input
                value={catForm.icon}
                onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })}
                placeholder="إيموجي (مثل: 🎯)"
                className="w-full border-2 border-primary/20 focus:border-primary rounded-xl px-3 py-2 text-sm outline-none"
              />
              <input
                value={catForm.description}
                onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                placeholder="وصف الفئة (اختياري)"
                className="w-full border-2 border-primary/20 focus:border-primary rounded-xl px-3 py-2 text-sm outline-none"
              />
              {/* Group assignment */}
              <div>
                <label className="text-sm font-bold text-primary/70 mb-1 block">المجموعة</label>
                <select
                  value={catForm.group_id || ""}
                  onChange={(e) => setCatForm({ ...catForm, group_id: e.target.value || null })}
                  className="w-full border-2 border-primary/20 focus:border-primary rounded-xl px-3 py-2 text-sm outline-none bg-white"
                >
                  <option value="">بدون مجموعة</option>
                  {categoryGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.icon} {g.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-primary/70 mb-1 block">صورة الفئة</label>
                <div className="flex gap-2 items-center mb-2">
                  <label className="cursor-pointer flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-2 rounded-xl text-sm font-bold transition-all border border-primary/20">
                    <span>📷 رفع صورة</span>
                    <input
                      data-testid="cat-image-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => uploadImage(e.target.files[0], (url) => setCatForm({ ...catForm, image_url: url }))}
                    />
                  </label>
                  <input
                    value={catForm.image_url}
                    onChange={(e) => setCatForm({ ...catForm, image_url: e.target.value })}
                    placeholder="أو الصق الرابط"
                    className="flex-1 border-2 border-primary/20 focus:border-primary rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
                {catForm.image_url && (
                  <img src={catForm.image_url} alt="" className="mt-2 h-20 w-full object-cover rounded-xl" onError={(e) => e.target.style.display = "none"} />
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={catForm.is_special} onChange={(e) => setCatForm({ ...catForm, is_special: e.target.checked })} className="w-4 h-4" />
                <span className="text-sm font-bold text-primary/70">فئة خاصة (مثل ولا كلمة)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={catForm.is_premium} onChange={(e) => setCatForm({ ...catForm, is_premium: e.target.checked })} className="w-4 h-4" />
                <span className="text-sm font-bold text-yellow-700">⭐ فئة Premium (مقفولة للمجانيين)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input data-testid="cat-active-toggle" type="checkbox" checked={catForm.is_active !== false} onChange={(e) => setCatForm({ ...catForm, is_active: e.target.checked })} className="w-4 h-4" />
                <span className="text-sm font-bold text-green-700">✓ فئة مفعّلة (تظهر في اللعبة)</span>
              </label>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSaveCat} className="flex-1 bg-primary text-secondary py-2 rounded-xl font-bold">{editingCat ? "تحديث" : "حفظ"}</button>
              <button onClick={() => { setShowCatForm(false); setEditingCat(null); }} className="flex-1 bg-primary/10 text-primary py-2 rounded-xl font-bold">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
