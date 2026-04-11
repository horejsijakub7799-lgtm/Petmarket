import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./useAuth";
import AuthModal from "./AuthModal";
import ProfilePage from "./ProfilePage";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');`;

const CSS = `
  ${FONTS}
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --green: #2d6a4f;
    --green-mid: #3a856a;
    --green-light: #e8f5ef;
    --green-pale: #f2faf6;
    --sand: #f7f4ef;
    --sand-dark: #ede8e0;
    --text: #1c2b22;
    --text-mid: #4a5e52;
    --text-light: #8a9e92;
    --white: #ffffff;
    --accent: #e07b39;
    --accent-light: #fdf0e6;
    --shadow-sm: 0 1px 4px rgba(44,80,58,0.07);
    --shadow-md: 0 4px 20px rgba(44,80,58,0.10);
    --shadow-lg: 0 12px 40px rgba(44,80,58,0.14);
    --radius: 16px;
    --radius-sm: 10px;
  }
  body { font-family: 'DM Sans', sans-serif; background: var(--sand); color: var(--text); }
  h1,h2,h3 { font-family: 'DM Serif Display', serif; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: var(--sand-dark); }
  ::-webkit-scrollbar-thumb { background: #b5cec0; border-radius: 4px; }
  input, select, textarea { font-family: 'DM Sans', sans-serif; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes popIn {
    from { opacity: 0; transform: scale(0.94); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(12px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  .card {
    background: var(--white);
    border-radius: var(--radius);
    border: 1.5px solid var(--sand-dark);
    box-shadow: var(--shadow-sm);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    cursor: pointer;
    overflow: hidden;
    animation: fadeUp 0.4s ease both;
  }
  .card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); }
  .pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 13px; border-radius: 30px; font-size: 0.8rem;
    font-weight: 600; cursor: pointer; transition: all 0.18s; border: none;
    font-family: 'DM Sans', sans-serif;
  }
  .pill-outline { background: var(--white); color: var(--text-mid); border: 1.5px solid var(--sand-dark); }
  .pill-outline:hover { border-color: var(--green); color: var(--green); }
  .pill-active { background: var(--green); color: var(--white); border: 1.5px solid var(--green); }
  .pill-dark { background: var(--text); color: var(--white); border: 1.5px solid var(--text); }
  .pill-dark-outline { background: var(--white); color: var(--text); border: 1.5px solid var(--sand-dark); }
  .pill-dark-outline:hover { border-color: var(--text); }

  .btn-primary {
    background: var(--green); color: var(--white);
    border: none; border-radius: var(--radius-sm);
    padding: 12px 22px; font-size: 0.9rem; font-weight: 600;
    cursor: pointer; transition: background 0.18s, box-shadow 0.18s;
    font-family: 'DM Sans', sans-serif;
    box-shadow: 0 2px 12px rgba(45,106,79,0.25);
  }
  .btn-primary:hover { background: var(--green-mid); box-shadow: 0 4px 18px rgba(45,106,79,0.32); }

  .btn-secondary {
    background: var(--white); color: var(--green);
    border: 2px solid var(--green); border-radius: var(--radius-sm);
    padding: 10px 20px; font-size: 0.9rem; font-weight: 600;
    cursor: pointer; transition: all 0.18s;
    font-family: 'DM Sans', sans-serif;
  }
  .btn-secondary:hover { background: var(--green-pale); }

  .input-field {
    width: 100%; border: 1.5px solid var(--sand-dark);
    border-radius: var(--radius-sm); padding: 11px 14px;
    font-size: 0.9rem; outline: none; background: var(--sand);
    color: var(--text); transition: border-color 0.18s, box-shadow 0.18s;
    font-family: 'DM Sans', sans-serif;
  }
  .input-field:focus {
    border-color: var(--green);
    box-shadow: 0 0 0 3px rgba(45,106,79,0.12);
    background: var(--white);
  }
  .label { font-size: 0.75rem; font-weight: 600; color: var(--text-mid); text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 6px; }

  .overlay {
    position: fixed; inset: 0; background: rgba(28,43,34,0.5);
    display: flex; align-items: center; justify-content: center;
    z-index: 200; padding: 20px; backdrop-filter: blur(5px);
  }
  .modal {
    background: var(--white); border-radius: 22px;
    max-width: 500px; width: 100%; max-height: 92vh; overflow-y: auto;
    box-shadow: var(--shadow-lg); animation: popIn 0.25s ease;
  }
`;

