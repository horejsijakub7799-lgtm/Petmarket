import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const CONTACT_FILTER_REGEX = /(\+?\d[\d\s\-]{7,})|(\b\w+@\w+\.\w+)|(revolut|iban|paypal|\b(u[cč]et|bank|p[řr]evod|hotovost|kontakt|telefon|email|e-mail|mobil|whatsapp|messenger|signal|viber|telegram|instagram|facebook|fb|ig)\b)/i;

const PREDEFINED_ANSWERS = [
  "Ano, plně funkční / v pořádku",
  "Ne, má drobné vady (viz popis)",
  "Viz popis inzerátu",
  "Cena je konečná",
  "Cena je k jednání — pošli nabídku",
  "Mohu odeslat / předat do 2 dnů",
];

const STATUS_CONFIG = {
  pending: { bg: "#fff8e1", color: "#e65100", label: "⏳ Čeká na odpověď" },
  answered: { bg: "#e8f5e9", color: "#1b5e20", label: "✅ Zodpovězeno" },
};

export default function MyQuestionsTab({ user, profile }) {
  const [mode, setMode] = useState("received");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  useEffect(() => {
    fetchQuestions();
    const channel = supabase
      .channel(`questions-${user.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "questions",
        filter: `${mode === "received" ? "seller_id" : "buyer_id"}=eq.${user.id}`
      }, () => fetchQuestions())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user, mode]);

  const fetchQuestions = async () => {
    setLoading(true);
    const column = mode === "received" ? "seller_id" : "buyer_id";
    const { data } = await supabase
      .from("questions")
      .select("*")
      .eq(column, user.id)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      const inzeratIds = [...new Set(data.map(q => q.inzerat_id))];
      const { data: inzeraty } = await supabase
        .from("inzeraty")
        .select("id, title, foto_urls, price, seller_name, city")
        .in("id", inzeratIds);

      const inzeratMap = {};
      (inzeraty || []).forEach(i => { inzeratMap[i.id] = i; });

      const enriched = data.map(q => ({
        ...q,
        inzerat: inzeratMap[q.inzerat_id] || null,
        status: q.answer ? "answered" : "pending",
      }));
      setQuestions(enriched);
    } else {
      setQuestions([]);
    }
    setLoading(false);
  };

  const pendingCount = mode === "received" ? questions.filter(q => !q.answer).length : 0;
  const answeredForBuyer = mode === "sent" ? questions.filter(q => q.answer).length : 0;

  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ede8e0", overflow: "hidden", minHeight: 400 }}>
      {selectedQuestion ? (
        <QuestionDetail
          question={selectedQuestion}
          mode={mode}
          user={user}
          onClose={() => { setSelectedQuestion(null); fetchQuestions(); }}
          onUpdate={fetchQuestions}
        />
      ) : (
        <>
          <div style={{ padding: "24px 28px 0", borderBottom: "1px solid #ede8e0" }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.4rem", color: "#1c2b22", marginBottom: 16 }}>Moje otázky</h2>
            <div style={{ display: "flex", gap: 0 }}>
              <button
                onClick={() => setMode("received")}
                style={{
                  padding: "12px 20px",
                  background: "none",
                  border: "none",
                  borderBottom: mode === "received" ? "2px solid #2d6a4f" : "2px solid transparent",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: mode === "received" ? 700 : 500,
                  color: mode === "received" ? "#2d6a4f" : "#8a9e92",
                  fontFamily: "'DM Sans', sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                📥 Přijaté (na mé inzeráty)
                {mode === "received" && pendingCount > 0 && (
                  <span style={{ background: "#e07b39", color: "#fff", borderRadius: 20, padding: "1px 8px", fontSize: "0.72rem", fontWeight: 700 }}>{pendingCount}</span>
                )}
              </button>
              <button
                onClick={() => setMode("sent")}
                style={{
                  padding: "12px 20px",
                  background: "none",
                  border: "none",
                  borderBottom: mode === "sent" ? "2px solid #2d6a4f" : "2px solid transparent",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: mode === "sent" ? 700 : 500,
                  color: mode === "sent" ? "#2d6a4f" : "#8a9e92",
                  fontFamily: "'DM Sans', sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                📤 Odeslané (moje otázky)
                {mode === "sent" && answeredForBuyer > 0 && (
                  <span style={{ background: "#2d6a4f", color: "#fff", borderRadius: 20, padding: "1px 8px", fontSize: "0.72rem", fontWeight: 700 }}>{answeredForBuyer}</span>
                )}
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#8a9e92" }}>Načítám...</div>
          ) : questions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#8a9e92" }}>
              <div style={{ fontSize: "3rem", marginBottom: 16 }}>{mode === "received" ? "❓" : "📤"}</div>
              <p style={{ fontSize: "0.95rem", marginBottom: 8 }}>
                {mode === "received" ? "Zatím ti nikdo nepoložil otázku." : "Zatím jsi nepoložil žádnou otázku."}
              </p>
              <p style={{ fontSize: "0.82rem" }}>
                {mode === "received" ? "Až někdo pošle dotaz na tvůj inzerát, uvidíš ho tady." : "Najdi inzerát v bazaru a klikni na '❓ Zeptat se'."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {questions.map(q => (
                <QuestionRow
                  key={q.id}
                  question={q}
                  mode={mode}
                  onClick={() => setSelectedQuestion(q)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function QuestionRow({ question, mode, onClick }) {
  const config = STATUS_CONFIG[question.status];
  const needsAction = mode === "received" && !question.answer;
  const hasNewAnswer = mode === "sent" && question.answer;

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 24px",
        borderBottom: "1px solid #f7f4ef",
        cursor: "pointer",
        background: (needsAction || hasNewAnswer) ? "#f2faf6" : "#fff",
        transition: "background 0.15s",
      }}
      onMouseOver={e => e.currentTarget.style.background = "#f7f4ef"}
      onMouseOut={e => e.currentTarget.style.background = (needsAction || hasNewAnswer) ? "#f2faf6" : "#fff"}
    >
      <div style={{ width: 56, height: 56, borderRadius: 10, background: "#e8f5ef", overflow: "hidden", flexShrink: 0 }}>
        {question.inzerat?.foto_urls?.[0] ? (
          <img src={question.inzerat.foto_urls[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🐾</div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: "#1c2b22", marginBottom: 3, fontSize: "0.92rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {question.inzerat?.title || "Smazaný inzerát"}
        </div>
        <div style={{ fontSize: "0.82rem", color: "#4a5e52", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          ❓ {question.question}
        </div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <span style={{ background: config.bg, color: config.color, borderRadius: 20, padding: "4px 12px", fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap", display: "inline-block", marginBottom: 6 }}>
          {config.label}
        </span>
        <div style={{ fontSize: "0.7rem", color: "#8a9e92" }}>
          {new Date(question.created_at).toLocaleDateString("cs-CZ")}
        </div>
      </div>
    </div>
  );
}

function QuestionDetail({ question, mode, user, onClose, onUpdate }) {
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleAnswer = async () => {
    if (!selectedAnswer) return setError("Vyber odpověď ze seznamu");

    setSaving(true);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("questions")
        .update({
          answer: selectedAnswer,
          answered_at: new Date().toISOString(),
        })
        .eq("id", question.id);

      if (updateError) throw updateError;

      // Email kupujícímu
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
          body: JSON.stringify({
            sellerEmail: "horejsi.jakub7799@gmail.com",
            sellerName: "Kupující",
            order: {
              _isQuestionAnswered: true,
              _itemTitle: question.inzerat?.title || "Inzerát",
              _question: question.question,
              _answer: selectedAnswer,
              _questionId: question.id,
            },
          }),
        });
      } catch (e) { console.error(e); }

      onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Nepodařilo se uložit odpověď: " + err.message);
    }
    setSaving(false);
  };

  return (
    <div>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #ede8e0", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onClose} style={{ background: "#f7f4ef", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
        <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.2rem", color: "#1c2b22", margin: 0 }}>Detail otázky</h3>
      </div>

      <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Produkt */}
        <div style={{ display: "flex", gap: 14, padding: 16, background: "#f2faf6", borderRadius: 12 }}>
          <div style={{ width: 72, height: 72, borderRadius: 10, background: "#e8f5ef", overflow: "hidden", flexShrink: 0 }}>
            {question.inzerat?.foto_urls?.[0] ? (
              <img src={question.inzerat.foto_urls[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>🐾</div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: "#1c2b22", fontSize: "1rem", marginBottom: 4 }}>
              {question.inzerat?.title || "Smazaný inzerát"}
            </div>
            <div style={{ fontSize: "0.82rem", color: "#8a9e92" }}>
              📍 {question.inzerat?.city || "—"} · {question.inzerat?.price || "—"} Kč
            </div>
          </div>
        </div>

        {/* Otázka */}
        <div style={{ background: "#e3f2fd", border: "1px solid #90caf9", borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#0d47a1", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>❓ Otázka</div>
          <div style={{ fontSize: "0.95rem", color: "#1c2b22", lineHeight: 1.5 }}>{question.question}</div>
          <div style={{ fontSize: "0.72rem", color: "#0d47a1", marginTop: 8 }}>
            {new Date(question.created_at).toLocaleString("cs-CZ")}
          </div>
        </div>

        {/* Odpověď (pokud existuje) */}
        {question.answer && (
          <div style={{ background: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#1b5e20", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>✅ Odpověď prodejce</div>
            <div style={{ fontSize: "0.95rem", color: "#1c2b22", lineHeight: 1.5 }}>{question.answer}</div>
            {question.answered_at && (
              <div style={{ fontSize: "0.72rem", color: "#1b5e20", marginTop: 8 }}>
                {new Date(question.answered_at).toLocaleString("cs-CZ")}
              </div>
            )}
          </div>
        )}

        {/* Formulář pro odpověď (jen prodejce, jen pokud neodpoveděl) */}
        {mode === "received" && !question.answer && (
          <>
            <div style={{ background: "#fff8e1", border: "1px solid #ffecb3", borderRadius: 10, padding: "12px 14px", fontSize: "0.8rem", color: "#7a5b00", lineHeight: 1.5 }}>
              ⚠️ <strong>Pozor:</strong> Komunikace a platba probíhá výhradně přes Pet Market.
            </div>

            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {PREDEFINED_ANSWERS.map(a => (
                  <button
                    key={a}
                    onClick={() => setSelectedAnswer(a)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: `1.5px solid ${selectedAnswer === a ? "#2d6a4f" : "#ede8e0"}`,
                      background: selectedAnswer === a ? "#f2faf6" : "#fff",
                      color: selectedAnswer === a ? "#2d6a4f" : "#4a5e52",
                      fontSize: "0.88rem",
                      fontWeight: selectedAnswer === a ? 600 : 400,
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {error && <div style={{ background: "#fee", color: "#b91c1c", padding: "10px 14px", borderRadius: 10, fontSize: "0.85rem" }}>{error}</div>}

            <button
              onClick={handleAnswer}
              disabled={saving || !selectedAnswer}
              style={{
                padding: "14px",
                fontSize: "1rem",
                fontWeight: 600,
                borderRadius: 10,
                cursor: (saving || !selectedAnswer) ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
                width: "100%",
                border: "none",
                background: (saving || !selectedAnswer) ? "#b5cec0" : "#2d6a4f",
                color: "#fff",
                boxShadow: "0 2px 12px rgba(45,106,79,0.25)",
              }}
            >
              {saving ? "Odesílám..." : "✅ Odeslat odpověď"}
            </button>
          </>
        )}

        {mode === "sent" && !question.answer && (
          <div style={{ background: "#fff8e1", border: "1px solid #ffecb3", borderRadius: 10, padding: 14, textAlign: "center", fontSize: "0.88rem", color: "#7a5b00" }}>
            ⏳ Prodejce zatím neodpověděl. Upozorníme tě emailem, jakmile odpoví.
          </div>
        )}
      </div>
    </div>
  );
}