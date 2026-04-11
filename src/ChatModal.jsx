import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./useAuth";

function filterMessage(text) {
  const patterns = [
    /\b[\w.-]+@[\w.-]+\.\w{2,}\b/gi,
    /(\+420|00420)?\s?[0-9]{3}\s?[0-9]{3}\s?[0-9]{3}/g,
    /\b\d{9,}\b/g,
    /https?:\/\/[^\s]+/gi,
    /www\.[^\s]+/gi,
    /instagram|facebook|whatsapp|telegram|signal|viber|skype/gi,
    /ig:|fb:|wa:|tg:/gi,
  ];
  let filtered = text;
  patterns.forEach(p => { filtered = filtered.replace(p, "***"); });
  return filtered;
}

export default function ChatModal({ item, onClose }) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [warning, setWarning] = useState("");
  const bottomRef = useRef(null);

  const sellerId = item.seller_id;
  const isOwner = user?.id === sellerId;
  // Kupující píše prodejci, prodejce odpovídá kupujícímu
  const receiverId = isOwner ? null : sellerId;

  useEffect(() => {
    if (!user || !item) return;
    fetchMessages();

    const channel = supabase
      .channel("chat-" + item.id + "-" + user.id)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `inzerat_id=eq.${item.id}`,
      }, (payload) => {
        const msg = payload.new;
        if (msg.sender_id === user.id || msg.receiver_id === user.id) {
          setMessages(prev => [...prev, msg]);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, item]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("inzerat_id", item.id)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
  };

  const sendMessage = async () => {
    if (!text.trim() || !user) return;

    const filtered = filterMessage(text.trim());
    if (filtered !== text.trim()) {
      setWarning("⚠️ Zpráva obsahuje kontaktní údaje které nejsou povoleny.");
      return;
    }

    // Zjisti receiver_id
    let targetReceiverId = receiverId;
    if (isOwner) {
      // Prodejce odpovídá — najdi kupujícího z předchozích zpráv
      const buyerMsg = messages.find(m => m.sender_id !== user.id);
      if (!buyerMsg) {
        setWarning("⚠️ Zatím nikdo nezahájil konverzaci.");
        return;
      }
      targetReceiverId = buyerMsg.sender_id;
    }

    if (!targetReceiverId) {
      setWarning("⚠️ Nelze odeslat zprávu.");
      return;
    }

    setSending(true);
    setWarning("");

    const { data, error } = await supabase.from("messages").insert({
      inzerat_id: item.id,
      sender_id: user.id,
      receiver_id: targetReceiverId,
      sender_name: profile?.name || user.email?.split("@")[0],
      content: filtered,
    }).select().single();

    setSending(false);
    if (!error && data) {
      setMessages(prev => [...prev, data]);
      setText("");
    } else {
      setWarning("❌ Chyba při odesílání: " + (error?.message || ""));
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(28,43,34,0.5)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(5px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:22, maxWidth:500, width:"100%", height:560, display:"flex", flexDirection:"column", boxShadow:"0 12px 40px rgba(44,80,58,0.18)" }}>

        {/* Header */}
        <div style={{ padding:"18px 22px", borderBottom:"1px solid #ede8e0", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          <div style={{ width:44, height:44, borderRadius:10, background:"#e8f5ef", overflow:"hidden", flexShrink:0 }}>
            {item.foto_urls?.[0]
              ? <img src={item.foto_urls[0]} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.3rem" }}>🐾</div>}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:600, color:"#1c2b22", fontSize:"0.95rem" }}>{item.title}</div>
            <div style={{ fontSize:"0.8rem", color:"#8a9e92" }}>
              {isOwner ? "Kupující píše o tvém inzerátu" : `Prodejce: ${item.seller_name || "Prodejce"}`}
            </div>
          </div>
          <button onClick={onClose} style={{ background:"#f7f4ef", border:"none", borderRadius:"50%", width:36, height:36, cursor:"pointer", fontSize:"1rem", color:"#4a5e52", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>

        {/* Bezpečnostní upozornění */}
        <div style={{ padding:"8px 22px", background:"#f2faf6", borderBottom:"1px solid #ede8e0", fontSize:"0.72rem", color:"#2d6a4f", flexShrink:0 }}>
          🔒 Pro bezpečnost nesdílej kontaktní údaje, emaily ani telefonní čísla.
        </div>

        {/* Zprávy */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px 22px", display:"flex", flexDirection:"column", gap:10 }}>
          {messages.length === 0 && (
            <div style={{ textAlign:"center", color:"#8a9e92", marginTop:40 }}>
              <div style={{ fontSize:"2.5rem", marginBottom:12 }}>💬</div>
              <p style={{ fontSize:"0.9rem" }}>Zatím žádné zprávy. Napiš první!</p>
            </div>
          )}
          {messages.map(msg => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} style={{ display:"flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth:"75%",
                  background: isMe ? "#2d6a4f" : "#f7f4ef",
                  color: isMe ? "#fff" : "#1c2b22",
                  borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  padding:"10px 14px",
                  fontSize:"0.9rem",
                  lineHeight:1.5,
                }}>
                  {!isMe && <div style={{ fontSize:"0.72rem", fontWeight:600, color:"#2d6a4f", marginBottom:4 }}>{msg.sender_name}</div>}
                  <div>{msg.content}</div>
                  <div style={{ fontSize:"0.65rem", color: isMe ? "rgba(255,255,255,0.6)" : "#8a9e92", marginTop:4, textAlign:"right" }}>
                    {new Date(msg.created_at).toLocaleTimeString("cs-CZ", { hour:"2-digit", minute:"2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {warning && (
          <div style={{ padding:"8px 22px", background:"#fce4ec", borderTop:"1px solid #f48fb1", fontSize:"0.8rem", color:"#880e4f", flexShrink:0 }}>
            {warning}
          </div>
        )}

        {/* Input */}
        <div style={{ padding:"12px 22px 16px", borderTop:"1px solid #ede8e0", display:"flex", gap:10, flexShrink:0 }}>
          {user ? (
            <>
              <textarea
                value={text}
                onChange={e => { setText(e.target.value); setWarning(""); }}
                onKeyDown={handleKey}
                placeholder="Napiš zprávu... (Enter = odeslat)"
                style={{ flex:1, border:"1.5px solid #ede8e0", borderRadius:12, padding:"10px 14px", fontSize:"0.9rem", outline:"none", fontFamily:"'DM Sans', sans-serif", resize:"none", height:44, lineHeight:1.4, background:"#f7f4ef", color:"#1c2b22" }}
              />
              <button onClick={sendMessage} disabled={sending || !text.trim()}
                style={{ background: sending || !text.trim() ? "#b5cec0" : "#2d6a4f", color:"#fff", border:"none", borderRadius:12, padding:"0 18px", cursor: sending || !text.trim() ? "not-allowed" : "pointer", fontSize:"1.1rem", flexShrink:0 }}>
                ➤
              </button>
            </>
          ) : (
            <div style={{ width:"100%", textAlign:"center", color:"#8a9e92", fontSize:"0.85rem" }}>
              Pro psaní zpráv se musíš přihlásit.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}