const LISTINGS = [
  { id:1, title:"Pelíšek M/L — béžový plyš", price:340, cat:"vybaveni", animal:"pes", emoji:"🛏️", cond:"dobrý", city:"Praha", seller:"Jana K.", desc:"Pohodlný plyšový pelíšek 80×60 cm, praný, málo používaný. Vhodný pro středně velké psy.", saved:false, time:"2 dny" },
  { id:2, title:"Klec pro křečka + příslušenství", price:190, cat:"vybaveni", animal:"hlodavec", emoji:"🏠", cond:"dobrý", city:"Brno", seller:"Tomáš M.", desc:"Kompletní klec včetně kolečka, misky, napáječky a podestýlky.", saved:false, time:"3 dny" },
  { id:3, title:"Zimní bundička — vel. S", price:145, cat:"obleceni", animal:"pes", emoji:"🧥", cond:"jako nový", city:"Ostrava", seller:"Lucie P.", desc:"Teplá zimní bunda, oblečena 3×. Modrá barva, zapínání na zip.", saved:false, time:"5 dní" },
  { id:4, title:"Prémiové granule pro kočky 2 kg", price:175, cat:"krmivo", animal:"kočka", emoji:"🐟", cond:"nový", city:"Praha", seller:"Martin V.", desc:"Neotevřené granule pro dospělé kočky. Expirace 08/2026.", saved:false, time:"1 den" },
  { id:5, title:"Škrabadlo s boudičkou 120 cm", price:390, cat:"vybaveni", animal:"kočka", emoji:"🌴", cond:"dobrý", city:"Plzeň", seller:"Eva S.", desc:"Stabilní škrabadlo s houpátkem a boudičkou. Jutové lano v dobrém stavu.", saved:false, time:"4 dny" },
  { id:6, title:"Kožené vodítko + obojek — sada", price:115, cat:"vybaveni", animal:"pes", emoji:"🔗", cond:"jako nový", city:"Liberec", seller:"Petr N.", desc:"Černá pravá kůže, obvod krku 35–45 cm. Použito jen párkrát.", saved:false, time:"6 dní" },
  { id:7, title:"Přírodní pamlsky pro psy 500 g", price:85, cat:"krmivo", animal:"pes", emoji:"🦴", cond:"nový", city:"Olomouc", seller:"Alena B.", desc:"Sušené přírodní pamlsky bez konzervantů a barviv.", saved:false, time:"2 dny" },
  { id:8, title:"Přepravní box na kočku", price:270, cat:"vybaveni", animal:"kočka", emoji:"📦", cond:"dobrý", city:"Č. Budějovice", seller:"Roman H.", desc:"Plastový přepravní box 50×30×30 cm. Dobře větraný, se dvířky.", saved:false, time:"1 týden" },
  { id:9, title:"Hračky — sada 5 myšiček", price:55, cat:"vybaveni", animal:"kočka", emoji:"🐭", cond:"nový", city:"Praha", seller:"Jana K.", desc:"Set 5 plyšových myšiček s catnipem. Kočky je milují!", saved:false, time:"3 dny" },
  { id:10, title:"Fotbalový dres pro psa — M", price:75, cat:"obleceni", animal:"pes", emoji:"⚽", cond:"jako nový", city:"Brno", seller:"Monika T.", desc:"Roztomilý fotbalový dres velikost M. Oblečen 2×.", saved:false, time:"5 dní" },
  { id:11, title:"Akvárium 60L komplet", price:650, cat:"vybaveni", animal:"ryba", emoji:"🐠", cond:"dobrý", city:"Praha", seller:"Ondřej K.", desc:"Akvárium 60 litrů, filtrace, osvětlení LED, kryt. Vše funkční.", saved:false, time:"2 dny" },
  { id:12, title:"Vitamíny pro hlodavce 100ml", price:70, cat:"krmivo", animal:"hlodavec", emoji:"💊", cond:"nový", city:"Hradec Králové", seller:"Tereza L.", desc:"Kapkové vitamíny do vody, neotevřeno, expirace 2027.", saved:false, time:"4 dny" },
];

