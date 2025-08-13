import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search, Phone, MessageSquare, Calendar, Check, Trash2 } from "lucide-react";

// --- Paleta Eleva
const ELEVA_PRIMARY = "#3a939d";
const ELEVA_DARK = "#2f3336";

// --- UI base (Tailwind)
const Button = ({ className = "", variant = "primary", ...props }) => {
  const base = "px-3 py-2 rounded-2xl text-sm font-medium shadow-sm active:scale-[.99]";
  const variants = {
    primary: `bg-[${ELEVA_PRIMARY}] text-white hover:opacity-95`,
    ghost: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    danger: "bg-rose-500 text-white hover:opacity-95",
    dark: `bg-[${ELEVA_DARK}] text-white hover:opacity-95`,
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
};
const Input = (props) => (
  <input {...props} className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[${ELEVA_PRIMARY}] ${props.className||""}`} />
);
const Select = (props) => (
  <select {...props} className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[${ELEVA_PRIMARY}] ${props.className||""}`} />
);

// --- Catálogos
const INTERESTS = ["Compra","Venta","Renta"];
const STAGES = ["Prospecto nuevo","En seguimiento","Interesado","En negociación","Cerrado","Perdido"];

// --- LocalStorage helper
const LS_KEY = "eleva_crm_v1";
function useLocalState(key, initial) {
  const [state, setState] = useState(() => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : initial; } catch { return initial; }
  });
  useEffect(()=>{ try { localStorage.setItem(key, JSON.stringify(state)); } catch {} },[state]);
  return [state, setState];
}

// Seed demo
const seedData = () => ({
  promoters: [ { id: "u1", name: "Fer Labrador" }, { id: "u2", name: "María López" }, { id: "u3", name: "Carlos Pérez" } ],
  clients: [
    { id: "C-001", name: "Ana García", phone: "+52 686 111 1111", email: "", source: "Facebook", firstContact: addDays(todayISO(), -10), interest: "Compra", stage: "En seguimiento", promoter: "Fer Labrador", nextFollowUp: addDays(todayISO(), 2), notes: "Le interesa Modelo Olivo" },
    { id: "C-002", name: "Luis Martínez", phone: "+52 686 222 2222", email: "", source: "Marketplace", firstContact: addDays(todayISO(), -5), interest: "Renta", stage: "Interesado", promoter: "María López", nextFollowUp: addDays(todayISO(), 1), notes: "Pet-friendly" },
    { id: "C-003", name: "Sofía Herrera", phone: "+52 686 333 3333", email: "", source: "Recomendación", firstContact: addDays(todayISO(), -2), interest: "Compra", stage: "Prospecto nuevo", promoter: "Carlos Pérez", nextFollowUp: addDays(todayISO(), 3), notes: "3 recámaras" },
  ],
  ui: { simpleMode: true }
});

