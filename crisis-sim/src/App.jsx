import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://uinyubwilfvrtfmxpcnu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbnl1YndpbGZ2cnRmbXhwY251Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NjM0MjQsImV4cCI6MjA5ODIzOTQyNH0.ATEUY2suGwCRACThjhwvYL25U-V9qe3h2Pqa5n_kwaE";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CHANNELS = ["Corporate Email","Social Media","Press Release","Internal Memo"];
const CHANNEL_ICONS = { "Corporate Email":"✉️","Social Media":"📣","Press Release":"📰","Internal Memo":"📋" };
const CHANNEL_COLORS = {
  "Corporate Email": { accent:"#4a90d9", badge:"#1a2744", dim:"#0f1a2e" },
  "Social Media":    { accent:"#e94560", badge:"#2d1020", dim:"#1a0d18" },
  "Press Release":   { accent:"#4caf77", badge:"#0f2a1a", dim:"#0a1a10" },
  "Internal Memo":   { accent:"#f5a623", badge:"#2a1f08", dim:"#1a1305" },
};

function ts(t){ return new Date(t).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}); }
function dtf(t){ return new Date(t).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}); }

// ── SHARED STYLES ──────────────────────────────────────────────────────────────
const S = {
  page:    { minHeight:"100vh", background:"#08090d", color:"#dde1f0", fontFamily:"'Inter',system-ui,sans-serif" },
  card:    { background:"#10121a", border:"1px solid #1c1f2e", borderRadius:10, padding:20, marginBottom:16 },
  label:   { display:"block", fontSize:11, color:"#555", fontWeight:700, letterSpacing:"0.1em", marginBottom:6, textTransform:"uppercase" },
  input:   { width:"100%", background:"#08090d", border:"1px solid #1c1f2e", borderRadius:6, padding:"9px 12px", color:"#dde1f0", fontSize:13, outline:"none", boxSizing:"border-box" },
  select:  { width:"100%", background:"#08090d", border:"1px solid #1c1f2e", borderRadius:6, padding:"9px 12px", color:"#dde1f0", fontSize:13, outline:"none", boxSizing:"border-box", cursor:"pointer" },
  btnRed:  { background:"#c0392b", color:"#fff", border:"none", borderRadius:6, padding:"9px 18px", fontSize:13, fontWeight:600, cursor:"pointer" },
  btnGhost:{ background:"none", color:"#888", border:"1px solid #1c1f2e", borderRadius:6, padding:"9px 18px", fontSize:13, cursor:"pointer" },
  tag:     { fontSize:11, padding:"2px 8px", borderRadius:4, fontWeight:600 },
  eyebrow: { fontSize:10, color:"#c0392b", fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:14 },
  header:  { background:"#0c0d14", borderBottom:"1px solid #1c1f2e", padding:"14px 22px", display:"flex", alignItems:"center", gap:10 },
};

// ── TOAST ──────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onDone }){
  useEffect(()=>{ const t=setTimeout(onDone,3000); return ()=>clearTimeout(t); },[]);
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:999, background: type==="error"?"#2a0a0a":"#0a2a14",
      border:`1px solid ${type==="error"?"#5a1a1a":"#1a4a25"}`, color: type==="error"?"#ff7070":"#4caf77",
      borderRadius:8, padding:"12px 18px", fontSize:13, boxShadow:"0 4px 20px #00000066" }}>
      {msg}
    </div>
  );
}