const CATS = [
  { id:"vse", label:"Vše", icon:"🐾" },
  { id:"vybaveni", label:"Vybavení", icon:"🏠" },
  { id:"krmivo", label:"Krmivo & pamlsky", icon:"🦴" },
  { id:"obleceni", label:"Oblečení", icon:"🧥" },
];
const ANIMALS = [
  { id:"vse", label:"Všechna zvířata" },
  { id:"pes", label:"🐕 Pes" },
  { id:"kočka", label:"🐈 Kočka" },
  { id:"hlodavec", label:"🐹 Hlodavec" },
  { id:"ryba", label:"🐠 Ryba" },
];
const COND_COLORS = {
  "nový":      { bg:"#e3f2fd", color:"#0d47a1" },
  "jako nový": { bg:"#e8f5e9", color:"#1b5e20" },
  "dobrý":     { bg:"#fff8e1", color:"#e65100" },
  "použitý":   { bg:"#fce4ec", color:"#880e4f" },
};

function CondBadge({ cond }) {
  const s = COND_COLORS[cond] || { bg:"#f5f5f5", color:"#555" };
  return (
    <span style={{ background:s.bg, color:s.color, fontSize:"0.68rem", fontWeight:700,
      padding:"3px 9px", borderRadius:20, textTransform:"uppercase", letterSpacing:"0.05em", whiteSpace:"nowrap" }}>
      {cond}
    </span>
  );
}

function Card({ item, onOpen, onSave, delay }) {
  return (
    <div className="card" style={{ animationDelay:`${delay}ms` }} onClick={() => onOpen(item)}>
      <div style={{ height:150, background:"linear-gradient(145deg, var(--green-pale), var(--sand))",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:"3.8rem", position:"relative" }}>
        {item.foto_urls && item.foto_urls.length > 0
  ? <img src={item.foto_urls[0]} alt={item.title}
      style={{ width:"100%", height:"100%", objectFit:"cover", position:"absolute", inset:0 }} />
  : (item.emoji || "🐾")}
        <button onClick={e => { e.stopPropagation(); onSave(item.id); }}
          style={{ position:"absolute", top:10, right:10,
            background: item.saved ? "var(--green)" : "rgba(255,255,255,0.9)",
            border:"none", borderRadius:"50%", width:34, height:34,
            cursor:"pointer", fontSize:"0.95rem", display:"flex",
            alignItems:"center", justifyContent:"center",
            boxShadow:"0 1px 6px rgba(0,0,0,0.12)", transition:"all 0.2s" }}>
          {item.saved ? "♥" : "♡"}
        </button>
      </div>
      <div style={{ padding:"14px 16px 16px" }}>
        <div style={{ fontSize:"0.8rem", color:"var(--text-light)", marginBottom:5, fontWeight:500 }}>
          📍 {item.city} · {item.time}
        </div>
        <div style={{ fontWeight:600, fontSize:"0.95rem", color:"var(--text)", lineHeight:1.35,
          marginBottom:10, minHeight:40 }}>{item.title}</div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:"1.2rem", fontWeight:700, color:"var(--green)", fontFamily:"'DM Serif Display', serif" }}>
            {item.price} Kč
          </span>
          <CondBadge cond={item.cond} />
        </div>
      </div>
    </div>
  );
}