// --- App principal (modo simple por defecto)
export default function App(){
  const [db, setDb] = useLocalState(LS_KEY, seedData());
  const [query, setQuery] = useState("");
  const clients = db.clients;
  const today = todayISO();

  const filtered = useMemo(()=>{
    const q = query.toLowerCase();
    return clients
      .filter(c => !q || [c.name,c.phone].some((v)=>String(v||"").toLowerCase().includes(q)))
      .sort((a,b)=> scoreFollow(b,today) - scoreFollow(a,today));
  },[clients, query, today]);

  const quickAdd = (payload) => setDb((p)=>({ ...p, clients: [{...payload, id: `C-${Date.now()}`}, ...p.clients] }));
  const updateClient = (id, patch) => setDb((p)=>({ ...p, clients: p.clients.map((c)=> c.id===id?{...c, ...patch}:c) }));
  const removeClient = (id) => setDb((p)=>({ ...p, clients: p.clients.filter((c)=>c.id!==id) }));

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#2f3336]">
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/80 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl" style={{background:ELEVA_PRIMARY}}/>
            <div className="leading-tight">
              <div className="text-sm text-slate-500">Eleva Inmobiliaria</div>
              <div className="font-semibold">CRM promotores (simple)</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-16 space-y-4">
        <div className="flex items-center gap-2 bg-white rounded-2xl px-3 py-2 border border-slate-200">
          <Search className="w-4 h-4"/>
          <input placeholder="Buscar por nombre o teléfono" value={query} onChange={e=>setQuery(e.target.value)} className="outline-none text-sm w-full"/>
          <Button variant="ghost" onClick={()=>setQuery("")}>Limpiar</Button>
        </div>

        <QuickAdd onCreate={(lead)=>quickAdd(lead)} promoters={db.promoters?.map((p)=>p.name)||[]} />

        <div className="space-y-2">
          {filtered.map(c => (
            <SimpleLeadCard key={c.id} c={c} today={today}
              onAdvance={()=>updateClient(c.id, { stage: nextStage(c.stage) })}
              onSchedule={(days)=>updateClient(c.id, { nextFollowUp: addDays(today, days) })}
              onEdit={(patch)=>updateClient(c.id, patch)}
              onRemove={()=>removeClient(c.id)}
            />
          ))}
          {filtered.length===0 && <div className="text-center py-10 text-slate-500">Sin leads. Crea el primero arriba.</div>}
        </div>
      </main>

      <div className="fixed bottom-5 right-5">
        <Button className="shadow-lg" onClick={()=>document.getElementById('quick-add-name')?.focus()}><Plus className="w-4 h-4 inline mr-1"/>Nuevo lead</Button>
      </div>

      <footer className="py-10 text-center text-xs text-slate-400">Eleva CRM • modo simple • colores #3a939d / #2f3336</footer>
    </div>
  );
}

// --- Componentes ---
function QuickAdd({ onCreate, promoters }){
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState("");
  const [promoter, setPromoter] = useState(promoters?.[0]||"");
  const [follow, setFollow] = useState(addDays(todayISO(), 1));

  const submit = (e)=>{
    e.preventDefault();
    if(!name || !phone) return alert("Nombre y teléfono");
    onCreate({ name, phone, email: "", source: "WhatsApp", firstContact: todayISO(), interest, stage: "Prospecto nuevo", promoter, nextFollowUp: follow, notes: "" });
    setName(""); setPhone(""); setInterest(""); setFollow(addDays(todayISO(),1));
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl p-3 border border-slate-200">
      <div className="text-sm font-medium mb-2">Alta rápida</div>
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-center">
        <Input id="quick-add-name" placeholder="Nombre" value={name} onChange={e=>setName(e.target.value)} className="sm:col-span-2"/>
        <Input placeholder="Teléfono" value={phone} onChange={e=>setPhone(e.target.value)} className="sm:col-span-1"/>
        <Select value={interest} onChange={e=>setInterest(e.target.value)} className="sm:col-span-1">
          <option value="">Interés</option>
          {INTERESTS.map(i=> <option key={i} value={i}>{i}</option>)}
        </Select>
        <Select value={promoter} onChange={e=>setPromoter(e.target.value)} className="sm:col-span-1">
          {promoters.map((p)=> <option key={p} value={p}>{p}</option>)}
        </Select>
        <Input type="date" value={follow} onChange={e=>setFollow(e.target.value)} className="sm:col-span-1"/>
        <Button type="submit" className="sm:col-span-1"><Plus className="w-4 h-4 inline mr-1"/>Agregar</Button>
      </div>
    </form>
  );
}

