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
  image_url: "", answer_image_url: "", audio_url: "", question_type: "text",
};

/* ═════════════════════════════════════════════════════════════════
   SECURITY DASHBOARD — Standalone component
   ═════════════════════════════════════════════════════════════════ */
function SecurityDashboard({ overview, users, sessions, suspicious, devices, loading,
  expandedUser, setExpandedUser, onLoad, onLoadDevices,
  onRevokeSession, onLock, onUnlock, onRemoveDevice, onClearLogs }) {

  const [tab, setTab] = useState("overview");

  useEffect(() => { if (!overview) onLoad(); }, []);

  const STATUS_BADGE = (u) => {
    if (u.is_locked)         return <span style={{ background:"#ef4444",color:"#fff",fontSize:"0.68rem",fontWeight:700,padding:"2px 8px",borderRadius:"9999px" }}>محظور</span>;
    if (u.suspicious_count > 3) return <span style={{ background:"#f59e0b",color:"#fff",fontSize:"0.68rem",fontWeight:700,padding:"2px 8px",borderRadius:"9999px" }}>مشبوه</span>;
    return <span style={{ background:"#10b981",color:"#fff",fontSize:"0.68rem",fontWeight:700,padding:"2px 8px",borderRadius:"9999px" }}>آمن</span>;
  };

  const STAT_CARD = ({ icon, label, value, color }) => (
    <div style={{ background:"rgba(255,255,255,0.07)",backdropFilter:"blur(10px)",borderRadius:"1rem",padding:"1.2rem 1.5rem",boxShadow:"0 8px 24px rgba(0,0,0,0.35)",border:"1px solid rgba(255,255,255,0.1)" }}>
      <div style={{ fontSize:"1.8rem",marginBottom:"0.4rem" }}>{icon}</div>
      <div style={{ fontSize:"2rem",fontWeight:900,color:color }}>{value ?? "—"}</div>
      <div style={{ fontSize:"0.78rem",color:"#e2e8f0",marginTop:"0.2rem" }}>{label}</div>
    </div>
  );

  return (
    <div style={{ padding:"1.5rem", minHeight:"70vh", fontFamily:"Cairo,sans-serif", color:"#e5e7eb" }}>
      {/* Header */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.5rem" }}>
        <h2 style={{ fontSize:"1.5rem",fontWeight:900,margin:0 }}>🛡 لوحة الأمان</h2>
        <button
          data-testid="security-refresh-btn"
          onClick={onLoad}
          disabled={loading}
          style={{ background:"rgba(59,130,246,0.18)",border:"1px solid rgba(59,130,246,0.4)",color:"#60a5fa",borderRadius:"0.75rem",padding:"0.5rem 1.2rem",cursor:"pointer",fontWeight:700,fontSize:"0.85rem" }}
        >
          {loading ? "⏳ تحميل..." : "↻ تحديث"}
        </button>
      </div>

      {/* Sub-tabs */}
      <div style={{ display:"flex",gap:"0.5rem",marginBottom:"1.5rem",flexWrap:"wrap" }}>
        {[
          { key:"overview",   label:"نظرة عامة" },
          { key:"users",      label:`المستخدمون (${users.length})` },
          { key:"sessions",   label:`الجلسات النشطة (${sessions.length})` },
          { key:"suspicious", label:`سجل المشبوهين (${suspicious.length})` },
        ].map(t => (
          <button
            key={t.key}
            data-testid={`sec-tab-${t.key}`}
            onClick={() => setTab(t.key)}
            style={{
              background: tab === t.key ? "#3b82f6" : "rgba(255,255,255,0.06)",
              border:`1px solid ${tab === t.key ? "#3b82f6" : "rgba(255,255,255,0.12)"}`,
              color: tab === t.key ? "#fff" : "rgba(229,231,235,0.7)",
              borderRadius:"0.75rem",padding:"0.45rem 1rem",cursor:"pointer",fontWeight:700,fontSize:"0.82rem",transition:"all 0.2s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div>
          {/* Security summary row */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"1rem", marginBottom:"1.5rem" }}>
            <STAT_CARD icon="🔐" label="محاولات دخول فاشلة" value={overview?.failed_logins_24h ?? 0} color="#ef4444" />
            <STAT_CARD icon="👥" label="جلسات نشطة" value={overview?.active_sessions ?? sessions.length} color="#10b981" />
            <STAT_CARD icon="📋" label="نشاط المدراء (7 أيام)" value={overview?.admin_actions_7d ?? 0} color="#3b82f6" />
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:"1rem",marginBottom:"1.5rem" }}>
            <STAT_CARD icon="👥" label="إجمالي المستخدمين" value={overview?.total_users}   color="#60a5fa" />
            <STAT_CARD icon="📱" label="الأجهزة المسجلة"   value={overview?.total_devices}  color="#a78bfa" />
            <STAT_CARD icon="🔗" label="الجلسات النشطة"    value={overview?.active_sessions} color="#34d399" />
            <STAT_CARD icon="⚠️" label="نشاط مشبوه (24س)"  value={overview?.suspicious_24h}  color="#fbbf24" />
            <STAT_CARD icon="🔒" label="حسابات محظورة"     value={overview?.locked_accounts} color="#f87171" />
          </div>
          <div style={{ background:"rgba(255,255,255,0.04)",borderRadius:"1rem",padding:"1.2rem",border:"1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontWeight:700,marginBottom:"0.75rem",color:"rgba(229,231,235,0.65)",fontSize:"0.8rem",textTransform:"uppercase",letterSpacing:"0.08em" }}>
              سياسة الحماية النشطة
            </div>
            {[
              { icon:"✅", text:"الحد الأقصى للأجهزة: 2 لكل مستخدم" },
              { icon:"✅", text:"الحد الأقصى للجلسات المتزامنة: 2" },
              { icon:"✅", text:"انتهاء الجلسة تلقائياً: 60 دقيقة من عدم النشاط" },
              { icon:"✅", text:"Rate Limiting: 10 محاولات/5 دقائق لكل IP" },
              { icon:"✅", text:"رصد تغيير الأجهزة السريع" },
              { icon:"✅", text:"قفل تلقائي عند >10 IPs مختلفة/ساعة" },
              { icon:"✅", text:"تنظيف سجلات الـ IP تلقائياً كل ساعتين" },
            ].map((p,i) => (
              <div key={i} style={{ display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.35rem 0",borderBottom:"1px solid rgba(255,255,255,0.05)",fontSize:"0.85rem" }}>
                <span>{p.icon}</span><span style={{ color:"rgba(229,231,235,0.8)" }}>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* USERS */}
      {tab === "users" && (
        <div style={{ display:"flex",flexDirection:"column",gap:"0.75rem" }}>
          {users.map(u => (
            <div key={u.id} style={{ background:"rgba(255,255,255,0.04)",borderRadius:"1rem",border:"1px solid rgba(255,255,255,0.08)",overflow:"hidden" }}>
              <div
                style={{ display:"flex",alignItems:"center",gap:"1rem",padding:"0.9rem 1.2rem",cursor:"pointer",flexWrap:"wrap" }}
                onClick={() => {
                  const next = expandedUser === u.id ? null : u.id;
                  setExpandedUser(next);
                  if (next && !devices[u.id]) onLoadDevices(u.id);
                }}
              >
                <div style={{ width:"36px",height:"36px",borderRadius:"50%",background:"rgba(59,130,246,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#60a5fa",fontSize:"1rem",flexShrink:0 }}>
                  {(u.username||"؟")[0].toUpperCase()}
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontWeight:700,color:"#e5e7eb",fontSize:"0.92rem" }}>{u.username || u.email}</div>
                  <div style={{ color:"rgba(229,231,235,0.45)",fontSize:"0.75rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{u.email}</div>
                </div>
                <div style={{ display:"flex",gap:"0.6rem",alignItems:"center",flexWrap:"wrap" }}>
                  {STATUS_BADGE(u)}
                  <span style={{ background:"rgba(167,139,250,0.15)",border:"1px solid rgba(167,139,250,0.3)",color:"#c4b5fd",fontSize:"0.72rem",fontWeight:700,padding:"2px 8px",borderRadius:"9999px" }}>📱 {u.device_count} أجهزة</span>
                  <span style={{ background:"rgba(52,211,153,0.12)",border:"1px solid rgba(52,211,153,0.3)",color:"#6ee7b7",fontSize:"0.72rem",fontWeight:700,padding:"2px 8px",borderRadius:"9999px" }}>🔗 {u.active_sessions} جلسات</span>
                  {u.suspicious_count > 0 && (
                    <span style={{ background:"rgba(251,191,36,0.12)",border:"1px solid rgba(251,191,36,0.3)",color:"#fcd34d",fontSize:"0.72rem",fontWeight:700,padding:"2px 8px",borderRadius:"9999px" }}>⚠ {u.suspicious_count} سجلات</span>
                  )}
                </div>
                <div style={{ display:"flex",gap:"0.4rem",flexShrink:0 }}>
                  {u.is_locked ? (
                    <button
                      data-testid={`unlock-user-${u.id}`}
                      onClick={e => { e.stopPropagation(); onUnlock(u.id); }}
                      style={{ background:"rgba(52,211,153,0.15)",border:"1px solid rgba(52,211,153,0.4)",color:"#34d399",borderRadius:"0.6rem",padding:"0.3rem 0.75rem",cursor:"pointer",fontSize:"0.75rem",fontWeight:700 }}
                    >فتح</button>
                  ) : (
                    <button
                      data-testid={`lock-user-${u.id}`}
                      onClick={e => { e.stopPropagation(); onLock(u.id); }}
                      style={{ background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.4)",color:"#f87171",borderRadius:"0.6rem",padding:"0.3rem 0.75rem",cursor:"pointer",fontSize:"0.75rem",fontWeight:700 }}
                    >قفل</button>
                  )}
                  {u.suspicious_count > 0 && (
                    <button
                      data-testid={`clear-logs-${u.id}`}
                      onClick={e => { e.stopPropagation(); onClearLogs(u.id); }}
                      style={{ background:"rgba(251,191,36,0.1)",border:"1px solid rgba(251,191,36,0.3)",color:"#fcd34d",borderRadius:"0.6rem",padding:"0.3rem 0.75rem",cursor:"pointer",fontSize:"0.75rem",fontWeight:700 }}
                    >مسح سجلات</button>
                  )}
                </div>
                <span style={{ color:"rgba(229,231,235,0.3)",marginLeft:"auto" }}>{expandedUser === u.id ? "▲" : "▼"}</span>
              </div>

              {/* Expanded: Devices list */}
              {expandedUser === u.id && (
                <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)",padding:"1rem 1.2rem",background:"rgba(0,0,0,0.2)" }}>
                  <div style={{ fontWeight:700,fontSize:"0.8rem",color:"rgba(229,231,235,0.5)",marginBottom:"0.6rem",textTransform:"uppercase",letterSpacing:"0.06em" }}>
                    الأجهزة المسجلة
                  </div>
                  {(devices[u.id] || []).length === 0 ? (
                    <div style={{ color:"rgba(229,231,235,0.3)",fontSize:"0.82rem" }}>لا توجد أجهزة مسجلة</div>
                  ) : (
                    <div style={{ display:"flex",flexDirection:"column",gap:"0.5rem" }}>
                      {(devices[u.id] || []).map(d => (
                        <div key={d.device_id} style={{ display:"flex",alignItems:"center",gap:"0.75rem",background:"rgba(255,255,255,0.03)",borderRadius:"0.75rem",padding:"0.6rem 0.9rem",border:"1px solid rgba(255,255,255,0.06)" }}>
                          <span style={{ fontSize:"1.3rem" }}>
                            {d.device_name?.includes("iPhone") ? "📱" : d.device_name?.includes("Android") ? "📱" : d.device_name?.includes("Mac") || d.device_name?.includes("Windows") ? "💻" : "🖥"}
                          </span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:700,fontSize:"0.85rem",color:"#e5e7eb" }}>{d.device_name}</div>
                            <div style={{ fontSize:"0.7rem",color:"rgba(229,231,235,0.4)" }}>
                              آخر دخول: {d.last_login ? new Date(d.last_login).toLocaleDateString("ar-SA") : "—"}
                              {" · "} IP: {d.last_ip || "—"}
                            </div>
                          </div>
                          <button
                            data-testid={`remove-device-${d.device_id}`}
                            onClick={() => onRemoveDevice(d.device_id, u.id)}
                            style={{ background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.35)",color:"#f87171",borderRadius:"0.6rem",padding:"0.25rem 0.65rem",cursor:"pointer",fontSize:"0.72rem",fontWeight:700 }}
                          >حذف</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {users.length === 0 && !loading && (
            <div style={{ textAlign:"center",padding:"3rem",color:"rgba(229,231,235,0.3)" }}>لا يوجد مستخدمون</div>
          )}
        </div>
      )}

      {/* SESSIONS */}
      {tab === "sessions" && (
        <div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:"0.83rem" }}>
              <thead>
                <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.1)" }}>
                  {["المستخدم","الجهاز","عنوان IP","بدأت","آخر نشاط",""].map((h,i) => (
                    <th key={i} style={{ padding:"0.6rem 0.8rem",textAlign:"right",color:"rgba(229,231,235,0.5)",fontWeight:700,fontSize:"0.75rem",textTransform:"uppercase",letterSpacing:"0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.session_id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding:"0.6rem 0.8rem" }}><div style={{ fontWeight:700 }}>{s.username || "؟"}</div><div style={{ fontSize:"0.7rem",color:"rgba(229,231,235,0.4)" }}>{s.email}</div></td>
                    <td style={{ padding:"0.6rem 0.8rem",color:"rgba(229,231,235,0.65)" }}>{s.device_id?.slice(0,8)}…</td>
                    <td style={{ padding:"0.6rem 0.8rem",fontFamily:"monospace",color:"#93c5fd",fontSize:"0.8rem" }}>{s.ip_address}</td>
                    <td style={{ padding:"0.6rem 0.8rem",color:"rgba(229,231,235,0.5)",fontSize:"0.78rem" }}>{s.created_at ? new Date(s.created_at).toLocaleString("ar-SA") : "—"}</td>
                    <td style={{ padding:"0.6rem 0.8rem",color:"rgba(229,231,235,0.5)",fontSize:"0.78rem" }}>{s.last_activity ? new Date(s.last_activity).toLocaleString("ar-SA") : "—"}</td>
                    <td style={{ padding:"0.6rem 0.8rem" }}>
                      <button
                        data-testid={`revoke-session-${s.session_id}`}
                        onClick={() => onRevokeSession(s.session_id)}
                        style={{ background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.4)",color:"#f87171",borderRadius:"0.6rem",padding:"0.3rem 0.75rem",cursor:"pointer",fontSize:"0.75rem",fontWeight:700 }}
                      >إلغاء</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sessions.length === 0 && <div style={{ textAlign:"center",padding:"2rem",color:"rgba(229,231,235,0.3)" }}>لا توجد جلسات نشطة</div>}
          </div>
        </div>
      )}

      {/* SUSPICIOUS */}
      {tab === "suspicious" && (
        <div style={{ display:"flex",flexDirection:"column",gap:"0.6rem" }}>
          {suspicious.map((s,i) => {
            const isHigh = ["auto_lock_too_many_ips","device_limit_exceeded"].includes(s.event_type);
            const isMed  = ["many_ips_flagged","rapid_device_switch"].includes(s.event_type);
            const bgColor = isHigh ? "rgba(239,68,68,0.08)" : isMed ? "rgba(251,191,36,0.06)" : "rgba(255,255,255,0.03)";
            const bdColor = isHigh ? "rgba(239,68,68,0.25)" : isMed ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.07)";
            return (
              <div key={i} style={{ background:bgColor,border:`1px solid ${bdColor}`,borderRadius:"0.9rem",padding:"0.8rem 1rem",display:"flex",alignItems:"flex-start",gap:"0.9rem" }}>
                <span style={{ fontSize:"1.1rem",flexShrink:0 }}>{isHigh ? "🔴" : isMed ? "🟡" : "⚪"}</span>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:"flex",gap:"0.6rem",alignItems:"center",flexWrap:"wrap",marginBottom:"0.3rem" }}>
                    <span style={{ fontWeight:700,color:"#e5e7eb",fontSize:"0.88rem" }}>{s.username || s.user_id?.slice(0,8)}</span>
                    <span style={{ background: isHigh?"rgba(239,68,68,0.15)":isMed?"rgba(251,191,36,0.12)":"rgba(255,255,255,0.05)",
                                    border:`1px solid ${isHigh?"rgba(239,68,68,0.3)":isMed?"rgba(251,191,36,0.25)":"rgba(255,255,255,0.1)"}`,
                                    color: isHigh?"#fca5a5":isMed?"#fcd34d":"rgba(229,231,235,0.6)",
                                    borderRadius:"9999px",padding:"2px 8px",fontSize:"0.7rem",fontWeight:700 }}>
                      {s.event_type}
                    </span>
                    <span style={{ color:"rgba(229,231,235,0.3)",fontSize:"0.72rem",marginLeft:"auto" }}>
                      {s.created_at ? new Date(s.created_at).toLocaleString("ar-SA") : ""}
                    </span>
                  </div>
                  <div style={{ fontSize:"0.75rem",color:"rgba(229,231,235,0.45)",fontFamily:"monospace" }}>
                    {JSON.stringify(s.data)}
                  </div>
                </div>
              </div>
            );
          })}
          {suspicious.length === 0 && <div style={{ textAlign:"center",padding:"3rem",color:"rgba(229,231,235,0.3)" }}>لا يوجد نشاط مشبوه</div>}
        </div>
      )}
    </div>
  );
}

/* ── PendingQuestionCard — standalone component to avoid stale-closure ── */
function PendingQuestionCard({ q, i, categories, headers, onApprove, onReject, onUpdate, selected, onToggleSelect }) {
  const diffColor = q.difficulty === 300 ? "green" : q.difficulty === 600 ? "amber" : "red";
  const diffLabel = q.difficulty === 300 ? "سهل" : q.difficulty === 600 ? "متوسط" : "صعب";
  const cat = categories.find(c => c.id === q.category_id);
  const [editImg, setEditImg] = useState(false);
  const [editAnsImg, setEditAnsImg] = useState(false);
  const [tmpImg, setTmpImg] = useState(q.image_url || "");
  const [tmpAnsImg, setTmpAnsImg] = useState(q.answer_image_url || "");
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [localQ, setLocalQ] = useState({ text: q.text, answer: q.answer, difficulty: q.difficulty, category_id: q.category_id });

  const saveField = async (field, val) => {
    setSaving(true);
    try {
      await axios.patch(`${API}/admin/questions/pending/${q.id}`, { [field]: val }, { headers });
      onUpdate(q.id, { [field]: val });
      toast.success("تم الحفظ");
    } catch { toast.error("خطأ في الحفظ"); }
    finally { setSaving(false); }
  };

  const saveEditMode = async () => {
    setSaving(true);
    try {
      await axios.patch(`${API}/admin/questions/pending/${q.id}`, localQ, { headers });
      onUpdate(q.id, localQ);
      toast.success("تم الحفظ");
      setEditMode(false);
    } catch { toast.error("خطأ في الحفظ"); }
    finally { setSaving(false); }
  };

  return (
    <div
      data-testid={`pending-q-${i}`}
      className={`bg-white border rounded-2xl overflow-hidden border-${diffColor}-200`}
      style={{ outline: selected ? "2px solid #3b82f6" : "none" }}
    >
      <div className={`h-1 w-full bg-${diffColor}-400`} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Checkbox */}
          <div className="pt-1 shrink-0">
            <input
              type="checkbox"
              checked={!!selected}
              onChange={() => onToggleSelect && onToggleSelect(q.id)}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
          </div>
          {/* Left: content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-[11px] font-black px-2 py-0.5 rounded-full bg-${diffColor}-100 text-${diffColor}-800`}>
                {diffLabel} · {q.difficulty}
              </span>
              {cat && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary/60 font-bold">
                  {cat.icon} {cat.name}
                </span>
              )}
              <button
                onClick={() => { setLocalQ({ text: q.text, answer: q.answer, difficulty: q.difficulty, category_id: q.category_id }); setEditMode(!editMode); }}
                style={{ fontSize: "0.75rem", color: "#6366f1", border: "1px solid #c7d2fe", borderRadius: "0.4rem", padding: "1px 8px", background: "transparent", cursor: "pointer", fontFamily: "Cairo,sans-serif", fontWeight: 700 }}
              >
                {editMode ? "✕ إلغاء التعديل" : "✏️ تعديل"}
              </button>
            </div>

            {editMode ? (
              <div style={{ marginBottom: "0.75rem" }}>
                <textarea
                  value={localQ.text}
                  onChange={e => setLocalQ(p => ({ ...p, text: e.target.value }))}
                  rows={3}
                  style={{ width: "100%", border: "2px solid #6366f1", borderRadius: "0.5rem", padding: "0.4rem 0.6rem", fontSize: "0.9rem", fontFamily: "Cairo,sans-serif", outline: "none", resize: "vertical", marginBottom: "0.4rem" }}
                  placeholder="نص السؤال..."
                />
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input
                    value={localQ.answer}
                    onChange={e => setLocalQ(p => ({ ...p, answer: e.target.value }))}
                    placeholder="الإجابة..."
                    style={{ flex: 1, border: "2px solid #6366f1", borderRadius: "0.5rem", padding: "0.4rem 0.6rem", fontSize: "0.85rem", fontFamily: "Cairo,sans-serif", outline: "none" }}
                  />
                  <select
                    value={localQ.difficulty}
                    onChange={e => setLocalQ(p => ({ ...p, difficulty: parseInt(e.target.value) }))}
                    style={{ border: "2px solid #6366f1", borderRadius: "0.5rem", padding: "0.4rem 0.6rem", fontSize: "0.85rem", fontFamily: "Cairo,sans-serif", outline: "none" }}
                  >
                    <option value={300}>300 - سهل</option>
                    <option value={600}>600 - متوسط</option>
                    <option value={900}>900 - صعب</option>
                  </select>
                  <select
                    value={localQ.category_id || ""}
                    onChange={e => setLocalQ(p => ({ ...p, category_id: e.target.value }))}
                    style={{ border: "2px solid #6366f1", borderRadius: "0.5rem", padding: "0.4rem 0.6rem", fontSize: "0.85rem", fontFamily: "Cairo,sans-serif", outline: "none", maxWidth: "160px" }}
                  >
                    <option value="">-- الفئة --</option>
                    {(categories || []).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={saveEditMode}
                    disabled={saving}
                    style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.4rem 1rem", fontWeight: 700, cursor: "pointer", fontFamily: "Cairo,sans-serif", opacity: saving ? 0.6 : 1 }}
                  >
                    {saving ? "..." : "حفظ"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="font-bold text-primary mb-1">{q.text}</div>
                <div className="text-sm text-primary/60 mb-3">
                  الإجابة: <span className="font-black text-primary">{q.answer}</span>
                </div>
              </>
            )}

            {/* Images row */}
            <div className="flex gap-3 flex-wrap">
              {/* Question Image */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-black text-primary/50">صورة السؤال</span>
                {q.image_url && !editImg ? (
                  <div className="flex flex-col gap-2">
                    <div className="rounded-xl overflow-hidden border border-primary/15 bg-black/10" style={{ maxHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <img
                        src={q.image_url}
                        alt="سؤال"
                        style={{ maxHeight: "200px", maxWidth: "100%", objectFit: "contain", display: "block" }}
                        onError={e => e.target.parentElement.style.display = "none"}
                      />
                    </div>
                    <button
                      onClick={() => { setTmpImg(q.image_url || ""); setEditImg(true); }}
                      className="text-xs text-primary/50 hover:text-primary border border-primary/20 px-2 py-1 rounded-lg transition-all self-start"
                    >
                      تغيير
                    </button>
                  </div>
                ) : editImg ? (
                  <div className="flex gap-1.5 items-center">
                    <input
                      data-testid={`pending-q-img-input-${q.id}`}
                      value={tmpImg}
                      onChange={e => setTmpImg(e.target.value)}
                      placeholder="رابط الصورة..."
                      className="border border-primary/20 rounded-lg px-2 py-1 text-xs outline-none w-40"
                    />
                    <button
                      onClick={() => { saveField("image_url", tmpImg); setEditImg(false); }}
                      disabled={saving}
                      className="text-xs bg-green-600 text-white px-2 py-1 rounded-lg font-black disabled:opacity-50"
                    >✓</button>
                    <button onClick={() => setEditImg(false)} className="text-xs text-primary/50 px-1">✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setTmpImg(""); setEditImg(true); }}
                    className="text-xs text-primary/40 border border-dashed border-primary/20 px-3 py-1.5 rounded-lg hover:border-primary/40 transition-all"
                  >
                    + إضافة صورة
                  </button>
                )}
              </div>

              {/* Answer Image */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-black text-primary/50">صورة الإجابة</span>
                {q.answer_image_url && !editAnsImg ? (
                  <div className="flex flex-col gap-2">
                    <div className="rounded-xl overflow-hidden border border-blue-200/30 bg-black/10" style={{ maxHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <img
                        src={q.answer_image_url}
                        alt="إجابة"
                        style={{ maxHeight: "200px", maxWidth: "100%", objectFit: "contain", display: "block" }}
                        onError={e => e.target.parentElement.style.display = "none"}
                      />
                    </div>
                    <button
                      onClick={() => { setTmpAnsImg(q.answer_image_url || ""); setEditAnsImg(true); }}
                      className="text-xs text-primary/50 hover:text-primary border border-primary/20 px-2 py-1 rounded-lg transition-all self-start"
                    >
                      تغيير
                    </button>
                  </div>
                ) : editAnsImg ? (
                  <div className="flex gap-1.5 items-center">
                    <input
                      data-testid={`pending-q-ans-img-input-${q.id}`}
                      value={tmpAnsImg}
                      onChange={e => setTmpAnsImg(e.target.value)}
                      placeholder="رابط صورة الإجابة..."
                      className="border border-blue-200 rounded-lg px-2 py-1 text-xs outline-none w-40"
                    />
                    <button
                      onClick={() => { saveField("answer_image_url", tmpAnsImg); setEditAnsImg(false); }}
                      disabled={saving}
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded-lg font-black disabled:opacity-50"
                    >✓</button>
                    <button onClick={() => setEditAnsImg(false)} className="text-xs text-primary/50 px-1">✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setTmpAnsImg(""); setEditAnsImg(true); }}
                    className="text-xs text-primary/40 border border-dashed border-blue-200 px-3 py-1.5 rounded-lg hover:border-blue-400 transition-all"
                  >
                    + إضافة صورة إجابة
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex flex-col gap-2 shrink-0">
            <button
              data-testid={`approve-q-${q.id}`}
              onClick={() => onApprove(q.id)}
              className="bg-green-600 text-white px-4 py-2 rounded-xl font-black text-sm hover:bg-green-700 transition-all whitespace-nowrap"
            >
              ✓ نشر
            </button>
            <button
              data-testid={`reject-q-${q.id}`}
              onClick={() => onReject(q.id)}
              className="bg-red-100 text-red-600 px-4 py-2 rounded-xl font-black text-sm hover:bg-red-200 transition-all whitespace-nowrap"
            >
              ✕ رفض
            </button>
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
  const [selectedPending, setSelectedPending] = useState(new Set());
  const [pendingFilter, setPendingFilter] = useState({ search: "", difficulty: "all", category: "all" });

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
      // أعد تحميل الأسئلة حتى تظهر في تاب الأسئلة فوراً
      axios.get(`${API}/questions`).then(r => setQuestions(r.data)).catch(() => {});
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
      const { data: qs } = await axios.get(`${API}/questions`);
      setQuestions(qs);
    } catch { toast.error("خطأ في الموافقة الجماعية"); }
  };

  const handleBulkAction = async (action) => {
    if (selectedPending.size === 0) return;
    const ids = [...selectedPending];
    try {
      const { data } = await axios.post(`${API}/admin/questions/pending/bulk`, { action, ids }, { headers });
      toast.success(data.message);
      setPendingQuestions(prev => prev.filter(q => !selectedPending.has(q.id)));
      setPendingTotal(t => t - ids.length);
      setSelectedPending(new Set());
    } catch { toast.error("خطأ في العملية"); }
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

  const [audioUploading, setAudioUploading] = useState(false);
  const uploadAudio = async (file, onSuccess) => {
    if (!file) return;
    const allowed = ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/mp4", "audio/ogg"];
    if (!allowed.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|ogg)$/i)) {
      toast.error("يُسمح فقط بـ MP3 / WAV / M4A");
      return;
    }
    setAudioUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await axios.post(`${API}/upload/audio`, fd, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      onSuccess(data.url);
      toast.success("تم رفع الملف الصوتي!");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "خطأ في رفع الملف الصوتي");
    } finally {
      setAudioUploading(false);
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

  const filteredQuestions = questions.filter((q) => {
    const catMatch = selectedCat ? q.category_id === selectedCat : true;
    const diffMatch = selectedDifficulty === "all" ? true : q.difficulty === parseInt(selectedDifficulty);
    return catMatch && diffMatch;
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
      <style>{`
        .admin-card {
          background: white;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 1rem;
          padding: 1.25rem 1.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          transition: box-shadow 0.2s;
        }
        .admin-card:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        .admin-kpi {
          background: linear-gradient(135deg, #fefefe, #f8f9fa);
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 1rem;
          padding: 1.2rem 1.4rem;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }
        .admin-kpi-value {
          font-size: 2.2rem;
          font-weight: 900;
          line-height: 1;
          margin-bottom: 0.3rem;
        }
        .admin-kpi-label {
          font-size: 0.8rem;
          color: rgba(0,0,0,0.5);
          font-weight: 700;
        }
        .admin-kpi-sub {
          font-size: 0.72rem;
          color: rgba(0,0,0,0.35);
          margin-top: 0.2rem;
        }
        .bulk-action-bar {
          animation: slideDown 0.2s ease;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
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
            { key: "community", label: "🏛️ المجتمع", superOnly: true },
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
                className={`text-sm px-3 py-1 rounded-lg font-bold tracking-wide transition-all ${activeTab === tab.key ? "bg-secondary text-primary" : "text-secondary/60 hover:text-secondary"}`}
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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
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
        <div style={{ background: "linear-gradient(160deg,#0f172a,#1e1b4b)", minHeight: "70vh", borderRadius: "1rem", margin: "0.5rem" }}>
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
      {activeTab === "analytics" && (
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black">الإحصاءات</h2>
            {isSuperAdmin && (
              <a
                data-testid="export-db-btn"
                href={`${API}/admin/export-db`}
                download="hujjah_db_export.zip"
                onClick={e => {
                  e.preventDefault();
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
                className="flex items-center gap-2 bg-primary text-secondary px-5 py-2.5 rounded-xl font-black text-sm hover:scale-[1.02] transition-all shadow-md cursor-pointer"
              >
                <span>💾</span>
                <span>تصدير قاعدة البيانات</span>
              </a>
            )}
          </div>
          {!analytics ? (
            <div className="text-center py-16 text-primary/30">جاري التحميل...</div>
          ) : (
            <div className="space-y-6">
              {/* ── KPI Grid ── */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:"1rem" }}>
                <div className="admin-kpi">
                  <div className="admin-kpi-value" style={{ color:"#2563eb" }}>{analytics.users.total}</div>
                  <div className="admin-kpi-label">إجمالي المستخدمين</div>
                  <div className="admin-kpi-sub">{analytics.users.recent_7d} مسجّل هذا الأسبوع</div>
                </div>
                <div className="admin-kpi">
                  <div className="admin-kpi-value" style={{ color:"#d97706" }}>{analytics.users.premium}</div>
                  <div className="admin-kpi-label">المشتركون المميزون</div>
                  <div className="admin-kpi-sub">{analytics.users.free} مستخدم مجاني</div>
                </div>
                <div className="admin-kpi">
                  <div className="admin-kpi-value" style={{ color:"#059669" }}>{analytics.users.active_24h ?? analytics.sessions?.active_24h ?? 0}</div>
                  <div className="admin-kpi-label">نشطون اليوم</div>
                  <div className="admin-kpi-sub">{analytics.users.active_7d ?? 0} نشط خلال 7 أيام</div>
                </div>
                <div className="admin-kpi">
                  <div className="admin-kpi-value" style={{ color:"#7c3aed" }}>{analytics.users.conversion_rate ?? 0}%</div>
                  <div className="admin-kpi-label">معدل التحويل</div>
                  <div className="admin-kpi-sub">مجاني → مميز</div>
                </div>
              </div>

              {/* ── Revenue Section ── */}
              <div className="admin-card">
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", flexWrap:"wrap" }}>
                  <div>
                    <div style={{ fontSize:"0.75rem", fontWeight:700, color:"rgba(0,0,0,0.4)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.4rem" }}>إجمالي الإيرادات</div>
                    <div style={{ fontSize:"2.5rem", fontWeight:900, color:"#f1e194", WebkitTextStroke:"1px #92681e" }}>{analytics.revenue.total} <span style={{ fontSize:"1.2rem" }}>{analytics.revenue.currency}</span></div>
                  </div>
                  {analytics.subscriptions && (
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontSize:"0.75rem", fontWeight:700, color:"rgba(0,0,0,0.4)", marginBottom:"0.4rem" }}>الاشتراكات</div>
                      <div style={{ display:"flex", gap:"0.75rem" }}>
                        <div style={{ background:"#dcfce7", borderRadius:"0.5rem", padding:"0.4rem 0.75rem", textAlign:"center" }}>
                          <div style={{ fontWeight:900, fontSize:"1.3rem", color:"#16a34a" }}>{analytics.subscriptions.active}</div>
                          <div style={{ fontSize:"0.7rem", color:"#15803d" }}>نشطة</div>
                        </div>
                        <div style={{ background:"#fee2e2", borderRadius:"0.5rem", padding:"0.4rem 0.75rem", textAlign:"center" }}>
                          <div style={{ fontWeight:900, fontSize:"1.3rem", color:"#dc2626" }}>{analytics.subscriptions.expired}</div>
                          <div style={{ fontSize:"0.7rem", color:"#b91c1c" }}>منتهية</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 30-day revenue trend bar chart */}
                {analytics.revenue.trend_30d?.length > 0 && (() => {
                  const maxAmount = Math.max(...analytics.revenue.trend_30d.map(d => d.amount), 1);
                  return (
                    <div style={{ marginTop:"1.2rem" }}>
                      <div style={{ fontSize:"0.75rem", fontWeight:700, color:"rgba(0,0,0,0.4)", marginBottom:"0.5rem" }}>اتجاه الإيرادات — 30 يوماً</div>
                      <div style={{ display:"flex", alignItems:"flex-end", gap:"3px", height:"70px" }}>
                        {analytics.revenue.trend_30d.map((d, i) => (
                          <div key={i} title={`${d.date}: ${d.amount} SAR`} style={{
                            flex:1, background: d.amount > 0 ? "rgba(241,225,148,0.8)" : "rgba(0,0,0,0.06)",
                            height:`${Math.max(4, (d.amount / maxAmount) * 100)}%`,
                            borderRadius:"3px 3px 0 0", transition:"height 0.3s"
                          }} />
                        ))}
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.65rem", color:"rgba(0,0,0,0.3)", marginTop:"0.25rem" }}>
                        <span>{analytics.revenue.trend_30d[0]?.date}</span>
                        <span>{analytics.revenue.trend_30d[analytics.revenue.trend_30d.length-1]?.date}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Recent transactions */}
                {analytics.revenue.recent_transactions?.length > 0 && (
                  <div style={{ marginTop:"1rem" }}>
                    <div style={{ fontSize:"0.75rem", fontWeight:700, color:"rgba(0,0,0,0.4)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"0.5rem" }}>آخر المعاملات</div>
                    {analytics.revenue.recent_transactions.map((txn, i) => (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.4rem 0", borderBottom:"1px solid rgba(0,0,0,0.04)", fontSize:"0.85rem" }}>
                        <span style={{ color:"rgba(0,0,0,0.55)" }}>{txn.email || txn.gifted_by || "—"}</span>
                        <span style={{ fontWeight:700, color: txn.payment_status === "paid" ? "#16a34a" : txn.payment_status === "gift" ? "#d97706" : "#dc2626" }}>
                          {txn.payment_status === "gift" ? "هدية" : `${txn.amount} ${txn.currency || ""}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── User Activity Row ── */}
              <div className="admin-card">
                <div style={{ fontWeight:700, marginBottom:"0.75rem", fontSize:"0.85rem", color:"rgba(0,0,0,0.5)", textTransform:"uppercase", letterSpacing:"0.06em" }}>نشاط المستخدمين</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"0.75rem" }}>
                  {[
                    { label:"نشط آخر 24 ساعة", value: analytics.users.active_24h ?? 0, color:"#059669" },
                    { label:"نشط آخر 7 أيام", value: analytics.users.active_7d ?? 0, color:"#2563eb" },
                    { label:"نشط آخر 30 يوم", value: analytics.users.active_30d ?? 0, color:"#7c3aed" },
                  ].map(item => (
                    <div key={item.label} style={{ background:"rgba(0,0,0,0.03)", borderRadius:"0.75rem", padding:"0.75rem 1rem", textAlign:"center" }}>
                      <div style={{ fontSize:"1.8rem", fontWeight:900, color:item.color }}>{item.value}</div>
                      <div style={{ fontSize:"0.72rem", color:"rgba(0,0,0,0.45)", fontWeight:700, marginTop:"0.2rem" }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Questions Breakdown ── */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
                {/* By category */}
                <div className="admin-card">
                  <div style={{ fontWeight:700, marginBottom:"0.75rem", fontSize:"0.85rem" }}>الأسئلة بالفئات</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                    {analytics.questions.by_category.map((cat) => {
                      const maxCat = Math.max(...analytics.questions.by_category.map(c => c.count), 1);
                      return (
                        <div key={cat.id} style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                          <span style={{ fontSize:"0.8rem", color:"rgba(0,0,0,0.6)", width:"8rem", flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{cat.name}</span>
                          <div style={{ flex:1, background:"rgba(0,0,0,0.07)", borderRadius:"9999px", height:"8px", overflow:"hidden" }}>
                            <div style={{ width:`${Math.min(100,(cat.count/maxCat)*100)}%`, height:"100%", background:"#5B0E14", borderRadius:"9999px" }} />
                          </div>
                          <span style={{ fontSize:"0.75rem", fontWeight:900, color:"rgba(0,0,0,0.45)", width:"2rem", textAlign:"left" }}>{cat.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* By difficulty */}
                <div className="admin-card">
                  <div style={{ fontWeight:700, marginBottom:"0.75rem", fontSize:"0.85rem" }}>الأسئلة بالصعوبة</div>
                  {analytics.questions.by_difficulty ? (
                    <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
                      {[
                        { label:"سهل (300)", count: analytics.questions.by_difficulty["300"], color:"#16a34a", bg:"#dcfce7" },
                        { label:"متوسط (600)", count: analytics.questions.by_difficulty["600"], color:"#d97706", bg:"#fef3c7" },
                        { label:"صعب (900)", count: analytics.questions.by_difficulty["900"], color:"#dc2626", bg:"#fee2e2" },
                      ].map(item => {
                        const maxDiff = Math.max(analytics.questions.by_difficulty["300"]||0, analytics.questions.by_difficulty["600"]||0, analytics.questions.by_difficulty["900"]||0, 1);
                        return (
                          <div key={item.label}>
                            <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.8rem", marginBottom:"0.2rem" }}>
                              <span style={{ fontWeight:700, color:item.color }}>{item.label}</span>
                              <span style={{ fontWeight:900 }}>{item.count ?? 0}</span>
                            </div>
                            <div style={{ background:"rgba(0,0,0,0.07)", borderRadius:"9999px", height:"10px", overflow:"hidden" }}>
                              <div style={{ width:`${Math.min(100,((item.count||0)/maxDiff)*100)}%`, height:"100%", background:item.color, borderRadius:"9999px", transition:"width 0.4s" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ color:"rgba(0,0,0,0.3)", fontSize:"0.85rem" }}>لا توجد بيانات</div>
                  )}

                  {/* Subscriptions bar */}
                  {analytics.subscriptions && (
                    <div style={{ marginTop:"1.5rem" }}>
                      <div style={{ fontWeight:700, marginBottom:"0.5rem", fontSize:"0.85rem" }}>الاشتراكات</div>
                      {(() => {
                        const total = (analytics.subscriptions.active || 0) + (analytics.subscriptions.expired || 0);
                        const pct = total > 0 ? Math.round((analytics.subscriptions.active / total) * 100) : 0;
                        return (
                          <>
                            <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.75rem", marginBottom:"0.3rem" }}>
                              <span style={{ color:"#16a34a", fontWeight:700 }}>نشطة: {analytics.subscriptions.active}</span>
                              <span style={{ color:"#dc2626", fontWeight:700 }}>منتهية: {analytics.subscriptions.expired}</span>
                            </div>
                            <div style={{ background:"#fee2e2", borderRadius:"9999px", height:"12px", overflow:"hidden" }}>
                              <div style={{ width:`${pct}%`, height:"100%", background:"#16a34a", borderRadius:"9999px", transition:"width 0.4s" }} />
                            </div>
                            <div style={{ fontSize:"0.7rem", color:"rgba(0,0,0,0.4)", marginTop:"0.2rem", textAlign:"center" }}>{pct}% نشطة</div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Categories Stats ── */}
              {analytics.categories && (
                <div className="admin-card">
                  <div style={{ fontWeight:700, marginBottom:"0.75rem", fontSize:"0.85rem" }}>الفئات</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:"0.75rem" }}>
                    {[
                      { label: "إجمالي الفئات", value: analytics.categories.total, color:"#2563eb" },
                      { label: "الفئات النشطة", value: analytics.categories.active, color:"#059669" },
                      { label: "الفئات المعطّلة", value: analytics.categories.inactive, color:"#dc2626" },
                      { label: "الفئات المميزة", value: analytics.categories.premium, color:"#d97706" },
                    ].map((kpi) => (
                      <div key={kpi.label} style={{ background:"rgba(0,0,0,0.03)", borderRadius:"0.75rem", padding:"0.75rem", textAlign:"center" }}>
                        <div style={{ fontSize:"1.6rem", fontWeight:900, color:kpi.color }}>{kpi.value}</div>
                        <div style={{ fontSize:"0.72rem", color:"rgba(0,0,0,0.45)", fontWeight:700, marginTop:"0.2rem" }}>{kpi.label}</div>
                      </div>
                    ))}
                  </div>
                  {analytics.categories?.most_popular?.name && (
                    <div style={{ marginTop:"1rem", background:"#fefce8", border:"1px solid #fde68a", borderRadius:"0.75rem", padding:"0.75rem 1rem", display:"flex", alignItems:"center", gap:"0.75rem" }}>
                      <span style={{ fontSize:"1.5rem" }}>🏆</span>
                      <div>
                        <div style={{ fontSize:"0.7rem", fontWeight:700, color:"#92400e", textTransform:"uppercase", letterSpacing:"0.06em" }}>الفئة الأكثر أسئلة</div>
                        <div style={{ fontWeight:900, fontSize:"1.05rem", color:"#78350f" }}>{analytics.categories.most_popular.name}</div>
                        <div style={{ fontSize:"0.75rem", color:"#a16207" }}>{analytics.categories.most_popular.count} سؤال</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

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

          {/* Send Welcome Emails */}
          <div className="bg-white border border-primary/10 rounded-2xl p-6 mt-6">
            <h3 className="font-black text-lg mb-1">إيميل الترحيب</h3>
            <p className="text-primary/50 text-sm mb-4">إرسال إيميل ترحيب لجميع المستخدمين المسجلين</p>
            <button
              onClick={async () => {
                if (!window.confirm("تأكيد: إرسال إيميل ترحيب لجميع المستخدمين؟")) return;
                try {
                  const res = await fetch(`${API}/admin/send-welcome-emails`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    toast.error(`خطأ: ${data.detail || res.status}`);
                    return;
                  }
                  toast.success(`✓ أُرسل: ${data.sent} | فشل: ${data.failed}`);
                } catch {
                  toast.error("حدث خطأ أثناء الإرسال");
                }
              }}
              className="w-full bg-primary text-secondary py-3 rounded-xl font-black text-lg hover:scale-[1.02] transition-all"
            >
              📧 إرسال إيميل ترحيب للكل
            </button>
          </div>

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
          ) : (() => {
            const filteredPending = pendingQuestions.filter(q => {
              const searchMatch = !pendingFilter.search || q.text?.includes(pendingFilter.search) || q.answer?.includes(pendingFilter.search);
              const diffMatch = pendingFilter.difficulty === "all" || String(q.difficulty) === pendingFilter.difficulty;
              const catMatch = pendingFilter.category === "all" || q.category_id === pendingFilter.category;
              return searchMatch && diffMatch && catMatch;
            });
            return (
            <>
              {/* Filter bar */}
              <div style={{ display:"flex", gap:"0.75rem", marginBottom:"1rem", flexWrap:"wrap", alignItems:"center" }}>
                <input
                  placeholder="بحث في الأسئلة..."
                  value={pendingFilter.search}
                  onChange={e => setPendingFilter(p => ({...p, search: e.target.value}))}
                  style={{ border:"1px solid rgba(0,0,0,0.15)", borderRadius:"0.5rem", padding:"0.4rem 0.75rem", fontSize:"0.85rem", outline:"none", minWidth:"180px", fontFamily:"Cairo,sans-serif" }}
                />
                <select value={pendingFilter.difficulty} onChange={e => setPendingFilter(p => ({...p, difficulty: e.target.value}))}
                  style={{ border:"1px solid rgba(0,0,0,0.15)", borderRadius:"0.5rem", padding:"0.4rem 0.75rem", fontSize:"0.85rem", fontFamily:"Cairo,sans-serif" }}>
                  <option value="all">كل الصعوبات</option>
                  <option value="300">سهل (300)</option>
                  <option value="600">متوسط (600)</option>
                  <option value="900">صعب (900)</option>
                </select>
                <select value={pendingFilter.category} onChange={e => setPendingFilter(p => ({...p, category: e.target.value}))}
                  style={{ border:"1px solid rgba(0,0,0,0.15)", borderRadius:"0.5rem", padding:"0.4rem 0.75rem", fontSize:"0.85rem", fontFamily:"Cairo,sans-serif" }}>
                  <option value="all">كل الفئات</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {(pendingFilter.search || pendingFilter.difficulty !== "all" || pendingFilter.category !== "all") && (
                  <button onClick={() => setPendingFilter({ search:"", difficulty:"all", category:"all" })}
                    style={{ fontSize:"0.8rem", color:"#6b7280", border:"1px solid #d1d5db", borderRadius:"0.5rem", padding:"0.4rem 0.75rem", background:"transparent", cursor:"pointer", fontFamily:"Cairo,sans-serif" }}>
                    مسح الفلتر
                  </button>
                )}
                <span style={{ fontSize:"0.8rem", color:"rgba(0,0,0,0.4)", marginRight:"auto" }}>
                  يعرض {filteredPending.length} من {pendingQuestions.length}
                </span>
              </div>

              {/* Bulk action bar */}
              {selectedPending.size > 0 && (
                <div className="bulk-action-bar" style={{ background:"#1e293b", color:"#fff", borderRadius:"1rem", padding:"0.75rem 1rem", marginBottom:"1rem", display:"flex", gap:"0.75rem", alignItems:"center" }}>
                  <span style={{ fontWeight:700 }}>{selectedPending.size} سؤال محدد</span>
                  <button onClick={() => handleBulkAction("approve")} style={{ background:"#16a34a", color:"#fff", border:"none", borderRadius:"0.5rem", padding:"0.4rem 1rem", fontWeight:700, cursor:"pointer", fontFamily:"Cairo,sans-serif" }}>✓ موافقة</button>
                  <button onClick={() => handleBulkAction("reject")} style={{ background:"#dc2626", color:"#fff", border:"none", borderRadius:"0.5rem", padding:"0.4rem 1rem", fontWeight:700, cursor:"pointer", fontFamily:"Cairo,sans-serif" }}>✕ رفض</button>
                  <button onClick={() => handleBulkAction("delete")} style={{ background:"#7f1d1d", color:"#fff", border:"none", borderRadius:"0.5rem", padding:"0.4rem 1rem", fontWeight:700, cursor:"pointer", fontFamily:"Cairo,sans-serif" }}>🗑 حذف</button>
                  <button onClick={() => setSelectedPending(new Set())} style={{ marginRight:"auto", background:"transparent", color:"#94a3b8", border:"none", cursor:"pointer", fontFamily:"Cairo,sans-serif" }}>إلغاء</button>
                </div>
              )}

              {/* Select all */}
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.75rem" }}>
                <input
                  type="checkbox"
                  checked={filteredPending.length > 0 && selectedPending.size === filteredPending.length}
                  onChange={e => {
                    if (e.target.checked) setSelectedPending(new Set(filteredPending.map(q => q.id)));
                    else setSelectedPending(new Set());
                  }}
                  style={{ width:"16px", height:"16px", cursor:"pointer" }}
                />
                <span style={{ fontSize:"0.8rem", color:"rgba(0,0,0,0.5)" }}>تحديد الكل ({filteredPending.length})</span>
              </div>

              <div className="space-y-3">
              {filteredPending.map((q, i) => (
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
                  onToggleSelect={id => setSelectedPending(prev => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id); else next.add(id);
                    return next;
                  })}
                />
              ))}
              </div>
            </>
            );
          })()}
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
                  <div className="mt-3 rounded-xl overflow-hidden border border-primary/20 bg-black/20" style={{ maxHeight: "260px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={form.image_url} alt="" style={{ maxHeight: "260px", maxWidth: "100%", objectFit: "contain", display: "block" }} onError={(e) => e.target.parentElement.style.display = "none"} />
                  </div>
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
                  <div className="mt-3 rounded-xl overflow-hidden border border-primary/20 bg-black/20" style={{ maxHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={form.answer_image_url} alt="" style={{ maxHeight: "200px", maxWidth: "100%", objectFit: "contain", display: "block" }} onError={(e) => e.target.parentElement.style.display = "none"} />
                  </div>
                )}
              </div>

              {/* Audio Upload — Optional */}
              <div>
                <label className="text-sm font-bold text-primary/70 mb-1 block">🎵 ملف صوتي (اختياري)</label>
                <div className="flex gap-2 items-center">
                  <label className={`cursor-pointer flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all border ${audioUploading ? "bg-primary/5 border-primary/10 text-primary/40 cursor-wait" : "bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"}`}>
                    <span>{audioUploading ? "⏳ جاري الرفع..." : "🎵 رفع ملف"}</span>
                    <input
                      type="file"
                      accept="audio/mpeg,audio/wav,audio/x-m4a,audio/mp4,.mp3,.wav,.m4a"
                      className="hidden"
                      disabled={audioUploading}
                      onChange={(e) => uploadAudio(e.target.files[0], (url) => setForm(prev => ({ ...prev, audio_url: url, question_type: "audio" })))}
                    />
                  </label>
                  <input
                    value={form.audio_url}
                    onChange={(e) => setForm(prev => ({ ...prev, audio_url: e.target.value, question_type: e.target.value ? "audio" : prev.question_type }))}
                    placeholder="أو الصق رابط الملف الصوتي"
                    className="flex-1 border-2 border-primary/20 focus:border-primary rounded-xl px-3 py-2 text-sm outline-none"
                  />
                  {form.audio_url && (
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, audio_url: "", question_type: "text" }))}
                      className="text-red-400 hover:text-red-600 text-lg px-1"
                      title="إزالة الصوت"
                    >✕</button>
                  )}
                </div>
                {form.audio_url && (
                  <div className="mt-3 p-3 rounded-xl border border-primary/20 bg-primary/5">
                    <audio controls src={form.audio_url} className="w-full h-10" style={{ accentColor: "#5B0E14" }} />
                  </div>
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

      {/* ── COMMUNITY MODERATION TAB ── */}
      {activeTab === "community" && (
        <CommunityAdminPanel adminToken={token} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   COMMUNITY ADMIN PANEL
══════════════════════════════════════════════════════════════════════════════ */
const API_BASE = `${process.env.REACT_APP_BACKEND_URL || "https://backend-production-cfa1f.up.railway.app"}/api`;

function CommunityAdminPanel({ adminToken }) {
  const [cats, setCats] = React.useState([]);
  const [payouts, setPayouts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [catStatus, setCatStatus] = React.useState("pending_review");
  const [payoutStatus, setPayoutStatus] = React.useState("pending");
  const [section, setSection] = React.useState("categories");
  const [rejectReason, setRejectReason] = React.useState("");
  const [rejectingId, setRejectingId] = React.useState(null);

  const headers = { Authorization: `Bearer ${adminToken}` };

  const STATUS_LABELS = {
    draft: "مسودة", pending_review: "قيد المراجعة", published: "منشورة", rejected: "مرفوضة",
  };
  const PAYOUT_LABELS = {
    pending: "قيد الانتظار", under_review: "قيد المراجعة", approved: "موافق", rejected: "مرفوض", paid: "مدفوع",
  };
  const PAYOUT_COLORS = {
    pending: "#94a3b8", under_review: "#fcd34d", approved: "#6ee7b7", rejected: "#f87171", paid: "#a78bfa",
  };

  const loadCats = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/admin/community/categories?status=${catStatus}`, { headers });
      setCats(data);
    } catch { toast.error("فشل تحميل الفئات"); }
    finally { setLoading(false); }
  };

  const loadPayouts = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/admin/community/payouts?status=${payoutStatus}`, { headers });
      setPayouts(data);
    } catch { toast.error("فشل تحميل طلبات السحب"); }
    finally { setLoading(false); }
  };

  React.useEffect(() => {
    if (section === "categories") loadCats();
    else loadPayouts();
  }, [section, catStatus, payoutStatus]);

  const approve = async (id) => {
    try {
      await axios.post(`${API_BASE}/admin/community/categories/${id}/approve`, {}, { headers });
      toast.success("تمت الموافقة ونشر الفئة");
      loadCats();
    } catch (e) { toast.error(e?.response?.data?.detail || "فشل"); }
  };

  const reject = async (id) => {
    try {
      await axios.post(`${API_BASE}/admin/community/categories/${id}/reject`, { reason: rejectReason }, { headers });
      toast.success("تم الرفض");
      setRejectingId(null);
      setRejectReason("");
      loadCats();
    } catch (e) { toast.error(e?.response?.data?.detail || "فشل"); }
  };

  const updatePayout = async (id, status, note = "") => {
    try {
      await axios.patch(`${API_BASE}/admin/community/payouts/${id}`, { status, admin_note: note }, { headers });
      toast.success("تم تحديث حالة السحب");
      loadPayouts();
    } catch (e) { toast.error(e?.response?.data?.detail || "فشل"); }
  };

  const pill = (label, color) => (
    <span style={{ background: `${color}22`, color, border: `1px solid ${color}55`, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>
      {label}
    </span>
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-black mb-1">إدارة مجتمع حُجّة</h2>
      <p className="text-primary/50 text-sm mb-6">مراجعة الفئات المقدّمة وطلبات سحب الأرباح</p>

      {/* Section toggle */}
      <div className="flex gap-3 mb-6">
        {[{ id: "categories", label: "🗂️ الفئات المقدّمة" }, { id: "payouts", label: "💸 طلبات السحب" }].map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`px-5 py-2 rounded-full font-bold text-sm transition-all ${section === s.id ? "bg-primary text-secondary" : "bg-primary/10 text-primary/60 hover:text-primary"}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* CATEGORIES */}
      {section === "categories" && (
        <div>
          {/* Status filter */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setCatStatus(k)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all border ${catStatus === k ? "bg-primary text-secondary border-primary" : "border-primary/20 text-primary/60 hover:text-primary"}`}
              >
                {v}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-10 text-primary/40">جاري التحميل...</div>
          ) : cats.length === 0 ? (
            <div className="text-center py-10 text-primary/40">لا توجد فئات بهذه الحالة</div>
          ) : (
            <div className="space-y-4">
              {cats.map((cat) => (
                <div key={cat.id} className="bg-white border border-primary/10 rounded-2xl p-5 shadow-sm">
                  <div className="flex gap-4 items-start">
                    {cat.image_url && (
                      <img src={cat.image_url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className="font-black text-lg">{cat.name}</h3>
                        {pill(STATUS_LABELS[cat.status] || cat.status, cat.status === "published" ? "#22c55e" : cat.status === "rejected" ? "#ef4444" : cat.status === "pending_review" ? "#f59e0b" : "#94a3b8")}
                      </div>
                      <p className="text-primary/50 text-sm mb-2">{cat.description}</p>
                      <div className="flex gap-4 text-sm text-primary/50 flex-wrap">
                        <span>📝 {cat.question_count || 0} سؤال</span>
                        <span>🎮 {cat.plays || 0} لعبة</span>
                        <span>❤️ {cat.likes || 0}</span>
                        <span>👤 {cat.creator_name || cat.creator_id}</span>
                        <span>🏷️ {cat.group}</span>
                        <span>📅 {cat.submitted_at?.slice(0, 10) || ""}</span>
                      </div>
                      {cat.reject_reason && (
                        <p className="text-red-500 text-sm mt-2">سبب الرفض: {cat.reject_reason}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {cat.status === "pending_review" && (
                    <div className="flex gap-3 mt-4 flex-wrap">
                      <button
                        onClick={() => approve(cat.id)}
                        className="bg-green-600 text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-green-700 transition-all"
                      >
                        ✅ موافقة ونشر
                      </button>
                      {rejectingId === cat.id ? (
                        <div className="flex gap-2 flex-1 flex-wrap">
                          <input
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="سبب الرفض (اختياري)..."
                            className="flex-1 border-2 border-red-200 rounded-xl px-3 py-1.5 text-sm outline-none min-w-0"
                          />
                          <button onClick={() => reject(cat.id)} className="bg-red-600 text-white px-4 py-1.5 rounded-full font-bold text-sm hover:bg-red-700">
                            تأكيد الرفض
                          </button>
                          <button onClick={() => { setRejectingId(null); setRejectReason(""); }} className="border border-primary/20 px-4 py-1.5 rounded-full text-sm font-bold text-primary/50 hover:text-primary">
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRejectingId(cat.id)}
                          className="border border-red-300 text-red-600 px-5 py-2 rounded-full font-bold text-sm hover:bg-red-50 transition-all"
                        >
                          ❌ رفض
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PAYOUTS */}
      {section === "payouts" && (
        <div>
          {/* Status filter */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {Object.entries(PAYOUT_LABELS).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setPayoutStatus(k)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all border ${payoutStatus === k ? "bg-primary text-secondary border-primary" : "border-primary/20 text-primary/60 hover:text-primary"}`}
              >
                {v}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-10 text-primary/40">جاري التحميل...</div>
          ) : payouts.length === 0 ? (
            <div className="text-center py-10 text-primary/40">لا توجد طلبات</div>
          ) : (
            <div className="space-y-4">
              {payouts.map((p) => (
                <div key={p.id} className="bg-white border border-primary/10 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl font-black text-amber-600">{p.amount} ﷼</span>
                        {pill(PAYOUT_LABELS[p.status] || p.status, PAYOUT_COLORS[p.status] || "#94a3b8")}
                      </div>
                      <div className="text-sm text-primary/50 space-y-1">
                        <div>👤 {p.user_id}</div>
                        <div dir="ltr" className="font-mono">🏦 {p.iban}</div>
                        <div>👁️ {p.account_name}</div>
                        <div>📅 {p.requested_at?.slice(0, 10)}</div>
                        {p.admin_note && <div className="text-primary/60">💬 {p.admin_note}</div>}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {p.status === "pending" && (
                        <button onClick={() => updatePayout(p.id, "under_review")} className="bg-yellow-500 text-white px-4 py-1.5 rounded-full font-bold text-sm hover:bg-yellow-600">
                          قيد المراجعة
                        </button>
                      )}
                      {(p.status === "pending" || p.status === "under_review") && (
                        <button onClick={() => updatePayout(p.id, "approved")} className="bg-green-600 text-white px-4 py-1.5 rounded-full font-bold text-sm hover:bg-green-700">
                          ✅ موافقة
                        </button>
                      )}
                      {p.status === "approved" && (
                        <button onClick={() => updatePayout(p.id, "paid")} className="bg-purple-600 text-white px-4 py-1.5 rounded-full font-bold text-sm hover:bg-purple-700">
                          💸 تأكيد الدفع
                        </button>
                      )}
                      {(p.status === "pending" || p.status === "under_review") && (
                        <button onClick={() => updatePayout(p.id, "rejected", "تم الرفض من الإدارة")} className="border border-red-300 text-red-600 px-4 py-1.5 rounded-full font-bold text-sm hover:bg-red-50">
                          ❌ رفض
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