function DetailModal({ item, onClose, onContact, onSave }) {
  const [fotoIdx, setFotoIdx] = useState(0);
  if (!item) return null;
  const fotos = item.foto_urls && item.foto_urls.length > 0 ? item.foto_urls : null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ height:220, background:"linear-gradient(145deg, var(--green-pale), var(--sand))",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:"6rem", position:"relative", borderRadius:"22px 22px 0 0", overflow:"hidden" }}>
          {fotos
            ? <img src={fotos[fotoIdx]} alt={item.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            : (item.emoji || "🐾")}
          {fotos && fotos.length > 1 && <>
            <button onClick={e => { e.stopPropagation(); setFotoIdx(i => (i - 1 + fotos.length) % fotos.length); }}
              style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)",
                background:"rgba(255,255,255,0.85)", border:"none", borderRadius:"50%",
                width:32, height:32, cursor:"pointer", fontSize:"1.2rem", fontWeight:700 }}>‹</button>
            <button onClick={e => { e.stopPropagation(); setFotoIdx(i => (i + 1) % fotos.length); }}
              style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
                background:"rgba(255,255,255,0.85)", border:"none", borderRadius:"50%",
                width:32, height:32, cursor:"pointer", fontSize:"1.2rem", fontWeight:700 }}>›</button>
            <div style={{ position:"absolute", bottom:8, left:"50%", transform:"translateX(-50%)", display:"flex", gap:5 }}>
              {fotos.map((_, i) => (
                <div key={i} onClick={e => { e.stopPropagation(); setFotoIdx(i); }}
                  style={{ width:7, height:7, borderRadius:"50%", cursor:"pointer",
                    background: i === fotoIdx ? "#fff" : "rgba(255,255,255,0.5)" }} />
              ))}
            </div>
          </>}
          <button onClick={onClose} style={{ position:"absolute", top:14, right:14,
            background:"rgba(255,255,255,0.9)", border:"none", borderRadius:"50%",
            width:38, height:38, cursor:"pointer", fontSize:"1.1rem", color:"var(--text-mid)",
            fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>
        <div style={{ padding:"24px 26px 28px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8, gap:12 }}>
            <h2 style={{ fontSize:"1.25rem", color:"var(--text)", lineHeight:1.3 }}>{item.title}</h2>
            <CondBadge cond={item.cond || item.condition} />
          </div>
          <div style={{ fontSize:"2rem", fontWeight:700, color:"var(--green)", fontFamily:"'DM Serif Display', serif", marginBottom:14 }}>
            {item.price} Kč
          </div>
          <p style={{ color:"var(--text-mid)", fontSize:"0.92rem", lineHeight:1.65, marginBottom:18 }}>
            {item.desc || item.description}
          </p>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:24 }}>
            {[`📍 ${item.city}`, `👤 ${item.seller_name || item.seller || "Prodejce"}`, `🕐 ${item.created_at ? new Date(item.created_at).toLocaleDateString("cs-CZ") : ""}`].map(tag => (
              <span key={tag} style={{ background:"var(--sand)", border:"1px solid var(--sand-dark)",
                borderRadius:20, padding:"5px 12px", fontSize:"0.78rem", color:"var(--text-mid)", fontWeight:500 }}>{tag}</span>
            ))}
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button className="btn-primary" style={{ flex:1 }} onClick={() => onContact(item)}>
              💬 Napsat prodejci
            </button>
            <button className="btn-secondary" onClick={() => onSave(item.id)}
              style={{ padding:"10px 16px", color: item.saved ? "var(--accent)" : "var(--green)",
                borderColor: item.saved ? "var(--accent)" : "var(--green)" }}>
              {item.saved ? "♥ Uloženo" : "♡ Uložit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddModal({ onClose, onAdd }) {
  const [f, setF] = useState({ title:"", price:"", cat:"vybaveni", animal:"pes", cond:"dobrý", city:"", desc:"", emoji:"🐾" });
  const set = (k,v) => setF(p => ({...p,[k]:v}));
  const EMOJIS = ["🛏️","🏠","🧥","🐟","🌴","🔗","🦴","📦","⚽","🐭","🎾","💊","🐠","🪮","🐾","🎀"];
  const submit = () => {
    if(!f.title.trim() || !f.price || !f.city.trim()) { alert("Vyplň prosím název, cenu a město."); return; }
    onAdd({ ...f, id:Date.now(), price:parseInt(f.price), saved:false, seller:"Já", time:"právě teď" });
    onClose();
  };
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:520 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:"22px 24px 0", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid var(--sand-dark)", paddingBottom:16 }}>
          <h2 style={{ fontSize:"1.35rem", color:"var(--text)" }}>Přidat inzerát</h2>
          <button onClick={onClose} style={{ background:"var(--sand)", border:"none", borderRadius:"50%",
            width:36, height:36, cursor:"pointer", fontSize:"1rem", color:"var(--text-mid)", fontWeight:700 }}>✕</button>
        </div>
        <div style={{ padding:"20px 24px 26px", display:"flex", flexDirection:"column", gap:16 }}>
          <div>
            <label className="label">Ikona produktu</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => set("emoji",e)} style={{
                  width:42, height:42, borderRadius:10, fontSize:"1.3rem",
                  border: f.emoji===e ? "2px solid var(--green)" : "1.5px solid var(--sand-dark)",
                  background: f.emoji===e ? "var(--green-light)" : "var(--sand)",
                  cursor:"pointer", transition:"all 0.15s" }}>{e}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Název inzerátu *</label>
            <input className="input-field" value={f.title} onChange={e=>set("title",e.target.value)} placeholder="Např. Pelíšek pro psa, vel. M" />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label className="label">Cena (Kč) *</label>
              <input className="input-field" type="number" value={f.price} onChange={e=>set("price",e.target.value)} placeholder="350" />
            </div>
            <div>
              <label className="label">Město *</label>
              <input className="input-field" value={f.city} onChange={e=>set("city",e.target.value)} placeholder="Praha" />
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
            {[
              { label:"Kategorie", key:"cat", opts:[["vybaveni","Vybavení"],["krmivo","Krmivo"],["obleceni","Oblečení"]] },
              { label:"Zvíře", key:"animal", opts:[["pes","Pes"],["kočka","Kočka"],["hlodavec","Hlodavec"],["ryba","Ryba"]] },
              { label:"Stav", key:"cond", opts:[["nový","Nový"],["jako nový","Jako nový"],["dobrý","Dobrý"],["použitý","Použitý"]] },
            ].map(({label,key,opts}) => (
              <div key={key}>
                <label className="label">{label}</label>
                <select className="input-field" style={{ cursor:"pointer" }} value={f[key]} onChange={e=>set(key,e.target.value)}>
                  {opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div>
            <label className="label">Popis</label>
            <textarea className="input-field" style={{ minHeight:80, resize:"vertical" }}
              value={f.desc} onChange={e=>set("desc",e.target.value)}
              placeholder="Stav, rozměry, důvod prodeje..." />
          </div>
          <button className="btn-primary" style={{ width:"100%", padding:"14px", fontSize:"1rem" }} onClick={submit}>
            ✓ Zveřejnit inzerát
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PetMarket() {
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("vse");
  const [animal, setAnimal] = useState("vse");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [maxPrice, setMaxPrice] = useState(1000);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const { user, profile, signOut } = useAuth();
useEffect(() => {
  const fetchInzeraty = async () => {
    const { data, error } = await supabase
      .from("inzeraty")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || data.length === 0) {
      setItems(LISTINGS);
    } else {
      setItems(data);
    }
    setLoading(false);
  };
  fetchInzeraty();
}, []);
  const toast_ = msg => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleSave = id => {
    const item = items.find(i => i.id === id);
    setItems(ls => ls.map(i => i.id === id ? {...i, saved:!i.saved} : i));
    if (selected?.id === id) setSelected(s => s ? {...s, saved:!s.saved} : s);
    toast_(item?.saved ? "Odstraněno z oblíbených" : "♥ Přidáno do oblíbených");
  };

  const handleContact = item => {
    toast_(`Zpráva odeslána prodejci ${item.seller}!`);
    setSelected(null);
  };

  const handleAdd = newItem => {
    setItems(ls => [newItem, ...ls]);
    toast_("🎉 Tvůj inzerát byl přidán!");
  };

  const filtered = items
    .filter(i => cat === "vse" || (i.cat || i.category || "").toLowerCase().includes(cat.toLowerCase()) || cat.toLowerCase().includes((i.cat || i.category || "").toLowerCase()))
    .filter(i => animal === "vse" || (i.animal || "").toLowerCase() === animal.toLowerCase())
    .filter(i => i.price <= maxPrice)
    .filter(i => !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.city.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => sort==="price_asc" ? a.price-b.price : sort==="price_desc" ? b.price-a.price : b.id-a.id);

  const savedCount = items.filter(i => i.saved).length;

  // Jméno uživatele pro navbar
  const userName = profile?.full_name || profile?.name || user?.email?.split("@")[0] || "Účet";

  return (
    <div style={{ minHeight:"100vh", background:"var(--sand)" }}>
      <style>{CSS}</style>

      {/* ── NAVBAR ── */}
      <nav style={{ background:"var(--white)", borderBottom:"1px solid var(--sand-dark)",
        position:"sticky", top:0, zIndex:100, boxShadow:"0 1px 12px rgba(44,80,58,0.07)" }}>
        <div style={{ maxWidth:1180, margin:"0 auto", padding:"0 24px",
          display:"flex", alignItems:"center", height:68, gap:18 }}>

          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0, marginRight:4 }}>
            <div style={{ width:42, height:42, borderRadius:12,
              background:"var(--green)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.3rem" }}>
              🐾
            </div>
            <div>
              <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:"1.25rem", color:"var(--text)", letterSpacing:"-0.02em" }}>
                Pet Market
              </div>
              <div style={{ fontSize:"0.6rem", color:"var(--text-light)", letterSpacing:"0.1em", textTransform:"uppercase", marginTop:-1 }}>
                tržiště pro mazlíčky
              </div>
            </div>
          </div>

          {/* Search */}
          <div style={{ flex:1, position:"relative" }}>
            <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:"1rem", opacity:0.45 }}>🔍</span>
            <input className="input-field" value={search} onChange={e=>setSearch(e.target.value)}
              style={{ paddingLeft:38, borderRadius:30, background:"var(--sand)" }}
              placeholder="Hledat pelíšek, granule, klec…" />
          </div>

          {/* Actions */}
          <div style={{ display:"flex", gap:10, alignItems:"center", flexShrink:0 }}>
            {savedCount > 0 && (
              <div style={{ background:"var(--green-light)", color:"var(--green)", borderRadius:20,
                padding:"6px 14px", fontSize:"0.8rem", fontWeight:700, border:"1px solid #b7d9c7" }}>
                ♥ {savedCount}
              </div>
            )}

            {/* ── TOTO JE OPRAVENÉ TLAČÍTKO ── */}
            {user ? (
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <button
                  className="btn-secondary"
                  style={{ padding:"8px 16px" }}
                  onClick={() => window.location.href = "/profil"}
                >
                  👤 {userName}
                </button>
                <button
                  className="btn-secondary"
                  style={{ padding:"8px 14px", fontSize:"0.8rem", borderColor:"var(--sand-dark)", color:"var(--text-mid)" }}
                  onClick={signOut}
                >
                  Odhlásit
                </button>
              </div>
            ) : (
              <button
                className="btn-secondary"
                style={{ padding:"8px 16px" }}
                onClick={() => setShowAuth(true)}
              >
                Přihlásit se
              </button>
            )}

            <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ padding:"10px 20px" }}>
              + Prodat
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO STRIP ── */}
      <div style={{ background:"linear-gradient(105deg, var(--green) 0%, #3a7d60 100%)", padding:"36px 24px" }}>
        <div style={{ maxWidth:1180, margin:"0 auto" }}>
          <h1 style={{ color:"var(--white)", fontSize:"clamp(1.5rem,3vw,2.2rem)", marginBottom:8, letterSpacing:"-0.02em" }}>
            Vše pro tvého mazlíčka — z druhé ruky
          </h1>
          <p style={{ color:"rgba(231,160,160,0.75)", fontSize:"0.95rem", marginBottom:24, maxWidth:520 }}>
            Kupuj a prodávej použité vybavení, krmivo i oblečení. Šetři peníze, pomáhej přírodě.
          </p>
          <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
            {[["🛍️", `${items.length} inzerátů`], ["🐾", "4 kategorie"], ["🏙️", "Celá ČR"]].map(([icon,label]) => (
              <div key={label} style={{ background:"rgba(255,255,255,0.15)", borderRadius:10,
                padding:"8px 16px", display:"flex", alignItems:"center", gap:7,
                color:"var(--white)", fontSize:"0.85rem", fontWeight:600, border:"1px solid rgba(255,255,255,0.2)" }}>
                {icon} {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div style={{ background:"var(--white)", borderBottom:"1px solid var(--sand-dark)", padding:"16px 24px" }}>
        <div style={{ maxWidth:1180, margin:"0 auto" }}>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
            {CATS.map(c => (
              <button key={c.id} className={`pill ${cat===c.id ? "pill-active" : "pill-outline"}`}
                onClick={() => setCat(c.id)} style={{ fontSize:"0.85rem", padding:"7px 16px" }}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
            {ANIMALS.map(a => (
              <button key={a.id} className={`pill ${animal===a.id ? "pill-dark" : "pill-dark-outline"}`}
                onClick={() => setAnimal(a.id)} style={{ fontSize:"0.78rem", padding:"5px 13px" }}>
                {a.label}
              </button>
            ))}
            <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:"0.78rem", color:"var(--text-light)", whiteSpace:"nowrap" }}>
                  Do <strong style={{ color:"var(--green)" }}>{maxPrice} Kč</strong>
                </span>
                <input type="range" min={50} max={2000} step={50} value={maxPrice}
                  onChange={e=>setMaxPrice(+e.target.value)}
                  style={{ width:90, accentColor:"var(--green)", cursor:"pointer" }} />
              </div>
              <select className="input-field" value={sort} onChange={e=>setSort(e.target.value)}
                style={{ width:"auto", padding:"6px 12px", borderRadius:20, cursor:"pointer", fontSize:"0.8rem" }}>
                <option value="newest">Nejnovější</option>
                <option value="price_asc">Cena: nízká → vysoká</option>
                <option value="price_desc">Cena: vysoká → nízká</option>
              </select>
              <span style={{ fontSize:"0.8rem", color:"var(--text-light)", whiteSpace:"nowrap" }}>
                {filtered.length} výsledků
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── GRID ── */}
      <main style={{ maxWidth:1180, margin:"0 auto", padding:"28px 24px 48px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"70px 20px", color:"var(--text-light)" }}>
            <div style={{ fontSize:"3.5rem", marginBottom:16 }}>🔍</div>
            <h3 style={{ fontFamily:"'DM Serif Display',serif", color:"var(--text-mid)", marginBottom:8 }}>
              Žádné inzeráty nenalezeny
            </h3>
            <p style={{ fontSize:"0.9rem" }}>Zkus upravit filtry nebo přidej vlastní inzerát.</p>
            <button className="btn-primary" style={{ marginTop:20 }} onClick={() => setShowAdd(true)}>
              + Přidat inzerát
            </button>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(230px, 1fr))", gap:20 }}>
            {filtered.map((item, i) => (
              <Card key={item.id} item={item} onOpen={setSelected} onSave={handleSave} delay={i * 40} />
            ))}
          </div>
        )}
      </main>

      {/* ── MODALS ── */}
      {selected && (
        <DetailModal item={selected} onClose={() => setSelected(null)}
          onContact={handleContact} onSave={handleSave} />
      )}
      {showAdd && (
        <AddModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />
      )}
      {showProfile && user && (
        <ProfilePage onClose={() => setShowProfile(false)} />
      )}
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onAuthSuccess={() => setShowAuth(false)} />
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div style={{ position:"fixed", bottom:28, left:"50%",
          transform:"translateX(-50%)", background:"var(--text)", color:"var(--white)",
          borderRadius:30, padding:"12px 26px", fontSize:"0.88rem", fontWeight:600,
          zIndex:300, whiteSpace:"nowrap", boxShadow:"0 8px 28px rgba(0,0,0,0.2)",
          animation:"toastIn 0.3s ease" }}>
          {toast}
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer style={{ background:"var(--text)", color:"rgba(255,255,255,0.5)",
        padding:"24px", textAlign:"center", fontSize:"0.8rem" }}>
        <span style={{ fontFamily:"'DM Serif Display',serif", color:"rgba(255,255,255,0.8)", fontSize:"1rem" }}>
          Pet Market
        </span>
        {" "}· Tržiště pro mazlíčky · Celá ČR · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