// ── MULTISELECT ────────────────────────────────────────────────────────────────
function MultiSelect({ options, selected, onChange, placeholder }){
  const [open,setOpen] = useState(false);
  const ref = useRef();
  useEffect(()=>{
    function h(e){ if(ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  },[]);
  function toggle(v){
    onChange(selected.includes(v) ? selected.filter(x=>x!==v) : [...selected,v]);
  }
  const allSelected = options.length > 0 && selected.length === options.length;
  return (
    <div ref={ref} style={{ position:"relative" }}>
      <div onClick={()=>setOpen(!open)} style={{ ...S.input, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ color: selected.length ? "#dde1f0":"#444" }}>
          {selected.length===0 ? placeholder : selected.length===options.length ? "All" : selected.join(", ")}
        </span>
        <span style={{ color:"#444", fontSize:10 }}>▼</span>
      </div>
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:"#10121a", border:"1px solid #1c1f2e", borderRadius:6, zIndex:100, overflow:"hidden" }}>
          <div onClick={()=>onChange(allSelected?[]:[...options])}
            style={{ padding:"9px 12px", fontSize:13, cursor:"pointer", color:"#aaa", borderBottom:"1px solid #1c1f2e", background: allSelected?"#1a1c2e":"none" }}>
            {allSelected ? "✓ " : ""}All
          </div>
          {options.map(o=>(
            <div key={o} onClick={()=>toggle(o)}
              style={{ padding:"9px 12px", fontSize:13, cursor:"pointer", color: selected.includes(o)?"#dde1f0":"#666",
                background: selected.includes(o)?"#1a1c2e":"none" }}>
              {selected.includes(o)?"✓ ":""}{o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SESSION SETUP ──────────────────────────────────────────────────────────────
function SessionSetup({ config, onSave }){
  const [roles,setRoles] = useState(config.roles||["CEO","CPO","CMO","CHRO","COO"]);
  const [teams,setTeams] = useState(config.teams||["Alpha","Bravo","Charlie","Delta","Echo"]);
  const [context,setContext] = useState(config.scenario_context||"");
  const [roleInput,setRoleInput] = useState("");
  const [teamInput,setTeamInput] = useState("");

  async function save(){
    const { error } = await supabase.from("session_config").update({ roles, teams, scenario_context:context, updated_at:new Date().toISOString() }).eq("id",config.id);
    if(!error) onSave({ ...config, roles, teams, scenario_context:context });
  }

  return (
    <div style={{ maxWidth:600, margin:"0 auto", padding:"28px 16px" }}>
      <div style={S.eyebrow}>Session Setup</div>

      <div style={S.card}>
        <div style={S.eyebrow}>Scenario Context</div>
        <label style={S.label}>Background (visible only to you — fed to AI for every event)</label>
        <textarea value={context} onChange={e=>setContext(e.target.value)} rows={4}
          placeholder="e.g. MegaCorp is a mid-size logistics firm. It is Monday morning. A reputational crisis is unfolding after a data leak was reported by a whistleblower..."
          style={{ ...S.input, resize:"vertical", lineHeight:1.6 }} />
      </div>

      <div style={S.card}>
        <div style={S.eyebrow}>Active Roles</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 }}>
          {roles.map(r=>(
            <span key={r} style={{ background:"#1a1c2e", color:"#aaa", padding:"4px 10px", borderRadius:20, fontSize:12, display:"flex", alignItems:"center", gap:6 }}>
              {r}
              <span onClick={()=>setRoles(roles.filter(x=>x!==r))} style={{ cursor:"pointer", color:"#555", fontSize:14 }}>×</span>
            </span>
          ))}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <input value={roleInput} onChange={e=>setRoleInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter"&&roleInput.trim()){ setRoles([...roles,roleInput.trim()]); setRoleInput(""); }}}
            placeholder="Add role, press Enter" style={{ ...S.input, flex:1 }} />
        </div>
      </div>

      <div style={S.card}>
        <div style={S.eyebrow}>Active Teams</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 }}>
          {teams.map(t=>(
            <span key={t} style={{ background:"#1a1c2e", color:"#aaa", padding:"4px 10px", borderRadius:20, fontSize:12, display:"flex", alignItems:"center", gap:6 }}>
              Team {t}
              <span onClick={()=>setTeams(teams.filter(x=>x!==t))} style={{ cursor:"pointer", color:"#555", fontSize:14 }}>×</span>
            </span>
          ))}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <input value={teamInput} onChange={e=>setTeamInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter"&&teamInput.trim()){ setTeams([...teams,teamInput.trim()]); setTeamInput(""); }}}
            placeholder="Add team name, press Enter" style={{ ...S.input, flex:1 }} />
        </div>
      </div>

      <button onClick={save} style={{ ...S.btnRed, width:"100%", padding:"12px 0", fontSize:14 }}>Save & Start Session</button>
    </div>
  );
}

// ── ADMIN VIEW ─────────────────────────────────────────────────────────────────
function AdminView({ config }){
  const [tab,setTab] = useState("fire"); // fire | matrix | export
  const [scenario,setScenario] = useState("");
  const [channel,setChannel] = useState(CHANNELS[0]);
  const [sender,setSender] = useState("");
  const [targetTeams,setTargetTeams] = useState([]);
  const [targetRoles,setTargetRoles] = useState([]);
  const [preview,setPreview] = useState(null);
  const [generating,setGenerating] = useState(false);
  const [publishing,setPublishing] = useState(false);
  const [events,setEvents] = useState([]);
  const [responses,setResponses] = useState([]);
  const [toast,setToast] = useState(null);
  const [apiKey,setApiKey] = useState("");
  const [expandedEvent,setExpandedEvent] = useState(null);

  useEffect(()=>{
    fetchAll();
    const evSub = supabase.channel("admin-ev")
      .on("postgres_changes",{ event:"*", schema:"public", table:"game_events" }, fetchAll)
      .subscribe();
    const resSub = supabase.channel("admin-res")
      .on("postgres_changes",{ event:"INSERT", schema:"public", table:"team_responses" }, fetchAll)
      .subscribe();
    return ()=>{ supabase.removeChannel(evSub); supabase.removeChannel(resSub); };
  },[]);

  async function fetchAll(){
    const { data:ev } = await supabase.from("game_events").select("*").order("created_at",{ ascending:false });
    const { data:re } = await supabase.from("team_responses").select("*").order("created_at",{ ascending:true });
    setEvents(ev||[]);
    setResponses(re||[]);
  }

  function notify(msg,type="success"){ setToast({msg,type}); }

  async function generate(){
    if(!scenario.trim()) return notify("Enter a crisis scenario.","error");
    if(!apiKey.trim()) return notify("Paste your Anthropic API key.","error");
    setGenerating(true);
    const systemPrompts = {
      "Corporate Email": "Write a formal corporate email about this crisis. Include Subject:, From:, and body. Max 180 words. Professional and factual.",
      "Social Media":    "Write a crisis social media post. Max 280 characters. Urgent but controlled. No hashtag spam.",
      "Press Release":   "Write a formal press release. Include FOR IMMEDIATE RELEASE, a headline, dateline, and 2-3 paragraphs. Max 220 words.",
      "Internal Memo":   "Write an internal memo to specific staff. Include TO:, FROM:, RE:, and concise body. Max 140 words. Direct and actionable.",
    };
    const rolesCtx = targetRoles.length ? `This message is directed to: ${targetRoles.join(", ")}.` : "";
    const teamsCtx = targetTeams.length ? `Target teams: ${targetTeams.join(", ")}.` : "Sent to all teams.";
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{ "Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true" },
        body:JSON.stringify({
          model:"claude-sonnet-4-6", max_tokens:600,
          system:`${systemPrompts[channel]}\n\nSession context: ${config.scenario_context||"No context set."}\n${rolesCtx} ${teamsCtx}`,
          messages:[{ role:"user", content:`Crisis event: ${scenario}` }]
        })
      });
      const data = await res.json();
      if(data.error) throw new Error(data.error.message);
      setPreview(data.content[0].text);
    } catch(e){ notify(`Generation failed: ${e.message}`,"error"); }
    setGenerating(false);
  }

  async function generateConsequence(event, response){
    if(!apiKey.trim()) return notify("Paste your Anthropic API key.","error");
    const systemPrompts = {
      "Corporate Email": "Write a follow-up corporate email that is a direct consequence of this team's response to the crisis. Max 180 words.",
      "Social Media":    "Write a follow-up social media post that reacts to this team's crisis response. Max 280 characters.",
      "Press Release":   "Write a follow-up press release that is a direct consequence of this team's response. Max 220 words.",
      "Internal Memo":   "Write a follow-up internal memo that is a direct consequence of this team's response. Max 140 words.",
    };
    setGenerating(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{ "Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true" },
        body:JSON.stringify({
          model:"claude-sonnet-4-6", max_tokens:600,
          system:`${systemPrompts[channel]}\n\nSession context: ${config.scenario_context||""}`,
          messages:[{ role:"user", content:`Original crisis event:\n${event.content}\n\nTeam ${response.team} (${response.role}) responded:\n${response.response}\n\nGenerate a realistic consequence event.` }]
        })
      });
      const data = await res.json();
      if(data.error) throw new Error(data.error.message);
      setPreview(data.content[0].text);
      setTargetTeams([response.team]);
      setTargetRoles([]);
      setTab("fire");
      notify("Consequence generated — review and publish below.");
    } catch(e){ notify(`Failed: ${e.message}`,"error"); }
    setGenerating(false);
  }

  async function publish(draft=false){
    if(!preview) return;
    setPublishing(true);
    const { error } = await supabase.from("game_events").insert({
      content:preview, channel, sender:sender||"System",
      is_published:!draft,
      target_teams: targetTeams.length ? targetTeams : null,
      target_roles: targetRoles.length ? targetRoles : null,
    });
    if(error){ notify(error.message,"error"); }
    else {
      notify(draft?"Saved as draft.":"Event published!");
      setPreview(null); setScenario("");
    }
    setPublishing(false);
  }

  async function togglePublish(ev){
    await supabase.from("game_events").update({ is_published:!ev.is_published }).eq("id",ev.id);
  }
  async function deleteEvent(id){
    await supabase.from("game_events").delete().eq("id",id);
  }

  function exportCSV(){
    const rows = [["Event ID","Channel","Sender","Published At","Target Teams","Target Roles","Event Content","Team","Role","Response","Responded At"]];
    responses.forEach(r=>{
      const ev = events.find(e=>e.id===r.event_id)||{};
      rows.push([ev.id||"",ev.channel||"",ev.sender||"",ev.created_at||"",
        (ev.target_teams||[]).join("|"),(ev.target_roles||[]).join("|"),
        (ev.content||"").replace(/\n/g," "),r.team,r.role,r.response.replace(/\n/g," "),r.created_at]);
    });
    const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="crisis_session.csv"; a.click();
  }

  const publishedEvents = events.filter(e=>e.is_published);
  const draftEvents = events.filter(e=>!e.is_published);

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:"#c0392b", boxShadow:"0 0 8px #c0392b44" }} />
        <span style={{ fontWeight:800, fontSize:14, color:"#fff", letterSpacing:"0.06em" }}>CRISIS COMMAND</span>
        <span style={{ fontSize:11, color:"#c0392b", background:"#1a0808", padding:"3px 10px", borderRadius:3, marginLeft:4 }}>GAME MASTER</span>
        <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
          {["fire","matrix","export"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{ ...S.btnGhost, padding:"5px 12px", fontSize:11,
              color:tab===t?"#fff":"#555", borderColor:tab===t?"#2a2d3e":"#1c1f2e", background:tab===t?"#1a1c2e":"none" }}>
              {t==="fire"?"⚡ Fire Event":t==="matrix"?"📊 Response Matrix":"⬇ Export"}
            </button>
          ))}
        </div>
      </div>

      {!apiKey && (
        <div style={{ background:"#1a1305", borderBottom:"1px solid #3a2a08", padding:"12px 22px", display:"flex", gap:12, alignItems:"center" }}>
          <span style={{ fontSize:12, color:"#f5a623", fontWeight:600 }}>API KEY</span>
          <input type="password" placeholder="sk-ant-..." onChange={e=>setApiKey(e.target.value)}
            style={{ ...S.input, maxWidth:360, flex:1 }} />
        </div>
      )}

      <div style={{ maxWidth:860, margin:"0 auto", padding:"24px 16px" }}>

        {/* ── FIRE EVENT TAB ── */}
        {tab==="fire" && (
          <>
            <div style={S.card}>
              <div style={S.eyebrow}>Fire Crisis Event</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                <div>
                  <label style={S.label}>Channel</label>
                  <select value={channel} onChange={e=>setChannel(e.target.value)} style={S.select}>
                    {CHANNELS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Sender</label>
                  <input value={sender} onChange={e=>setSender(e.target.value)}
                    placeholder="e.g. CEO, @CompanyHandle, Reuters" style={S.input} />
                </div>
                <div>
                  <label style={S.label}>Target Teams <span style={{ color:"#444", fontWeight:400 }}>(empty = all)</span></label>
                  <MultiSelect options={config.teams||[]} selected={targetTeams} onChange={setTargetTeams} placeholder="All teams" />
                </div>
                <div>
                  <label style={S.label}>Target Roles <span style={{ color:"#444", fontWeight:400 }}>(empty = all)</span></label>
                  <MultiSelect options={config.roles||[]} selected={targetRoles} onChange={setTargetRoles} placeholder="All roles" />
                </div>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={S.label}>Crisis Scenario</label>
                <textarea value={scenario} onChange={e=>setScenario(e.target.value)} rows={3}
                  placeholder="e.g. A journalist from NRC contacts the CPR asking for comment on whistleblower allegations"
                  style={{ ...S.input, resize:"vertical", lineHeight:1.6 }} />
              </div>
              <button onClick={generate} disabled={generating} style={{ ...S.btnRed, opacity:generating?0.6:1 }}>
                {generating?"Generating...":"⚡ Generate"}
              </button>

              {preview && (
                <div style={{ marginTop:18, background:"#08090d", border:"1px solid #1c1f2e", borderRadius:8, padding:16 }}>
                  <div style={{ fontSize:11, color:"#555", marginBottom:10, display:"flex", justifyContent:"space-between" }}>
                    <span>PREVIEW — {CHANNEL_ICONS[channel]} {channel}{targetRoles.length?` → ${targetRoles.join(", ")}`:""}{targetTeams.length?` · Team ${targetTeams.join(", ")}`:""}</span>
                    <button onClick={()=>setPreview(null)} style={{ background:"none", border:"none", color:"#444", cursor:"pointer" }}>✕</button>
                  </div>
                  <textarea value={preview} onChange={e=>setPreview(e.target.value)} rows={7}
                    style={{ ...S.input, fontSize:13, lineHeight:1.7, resize:"vertical" }} />
                  <div style={{ display:"flex", gap:10, marginTop:12 }}>
                    <button onClick={()=>publish(false)} disabled={publishing} style={S.btnRed}>🚨 Publish Now</button>
                    <button onClick={()=>publish(true)} disabled={publishing} style={S.btnGhost}>Save Draft</button>
                  </div>
                </div>
              )}
            </div>

            {/* Event log */}
            <div style={S.card}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div style={S.eyebrow}>Event Log <span style={{ color:"#333", fontWeight:400 }}>({publishedEvents.length} live · {draftEvents.length} draft)</span></div>
              </div>
              {events.length===0 && <div style={{ color:"#333", fontSize:13 }}>No events yet.</div>}
              {events.map(ev=>{
                const cc = CHANNEL_COLORS[ev.channel]||{ accent:"#888", badge:"#1a1c2e", dim:"#0d0f18" };
                const evResponses = responses.filter(r=>r.event_id===ev.id);
                const isExpanded = expandedEvent===ev.id;
                return (
                  <div key={ev.id} style={{ borderLeft:`2px solid ${ev.is_published?cc.accent:"#222"}`, paddingLeft:14, marginBottom:14, opacity:ev.is_published?1:0.5 }}>
                    <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6, flexWrap:"wrap" }}>
                      <span style={{ ...S.tag, background:cc.badge, color:cc.accent }}>{CHANNEL_ICONS[ev.channel]} {ev.channel}</span>
                      <span style={{ fontSize:11, color:"#555" }}>{ev.sender}</span>
                      {ev.target_roles?.length>0 && <span style={{ ...S.tag, background:"#1a1c2e", color:"#7a9fd4" }}>→ {ev.target_roles.join(", ")}</span>}
                      {ev.target_teams?.length>0 && <span style={{ ...S.tag, background:"#1a2010", color:"#4caf77" }}>Team {ev.target_teams.join(", ")}</span>}
                      <span style={{ fontSize:11, color:"#333", marginLeft:"auto" }}>{dtf(ev.created_at)}</span>
                      {evResponses.length>0 && (
                        <span onClick={()=>setExpandedEvent(isExpanded?null:ev.id)}
                          style={{ fontSize:11, color:"#f5a623", background:"#2a1f08", padding:"2px 8px", borderRadius:4, cursor:"pointer" }}>
                          {evResponses.length} response{evResponses.length!==1?"s":""}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize:12, color:"#888", lineHeight:1.5, maxHeight:60, overflow:"hidden" }}>
                      {ev.content.substring(0,180)}{ev.content.length>180?"...":""}
                    </div>
                    {isExpanded && (
                      <div style={{ marginTop:10 }}>
                        {evResponses.map(r=>(
                          <div key={r.id} style={{ background:"#0d0f18", border:"1px solid #1c1f2e", borderRadius:6, padding:12, marginBottom:8 }}>
                            <div style={{ display:"flex", gap:8, marginBottom:6 }}>
                              <span style={{ fontSize:11, fontWeight:700, color:"#dde1f0" }}>Team {r.team}</span>
                              <span style={{ fontSize:11, color:"#555" }}>{r.role}</span>
                              <span style={{ fontSize:11, color:"#333", marginLeft:"auto" }}>{ts(r.created_at)}</span>
                            </div>
                            <div style={{ fontSize:12, color:"#aaa", lineHeight:1.6, marginBottom:10 }}>{r.response}</div>
                            <button onClick={()=>generateConsequence(ev,r)} disabled={generating}
                              style={{ ...S.btnGhost, fontSize:11, padding:"4px 12px", color:"#f5a623", borderColor:"#3a2a08" }}>
                              ⚡ Generate Consequence for Team {r.team}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display:"flex", gap:8, marginTop:8 }}>
                      <button onClick={()=>togglePublish(ev)} style={{ ...S.btnGhost, fontSize:11, padding:"4px 10px" }}>
                        {ev.is_published?"⏸ Unpublish":"▶ Publish"}
                      </button>
                      <button onClick={()=>deleteEvent(ev.id)} style={{ ...S.btnGhost, fontSize:11, padding:"4px 10px", color:"#c0392b", borderColor:"#2a0a0a" }}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── MATRIX TAB ── */}
        {tab==="matrix" && (
          <div style={S.card}>
            <div style={S.eyebrow}>Response Matrix — who has responded</div>
            {publishedEvents.length===0 && <div style={{ color:"#333", fontSize:13 }}>No published events yet.</div>}
            {publishedEvents.map(ev=>{
              const cc = CHANNEL_COLORS[ev.channel]||{ accent:"#888", badge:"#1a1c2e" };
              const evResponses = responses.filter(r=>r.event_id===ev.id);
              const relevantTeams = ev.target_teams||config.teams||[];
              const relevantRoles = ev.target_roles||config.roles||[];
              return (
                <div key={ev.id} style={{ marginBottom:24 }}>
                  <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10 }}>
                    <span style={{ ...S.tag, background:cc.badge, color:cc.accent }}>{CHANNEL_ICONS[ev.channel]} {ev.channel}</span>
                    <span style={{ fontSize:12, color:"#666" }}>{ev.sender} · {dtf(ev.created_at)}</span>
                    {ev.target_roles?.length>0 && <span style={{ ...S.tag, background:"#1a1c2e", color:"#7a9fd4" }}>→ {ev.target_roles.join(", ")}</span>}
                  </div>
                  <div style={{ fontSize:12, color:"#666", marginBottom:10, lineHeight:1.5 }}>{ev.content.substring(0,120)}...</div>
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ borderCollapse:"collapse", width:"100%", fontSize:12 }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign:"left", color:"#444", padding:"6px 10px", borderBottom:"1px solid #1c1f2e" }}>Team</th>
                          {relevantRoles.map(role=>(
                            <th key={role} style={{ textAlign:"center", color:"#444", padding:"6px 10px", borderBottom:"1px solid #1c1f2e" }}>{role}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {relevantTeams.map(team=>(
                          <tr key={team}>
                            <td style={{ color:"#888", padding:"6px 10px", borderBottom:"1px solid #111" }}>Team {team}</td>
                            {relevantRoles.map(role=>{
                              const resp = evResponses.find(r=>r.team===team&&r.role===role);
                              return (
                                <td key={role} style={{ textAlign:"center", padding:"6px 10px", borderBottom:"1px solid #111" }}>
                                  {resp
                                    ? <span title={resp.response} style={{ color:"#4caf77", cursor:"help" }}>✓</span>
                                    : <span style={{ color:"#222" }}>–</span>}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── EXPORT TAB ── */}
        {tab==="export" && (
          <div style={S.card}>
            <div style={S.eyebrow}>Session Export</div>
            <p style={{ fontSize:13, color:"#666", lineHeight:1.6, marginBottom:20 }}>
              Export all team responses alongside the events that triggered them. Use this for post-session debrief and quality evaluation.
            </p>
            <div style={{ background:"#08090d", borderRadius:8, padding:16, marginBottom:20 }}>
              <div style={{ fontSize:12, color:"#555", marginBottom:8 }}>Summary</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                {[["Events fired",publishedEvents.length],["Responses collected",responses.length],["Teams active",[...new Set(responses.map(r=>r.team))].length]].map(([label,val])=>(
                  <div key={label} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:28, fontWeight:800, color:"#dde1f0" }}>{val}</div>
                    <div style={{ fontSize:11, color:"#444" }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={exportCSV} style={{ ...S.btnRed, width:"100%", padding:"12px 0", fontSize:14 }}>
              ⬇ Download CSV
            </button>
          </div>
        )}
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)} />}
    </div>
  );
}

// ── STUDENT VIEW ───────────────────────────────────────────────────────────────
function StudentView(){
  const [config,setConfig] = useState(null);
  const [team,setTeam] = useState(null);
  const [role,setRole] = useState(null);
  const [events,setEvents] = useState([]);
  const [responses,setResponses] = useState({});
  const [submitted,setSubmitted] = useState({});
  const [newIds,setNewIds] = useState(new Set());
  const [activeChannel,setActiveChannel] = useState("All");
  const [toast,setToast] = useState(null);

  useEffect(()=>{
    supabase.from("session_config").select("*").single().then(({data})=>setConfig(data));
  },[]);

  useEffect(()=>{
    if(!team||!role) return;
    fetchEvents();
    const sub = supabase.channel("student-live")
      .on("postgres_changes",{ event:"INSERT", schema:"public", table:"game_events" }, payload=>{
        const ev = payload.new;
        if(!ev.is_published) return;
        if(ev.target_teams?.length && !ev.target_teams.includes(team)) return;
        if(ev.target_roles?.length && !ev.target_roles.includes(role)) return;
        setEvents(prev=>[ev,...prev]);
        setNewIds(prev=>new Set([...prev,ev.id]));
        setTimeout(()=>setNewIds(prev=>{ const n=new Set(prev); n.delete(ev.id); return n; }),5000);
      })
      .on("postgres_changes",{ event:"UPDATE", schema:"public", table:"game_events" }, fetchEvents)
      .subscribe();
    return ()=>supabase.removeChannel(sub);
  },[team,role]);

  async function fetchEvents(){
    if(!team||!role) return;
    const { data } = await supabase.from("game_events").select("*")
      .eq("is_published",true)
      .order("created_at",{ ascending:false });
    const visible = (data||[]).filter(ev=>{
      const teamOk = !ev.target_teams?.length || ev.target_teams.includes(team);
      const roleOk = !ev.target_roles?.length || ev.target_roles.includes(role);
      return teamOk && roleOk;
    });
    setEvents(visible);
  }

  async function submitResponse(eventId){
    const text = responses[eventId]||"";
    if(!text.trim()) return;
    const { error } = await supabase.from("team_responses").insert({ event_id:eventId, team, role, response:text });
    if(!error){
      setSubmitted(prev=>({ ...prev, [eventId]:true }));
      setToast({ msg:"Response submitted.", type:"success" });
    } else {
      setToast({ msg:error.message, type:"error" });
    }
  }

  if(!config) return <div style={{ ...S.page, display:"flex", alignItems:"center", justifyContent:"center", color:"#333" }}>Loading...</div>;

  // Login screen
  if(!team||!role){
    return (
      <div style={{ ...S.page, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ ...S.card, maxWidth:400, width:"100%", textAlign:"center" }}>
          <div style={{ fontSize:28, marginBottom:8 }}>🚨</div>
          <div style={{ fontWeight:800, fontSize:20, color:"#fff", marginBottom:4 }}>Crisis Simulation</div>
          <div style={{ fontSize:13, color:"#444", marginBottom:28 }}>Select your team and role to enter</div>
          <div style={{ marginBottom:16, textAlign:"left" }}>
            <label style={S.label}>Your Team</label>
            <select value={team||""} onChange={e=>setTeam(e.target.value)} style={S.select}>
              <option value="">Select team...</option>
              {(config.teams||[]).map(t=><option key={t} value={t}>Team {t}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:20, textAlign:"left" }}>
            <label style={S.label}>Your Role</label>
            <select value={role||""} onChange={e=>setRole(e.target.value)} style={S.select}>
              <option value="">Select role...</option>
              {(config.roles||[]).map(r=><option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button onClick={()=>{ if(team&&role) {} }} disabled={!team||!role}
            style={{ ...S.btnRed, width:"100%", padding:"12px 0", opacity:(!team||!role)?0.4:1 }}>
            Enter Simulation
          </button>
        </div>
        {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)} />}
      </div>
    );
  }

  const channels = ["All",...CHANNELS];
  const filtered = activeChannel==="All" ? events : events.filter(e=>e.channel===activeChannel);
  const newByChannel = {};
  CHANNELS.forEach(c=>{ newByChannel[c]=events.filter(e=>e.channel===c&&newIds.has(e.id)).length; });

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:"#c0392b", animation:"pulse 1.5s infinite", boxShadow:"0 0 6px #c0392b" }} />
        <span style={{ fontWeight:700, fontSize:13, color:"#fff" }}>CRISIS FEED</span>
        <span style={{ fontSize:11, background:"#1a0808", color:"#c0392b", padding:"3px 10px", borderRadius:3 }}>Team {team}</span>
        <span style={{ fontSize:11, background:"#1a1c2e", color:"#7a9fd4", padding:"3px 10px", borderRadius:3 }}>{role}</span>
        <span style={{ marginLeft:"auto", fontSize:11, color:"#333" }}>{events.length} event{events.length!==1?"s":""}</span>
        <button onClick={()=>{ setTeam(null); setRole(null); setEvents([]); }} style={{ ...S.btnGhost, fontSize:11, padding:"4px 10px" }}>
          Switch
        </button>
      </div>

      {/* Channel tabs */}
      <div style={{ background:"#0c0d14", borderBottom:"1px solid #1c1f2e", display:"flex", overflowX:"auto" }}>
        {channels.map(c=>(
          <button key={c} onClick={()=>setActiveChannel(c)} style={{
            background:"none", border:"none", cursor:"pointer", padding:"11px 16px", fontSize:12, whiteSpace:"nowrap",
            color: activeChannel===c?"#fff":"#444",
            borderBottom: activeChannel===c?"2px solid #c0392b":"2px solid transparent",
            fontWeight: activeChannel===c?600:400
          }}>
            {c!=="All"&&CHANNEL_ICONS[c]} {c}
            {c!=="All"&&newByChannel[c]>0&&(
              <span style={{ marginLeft:6, background:"#c0392b", color:"#fff", borderRadius:10, padding:"1px 6px", fontSize:10 }}>{newByChannel[c]}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:680, margin:"0 auto", padding:"20px 16px" }}>
        {filtered.length===0 && (
          <div style={{ textAlign:"center", color:"#222", fontSize:13, marginTop:60 }}>
            <div style={{ fontSize:30, marginBottom:10 }}>📡</div>
            Monitoring. No messages yet.
          </div>
        )}
        {filtered.map(ev=>{
          const cc = CHANNEL_COLORS[ev.channel]||{ accent:"#888", badge:"#1a1c2e", dim:"#0d0f18" };
          const isNew = newIds.has(ev.id);
          const isDone = submitted[ev.id];
          return (
            <div key={ev.id} style={{
              background: cc.dim, border:`1px solid ${isNew?cc.accent:"#1c1f2e"}`,
              borderRadius:10, padding:18, marginBottom:16,
              boxShadow: isNew?`0 0 16px ${cc.accent}22`:"none",
              transition:"border-color 0.6s, box-shadow 0.6s"
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                  <span style={{ ...S.tag, background:cc.badge, color:cc.accent }}>{CHANNEL_ICONS[ev.channel]} {ev.channel}</span>
                  <span style={{ fontSize:12, color:"#555" }}>{ev.sender}</span>
                </div>
                <span style={{ fontSize:11, color:"#333", whiteSpace:"nowrap" }}>{ts(ev.created_at)}</span>
              </div>
              <div style={{ fontSize:13, lineHeight:1.75, color:"#ccd0e8", whiteSpace:"pre-wrap", marginBottom:14 }}>{ev.content}</div>

              {/* Response area */}
              {!isDone ? (
                <div style={{ borderTop:"1px solid #1c1f2e", paddingTop:14 }}>
                  <label style={{ ...S.label, color:"#444" }}>Your Response</label>
                  <textarea
                    value={responses[ev.id]||""}
                    onChange={e=>setResponses(prev=>({ ...prev, [ev.id]:e.target.value }))}
                    rows={4} placeholder="Type your response here..."
                    style={{ ...S.input, resize:"vertical", lineHeight:1.6, marginBottom:10 }}
                  />
                  <button onClick={()=>submitResponse(ev.id)} style={{ ...S.btnRed, fontSize:12, padding:"7px 16px" }}>
                    Submit Response
                  </button>
                </div>
              ) : (
                <div style={{ borderTop:"1px solid #1c1f2e", paddingTop:12, fontSize:12, color:"#4caf77" }}>
                  ✓ Response submitted
                </div>
              )}
              {isNew && <div style={{ marginTop:10, fontSize:10, color:cc.accent, fontWeight:700, letterSpacing:"0.1em" }}>● NEW</div>}
            </div>
          );
        })}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)} />}
    </div>
  );
}

// ── ROOT ───────────────────────────────────────────────────────────────────────
export default function App(){
  const [mode,setMode] = useState(null);
  const [config,setConfig] = useState(null);
  const [setupDone,setSetupDone] = useState(false);

  useEffect(()=>{
    supabase.from("session_config").select("*").single().then(({data})=>setConfig(data));
  },[]);

  if(mode==="student") return <StudentView />;

  if(mode==="admin"){
    if(!config) return <div style={{ ...S.page, display:"flex", alignItems:"center", justifyContent:"center", color:"#333" }}>Loading...</div>;
    if(!setupDone) return <div style={S.page}><div style={S.header}><span style={{ fontWeight:800, fontSize:14, color:"#fff" }}>CRISIS COMMAND</span></div><SessionSetup config={config} onSave={c=>{ setConfig(c); setSetupDone(true); }} /></div>;
    return <AdminView config={config} />;
  }

  return (
    <div style={{ ...S.page, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:11, color:"#c0392b", letterSpacing:"0.18em", fontWeight:700, marginBottom:10 }}>EMBA · LEADING THROUGH CRISIS</div>
        <div style={{ fontSize:38, fontWeight:900, color:"#fff", marginBottom:6, letterSpacing:"-0.02em" }}>Crisis Simulation</div>
        <div style={{ fontSize:14, color:"#333", marginBottom:44 }}>Real pressure. Real decisions. Real consequences.</div>
        <div style={{ display:"flex", gap:14, justifyContent:"center" }}>
          <button onClick={()=>setMode("admin")} style={{ ...S.btnRed, padding:"13px 30px", fontSize:14 }}>🎯 Game Master</button>
          <button onClick={()=>setMode("student")} style={{ ...S.btnGhost, padding:"13px 30px", fontSize:14 }}>👤 Student</button>
        </div>
      </div>
    </div>
  );
}