function SimpleLeadCard({ c, today, onAdvance, onSchedule, onEdit, onRemove }){
  const overdue = c.nextFollowUp && c.stage!=='Cerrado' && c.stage!=='Perdido' && c.nextFollowUp < today;
  const soon = c.nextFollowUp && c.stage!=='Cerrado' && c.stage!=='Perdido' && c.nextFollowUp >= today && c.nextFollowUp <= addDays(today,2);

  const waUrl = makeWa(c.phone, `Hola ${c.name.split(' ')[0]}, te escribe Eleva Inmobiliaria. ¿Seguimos con tu interés en ${c.interest||'la propiedad'}?`);
  const telUrl = makeTel(c.phone);

  return (
    <div className={"p-3 rounded-2xl border flex flex-col gap-3 " + (overdue?"border-rose-300 bg-rose-50":"border-slate-200 bg-white") }>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium truncate">{c.name}</div>
          <div className="text-xs text-slate-500 flex flex-wrap gap-3">
            <span>{c.phone}</span>
            <span className={"px-2 py-0.5 rounded-full text-[11px] " + (stageColor[c.stage]||"bg-slate-100")}>{c.stage}</span>
            {c.nextFollowUp && (
              <span className={"inline-flex items-center gap-1 " + (overdue?"text-rose-600": soon?"text-amber-600":"text-slate-500")}>
                <Calendar className="w-3 h-3"/> Próximo: {c.nextFollowUp}
              </span>
            )}
          </div>
          {c.notes && <div className="text-sm text-slate-600 mt-1">{c.notes}</div>}
        </div>
        <div className="flex items-center gap-2">
          <a href={telUrl}><Button variant="ghost"><Phone className="w-4 h-4 mr-1"/>Llamar</Button></a>
          <a target="_blank" rel="noreferrer" href={waUrl}><Button variant="ghost"><MessageSquare className="w-4 h-4 mr-1"/>WhatsApp</Button></a>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Button variant="ghost" onClick={()=>onSchedule(0)}><Calendar className="w-4 h-4 mr-1"/>Hoy</Button>
        <Button variant="ghost" onClick={()=>onSchedule(1)}><Calendar className="w-4 h-4 mr-1"/>Mañana</Button>
        <Button variant="ghost" onClick={()=>onSchedule(3)}><Calendar className="w-4 h-4 mr-1"/>3 días</Button>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={onAdvance}><Check className="w-4 h-4 mr-1"/>Avanzar etapa</Button>
        <Button variant="ghost" onClick={()=>{ const note = prompt('Nota / comentario (opcional):', c.notes||''); if(note!==null) onEdit({ notes: note }); }}>Nota</Button>
        <Button variant="ghost" onClick={()=>{ const res = prompt('Cambiar promotor:', c.promoter||''); if(res!==null) onEdit({ promoter: res }); }}>Promotor</Button>
        <Button variant="ghost" onClick={onRemove}><Trash2 className="w-4 h-4"/></Button>
      </div>
    </div>
  );
}

// --- Widgets ---
const stageColor = {
  "Prospecto nuevo": "bg-slate-100 text-slate-700",
  "En seguimiento": "bg-amber-100 text-amber-700",
  "Interesado": "bg-blue-100 text-blue-700",
  "En negociación": "bg-purple-100 text-purple-700",
  "Cerrado": "bg-emerald-100 text-emerald-700",
  "Perdido": "bg-rose-100 text-rose-700",
};

// --- Utilidades ---
function todayISO(){ return new Date().toISOString().slice(0,10); }
function addDays(dateISO, days){ const d=new Date(dateISO); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10); }
function nextStage(stage){ const order = STAGES; const i = Math.max(0, order.indexOf(stage)); return order[Math.min(i+1, order.length-1)]; }
function scoreFollow(c, todayISO){ if(!c.nextFollowUp || c.stage==='Cerrado' || c.stage==='Perdido') return 0; const t=new Date(todayISO).getTime(); const n=new Date(c.nextFollowUp).getTime(); if(n<t) return 3; if(n<=t+86400000) return 2; if(n<=t+2*86400000) return 1; return 0; }
function digitsOnly(s){ return (s||'').split('').filter(ch=>ch>='0'&&ch<='9').join(''); }
function makeWa(phone, text){ const num=digitsOnly(phone); const t=encodeURIComponent(text||''); return `https://wa.me/${num}?text=${t}`; }
function makeTel(phone){ const a=(phone||'').split(' ').join('').split('-').join(''); return `tel:${a}`; }
